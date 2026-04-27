import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase-server";
import {
  contentTopics,
  extractYouTubeId,
  getYouTubeThumbnails,
  type ContentTopic,
  type HookPlatform,
  type VideoType,
} from "@/lib/content";

type RawVideoRecord = {
  id: string;
  title?: string;
  date?: string;
  publishedDate?: string;
  type?: VideoType;
  contentType?: VideoType;
  topic?: ContentTopic;
  category?: ContentTopic;
  description?: string;
  youtubeUrl?: string;
  videoUrl?: string;
  videoId?: string;
  thumbnail?: string;
  featured?: boolean;
  tags?: string[];
  series?: string;
  relatedArticleSlug?: string;
  hookText?: string;
  views24h?: number;
  views48h?: number;
  views7d?: number;
  rankingByViews?: number;
  averageViewDuration?: string;
  retentionPercent?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  platform?: HookPlatform;
  notes?: string;
  hookScore?: number;
  [key: string]: unknown;
};

type RawArticleRecord = {
  slug: string;
  relatedVideoId?: string;
  [key: string]: unknown;
};

type VideoUpdatePayload = {
  title?: string;
  description?: string;
  videoUrl?: string;
  publishedDate?: string;
  contentType?: VideoType;
  category?: ContentTopic;
  tags?: string[];
  featured?: boolean;
  thumbnail?: string;
  relatedArticleSlug?: string;
  hookText?: string;
  views24h?: number;
  views48h?: number;
  views7d?: number;
  rankingByViews?: number;
  averageViewDuration?: string;
  retentionPercent?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  platform?: HookPlatform;
  notes?: string;
};

const videosPath = path.join(process.cwd(), "src", "data", "videos.json");
const articlesPath = path.join(process.cwd(), "src", "data", "articles.json");
const validTopics = new Set(contentTopics.map((topic) => topic.value));
const validTypes = new Set<VideoType>(["short", "long"]);

function asCleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asCleanStringList(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(value.map((item) => asCleanString(item)).filter(Boolean)),
  );
}

function asNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function calculateHookScore(input: {
  views24h?: number;
  rankingByViews?: number;
  retentionPercent?: number;
  comments?: number;
  shares?: number;
}) {
  const rankingBonus = input.rankingByViews && input.rankingByViews <= 3
    ? 30
    : input.rankingByViews && input.rankingByViews <= 6
      ? 15
      : 0;
  const retentionBonus = Math.min(input.retentionPercent ?? 0, 100) * 0.35;
  const engagementBonus = Math.min((input.comments ?? 0) * 1.5 + (input.shares ?? 0) * 2, 35);
  const viewScore = Math.log10((input.views24h ?? 0) + 1) * 18;

  return Math.round(Math.min(100, viewScore + rankingBonus + retentionBonus + engagementBonus));
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function applyFieldAliases(record: RawVideoRecord, payload: Required<VideoUpdatePayload>, videoId: string) {
  const next = { ...record };

  next.title = payload.title;
  next.slug = typeof next.slug === "string" && next.slug.trim() ? next.slug : slugify(payload.title);
  next.updatedAt = new Date().toISOString();
  next.description = payload.description;
  next.videoId = videoId;
  next.thumbnail = payload.thumbnail || getYouTubeThumbnails(videoId)[0] || "";
  next.featured = payload.featured;
  next.tags = payload.tags;
  next.relatedArticleSlug = payload.relatedArticleSlug;
  next.hookText = payload.hookText;
  next.views24h = payload.views24h;
  next.views48h = payload.views48h;
  next.views7d = payload.views7d;
  next.rankingByViews = payload.rankingByViews;
  next.averageViewDuration = payload.averageViewDuration;
  next.retentionPercent = payload.retentionPercent;
  next.likes = payload.likes;
  next.comments = payload.comments;
  next.shares = payload.shares;
  next.platform = payload.platform;
  next.notes = payload.notes;
  next.hookScore = calculateHookScore(payload);

  if ("publishedDate" in next && !("date" in next)) {
    next.publishedDate = payload.publishedDate;
  } else {
    next.date = payload.publishedDate;
  }

  if ("contentType" in next && !("type" in next)) {
    next.contentType = payload.contentType;
  } else {
    next.type = payload.contentType;
  }

  if ("category" in next && !("topic" in next)) {
    next.category = payload.category;
  } else {
    next.topic = payload.category;
  }

  if ("videoUrl" in next && !("youtubeUrl" in next)) {
    next.videoUrl = payload.videoUrl;
  } else {
    next.youtubeUrl = payload.videoUrl;
  }

  return next;
}

async function deleteLinkedArticle(video: RawVideoRecord) {
  const file = await readFile(articlesPath, "utf8");
  const articles = JSON.parse(file) as RawArticleRecord[];
  const relatedSlug = asCleanString(video.relatedArticleSlug);
  const nextArticles = articles.filter((article) => {
    if (relatedSlug && article.slug === relatedSlug) return false;
    if (article.relatedVideoId && article.relatedVideoId === video.id) return false;
    return true;
  });

  if (nextArticles.length !== articles.length) {
    await writeFile(articlesPath, `${JSON.stringify(nextArticles, null, 2)}\n`, "utf8");
    if (relatedSlug) revalidatePath(`/blog/${relatedSlug}`);
  }
}

async function deleteSupabaseVideoAndDeepDive(video: RawVideoRecord) {
  if (!isSupabaseConfigured()) return "";

  try {
    const supabase = getSupabaseAdminClient();
    const slug = asCleanString(video.slug) || slugify(asCleanString(video.title));
    const relatedSlug = asCleanString(video.relatedArticleSlug);
    const { data: supabaseVideo, error: selectError } = await supabase
      .from("videos")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (selectError) throw new Error(selectError.message);

    if (supabaseVideo?.id) {
      const { error: deepDiveError } = await supabase
        .from("deep_dives")
        .delete()
        .eq("video_id", supabaseVideo.id);

      if (deepDiveError) throw new Error(deepDiveError.message);

      const { error: videoError } = await supabase
        .from("videos")
        .delete()
        .eq("id", supabaseVideo.id);

      if (videoError) throw new Error(videoError.message);
      return "";
    }

    if (relatedSlug) {
      const { error } = await supabase
        .from("deep_dives")
        .delete()
        .eq("slug", relatedSlug);

      if (error) throw new Error(error.message);
    }
  } catch (error) {
    return error instanceof Error ? error.message : "Supabase delete failed.";
  }

  return "";
}

export async function PATCH(request: Request, context: RouteContext<"/admin/api/videos/[id]">) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as VideoUpdatePayload;
  const payload = {
    title: asCleanString(body.title),
    description: asCleanString(body.description),
    videoUrl: asCleanString(body.videoUrl),
    publishedDate: asCleanString(body.publishedDate),
    contentType: body.contentType,
    category: body.category,
    tags: asCleanStringList(body.tags),
    featured: Boolean(body.featured),
    thumbnail: asCleanString(body.thumbnail),
    relatedArticleSlug: asCleanString(body.relatedArticleSlug),
    hookText: asCleanString(body.hookText),
    views24h: asNumber(body.views24h),
    views48h: asNumber(body.views48h),
    views7d: asNumber(body.views7d),
    rankingByViews: asNumber(body.rankingByViews),
    averageViewDuration: asCleanString(body.averageViewDuration),
    retentionPercent: Math.min(100, asNumber(body.retentionPercent)),
    likes: asNumber(body.likes),
    comments: asNumber(body.comments),
    shares: asNumber(body.shares),
    platform: (body.platform === "Facebook" || body.platform === "Instagram" || body.platform === "TikTok"
      ? body.platform
      : "YouTube") as HookPlatform,
    notes: asCleanString(body.notes),
  };

  const errors: string[] = [];
  if (!payload.title) errors.push("Title is required.");
  if (!payload.videoUrl) errors.push("URL is required.");
  if (!payload.publishedDate) errors.push("Published date is required.");
  if (!payload.contentType || !validTypes.has(payload.contentType)) errors.push("Content type is required.");
  if (!payload.category || !validTopics.has(payload.category)) errors.push("Category is required.");

  const videoId = extractYouTubeId(payload.videoUrl);
  if (!videoId) errors.push("Enter a valid YouTube/video URL.");

  if (errors.length > 0 || !payload.contentType || !payload.category || !videoId) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const file = await readFile(videosPath, "utf8");
  const videos = JSON.parse(file) as RawVideoRecord[];
  const index = videos.findIndex((video) => video.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  videos[index] = applyFieldAliases(
    videos[index],
    {
      ...payload,
      contentType: payload.contentType,
      category: payload.category,
    },
    videoId,
  );

  await writeFile(videosPath, `${JSON.stringify(videos, null, 2)}\n`, "utf8");

  revalidatePath("/");
  revalidatePath("/videos");
  revalidatePath("/explore");
  revalidatePath("/blog");

  return NextResponse.json({ video: videos[index] });
}

export async function DELETE(_request: Request, context: RouteContext<"/admin/api/videos/[id]">) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const file = await readFile(videosPath, "utf8");
  const videos = JSON.parse(file) as RawVideoRecord[];
  const index = videos.findIndex((video) => video.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  const [deletedVideo] = videos.splice(index, 1);
  await writeFile(videosPath, `${JSON.stringify(videos, null, 2)}\n`, "utf8");
  await deleteLinkedArticle(deletedVideo);
  const warning = await deleteSupabaseVideoAndDeepDive(deletedVideo);

  revalidatePath("/");
  revalidatePath("/videos");
  revalidatePath("/explore");
  revalidatePath("/blog");

  return NextResponse.json({ video: deletedVideo, warning });
}

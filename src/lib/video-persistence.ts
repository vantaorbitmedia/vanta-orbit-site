import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import {
  contentTopics,
  extractYouTubeId,
  getYouTubeThumbnails,
  type ContentStatus,
  type ContentTopic,
  type VideoType,
} from "@/lib/content";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase-server";

export type VideoSavePayload = {
  id?: string;
  slug?: string;
  status?: ContentStatus;
  title?: string;
  focusObject?: string;
  selectedHook?: string;
  selectedThumbnailText?: string;
  titleIdeas?: string[];
  hookIdeas?: string[];
  thumbnailTextIdeas?: string[];
  description?: string;
  videoUrl?: string;
  publishedDate?: string;
  contentType?: VideoType;
  category?: ContentTopic;
  videoId?: string;
  thumbnail?: string;
  featured?: boolean;
  tags?: string[];
  series?: string;
  relatedArticleSlug?: string;
  deepDiveTitle?: string;
  deepDiveContent?: string;
  deepDiveMetaDescription?: string;
  deepDiveAiPrompt?: string;
  videoContext?: string;
  keyFacts?: string[];
  targetAudience?: string;
  tone?: string;
  depthLevel?: string;
  suggestedArticleStructure?: string[];
  sourceNotes?: string;
  relatedQuestions?: string[];
  seoKeywords?: string[];
  generatedImageUrls?: string[];
};

type RawVideoRecord = VideoSavePayload & {
  id: string;
  date?: string;
  type?: VideoType;
  topic?: ContentTopic;
  youtubeUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type RawArticleRecord = {
  slug: string;
  title: string;
  date: string;
  content: string;
  relatedVideoId: string;
  image?: string;
  tags?: string[];
  series?: string;
};

type PersistedSupabaseVideo = {
  id: string;
  slug?: string | null;
  status?: ContentStatus | null;
};

const videosPath = path.join(process.cwd(), "src", "data", "videos.json");
const articlesPath = path.join(process.cwd(), "src", "data", "articles.json");
const validTopics = new Set(contentTopics.map((topic) => topic.value));
const validTypes = new Set<VideoType>(["short", "long"]);

function asCleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringList(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(value.map((item) => asCleanString(item)).filter(Boolean)),
  );
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildVideoId(title: string, publishedDate: string) {
  const slug = slugify(title) || "untitled-video";
  const compactDate = publishedDate.replace(/-/g, "") || "draft";
  return `${slug}-${compactDate}`;
}

function validate(
  payload: Required<Pick<VideoSavePayload, "title" | "description" | "videoUrl" | "publishedDate">> & {
    contentType?: VideoType;
    category?: ContentTopic;
    thumbnail?: string;
  },
  status: ContentStatus,
) {
  const errors: string[] = [];

  if (!payload.title) errors.push("Title is required.");
  if (!payload.description) errors.push("Description is required.");
  if (!payload.videoUrl) errors.push("URL is required.");
  if (!payload.publishedDate) errors.push("Published date is required.");
  if (!payload.contentType || !validTypes.has(payload.contentType)) errors.push("Content type is required.");
  if (!payload.category || !validTopics.has(payload.category)) errors.push("Category is required.");
  if (status === "published" && !payload.thumbnail) errors.push("Thumbnail is required before publishing.");

  const videoId = extractYouTubeId(payload.videoUrl);
  if (!videoId) errors.push("Enter a valid YouTube/video URL.");

  return { errors, videoId };
}

function toRecord(body: VideoSavePayload, status: ContentStatus, existing?: RawVideoRecord): RawVideoRecord {
  const title = asCleanString(body.title);
  const description = asCleanString(body.description);
  const videoUrl = asCleanString(body.videoUrl);
  const publishedDate = asCleanString(body.publishedDate);
  const videoId = extractYouTubeId(asCleanString(body.videoId) || videoUrl);
  const id = asCleanString(body.id) || existing?.id || buildVideoId(title, publishedDate);
  const now = new Date().toISOString();
  const thumbnail = asCleanString(body.thumbnail) || getYouTubeThumbnails(videoId)[0] || "";
  const relatedArticleSlug = asCleanString(body.relatedArticleSlug)
    || slugify(asCleanString(body.deepDiveTitle));

  return {
    ...existing,
    id,
    slug: asCleanString(body.slug) || slugify(title),
    status,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    title,
    focusObject: asCleanString(body.focusObject),
    selectedHook: asCleanString(body.selectedHook),
    selectedThumbnailText: asCleanString(body.selectedThumbnailText),
    titleIdeas: asStringList(body.titleIdeas),
    hookIdeas: asStringList(body.hookIdeas),
    thumbnailTextIdeas: asStringList(body.thumbnailTextIdeas),
    description,
    youtubeUrl: videoUrl,
    videoUrl,
    date: publishedDate,
    publishedDate,
    type: body.contentType,
    contentType: body.contentType,
    topic: body.category,
    category: body.category,
    videoId,
    thumbnail,
    featured: Boolean(body.featured),
    tags: asStringList(body.tags),
    series: asCleanString(body.series),
    relatedArticleSlug,
    deepDiveTitle: asCleanString(body.deepDiveTitle),
    deepDiveContent: asCleanString(body.deepDiveContent),
    deepDiveMetaDescription: asCleanString(body.deepDiveMetaDescription),
    deepDiveAiPrompt: asCleanString(body.deepDiveAiPrompt),
    videoContext: asCleanString(body.videoContext),
    keyFacts: asStringList(body.keyFacts),
    targetAudience: asCleanString(body.targetAudience),
    tone: asCleanString(body.tone),
    depthLevel: asCleanString(body.depthLevel),
    suggestedArticleStructure: asStringList(body.suggestedArticleStructure),
    sourceNotes: asCleanString(body.sourceNotes),
    relatedQuestions: asStringList(body.relatedQuestions),
    seoKeywords: asStringList(body.seoKeywords),
    generatedImageUrls: asStringList(body.generatedImageUrls),
  };
}

async function saveJsonMirror(body: VideoSavePayload, status: ContentStatus) {
  const title = asCleanString(body.title);
  const publishedDate = asCleanString(body.publishedDate);
  const contentType = body.contentType;
  const category = body.category;
  const file = await readFile(videosPath, "utf8");
  const videos = JSON.parse(file) as RawVideoRecord[];
  const id = asCleanString(body.id) || buildVideoId(title, publishedDate);
  const index = videos.findIndex((video) => video.id === id);
  const record = toRecord({ ...body, id, contentType, category }, status, index >= 0 ? videos[index] : undefined);

  if (index >= 0) {
    videos[index] = record;
  } else {
    videos.unshift(record);
  }

  await writeFile(videosPath, `${JSON.stringify(videos, null, 2)}\n`, "utf8");

  if (status === "published" && record.deepDiveTitle && record.deepDiveContent && record.relatedArticleSlug) {
    const articlesFile = await readFile(articlesPath, "utf8");
    const articles = JSON.parse(articlesFile) as RawArticleRecord[];
    const article: RawArticleRecord = {
      slug: record.relatedArticleSlug,
      title: record.deepDiveTitle,
      date: record.publishedDate || record.date || new Date().toISOString().slice(0, 10),
      content: record.deepDiveContent,
      relatedVideoId: record.id,
      image: record.thumbnail,
      tags: record.tags,
      series: record.series,
    };
    const articleIndex = articles.findIndex((entry) => entry.slug === article.slug);

    if (articleIndex >= 0) {
      articles[articleIndex] = { ...articles[articleIndex], ...article };
    } else {
      articles.unshift(article);
    }

    await writeFile(articlesPath, `${JSON.stringify(articles, null, 2)}\n`, "utf8");
    revalidatePath(`/blog/${article.slug}`);
  }

  return record;
}

async function saveSupabaseDeepDive(videoId: string, record: RawVideoRecord, status: ContentStatus) {
  if (!record.deepDiveTitle || !record.deepDiveContent) return null;

  const supabase = getSupabaseAdminClient();
  const slug = record.relatedArticleSlug || slugify(record.deepDiveTitle);
  const payload = {
    video_id: videoId,
    title: record.deepDiveTitle,
    slug,
    content: record.deepDiveContent,
    meta_description: record.deepDiveMetaDescription,
    status,
  };
  const { data: existing, error: selectError } = await supabase
    .from("deep_dives")
    .select("id")
    .eq("video_id", videoId)
    .maybeSingle();

  if (selectError) throw new Error(selectError.message);

  if (existing?.id) {
    const { data, error } = await supabase
      .from("deep_dives")
      .update(payload)
      .eq("id", existing.id)
      .select("id, slug, status")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from("deep_dives")
    .insert(payload)
    .select("id, slug, status")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function saveSupabaseVideo(record: RawVideoRecord, status: ContentStatus) {
  const supabase = getSupabaseAdminClient();
  const payload = {
    title: record.title,
    description: record.description,
    video_url: record.videoUrl,
    thumbnail_url: record.thumbnail,
    published_date: record.publishedDate,
    content_type: record.contentType,
    category: record.category,
    slug: record.slug,
    status,
    selected_hook: record.selectedHook,
    selected_thumbnail_text: record.selectedThumbnailText,
    tags: record.tags,
    series: record.series,
    is_featured: record.featured,
  };
  const { data: existing, error: selectError } = await supabase
    .from("videos")
    .select("id, slug, status")
    .eq("slug", record.slug)
    .maybeSingle();

  if (selectError) throw new Error(selectError.message);

  if (existing?.id) {
    const { data, error } = await supabase
      .from("videos")
      .update(payload)
      .eq("id", existing.id)
      .select("id, slug, status")
      .single();

    if (error) throw new Error(error.message);
    return data as PersistedSupabaseVideo;
  }

  const { data, error } = await supabase
    .from("videos")
    .insert(payload)
    .select("id, slug, status")
    .single();

  if (error) throw new Error(error.message);
  return data as PersistedSupabaseVideo;
}

function revalidatePublicContent() {
  revalidatePath("/");
  revalidatePath("/videos");
  revalidatePath("/explore");
  revalidatePath("/blog");
}

export async function persistVideo(body: VideoSavePayload, requestedStatus: ContentStatus) {
  const status: ContentStatus = requestedStatus === "published" ? "published" : "draft";
  const title = asCleanString(body.title);
  const description = asCleanString(body.description);
  const videoUrl = asCleanString(body.videoUrl);
  const publishedDate = asCleanString(body.publishedDate);
  const contentType = body.contentType;
  const category = body.category;
  const thumbnail = asCleanString(body.thumbnail);
  const { errors } = validate(
    { title, description, videoUrl, publishedDate, contentType, category, thumbnail },
    status,
  );

  if (errors.length > 0 || !contentType || !category) {
    return { ok: false as const, errors };
  }

  const jsonRecord = await saveJsonMirror({ ...body, contentType, category }, status);
  let supabaseVideo: PersistedSupabaseVideo | null = null;
  let deepDive = null;
  let supabaseError = "";

  if (isSupabaseConfigured()) {
    try {
      supabaseVideo = await saveSupabaseVideo(jsonRecord, status);
      deepDive = await saveSupabaseDeepDive(supabaseVideo.id, jsonRecord, status);
    } catch (error) {
      supabaseError = error instanceof Error ? error.message : "Supabase save failed.";
    }
  }

  revalidatePublicContent();

  return {
    ok: true as const,
    video: {
      ...jsonRecord,
      supabaseId: supabaseVideo?.id ?? "",
      supabaseSlug: supabaseVideo?.slug ?? "",
    },
    deepDive,
    storage: supabaseVideo ? "supabase+json" : "json",
    warning: supabaseError || (!isSupabaseConfigured() ? "Supabase is not configured, so the JSON fallback was used." : ""),
  };
}

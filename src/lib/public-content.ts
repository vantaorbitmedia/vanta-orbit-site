import "server-only";
import {
  articles,
  createYouTubeEmbedUrl,
  normalizeVideoItem,
  sortContentByNewestDate,
  videos as fallbackVideos,
  type ContentItem,
  type ContentTopic,
  type VideoItem,
  type VideoType,
} from "@/lib/content";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase-server";

type PublicSupabaseVideoRow = {
  id: string;
  title: string | null;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  published_date: string | null;
  content_type: VideoType | null;
  category: ContentTopic | null;
  slug: string | null;
  status: "draft" | "published" | null;
  selected_hook: string | null;
  selected_thumbnail_text: string | null;
  tags: string[] | null;
  series: string | null;
  is_featured: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const publicVideoColumns = [
  "id",
  "title",
  "description",
  "video_url",
  "thumbnail_url",
  "published_date",
  "content_type",
  "category",
  "slug",
  "status",
  "selected_hook",
  "selected_thumbnail_text",
  "tags",
  "series",
  "is_featured",
  "created_at",
  "updated_at",
].join(",");

function clean(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

function supabaseVideoToRaw(row: PublicSupabaseVideoRow) {
  const title = clean(row.title) || "Untitled video";
  const slug = clean(row.slug) || row.id;
  const publishedDate = clean(row.published_date) || clean(row.updated_at) || clean(row.created_at);

  return {
    id: row.id,
    title,
    slug,
    status: row.status ?? "draft",
    createdAt: clean(row.created_at) || publishedDate,
    updatedAt: clean(row.updated_at) || publishedDate,
    description: clean(row.description) || "A newly published Vanta Orbit Media video.",
    videoUrl: clean(row.video_url),
    youtubeUrl: clean(row.video_url),
    publishedDate,
    date: publishedDate,
    contentType: row.content_type ?? "short",
    type: row.content_type ?? "short",
    category: row.category ?? "space-mysteries",
    topic: row.category ?? "space-mysteries",
    thumbnail: clean(row.thumbnail_url),
    featured: Boolean(row.is_featured),
    tags: Array.isArray(row.tags) ? row.tags : [],
    series: clean(row.series),
    selectedHook: clean(row.selected_hook),
    selectedThumbnailText: clean(row.selected_thumbnail_text),
  };
}

function mergeVideos(primary: VideoItem[], fallback: VideoItem[]) {
  const seen = new Set<string>();
  const merged: VideoItem[] = [];

  for (const video of [...primary, ...fallback]) {
    const key = video.slug || video.id;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(video);
  }

  return [...merged].sort((left, right) => {
    const leftDate = new Date(left.date || left.updatedAt || left.createdAt).getTime();
    const rightDate = new Date(right.date || right.updatedAt || right.createdAt).getTime();
    return (Number.isFinite(rightDate) ? rightDate : 0) - (Number.isFinite(leftDate) ? leftDate : 0);
  });
}

export async function getPublicVideos() {
  if (!isSupabaseConfigured()) {
    return fallbackVideos;
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("videos")
      .select(publicVideoColumns)
      .eq("status", "published")
      .order("published_date", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("[public-content] Supabase published videos query failed", { error: error.message });
      return fallbackVideos;
    }

    const supabaseVideos = ((data ?? []) as unknown as PublicSupabaseVideoRow[])
      .map((row) => normalizeVideoItem(supabaseVideoToRaw(row)));

    return mergeVideos(supabaseVideos, fallbackVideos);
  } catch (error) {
    console.error("[public-content] Falling back to JSON videos", {
      error: error instanceof Error ? error.message : "Unknown public video load error.",
    });
    return fallbackVideos;
  }
}

export async function getPublicLatestVideos(limit = 6) {
  return (await getPublicVideos()).slice(0, limit);
}

export async function getPublicFeaturedVideo() {
  const publicVideos = await getPublicVideos();
  const featuredVideos = publicVideos.filter((video) => video.featured);
  return featuredVideos[0] ?? publicVideos.find((video) => video.type === "long") ?? publicVideos[0];
}

export async function getPublicArchiveContent() {
  const publicVideos = await getPublicVideos();
  const videoItems: ContentItem[] = publicVideos.map((video) => ({
    title: video.title,
    slug: video.slug,
    topic: video.topic,
    type: "video",
    description: video.description,
    image: video.thumbnail,
    youtubeUrl: createYouTubeEmbedUrl(video.videoId),
    youtubeId: video.videoId,
    videoType: video.type,
    relatedArticleSlug: video.relatedArticleSlug,
    tags: video.tags,
    series: video.series,
    date: video.date,
  }));

  return sortContentByNewestDate([
    ...articles.map((article) => ({
      title: article.title,
      slug: article.slug,
      topic: article.topic,
      type: "article" as const,
      description: article.description,
      image: article.image,
      youtubeUrl: article.youtubeUrl,
      youtubeId: article.youtubeId,
      relatedVideoId: article.relatedVideoId,
      relatedVideoSlug: article.relatedVideoSlug,
      tags: article.tags,
      series: article.series,
      date: article.date,
      content: article.content,
      body: article.body,
    })),
    ...videoItems,
  ]);
}

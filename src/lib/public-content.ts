import "server-only";
import {
  articles,
  createYouTubeThumbnailUrl,
  createYouTubeEmbedUrl,
  normalizeVideoItem,
  sortContentByNewestDate,
  type ArticleItem,
  type ContentStatus,
  videos as fallbackVideos,
  type ContentItem,
  type ContentTopic,
  type VideoItem,
  type VideoType,
} from "@/lib/content";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase-server";

export type SupabaseVideoStatus = ContentStatus;

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
  status: string | null;
  selected_hook: string | null;
  selected_thumbnail_text: string | null;
  tags: string[] | null;
  series: string | null;
  is_featured: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SupabaseDeepDiveRow = {
  video_id: string | null;
  title: string | null;
  slug: string | null;
  content: string | null;
  meta_description: string | null;
  status: string | null;
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

function normalizeStatus(value?: string | null): SupabaseVideoStatus {
  const normalized = clean(value).toLowerCase();
  if (normalized === "published" || normalized === "draft" || normalized === "archived") return normalized;
  return "draft";
}

function supabaseVideoToRaw(row: PublicSupabaseVideoRow) {
  const title = clean(row.title) || "Untitled video";
  const slug = clean(row.slug) || row.id;
  const publishedDate = clean(row.published_date) || clean(row.updated_at) || clean(row.created_at);

  return {
    id: row.id,
    title,
    slug,
    status: normalizeStatus(row.status),
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
    thumbnail: clean(row.thumbnail_url) || createYouTubeThumbnailUrl(clean(row.video_url)),
    featured: Boolean(row.is_featured),
    tags: Array.isArray(row.tags) ? row.tags : [],
    series: clean(row.series),
    selectedHook: clean(row.selected_hook),
    selectedThumbnailText: clean(row.selected_thumbnail_text),
  };
}

function stablePublicThumbnail(thumbnail: string) {
  return thumbnail.includes("img.youtube.com/vi/") && thumbnail.includes("/maxresdefault.jpg")
    ? thumbnail.replace("/maxresdefault.jpg", "/hqdefault.jpg")
    : thumbnail;
}

function dedupeKey(video: VideoItem) {
  return video.videoId || video.slug || video.id;
}

function sanitizePublicVideo(video: VideoItem, articleSlugs: Set<string>) {
  return {
    ...video,
    thumbnail: stablePublicThumbnail(video.thumbnail),
    relatedArticleSlug: video.relatedArticleSlug && articleSlugs.has(video.relatedArticleSlug)
      ? video.relatedArticleSlug
      : "",
  };
}

function mergeVideos(primary: VideoItem[], fallback: VideoItem[], validArticleSlugs = new Set(articles.map((article) => article.slug))) {
  const seen = new Set<string>();
  const merged: VideoItem[] = [];

  for (const video of [...primary, ...fallback]) {
    const key = dedupeKey(video);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(sanitizePublicVideo(video, validArticleSlugs));
  }

  return [...merged].sort((left, right) => {
    const leftDate = new Date(left.date || left.updatedAt || left.createdAt).getTime();
    const rightDate = new Date(right.date || right.updatedAt || right.createdAt).getTime();
    return (Number.isFinite(rightDate) ? rightDate : 0) - (Number.isFinite(leftDate) ? leftDate : 0);
  });
}

export async function getPublicVideos() {
  const supabaseVideos = await getSupabaseVideos({ statuses: ["published"], includeDeepDives: true });
  const validArticleSlugs = new Set([
    ...articles.map((article) => article.slug),
    ...supabaseVideos.map((video) => video.relatedArticleSlug).filter(Boolean),
  ]);

  return mergeVideos(supabaseVideos, fallbackVideos, validArticleSlugs);
}

export async function getSupabaseVideos({
  statuses,
  includeDeepDives = false,
}: {
  statuses?: string[];
  includeDeepDives?: boolean;
} = {}) {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("videos")
      .select(publicVideoColumns)
      .order("published_date", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false, nullsFirst: false });

    if (statuses && statuses.length > 0) {
      query = query.in("status", statuses.flatMap((status) => {
        const lower = status.toLowerCase();
        return [status, lower, lower.toUpperCase(), `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`];
      }));
    }

    const { data, error } = await query;

    if (error) {
      console.error("[public-content] Supabase videos query failed", { error: error.message });
      return [];
    }

    const rows = (data ?? []) as unknown as PublicSupabaseVideoRow[];
    let deepDives = new Map<string, SupabaseDeepDiveRow>();

    if (includeDeepDives && rows.length > 0) {
      const { data: deepDiveData, error: deepDiveError } = await supabase
        .from("deep_dives")
        .select("video_id,title,slug,content,meta_description,status")
        .in("video_id", rows.map((row) => row.id));

      if (deepDiveError) {
        console.error("[public-content] Supabase deep dives query failed", { error: deepDiveError.message });
      } else {
        deepDives = new Map(
          ((deepDiveData ?? []) as unknown as SupabaseDeepDiveRow[]).map((deepDive) => [clean(deepDive.video_id), deepDive]),
        );
      }
    }

    return rows
      .map((row) => {
        const deepDive = deepDives.get(row.id);
        return normalizeVideoItem({
          ...supabaseVideoToRaw(row),
          relatedArticleSlug: clean(deepDive?.slug),
          deepDiveTitle: clean(deepDive?.title),
          deepDiveContent: clean(deepDive?.content),
          deepDiveMetaDescription: clean(deepDive?.meta_description),
        });
      });
  } catch (error) {
    console.error("[public-content] Supabase videos query failed", {
      error: error instanceof Error ? error.message : "Unknown public video load error.",
    });
    return [];
  }
}

export async function getAdminVideos() {
  const supabaseVideos = await getSupabaseVideos({ includeDeepDives: true });
  const validArticleSlugs = new Set([
    ...articles.map((article) => article.slug),
    ...supabaseVideos.map((video) => video.relatedArticleSlug).filter(Boolean),
  ]);

  return mergeVideos(supabaseVideos, fallbackVideos, validArticleSlugs);
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
  const publicArticles = await getPublicArticles();
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
    ...publicArticles.map((article) => ({
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

function splitBody(content: string) {
  return content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function excerpt(content: string) {
  const compact = content.replace(/\s+/g, " ").trim();
  return compact.length > 170 ? `${compact.slice(0, 167).trimEnd()}...` : compact;
}

function mergeArticles(primary: ArticleItem[], fallback: ArticleItem[]) {
  const seen = new Set<string>();
  return sortContentByNewestDate([...primary, ...fallback].filter((article) => {
    if (seen.has(article.slug)) return false;
    seen.add(article.slug);
    return true;
  }));
}

async function getSupabaseArticles({ statuses }: { statuses?: string[] } = {}) {
  if (!isSupabaseConfigured()) return articles;

  try {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("deep_dives")
      .select("video_id,title,slug,content,meta_description,status")
      .order("slug", { ascending: true });

    if (statuses && statuses.length > 0) {
      query = query.in("status", statuses.flatMap((status) => {
        const lower = status.toLowerCase();
        return [status, lower, lower.toUpperCase(), `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`];
      }));
    }

    const { data: deepDiveData, error } = await query;

    if (error) {
      console.error("[public-content] Supabase deep dives query failed", { error: error.message });
      return [];
    }

    const deepDives = (deepDiveData ?? []) as unknown as SupabaseDeepDiveRow[];
    const videoIds = Array.from(new Set(deepDives.map((deepDive) => clean(deepDive.video_id)).filter(Boolean)));
    const videosById = new Map<string, VideoItem>();

    if (videoIds.length > 0) {
      const { data: videoData, error: videoError } = await supabase
        .from("videos")
        .select(publicVideoColumns)
        .in("id", videoIds);

      if (videoError) {
        console.error("[public-content] Supabase deep dive video lookup failed", { error: videoError.message });
      } else {
        for (const row of (videoData ?? []) as unknown as PublicSupabaseVideoRow[]) {
          videosById.set(row.id, normalizeVideoItem(supabaseVideoToRaw(row)));
        }
      }
    }

    const supabaseArticles: ArticleItem[] = deepDives
      .map((deepDive) => {
        const slug = clean(deepDive.slug);
        const title = clean(deepDive.title);
        const content = clean(deepDive.content);
        if (!slug || !title || !content) return null;

        const relatedVideoId = clean(deepDive.video_id);
        const relatedVideo = videosById.get(relatedVideoId);
        const description = clean(deepDive.meta_description) || excerpt(content);

        return {
          slug,
          title,
          date: relatedVideo?.publishedDate || relatedVideo?.updatedAt || "",
          content,
          body: splitBody(content),
          relatedVideoId,
          relatedVideoSlug: relatedVideo?.slug || "",
          topic: relatedVideo?.topic || "space-mysteries",
          description,
          image: relatedVideo?.thumbnail || "/vanta-banner.png",
          youtubeId: relatedVideo?.videoId || "",
          youtubeUrl: createYouTubeEmbedUrl(relatedVideo?.videoId),
          tags: relatedVideo?.tags || [],
          series: relatedVideo?.series || "",
        };
      })
      .filter((article): article is ArticleItem => Boolean(article));

    return sortContentByNewestDate(supabaseArticles);
  } catch (error) {
    console.error("[public-content] Supabase article load failed", {
      error: error instanceof Error ? error.message : "Unknown article load error.",
    });
    return [];
  }
}

export async function getPublicArticles() {
  const supabaseArticles = await getSupabaseArticles({ statuses: ["published"] });
  return mergeArticles(supabaseArticles, articles);
}

export async function getPublicArticle(slug: string) {
  return (await getPublicArticles()).find((article) => article.slug === slug);
}

export async function getAdminArticles() {
  const supabaseArticles = await getSupabaseArticles();
  return mergeArticles(supabaseArticles, articles);
}

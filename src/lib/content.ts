import {
  Eclipse,
  Globe2,
  HelpCircle,
  Moon,
  Orbit,
  Sparkles,
  Sun,
} from "lucide-react";
import articlesData from "@/data/articles.json";
import videosData from "@/data/videos.json";

export type ContentTopic =
  | "moon"
  | "earth"
  | "sun"
  | "deep-space"
  | "future-earth"
  | "space-mysteries";

export type HomeTopicName =
  | "Earth"
  | "Moon"
  | "Sun"
  | "Planets"
  | "Deep Space"
  | "The Unknown";

export type Topic = HomeTopicName;

export type VideoType = "short" | "long";
export type HookPlatform = "YouTube" | "Facebook" | "Instagram" | "TikTok";
export type ContentStatus = "draft" | "published" | "archived";

export type VideoItem = {
  id: string;
  title: string;
  focusObject: string;
  slug: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  date: string;
  publishedDate: string;
  type: VideoType;
  contentType: VideoType;
  topic: ContentTopic;
  category: ContentTopic;
  description: string;
  youtubeUrl: string;
  videoUrl: string;
  videoId: string;
  youtubeId: string;
  embedUrl: string;
  thumbnail: string;
  featured: boolean;
  tags: string[];
  series: string;
  selectedHook: string;
  selectedThumbnailText: string;
  titleIdeas: string[];
  hookIdeas: string[];
  thumbnailTextIdeas: string[];
  generatedImageUrls: string[];
  deepDiveTitle: string;
  deepDiveContent: string;
  deepDiveMetaDescription: string;
  deepDiveAiPrompt: string;
  relatedArticleSlug: string;
  videoContext: string;
  keyFacts: string[];
  targetAudience: string;
  tone: string;
  depthLevel: string;
  suggestedArticleStructure: string[];
  sourceNotes: string;
  relatedQuestions: string[];
  seoKeywords: string[];
  hookText: string;
  views24h: number;
  views48h: number;
  views7d: number;
  rankingByViews: number;
  averageViewDuration: string;
  retentionPercent: number;
  likes: number;
  comments: number;
  shares: number;
  platform: HookPlatform;
  notes: string;
  hookScore: number;
};

export type ArticleItem = {
  slug: string;
  title: string;
  date: string;
  content: string;
  body: string[];
  relatedVideoId: string;
  relatedVideoSlug: string;
  topic: ContentTopic;
  description: string;
  image: string;
  youtubeId: string;
  youtubeUrl: string;
  tags: string[];
  series: string;
};

export type ContentItem = {
  title: string;
  slug: string;
  topic: ContentTopic;
  type: "video" | "article";
  description: string;
  image: string;
  youtubeUrl: string;
  youtubeId?: string;
  videoType?: VideoType;
  relatedArticleSlug?: string;
  relatedVideoId?: string;
  relatedVideoSlug?: string;
  tags?: string[];
  series?: string;
  date: string;
  readTime?: string;
  content?: string;
  body?: string[];
};

type RawVideoItem = {
  id: string;
  title: string;
  focusObject?: string;
  slug?: string;
  status?: ContentStatus;
  createdAt?: string;
  updatedAt?: string;
  date?: string;
  publishedDate?: string;
  type?: VideoType;
  contentType?: VideoType;
  topic?: ContentTopic;
  category?: ContentTopic;
  description: string;
  youtubeUrl?: string;
  videoUrl?: string;
  videoId?: string;
  thumbnail?: string;
  featured?: boolean;
  tags?: string[];
  series?: string;
  selectedHook?: string;
  selectedThumbnailText?: string;
  titleIdeas?: string[];
  hookIdeas?: string[];
  thumbnailTextIdeas?: string[];
  generatedImageUrls?: string[];
  deepDiveTitle?: string;
  deepDiveContent?: string;
  deepDiveMetaDescription?: string;
  deepDiveAiPrompt?: string;
  metaDescription?: string;
  relatedArticleSlug?: string;
  videoContext?: string;
  keyFacts?: string[];
  targetAudience?: string;
  tone?: string;
  depthLevel?: string;
  suggestedArticleStructure?: string[];
  sourceNotes?: string;
  relatedQuestions?: string[];
  seoKeywords?: string[];
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
};

type RawArticleItem = {
  slug: string;
  title: string;
  date: string;
  content: string;
  relatedVideoId: string;
  image?: string;
  tags?: string[];
  series?: string;
};

export const contentTopics = [
  {
    value: "earth" as const,
    label: "Earth",
    description: "Core Earth systems, orbit, atmosphere, and our home world in focus.",
  },
  {
    value: "moon" as const,
    label: "Moon",
    description: "Lunar drift, eclipses, tides, scars, and the companion shaping Earth.",
  },
  {
    value: "sun" as const,
    label: "Sun",
    description: "Solar storms, fusion, aging, and the star driving every story here.",
  },
  {
    value: "deep-space" as const,
    label: "Deep Space",
    description: "Ancient light, galaxies, black holes, and the larger architecture of the cosmos.",
  },
  {
    value: "future-earth" as const,
    label: "Future Earth",
    description: "Climate futures, orbital cycles, and the long arc of Earth’s changing fate.",
  },
  {
    value: "space-mysteries" as const,
    label: "Space Mysteries",
    description: "Unknown signals, strange worlds, cosmic anomalies, and unanswered questions.",
  },
];

const contentTopicSet = new Set<ContentTopic>(contentTopics.map((topic) => topic.value));

export const topics = [
  {
    name: "Earth" as const,
    slug: "earth",
    description: "Climate cycles, oceans, atmosphere, magnetic fields, and the fragile world beneath us.",
    icon: Globe2,
    image: "/images/topics/earth.jpg",
    contentTopic: "earth" as const,
  },
  {
    name: "Moon" as const,
    slug: "moon",
    description: "Tides, impact scars, lunar drift, eclipses, and the companion that shaped Earth.",
    icon: Moon,
    image: "/images/topics/moon.jpg",
    contentTopic: "moon" as const,
  },
  {
    name: "Sun" as const,
    slug: "sun",
    description: "Solar storms, fusion, stellar aging, auroras, and the star that powers every story here.",
    icon: Sun,
    image: "/images/topics/sun.jpg",
    contentTopic: "sun" as const,
  },
  {
    name: "Planets" as const,
    slug: "planets",
    description: "Strange worlds, impossible weather, diamond interiors, rings, moons, and alien horizons.",
    icon: Orbit,
    image: "/images/topics/planets.jpg",
    contentTopic: "space-mysteries" as const,
  },
  {
    name: "Deep Space" as const,
    slug: "deep-space",
    description: "Galaxies, black holes, ancient stars, nebulae, and the vast architecture of the cosmos.",
    icon: Sparkles,
    image: "/images/topics/deep-space.jpg",
    contentTopic: "deep-space" as const,
  },
  {
    name: "The Unknown" as const,
    slug: "the-unknown",
    description: "Mysteries, anomalies, cosmic questions, and the places where certainty runs out.",
    icon: HelpCircle,
    image: "/images/topics/unknown.jpg",
    contentTopic: "space-mysteries" as const,
  },
];

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const FALLBACK_IMAGE = "/vanta-banner.png";
const FALLBACK_THUMBNAIL = "/images/thumbnails/placeholder.jpg";

export function isValidYouTubeId(youtubeId?: string | null): youtubeId is string {
  return typeof youtubeId === "string" && YOUTUBE_ID_PATTERN.test(youtubeId);
}

export function extractYouTubeId(url?: string | null) {
  if (!url) return "";

  const trimmed = url.trim();
  if (isValidYouTubeId(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const shortId = parsed.pathname.replace(/^\/+/, "").split("/")[0];
      return isValidYouTubeId(shortId) ? shortId : "";
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (parsed.pathname.startsWith("/shorts/")) {
        const shortId = parsed.pathname.split("/")[2];
        return isValidYouTubeId(shortId) ? shortId : "";
      }

      if (parsed.pathname.startsWith("/embed/")) {
        const embedId = parsed.pathname.split("/")[2];
        return isValidYouTubeId(embedId) ? embedId : "";
      }

      const watchId = parsed.searchParams.get("v");
      return isValidYouTubeId(watchId) ? watchId : "";
    }
  } catch {
    return "";
  }

  return "";
}

export function createYouTubeEmbedUrl(videoId?: string | null) {
  return isValidYouTubeId(videoId)
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : "";
}

export function createYouTubeWatchUrl(videoId?: string | null) {
  return isValidYouTubeId(videoId)
    ? `https://www.youtube.com/watch?v=${videoId}`
    : "";
}

export function getYouTubeThumbnails(videoId?: string | null) {
  if (!isValidYouTubeId(videoId)) return [];

  return [
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
  ];
}

export const createYouTubeThumbnailUrls = getYouTubeThumbnails;

export function createYouTubeThumbnailUrl(videoId?: string | null) {
  return getYouTubeThumbnails(videoId)[0] ?? FALLBACK_THUMBNAIL;
}

export function formatVideoTypeLabel(type: VideoType) {
  return type === "long" ? "Long" : "Short";
}

export function formatTopicLabel(topic: ContentTopic) {
  return contentTopics.find((entry) => entry.value === topic)?.label ?? topic;
}

export function getTopicByHomeName(name: HomeTopicName) {
  return topics.find((topic) => topic.name === name);
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toDateValue(value: string) {
  return new Date(value).getTime();
}

function sortByNewestDate<T extends { date: string }>(items: T[]) {
  return [...items].sort((left, right) => toDateValue(right.date) - toDateValue(left.date));
}

export function sortContentByNewestDate<T extends { date: string }>(items: T[]) {
  return sortByNewestDate(items);
}

function normalizeTopic(topic: string) {
  return contentTopicSet.has(topic as ContentTopic)
    ? (topic as ContentTopic)
    : "space-mysteries";
}

function normalizeStringList(value?: string[] | string) {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeNumber(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizePlatform(value?: HookPlatform) {
  return value === "Facebook" || value === "Instagram" || value === "TikTok" ? value : "YouTube";
}

export function calculateHookScore(input: {
  views24h?: number;
  rankingByViews?: number;
  retentionPercent?: number;
  comments?: number;
  shares?: number;
}) {
  const views24h = normalizeNumber(input.views24h);
  const rankingByViews = normalizeNumber(input.rankingByViews);
  const retentionPercent = normalizeNumber(input.retentionPercent);
  const comments = normalizeNumber(input.comments);
  const shares = normalizeNumber(input.shares);
  const rankingBonus = rankingByViews > 0 && rankingByViews <= 3
    ? 30
    : rankingByViews > 0 && rankingByViews <= 6
      ? 15
      : 0;
  const retentionBonus = Math.min(retentionPercent, 100) * 0.35;
  const engagementBonus = Math.min(comments * 1.5 + shares * 2, 35);
  const viewScore = Math.log10(Math.max(views24h, 0) + 1) * 18;

  return Math.round(Math.min(100, viewScore + rankingBonus + retentionBonus + engagementBonus));
}

function createExcerpt(content: string) {
  const compact = content.replace(/\s+/g, " ").trim();
  if (compact.length <= 170) return compact;

  return `${compact.slice(0, 167).trimEnd()}...`;
}

function splitContentBody(content: string) {
  return content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function estimateReadTime(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 180));
  return `${minutes} min read`;
}

function normalizeVideo(raw: RawVideoItem): VideoItem {
  const videoUrl = raw.videoUrl ?? raw.youtubeUrl ?? "";
  const videoId = extractYouTubeId(raw.videoId || videoUrl);
  const topic = normalizeTopic(raw.category ?? raw.topic ?? "space-mysteries");
  const type = raw.contentType ?? raw.type ?? "short";
  const date = raw.publishedDate ?? raw.date ?? "";

  return {
    id: raw.id,
    title: raw.title,
    focusObject: raw.focusObject ?? "",
    slug: raw.slug || toSlug(raw.title),
    status: raw.status ?? "published",
    createdAt: raw.createdAt ?? date,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? date,
    date,
    publishedDate: date,
    type,
    contentType: type,
    topic,
    category: topic,
    description: raw.description,
    youtubeUrl: videoUrl || createYouTubeWatchUrl(videoId),
    videoUrl: videoUrl || createYouTubeWatchUrl(videoId),
    videoId,
    youtubeId: videoId,
    embedUrl: createYouTubeEmbedUrl(videoId),
    thumbnail: raw.thumbnail || createYouTubeThumbnailUrl(videoId),
    featured: Boolean(raw.featured),
    tags: raw.tags ?? [],
    series: raw.series ?? "",
    selectedHook: raw.selectedHook ?? "",
    selectedThumbnailText: raw.selectedThumbnailText ?? "",
    titleIdeas: normalizeStringList(raw.titleIdeas),
    hookIdeas: normalizeStringList(raw.hookIdeas),
    thumbnailTextIdeas: normalizeStringList(raw.thumbnailTextIdeas),
    generatedImageUrls: normalizeStringList(raw.generatedImageUrls),
    deepDiveTitle: raw.deepDiveTitle ?? "",
    deepDiveContent: raw.deepDiveContent ?? "",
    deepDiveMetaDescription: raw.deepDiveMetaDescription ?? raw.metaDescription ?? "",
    deepDiveAiPrompt: raw.deepDiveAiPrompt ?? "",
    relatedArticleSlug: raw.relatedArticleSlug ?? "",
    videoContext: raw.videoContext ?? "",
    keyFacts: normalizeStringList(raw.keyFacts),
    targetAudience: raw.targetAudience ?? "",
    tone: raw.tone ?? "",
    depthLevel: raw.depthLevel ?? "",
    suggestedArticleStructure: normalizeStringList(raw.suggestedArticleStructure),
    sourceNotes: raw.sourceNotes ?? "",
    relatedQuestions: normalizeStringList(raw.relatedQuestions),
    seoKeywords: normalizeStringList(raw.seoKeywords),
    hookText: raw.hookText ?? "",
    views24h: normalizeNumber(raw.views24h),
    views48h: normalizeNumber(raw.views48h),
    views7d: normalizeNumber(raw.views7d),
    rankingByViews: normalizeNumber(raw.rankingByViews),
    averageViewDuration: raw.averageViewDuration ?? "",
    retentionPercent: normalizeNumber(raw.retentionPercent),
    likes: normalizeNumber(raw.likes),
    comments: normalizeNumber(raw.comments),
    shares: normalizeNumber(raw.shares),
    platform: normalizePlatform(raw.platform),
    notes: raw.notes ?? "",
    hookScore: calculateHookScore(raw),
  };
}

export function normalizeVideoItem(raw: RawVideoItem): VideoItem {
  return normalizeVideo(raw);
}

const normalizedVideoItems = sortByNewestDate(
  (videosData as RawVideoItem[]).map(normalizeVideo),
);
const publishedVideoItems = normalizedVideoItems.filter((video) => video.status === "published");

const videosById = new Map(publishedVideoItems.map((video) => [video.id, video]));
const videosBySlug = new Map(publishedVideoItems.map((video) => [video.slug, video]));

function normalizeArticle(raw: RawArticleItem): ArticleItem {
  const relatedVideo = videosById.get(raw.relatedVideoId);
  const topic = relatedVideo?.topic ?? "space-mysteries";
  const content = raw.content.trim();

  return {
    slug: raw.slug,
    title: raw.title,
    date: raw.date,
    content,
    body: splitContentBody(content),
    relatedVideoId: raw.relatedVideoId,
    relatedVideoSlug: relatedVideo?.slug ?? "",
    topic,
    description: createExcerpt(content),
    image: raw.image ?? FALLBACK_IMAGE,
    youtubeId: relatedVideo?.videoId ?? "",
    youtubeUrl: createYouTubeEmbedUrl(relatedVideo?.videoId ?? ""),
    tags: raw.tags ?? relatedVideo?.tags ?? [],
    series: raw.series ?? relatedVideo?.series ?? "",
  };
}

const normalizedArticles = sortByNewestDate(
  (articlesData as RawArticleItem[]).map(normalizeArticle),
);

const articleBySlug = new Map(normalizedArticles.map((article) => [article.slug, article]));

function toArticleContentItem(article: ArticleItem): ContentItem {
  return {
    title: article.title,
    slug: article.slug,
    topic: article.topic,
    type: "article",
    description: article.description,
    image: article.image,
    youtubeUrl: article.youtubeUrl,
    youtubeId: article.youtubeId,
    relatedVideoId: article.relatedVideoId,
    relatedVideoSlug: article.relatedVideoSlug,
    tags: article.tags,
    series: article.series,
    date: article.date,
    readTime: estimateReadTime(article.content),
    content: article.content,
    body: article.body,
  };
}

function toVideoContentItem(video: VideoItem): ContentItem {
  return {
    title: video.title,
    slug: video.slug,
    topic: video.topic,
    type: "video",
    description: video.description,
    image: video.thumbnail,
    youtubeUrl: video.embedUrl,
    youtubeId: video.videoId,
    videoType: video.type,
    relatedArticleSlug: video.relatedArticleSlug,
    tags: video.tags,
    series: video.series,
    date: video.date,
  };
}

function warnInDevelopment(message: string) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(message);
  }
}

function validateRelationships() {
  const articleSlugs = new Set(normalizedArticles.map((article) => article.slug));
  const featuredVideos = publishedVideoItems.filter((video) => video.featured);

  if (featuredVideos.length > 1) {
    warnInDevelopment(
      `[content] Multiple featured videos found: ${featuredVideos
        .map((video) => video.slug)
        .join(", ")}.`,
    );
  }

  for (const video of normalizedVideoItems) {
    if (video.status !== "published") continue;
    if (video.relatedArticleSlug && !articleSlugs.has(video.relatedArticleSlug)) {
      warnInDevelopment(
        `[content] Video "${video.slug}" references missing relatedArticleSlug "${video.relatedArticleSlug}".`,
      );
    }
  }

  for (const article of normalizedArticles) {
    if (article.relatedVideoId && !videosById.has(article.relatedVideoId)) {
      warnInDevelopment(
        `[content] Article "${article.slug}" references missing relatedVideoId "${article.relatedVideoId}".`,
      );
    }
  }
}

validateRelationships();

export function getAllVideos() {
  return [...publishedVideoItems];
}

export function getAllAdminVideos() {
  return [...normalizedVideoItems];
}

export function getLatestVideos(limit = 6) {
  return getAllVideos().slice(0, limit);
}

export function getFeaturedVideo() {
  const featuredVideos = publishedVideoItems.filter((video) => video.featured);

  if (featuredVideos.length === 1) {
    return featuredVideos[0];
  }

  if (featuredVideos.length > 1) {
    warnInDevelopment(
      `[content] Using newest featured video "${featuredVideos[0].slug}" because multiple videos are marked featured.`,
    );
    return featuredVideos[0];
  }

  return publishedVideoItems.find((video) => video.type === "long") ?? publishedVideoItems[0];
}

export function getVideosByType(type: VideoType) {
  return publishedVideoItems.filter((video) => video.type === type);
}

export function getVideosByTopic(topic: ContentTopic) {
  return publishedVideoItems.filter((video) => video.topic === topic);
}

export function getAllArticles() {
  return [...normalizedArticles];
}

export function getAllContentSortedByDate() {
  return sortByNewestDate([
    ...normalizedArticles.map(toArticleContentItem),
    ...publishedVideoItems.map(toVideoContentItem),
  ]);
}

export function getArticle(slug: string) {
  return articleBySlug.get(slug);
}

export function getVideoBySlug(slug: string) {
  return videosBySlug.get(slug);
}

export function getVideoById(id: string) {
  return videosById.get(id);
}

export function relatedFor(item: Pick<ContentItem, "slug" | "topic">) {
  return getAllContentSortedByDate()
    .filter((entry) => entry.slug !== item.slug && entry.topic === item.topic)
    .slice(0, 3);
}

export const videos = getAllVideos();
export const adminVideos = getAllAdminVideos();
export const latestVideos = getLatestVideos();
export const featuredVideo = getFeaturedVideo();
export const longVideos = getVideosByType("long");
export const shortVideos = getVideosByType("short");
export const articles = getAllArticles();
export const archiveContent = getAllContentSortedByDate();

export { Eclipse };

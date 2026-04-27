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
  createdAt?: string;
  updatedAt?: string;
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
  supabaseId?: string;
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

type SupabaseVideoRow = {
  id: string;
  title: string | null;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  published_date: string | null;
  content_type: VideoType | null;
  category: ContentTopic | null;
  slug: string | null;
  status: ContentStatus | null;
  selected_hook: string | null;
  selected_thumbnail_text: string | null;
  tags: string[] | null;
  series: string | null;
  is_featured: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SupabaseDeepDiveRow = {
  video_id: string;
  title: string | null;
  slug: string | null;
  content: string | null;
  meta_description: string | null;
  status: ContentStatus | null;
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

type SupabaseSchemaCheck = {
  ok: boolean;
  table: string;
  columns: string[];
  error?: string;
};

const videosPath = path.join(process.cwd(), "src", "data", "videos.json");
const articlesPath = path.join(process.cwd(), "src", "data", "articles.json");
const validTopics = new Set(contentTopics.map((topic) => topic.value));
const validTypes = new Set<VideoType>(["short", "long"]);
const expectedVideoColumns = [
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
];
const expectedDeepDiveColumns = [
  "id",
  "video_id",
  "title",
  "slug",
  "content",
  "meta_description",
  "status",
];

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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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

function supabaseRowToDraft(row: SupabaseVideoRow, deepDive?: SupabaseDeepDiveRow): VideoSavePayload {
  const title = asCleanString(row.title);
  const publishedDate = asCleanString(row.published_date);

  return {
    id: row.id,
    supabaseId: row.id,
    slug: asCleanString(row.slug) || slugify(title),
    status: row.status ?? "draft",
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
    title,
    description: asCleanString(row.description),
    videoUrl: asCleanString(row.video_url),
    publishedDate,
    contentType: row.content_type ?? "short",
    category: row.category ?? "moon",
    videoId: extractYouTubeId(asCleanString(row.video_url)),
    thumbnail: asCleanString(row.thumbnail_url),
    selectedHook: asCleanString(row.selected_hook),
    selectedThumbnailText: asCleanString(row.selected_thumbnail_text),
    tags: Array.isArray(row.tags) ? row.tags : [],
    series: asCleanString(row.series),
    featured: Boolean(row.is_featured),
    relatedArticleSlug: asCleanString(deepDive?.slug),
    deepDiveTitle: asCleanString(deepDive?.title),
    deepDiveContent: asCleanString(deepDive?.content),
    deepDiveMetaDescription: asCleanString(deepDive?.meta_description),
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

async function checkSupabaseTableColumns(table: string, columns: string[]): Promise<SupabaseSchemaCheck> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from(table)
    .select(columns.join(","), { head: true })
    .limit(1);

  if (!error) {
    return { ok: true, table, columns };
  }

  const check = {
    ok: false,
    table,
    columns,
    error: error.message,
  };
  console.error("[supabase] schema check failed", check);
  return check;
}

export async function getVideoPersistenceSchemaDiagnostics(includeDeepDive = true) {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      checks: [] as SupabaseSchemaCheck[],
    };
  }

  const checks = [
    await checkSupabaseTableColumns("videos", expectedVideoColumns),
  ];

  if (includeDeepDive) {
    checks.push(await checkSupabaseTableColumns("deep_dives", expectedDeepDiveColumns));
  }

  return {
    configured: true,
    checks,
  };
}

async function saveSupabaseVideo(record: RawVideoRecord, status: ContentStatus) {
  const supabase = getSupabaseAdminClient();
  const possibleSupabaseId = asCleanString(record.supabaseId) || (isUuid(record.id) ? record.id : "");
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
  let existing: PersistedSupabaseVideo | null = null;

  if (possibleSupabaseId) {
    const { data, error } = await supabase
      .from("videos")
      .select("id, slug, status")
      .eq("id", possibleSupabaseId)
      .maybeSingle();

    if (error) {
      console.error("[supabase] videos id lookup failed", {
        id: possibleSupabaseId,
        slug: record.slug,
        error: error.message,
      });
      throw new Error(error.message);
    }

    existing = data as PersistedSupabaseVideo | null;
  }

  if (!existing) {
    const { data, error } = await supabase
      .from("videos")
      .select("id, slug, status")
      .eq("slug", record.slug)
      .maybeSingle();

    if (error) {
      console.error("[supabase] videos slug lookup failed", {
        slug: record.slug,
        error: error.message,
      });
      throw new Error(error.message);
    }

    existing = data as PersistedSupabaseVideo | null;
  }

  if (existing?.id) {
    const { data, error } = await supabase
      .from("videos")
      .update(payload)
      .eq("id", existing.id)
      .select("id, slug, status")
      .single();

    if (error) {
      console.error("[supabase] videos update failed", {
        id: existing.id,
        slug: record.slug,
        status,
        error: error.message,
      });
      throw new Error(error.message);
    }
    return data as PersistedSupabaseVideo;
  }

  const insertPayload = possibleSupabaseId
    ? { id: possibleSupabaseId, ...payload }
    : payload;
  const { data, error } = await supabase
    .from("videos")
    .insert(insertPayload)
    .select("id, slug, status")
    .single();

  if (error) {
    console.error("[supabase] videos insert failed", {
      id: possibleSupabaseId || undefined,
      slug: record.slug,
      status,
      error: error.message,
    });
    throw new Error(error.message);
  }
  return data as PersistedSupabaseVideo;
}

export async function listDraftVideos() {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    const { data: videosData, error } = await supabase
      .from("videos")
      .select(expectedVideoColumns.join(","))
      .eq("status", "draft")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[supabase] draft list failed", { error: error.message });
      throw new Error(error.message);
    }

    const rows = (videosData ?? []) as unknown as SupabaseVideoRow[];
    const videoIds = rows.map((row) => row.id);
    let deepDives = new Map<string, SupabaseDeepDiveRow>();

    if (videoIds.length > 0) {
      const { data: deepDiveData, error: deepDiveError } = await supabase
        .from("deep_dives")
        .select("video_id,title,slug,content,meta_description,status")
        .in("video_id", videoIds);

      if (deepDiveError) {
        console.error("[supabase] draft deep dive list failed", { error: deepDiveError.message });
      } else {
        deepDives = new Map(
          ((deepDiveData ?? []) as unknown as SupabaseDeepDiveRow[]).map((deepDive) => [deepDive.video_id, deepDive]),
        );
      }
    }

    return rows.map((row) => supabaseRowToDraft(row, deepDives.get(row.id)));
  }

  const file = await readFile(videosPath, "utf8");
  const videos = JSON.parse(file) as RawVideoRecord[];
  return videos
    .filter((video) => video.status === "draft")
    .map((video) => ({
      ...video,
      videoUrl: asCleanString(video.videoUrl) || asCleanString(video.youtubeUrl),
      publishedDate: asCleanString(video.publishedDate) || asCleanString(video.date),
      contentType: video.contentType ?? video.type,
      category: video.category ?? video.topic,
      thumbnail: asCleanString(video.thumbnail),
    }));
}

export async function deleteDraftVideo(id: string) {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    const { data: existing, error: selectError } = await supabase
      .from("videos")
      .select(expectedVideoColumns.join(","))
      .eq("id", id)
      .eq("status", "draft")
      .maybeSingle();

    if (selectError) {
      console.error("[supabase] draft delete lookup failed", { id, error: selectError.message });
      throw new Error(selectError.message);
    }

    if (!existing) {
      throw new Error("Draft not found.");
    }

    const { error: deepDiveError } = await supabase
      .from("deep_dives")
      .delete()
      .eq("video_id", id);

    if (deepDiveError) {
      console.error("[supabase] draft deep dive delete failed", { id, error: deepDiveError.message });
      throw new Error(deepDiveError.message);
    }

    const { error } = await supabase
      .from("videos")
      .delete()
      .eq("id", id)
      .eq("status", "draft");

    if (error) {
      console.error("[supabase] draft delete failed", { id, error: error.message });
      throw new Error(error.message);
    }

    revalidatePublicContent();
    return supabaseRowToDraft(existing as unknown as SupabaseVideoRow);
  }

  const file = await readFile(videosPath, "utf8");
  const videos = JSON.parse(file) as RawVideoRecord[];
  const index = videos.findIndex((video) => video.id === id && video.status === "draft");

  if (index === -1) {
    throw new Error("Draft not found.");
  }

  const [deletedVideo] = videos.splice(index, 1);
  await writeFile(videosPath, `${JSON.stringify(videos, null, 2)}\n`, "utf8");
  return deletedVideo;
}

export async function publishDraftVideo(id: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is required to publish saved drafts.");
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("videos")
    .update({ status: "published" })
    .eq("id", id)
    .eq("status", "draft")
    .select(expectedVideoColumns.join(","))
    .single();

  if (error) {
    console.error("[supabase] draft publish failed", { id, error: error.message });
    throw new Error(error.message);
  }

  const { error: deepDiveError } = await supabase
    .from("deep_dives")
    .update({ status: "published" })
    .eq("video_id", id);

  if (deepDiveError) {
    console.error("[supabase] draft deep dive publish failed", { id, error: deepDiveError.message });
    throw new Error(deepDiveError.message);
  }

  revalidatePublicContent();
  return supabaseRowToDraft(data as unknown as SupabaseVideoRow);
}

function revalidatePublicContent() {
  revalidatePath("/");
  revalidatePath("/videos");
  revalidatePath("/explore");
  revalidatePath("/blog");
}

function canWriteJsonMirror() {
  return process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1";
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

  const record = toRecord({ ...body, contentType, category }, status);
  let supabaseVideo: PersistedSupabaseVideo | null = null;
  let deepDive = null;
  let supabaseError = "";
  let jsonRecord: RawVideoRecord | null = null;
  let jsonError = "";
  const schemaDiagnostics = await getVideoPersistenceSchemaDiagnostics(
    Boolean(record.deepDiveTitle && record.deepDiveContent),
  );

  if (isSupabaseConfigured()) {
    try {
      const failedSchemaChecks = schemaDiagnostics.checks.filter((check) => !check.ok);
      if (failedSchemaChecks.length > 0) {
        throw new Error(
          failedSchemaChecks
            .map((check) => `${check.table}: ${check.error}`)
            .join(" | "),
        );
      }

      supabaseVideo = await saveSupabaseVideo(record, status);
      deepDive = await saveSupabaseDeepDive(supabaseVideo.id, record, status);
    } catch (error) {
      supabaseError = error instanceof Error ? error.message : "Supabase save failed.";
      console.error("[supabase] video persistence failed", {
        status,
        slug: record.slug,
        error: supabaseError,
      });
    }
  }

  if (!supabaseVideo && canWriteJsonMirror()) {
    try {
      jsonRecord = await saveJsonMirror({ ...body, contentType, category }, status);
    } catch (error) {
      jsonError = error instanceof Error ? error.message : "JSON fallback save failed.";
      console.error("[video-persistence] JSON fallback failed", {
        status,
        slug: record.slug,
        error: jsonError,
      });
    }
  }

  if (!supabaseVideo && !jsonRecord) {
    return {
      ok: false as const,
      errors: [
        supabaseError
          ? `Supabase save failed: ${supabaseError}`
          : "Supabase is not configured.",
        jsonError
          ? `JSON fallback failed: ${jsonError}`
          : "JSON fallback is disabled in production.",
      ],
      schemaDiagnostics,
    };
  }

  revalidatePublicContent();

  const savedRecord = jsonRecord ?? record;
  const storage = supabaseVideo ? (jsonRecord ? "supabase+json" : "supabase") : "json";

  return {
    ok: true as const,
    video: {
      ...savedRecord,
      supabaseId: supabaseVideo?.id ?? "",
      supabaseSlug: supabaseVideo?.slug ?? "",
    },
    deepDive,
    storage,
    schemaDiagnostics,
    warning: supabaseError || jsonError || (!isSupabaseConfigured() ? "Supabase is not configured, so the JSON fallback was used." : ""),
  };
}

import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const videosPath = path.join(root, "src", "data", "videos.json");
const articlesPath = path.join(root, "src", "data", "articles.json");
const envPath = path.join(root, ".env.local");
const validContentTypes = new Set(["short", "long"]);
const validCategories = new Set(["moon", "earth", "sun", "deep-space", "future-earth", "space-mysteries"]);

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readEnv(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [
          line.slice(0, index),
          line.slice(index + 1).replace(/^['"]|['"]$/g, ""),
        ];
      }),
  );
}

function slugify(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractYouTubeId(value) {
  const input = clean(value);
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;

  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return url.pathname.replace(/^\/+/, "").split("/")[0] || "";
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2] || "";
      if (url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2] || "";
      return url.searchParams.get("v") || "";
    }
  } catch {
    return "";
  }

  return "";
}

function youtubeWatchUrl(videoId) {
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : "";
}

function youtubeThumbnail(videoId) {
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
}

function list(value) {
  if (Array.isArray(value)) return Array.from(new Set(value.map(clean).filter(Boolean)));
  if (typeof value === "string") return Array.from(new Set(value.split(/\n|,/).map(clean).filter(Boolean)));
  return [];
}

function normalizeVideo(raw) {
  const title = clean(raw.title);
  const videoUrl = clean(raw.videoUrl) || clean(raw.youtubeUrl);
  const videoId = extractYouTubeId(clean(raw.videoId) || videoUrl);
  const slug = clean(raw.slug) || slugify(title);
  const contentType = validContentTypes.has(raw.contentType) ? raw.contentType : validContentTypes.has(raw.type) ? raw.type : "short";
  const category = validCategories.has(raw.category) ? raw.category : validCategories.has(raw.topic) ? raw.topic : "space-mysteries";
  const status = clean(raw.status).toLowerCase() || "published";

  return {
    sourceId: clean(raw.id),
    slug,
    videoId,
    payload: {
      title,
      description: clean(raw.description) || "Imported from local video data.",
      video_url: videoUrl || youtubeWatchUrl(videoId),
      thumbnail_url: clean(raw.thumbnail) || youtubeThumbnail(videoId),
      published_date: clean(raw.publishedDate) || clean(raw.date) || null,
      content_type: contentType,
      category,
      slug,
      status: status === "draft" || status === "archived" ? status : "published",
      selected_hook: clean(raw.selectedHook) || clean(raw.hookText),
      selected_thumbnail_text: clean(raw.selectedThumbnailText),
      tags: list(raw.tags),
      series: clean(raw.series),
      is_featured: Boolean(raw.featured),
    },
    deepDive: {
      title: clean(raw.deepDiveTitle),
      content: clean(raw.deepDiveContent),
      meta_description: clean(raw.deepDiveMetaDescription) || clean(raw.metaDescription),
      slug: clean(raw.relatedArticleSlug) || slugify(clean(raw.deepDiveTitle)),
    },
  };
}

function safeUpdatePayload(existing, next) {
  const update = {};

  for (const [key, value] of Object.entries(next)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;

    const current = existing[key];
    if (current === null || current === undefined || current === "" || (Array.isArray(current) && current.length === 0)) {
      update[key] = value;
    }
  }

  return update;
}

function articleForVideo(articles, video) {
  return articles.find((article) =>
    clean(article.relatedVideoId) === video.sourceId ||
    clean(article.slug) === clean(video.deepDive.slug),
  );
}

async function main() {
  const [envText, videosText, articlesText] = await Promise.all([
    readFile(envPath, "utf8"),
    readFile(videosPath, "utf8"),
    readFile(articlesPath, "utf8"),
  ]);
  const env = readEnv(envText);

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase URL or service role key is missing from .env.local.");
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const localVideos = JSON.parse(videosText).map(normalizeVideo);
  const localArticles = JSON.parse(articlesText);
  const stats = {
    imported: 0,
    skipped: 0,
    updated: 0,
    duplicate: 0,
    deepDivesImported: 0,
    deepDivesUpdated: 0,
    errors: 0,
  };
  const errors = [];
  const { data: existingRows, error: existingError } = await supabase
    .from("videos")
    .select("id,slug,video_url,title,description,thumbnail_url,published_date,content_type,category,status,selected_hook,selected_thumbnail_text,tags,series,is_featured");

  if (existingError) throw new Error(existingError.message);

  const existingBySlug = new Map();
  const existingByVideoId = new Map();
  for (const row of existingRows ?? []) {
    const slug = clean(row.slug);
    const videoId = extractYouTubeId(row.video_url);
    if (slug) existingBySlug.set(slug, row);
    if (videoId) existingByVideoId.set(videoId, row);
  }

  for (const video of localVideos) {
    try {
      if (!video.payload.title || !video.slug) {
        stats.skipped += 1;
        continue;
      }

      const existing = existingBySlug.get(video.slug) || (video.videoId ? existingByVideoId.get(video.videoId) : null);
      let supabaseVideoId = "";

      if (existing?.id) {
        supabaseVideoId = existing.id;
        const update = safeUpdatePayload(existing, video.payload);

        if (Object.keys(update).length > 0) {
          const { error } = await supabase.from("videos").update(update).eq("id", existing.id);
          if (error) throw new Error(error.message);
          stats.updated += 1;
        } else {
          stats.duplicate += 1;
        }
      } else {
        const { data, error } = await supabase
          .from("videos")
          .insert(video.payload)
          .select("id")
          .single();

        if (error) throw new Error(error.message);
        supabaseVideoId = data.id;
        stats.imported += 1;
      }

      const relatedArticle = articleForVideo(localArticles, video);
      const deepDivePayload = {
        video_id: supabaseVideoId,
        title: video.deepDive.title || clean(relatedArticle?.title),
        slug: video.deepDive.slug || clean(relatedArticle?.slug),
        content: video.deepDive.content || clean(relatedArticle?.content),
        meta_description: video.deepDive.meta_description || clean(relatedArticle?.metaDescription),
        status: video.payload.status,
      };

      if (deepDivePayload.title && deepDivePayload.slug && deepDivePayload.content) {
        const { data: existingDeepDive, error: deepDiveLookupError } = await supabase
          .from("deep_dives")
          .select("id,video_id,title,slug,content,meta_description,status")
          .eq("video_id", supabaseVideoId)
          .maybeSingle();

        if (deepDiveLookupError) throw new Error(deepDiveLookupError.message);

        if (existingDeepDive?.id) {
          const update = safeUpdatePayload(existingDeepDive, deepDivePayload);
          if (Object.keys(update).length > 0) {
            const { error } = await supabase.from("deep_dives").update(update).eq("id", existingDeepDive.id);
            if (error) throw new Error(error.message);
            stats.deepDivesUpdated += 1;
          }
        } else {
          const { error } = await supabase.from("deep_dives").insert(deepDivePayload);
          if (error) throw new Error(error.message);
          stats.deepDivesImported += 1;
        }
      }
    } catch (error) {
      stats.errors += 1;
      errors.push({
        slug: video.slug,
        message: error instanceof Error ? error.message : "Unknown import error.",
      });
    }
  }

  console.log("Video import complete.");
  console.log(`Imported: ${stats.imported}`);
  console.log(`Updated: ${stats.updated}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Duplicates/no-op: ${stats.duplicate}`);
  console.log(`Deep dives imported: ${stats.deepDivesImported}`);
  console.log(`Deep dives updated: ${stats.deepDivesUpdated}`);
  console.log(`Errors: ${stats.errors}`);
  if (errors.length > 0) {
    console.log(JSON.stringify(errors, null, 2));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Import failed.");
  process.exit(1);
});

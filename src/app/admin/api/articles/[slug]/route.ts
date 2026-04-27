import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase-server";

type RawArticleRecord = {
  slug: string;
  relatedVideoId?: string;
  [key: string]: unknown;
};

type RawVideoRecord = {
  id: string;
  relatedArticleSlug?: string;
  [key: string]: unknown;
};

const articlesPath = path.join(process.cwd(), "src", "data", "articles.json");
const videosPath = path.join(process.cwd(), "src", "data", "videos.json");

function asCleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function detachArticleFromVideos(slug: string, relatedVideoId: string) {
  const file = await readFile(videosPath, "utf8");
  const videos = JSON.parse(file) as RawVideoRecord[];
  let detachedVideos = 0;

  const nextVideos = videos.map((video) => {
    const pointsToArticle = asCleanString(video.relatedArticleSlug) === slug;
    const matchesRelatedVideo = relatedVideoId && video.id === relatedVideoId && asCleanString(video.relatedArticleSlug) === slug;

    if (!pointsToArticle && !matchesRelatedVideo) return video;

    detachedVideos += 1;
    const next = { ...video };
    delete next.relatedArticleSlug;
    return next;
  });

  if (detachedVideos > 0) {
    await writeFile(videosPath, `${JSON.stringify(nextVideos, null, 2)}\n`, "utf8");
  }

  return detachedVideos;
}

async function deleteSupabaseDeepDive(slug: string) {
  if (!isSupabaseConfigured()) return "";

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("deep_dives").delete().eq("slug", slug);

    if (error) throw new Error(error.message);
  } catch (error) {
    return error instanceof Error ? error.message : "Supabase deep dive delete failed.";
  }

  return "";
}

export async function DELETE(_request: Request, context: RouteContext<"/admin/api/articles/[slug]">) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const cleanSlug = decodeURIComponent(slug).trim();

  if (!cleanSlug) {
    return NextResponse.json({ error: "Article slug is required." }, { status: 400 });
  }

  const file = await readFile(articlesPath, "utf8");
  const articles = JSON.parse(file) as RawArticleRecord[];
  const index = articles.findIndex((article) => article.slug === cleanSlug);

  if (index === -1) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  const [deletedArticle] = articles.splice(index, 1);
  await writeFile(articlesPath, `${JSON.stringify(articles, null, 2)}\n`, "utf8");

  const detachedVideos = await detachArticleFromVideos(cleanSlug, asCleanString(deletedArticle.relatedVideoId));
  const warning = await deleteSupabaseDeepDive(cleanSlug);

  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${cleanSlug}`);
  revalidatePath("/videos");
  revalidatePath("/explore");

  return NextResponse.json({ article: deletedArticle, detachedVideos, warning });
}

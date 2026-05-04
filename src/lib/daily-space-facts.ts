import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase-server";

export const DEFAULT_DAILY_FACT_CARD_CTA = "Follow for daily space facts 🚀";

export const dailyFactStatuses = [
  "scheduled",
  "live_short_fact",
  "needs_review",
  "ready",
  "published",
  "archived",
] as const;

export type DailyFactStatus = (typeof dailyFactStatuses)[number];

export type DailySpaceFact = {
  id: string;
  slug: string;
  title: string;
  short_fact: string;
  detailed_explanation: string;
  source_notes: string;
  publish_date: string;
  status: DailyFactStatus;
  is_homepage_fact: boolean;
  facebook_caption: string;
  instagram_caption: string;
  tiktok_caption: string;
  youtube_caption: string;
  hashtags: string[];
  leonardo_prompt: string;
  image_url: string;
  image_alt: string;
  card_headline: string;
  card_subtext: string;
  card_curiosity_line: string;
  card_cta: string;
  created_at: string;
  updated_at: string;
  full_post_published_at: string;
};

export type DailyFactSavePayload = Partial<DailySpaceFact> & {
  title: string;
  short_fact: string;
  publish_date: string;
};

type SupabaseDailyFactRow = Omit<DailySpaceFact, "full_post_published_at"> & {
  full_post_published_at: string | null;
};

const factsPath = path.join(process.cwd(), "src", "data", "daily-space-facts.json");
const publicHomepageStatuses = new Set<DailyFactStatus>(["live_short_fact", "ready", "published"]);

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function slugifyDailyFact(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => asString(item)).filter(Boolean)));
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeStatus(value: unknown): DailyFactStatus {
  return dailyFactStatuses.includes(value as DailyFactStatus) ? (value as DailyFactStatus) : "scheduled";
}

function normalizeFact(value: Partial<DailySpaceFact>): DailySpaceFact {
  const now = new Date().toISOString();
  const title = asString(value.title) || "Untitled Space Fact";
  const publishDate = asString(value.publish_date) || todayIsoDate();
  const slug = asString(value.slug) || slugifyDailyFact(title);

  return {
    id: asString(value.id) || `${slug}-${publishDate}`,
    slug,
    title,
    short_fact: asString(value.short_fact),
    detailed_explanation: asString(value.detailed_explanation),
    source_notes: asString(value.source_notes),
    publish_date: publishDate,
    status: normalizeStatus(value.status),
    is_homepage_fact: Boolean(value.is_homepage_fact),
    facebook_caption: asString(value.facebook_caption),
    instagram_caption: asString(value.instagram_caption),
    tiktok_caption: asString(value.tiktok_caption),
    youtube_caption: asString(value.youtube_caption),
    hashtags: asStringArray(value.hashtags),
    leonardo_prompt: asString(value.leonardo_prompt),
    image_url: asString(value.image_url),
    image_alt: asString(value.image_alt),
    card_headline: asString(value.card_headline),
    card_subtext: asString(value.card_subtext),
    card_curiosity_line: asString(value.card_curiosity_line),
    card_cta: asString(value.card_cta) || DEFAULT_DAILY_FACT_CARD_CTA,
    created_at: asString(value.created_at) || now,
    updated_at: asString(value.updated_at) || now,
    full_post_published_at: asString(value.full_post_published_at),
  };
}

function rowToFact(row: SupabaseDailyFactRow): DailySpaceFact {
  return normalizeFact({
    ...row,
    full_post_published_at: row.full_post_published_at ?? "",
  });
}

function factToSupabasePayload(fact: DailySpaceFact) {
  return {
    id: fact.id,
    slug: fact.slug,
    title: fact.title,
    short_fact: fact.short_fact,
    detailed_explanation: fact.detailed_explanation,
    source_notes: fact.source_notes,
    publish_date: fact.publish_date,
    status: fact.status,
    is_homepage_fact: fact.is_homepage_fact,
    facebook_caption: fact.facebook_caption,
    instagram_caption: fact.instagram_caption,
    tiktok_caption: fact.tiktok_caption,
    youtube_caption: fact.youtube_caption,
    hashtags: fact.hashtags,
    leonardo_prompt: fact.leonardo_prompt,
    image_url: fact.image_url,
    image_alt: fact.image_alt,
    card_headline: fact.card_headline,
    card_subtext: fact.card_subtext,
    card_curiosity_line: fact.card_curiosity_line,
    card_cta: fact.card_cta,
    created_at: fact.created_at,
    updated_at: fact.updated_at,
    full_post_published_at: fact.full_post_published_at || null,
  };
}

function canWriteJsonMirror() {
  return process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1";
}

async function readJsonFacts() {
  const file = await readFile(factsPath, "utf8");
  return (JSON.parse(file) as Partial<DailySpaceFact>[]).map(normalizeFact);
}

async function writeJsonFacts(facts: DailySpaceFact[]) {
  if (!canWriteJsonMirror()) {
    throw new Error("Local JSON writes are disabled in production.");
  }

  await writeFile(factsPath, `${JSON.stringify(facts, null, 2)}\n`, "utf8");
}

export async function listDailyFacts() {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("daily_space_facts")
      .select("*")
      .order("publish_date", { ascending: false });

    if (error) {
      console.error("[daily-facts] Supabase list failed", { error: error.message });
      return (await readJsonFacts()).sort((a, b) => b.publish_date.localeCompare(a.publish_date));
    }

    return ((data ?? []) as SupabaseDailyFactRow[]).map(rowToFact);
  }

  return (await readJsonFacts()).sort((a, b) => b.publish_date.localeCompare(a.publish_date));
}

export async function getDailyFactById(id: string) {
  const facts = await listDailyFacts();
  return facts.find((fact) => fact.id === id) ?? null;
}

export async function getDailyFactBySlug(slug: string) {
  const facts = await listDailyFacts();
  return facts.find((fact) => fact.slug === slug) ?? null;
}

export async function getHomepageDailyFact(date = todayIsoDate()) {
  const facts = await listDailyFacts();
  const eligible = facts
    .filter((fact) => publicHomepageStatuses.has(fact.status) && fact.publish_date <= date)
    .sort((a, b) => {
      if (a.is_homepage_fact !== b.is_homepage_fact) return a.is_homepage_fact ? -1 : 1;
      return b.publish_date.localeCompare(a.publish_date);
    });

  return eligible[0] ?? null;
}

export async function saveDailyFact(payload: DailyFactSavePayload) {
  const existing = payload.id ? await getDailyFactById(payload.id) : null;
  const now = new Date().toISOString();
  const fact = normalizeFact({
    ...existing,
    ...payload,
    id: payload.id || existing?.id,
    slug: payload.slug || existing?.slug || slugifyDailyFact(payload.title),
    hashtags: payload.hashtags,
    created_at: existing?.created_at || payload.created_at || now,
    updated_at: now,
    full_post_published_at:
      payload.status === "published" && !existing?.full_post_published_at
        ? now
        : payload.full_post_published_at ?? existing?.full_post_published_at ?? "",
  });

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("daily_space_facts")
      .upsert(factToSupabasePayload(fact), { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      console.error("[daily-facts] Supabase save failed", { id: fact.id, error: error.message });
      if (!canWriteJsonMirror()) {
        throw new Error(error.message);
      }
    } else {
      revalidateDailyFactPaths(fact);
      return rowToFact(data as SupabaseDailyFactRow);
    }
  }

  const facts = await readJsonFacts();
  const index = facts.findIndex((item) => item.id === fact.id);

  if (index >= 0) {
    facts[index] = fact;
  } else {
    facts.unshift(fact);
  }

  await writeJsonFacts(facts);
  revalidateDailyFactPaths(fact);
  return fact;
}

export async function updateDailyFactStatus(id: string, status: DailyFactStatus) {
  const existing = await getDailyFactById(id);
  if (!existing) throw new Error("Daily space fact not found.");

  return saveDailyFact({
    ...existing,
    status,
    full_post_published_at: status === "published" ? existing.full_post_published_at || new Date().toISOString() : existing.full_post_published_at,
  });
}

export async function deleteDailyFacts(ids: string[]) {
  const cleanIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
  if (cleanIds.length === 0) {
    return { deleted: 0, ids: [] };
  }

  const existingFacts = (await listDailyFacts()).filter((fact) => cleanIds.includes(fact.id));

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("daily_space_facts")
      .delete()
      .in("id", cleanIds);

    if (error) {
      console.error("[daily-facts] Supabase delete failed", { ids: cleanIds, error: error.message });
      if (!canWriteJsonMirror()) {
        throw new Error(error.message);
      }
    } else {
      for (const fact of existingFacts) {
        revalidateDailyFactPaths(fact);
      }
      revalidatePath("/admin/daily-facts");
      revalidatePath("/");
      return { deleted: existingFacts.length, ids: cleanIds };
    }
  }

  const facts = await readJsonFacts();
  const nextFacts = facts.filter((fact) => !cleanIds.includes(fact.id));
  await writeJsonFacts(nextFacts);

  for (const fact of existingFacts) {
    revalidateDailyFactPaths(fact);
  }
  revalidatePath("/admin/daily-facts");
  revalidatePath("/");

  return { deleted: facts.length - nextFacts.length, ids: cleanIds };
}

export async function activateDailySpaceFact(options: {
  date?: string;
  generatedFields?: Partial<DailySpaceFact>;
} = {}) {
  const date = options.date || todayIsoDate();
  const facts = await listDailyFacts();
  const scheduled = facts
    .filter((fact) => fact.publish_date <= date && fact.status !== "archived")
    .sort((a, b) => b.publish_date.localeCompare(a.publish_date))[0] ?? null;

  if (!scheduled) {
    return {
      activated: false,
      date,
      fact: null,
      message: "No scheduled daily space fact found for today or earlier.",
    };
  }

  const needsDraftFields = !scheduled.detailed_explanation
    || !scheduled.facebook_caption
    || !scheduled.instagram_caption
    || !scheduled.tiktok_caption
    || !scheduled.youtube_caption
    || scheduled.hashtags.length === 0
    || !scheduled.leonardo_prompt
    || !scheduled.card_headline
    || !scheduled.card_subtext;
  const nextStatus: DailyFactStatus = scheduled.status === "published" || scheduled.status === "ready"
    ? scheduled.status
    : needsDraftFields || options.generatedFields ? "needs_review" : "live_short_fact";
  const updated = await saveDailyFact({
    ...scheduled,
    ...options.generatedFields,
    status: nextStatus,
    is_homepage_fact: true,
  });

  const older = facts.filter((fact) => fact.id !== updated.id && fact.is_homepage_fact);
  for (const fact of older) {
    await saveDailyFact({ ...fact, is_homepage_fact: false });
  }

  return {
    activated: true,
    date,
    fact: updated,
    olderHomepageFactsCleared: older.map((fact) => fact.id),
    generatedDraftFieldsApplied: Boolean(options.generatedFields),
  };
}

function revalidateDailyFactPaths(fact: DailySpaceFact) {
  revalidatePath("/");
  revalidatePath("/daily-facts");
  revalidatePath(`/daily-facts/${fact.slug}`);
  revalidatePath("/admin/daily-facts");
  revalidatePath(`/admin/daily-facts/${fact.id}`);
}

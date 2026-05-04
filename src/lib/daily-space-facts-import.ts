import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_DAILY_FACT_CARD_CTA, dailyFactStatuses, slugifyDailyFact, type DailyFactStatus, type DailySpaceFact } from "@/lib/daily-space-facts";

export type DailyFactImportOptions = {
  force?: boolean;
  allowDuplicatePublishDates?: boolean;
  allowDuplicateSlugs?: boolean;
};

export type DailyFactImportResult = {
  ok: boolean;
  total: number;
  valid: number;
  imported: number;
  skipped: number;
  errors: string[];
  skippedProtected: string[];
};

const protectedStatuses = new Set<DailyFactStatus>(["published", "live_short_fact"]);

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function normalizeStatus(value: unknown) {
  return dailyFactStatuses.includes(value as DailyFactStatus) ? value as DailyFactStatus : "scheduled";
}

function normalizeImportFact(value: Partial<DailySpaceFact>) {
  const title = asString(value.title);
  const slug = asString(value.slug) || slugifyDailyFact(title);
  const publishDate = asString(value.publish_date);
  const id = asString(value.id) || `${slug}-${publishDate}`;

  return {
    id,
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
    full_post_published_at: asString(value.full_post_published_at) || null,
  };
}

export function validateDailyFactImport(input: unknown, options: DailyFactImportOptions = {}) {
  const errors: string[] = [];

  if (!Array.isArray(input)) {
    return { facts: [], errors: ["Import JSON must be an array of daily space facts."] };
  }

  const publishDates = new Map<string, string>();
  const slugs = new Map<string, string>();
  const facts = input.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors.push(`Item ${index + 1}: expected an object.`);
      return null;
    }

    const fact = normalizeImportFact(item as Partial<DailySpaceFact>);
    const label = fact.id || `item ${index + 1}`;

    if (!fact.title) errors.push(`${label}: title is required.`);
    if (!fact.short_fact) errors.push(`${label}: short_fact is required.`);
    if (!fact.publish_date) errors.push(`${label}: publish_date is required.`);
    if (!fact.slug) errors.push(`${label}: slug is required.`);
    if (fact.publish_date && !/^\d{4}-\d{2}-\d{2}$/.test(fact.publish_date)) {
      errors.push(`${label}: publish_date must use YYYY-MM-DD.`);
    }

    const existingDateSlug = publishDates.get(fact.publish_date);
    if (fact.publish_date && existingDateSlug && existingDateSlug !== fact.slug && !options.allowDuplicatePublishDates) {
      errors.push(`${label}: duplicate publish_date ${fact.publish_date}.`);
    }
    if (fact.publish_date) publishDates.set(fact.publish_date, fact.slug);

    const existingSlugDate = slugs.get(fact.slug);
    if (fact.slug && existingSlugDate && existingSlugDate !== fact.publish_date && !options.allowDuplicateSlugs) {
      errors.push(`${label}: duplicate slug ${fact.slug} with different publish_date.`);
    }
    if (fact.slug) slugs.set(fact.slug, fact.publish_date);

    return fact;
  }).filter((fact): fact is ReturnType<typeof normalizeImportFact> => Boolean(fact));

  return { facts, errors };
}

export async function importDailyFactsToSupabase(
  supabase: SupabaseClient,
  input: unknown,
  options: DailyFactImportOptions = {},
): Promise<DailyFactImportResult> {
  const validation = validateDailyFactImport(input, options);
  const result: DailyFactImportResult = {
    ok: validation.errors.length === 0,
    total: Array.isArray(input) ? input.length : 0,
    valid: validation.facts.length,
    imported: 0,
    skipped: 0,
    errors: validation.errors,
    skippedProtected: [],
  };

  if (validation.errors.length > 0 || validation.facts.length === 0) {
    return result;
  }

  const ids = validation.facts.map((fact) => fact.id);
  const slugs = validation.facts.map((fact) => fact.slug);
  const { data: existingByIdRows, error: existingByIdError } = await supabase
    .from("daily_space_facts")
    .select("id,slug,status")
    .in("id", ids);

  if (existingByIdError) {
    return {
      ...result,
      ok: false,
      errors: [`Supabase id lookup failed: ${existingByIdError.message}`],
    };
  }

  const { data: existingBySlugRows, error: existingBySlugError } = await supabase
    .from("daily_space_facts")
    .select("id,slug,status")
    .in("slug", slugs);

  if (existingBySlugError) {
    return {
      ...result,
      ok: false,
      errors: [`Supabase slug lookup failed: ${existingBySlugError.message}`],
    };
  }

  const existingRows = [...(existingByIdRows ?? []), ...(existingBySlugRows ?? [])] as Array<{ id: string; slug: string; status: DailyFactStatus }>;
  const existingById = new Map(existingRows.map((row) => [row.id, row]));
  const existingBySlug = new Map(existingRows.map((row) => [row.slug, row]));
  const rows = validation.facts.flatMap((fact) => {
    const existing = existingById.get(fact.id) ?? existingBySlug.get(fact.slug);

    if (existing && protectedStatuses.has(existing.status) && !options.force) {
      result.skipped += 1;
      result.skippedProtected.push(`${fact.id} (${existing.status})`);
      return [];
    }

    const status = existing && protectedStatuses.has(existing.status) && !options.force
      ? existing.status
      : fact.status === "published" || fact.status === "live_short_fact"
        ? "scheduled"
        : fact.status;
    const now = new Date().toISOString();

    return [{
      ...fact,
      id: existing?.id ?? fact.id,
      status,
      updated_at: now,
    }];
  });

  if (rows.length === 0) {
    result.ok = true;
    return result;
  }

  const { error } = await supabase
    .from("daily_space_facts")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    return {
      ...result,
      ok: false,
      errors: [`Supabase upsert failed: ${error.message}`],
    };
  }

  result.imported = rows.length;
  result.ok = true;
  return result;
}

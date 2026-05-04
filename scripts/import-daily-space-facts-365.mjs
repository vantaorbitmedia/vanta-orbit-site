import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { loadEnvConfig } = nextEnv;
loadEnvConfig(projectDir);

const inputPath = path.join(projectDir, "src", "data", "daily-space-facts-365.json");
const force = process.argv.includes("--force");
const allowDuplicatePublishDates = process.argv.includes("--allow-duplicate-publish-dates");
const allowDuplicateSlugs = process.argv.includes("--allow-duplicate-slugs");
const protectedStatuses = new Set(["published", "live_short_fact"]);
const validStatuses = new Set(["scheduled", "live_short_fact", "needs_review", "ready", "published", "archived"]);
const defaultCardCta = "Follow for daily space facts 🚀";

function fail(message) {
  console.error(`Daily Space Facts import failed: ${message}`);
  process.exit(1);
}

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value) {
  if (Array.isArray(value)) return value.map((item) => asString(item)).filter(Boolean);
  if (typeof value === "string") return value.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean);
  return [];
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeStatus(value) {
  return validStatuses.has(value) ? value : "scheduled";
}

function normalizeFact(value) {
  const title = asString(value.title);
  const slug = asString(value.slug) || slugify(title);
  const publishDate = asString(value.publish_date);

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
    card_cta: asString(value.card_cta) || defaultCardCta,
    full_post_published_at: asString(value.full_post_published_at) || null,
  };
}

function validate(input) {
  const errors = [];
  if (!Array.isArray(input)) return { facts: [], errors: ["JSON file must contain an array."] };

  const publishDates = new Map();
  const slugs = new Map();
  const facts = [];

  input.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors.push(`Item ${index + 1}: expected an object.`);
      return;
    }

    const fact = normalizeFact(item);
    const label = fact.id || `item ${index + 1}`;

    if (!fact.title) errors.push(`${label}: title is required.`);
    if (!fact.short_fact) errors.push(`${label}: short_fact is required.`);
    if (!fact.publish_date) errors.push(`${label}: publish_date is required.`);
    if (!fact.slug) errors.push(`${label}: slug is required.`);
    if (fact.publish_date && !/^\d{4}-\d{2}-\d{2}$/.test(fact.publish_date)) {
      errors.push(`${label}: publish_date must use YYYY-MM-DD.`);
    }

    const existingDateSlug = publishDates.get(fact.publish_date);
    if (fact.publish_date && existingDateSlug && existingDateSlug !== fact.slug && !allowDuplicatePublishDates) {
      errors.push(`${label}: duplicate publish_date ${fact.publish_date}.`);
    }
    if (fact.publish_date) publishDates.set(fact.publish_date, fact.slug);

    const existingSlugDate = slugs.get(fact.slug);
    if (fact.slug && existingSlugDate && existingSlugDate !== fact.publish_date && !allowDuplicateSlugs) {
      errors.push(`${label}: duplicate slug ${fact.slug} with different publish_date.`);
    }
    if (fact.slug) slugs.set(fact.slug, fact.publish_date);

    facts.push(fact);
  });

  return { facts, errors };
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) fail("NEXT_PUBLIC_SUPABASE_URL is missing.");
  if (!serviceRoleKey) fail("SUPABASE_SERVICE_ROLE_KEY is missing.");

  let input;
  try {
    input = JSON.parse(await readFile(inputPath, "utf8"));
  } catch (error) {
    fail(`Could not read ${inputPath}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const { facts, errors } = validate(input);
  if (errors.length > 0) fail(`validation errors:\n- ${errors.join("\n- ")}`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const ids = facts.map((fact) => fact.id);
  const slugs = facts.map((fact) => fact.slug);

  const { data: existingByIdRows, error: idError } = await supabase
    .from("daily_space_facts")
    .select("id,slug,status")
    .in("id", ids);
  if (idError) fail(`Supabase id lookup failed: ${idError.message}`);

  const { data: existingBySlugRows, error: slugError } = await supabase
    .from("daily_space_facts")
    .select("id,slug,status")
    .in("slug", slugs);
  if (slugError) fail(`Supabase slug lookup failed: ${slugError.message}`);

  const existingRows = [...(existingByIdRows ?? []), ...(existingBySlugRows ?? [])];
  const existingById = new Map(existingRows.map((row) => [row.id, row]));
  const existingBySlug = new Map(existingRows.map((row) => [row.slug, row]));
  const skippedProtected = [];
  const rows = [];

  for (const fact of facts) {
    const existing = existingById.get(fact.id) ?? existingBySlug.get(fact.slug);
    if (existing && protectedStatuses.has(existing.status) && !force) {
      skippedProtected.push(`${fact.id} (${existing.status})`);
      continue;
    }

    const requestedStatus = fact.status === "published" || fact.status === "live_short_fact" ? "scheduled" : fact.status;
    rows.push({
      ...fact,
      id: existing?.id ?? fact.id,
      status: force ? fact.status : requestedStatus,
      updated_at: new Date().toISOString(),
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase
      .from("daily_space_facts")
      .upsert(rows, { onConflict: "id" });
    if (error) fail(`Supabase upsert failed: ${error.message}`);
  }

  console.log(`Daily Space Facts import complete.`);
  console.log(`Read: ${facts.length}`);
  console.log(`Imported/updated: ${rows.length}`);
  console.log(`Skipped protected live/published rows: ${skippedProtected.length}`);
  if (skippedProtected.length > 0) {
    console.log(skippedProtected.map((item) => `- ${item}`).join("\n"));
  }
  console.log(force ? "Force mode: enabled" : "Force mode: disabled");
}

await main();

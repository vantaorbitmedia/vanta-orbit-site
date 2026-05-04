import { generateAiText } from "@/lib/server-ai";
import { DEFAULT_DAILY_FACT_CARD_CTA, type DailySpaceFact } from "@/lib/daily-space-facts";

export type GeneratedDailyFactContent = {
  detailed_explanation: string;
  facebook_caption: string;
  instagram_caption: string;
  tiktok_caption: string;
  youtube_caption: string;
  hashtags: string[];
  card_headline: string;
  card_subtext: string;
  card_curiosity_line: string;
  card_cta: string;
  leonardo_prompt: string;
};

function extractJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response did not include a JSON object.");
  }

  return JSON.parse(raw.slice(start, end + 1)) as Partial<GeneratedDailyFactContent>;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asHashtags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => asString(item)).filter(Boolean).slice(0, 8);
  }

  if (typeof value === "string") {
    return value.split(/[,\s]+/).map((item) => item.trim()).filter((item) => item.startsWith("#")).slice(0, 8);
  }

  return [];
}

export function buildFallbackDailyFactContent(title: string, shortFact: string): GeneratedDailyFactContent {
  return {
    detailed_explanation: `${shortFact}\n\nSmall measurements like this can reveal slow changes that are invisible in everyday life. Over long timescales, they help scientists understand how planets, moons, stars, and galaxies evolve.`,
    facebook_caption: `${shortFact} Follow Vanta Orbit Media for more daily space facts.`,
    instagram_caption: `${shortFact}\n\nFollow for more space facts.`,
    tiktok_caption: `${shortFact} Quick space fact for today.`,
    youtube_caption: `Daily Space Fact: ${shortFact}`,
    hashtags: ["#SpaceFact", "#Astronomy", "#NASA", "#VantaOrbit"],
    card_headline: makeFallbackHeadline(title, shortFact),
    card_subtext: shortFact,
    card_curiosity_line: makeFallbackCuriosityLine(title, shortFact),
    card_cta: DEFAULT_DAILY_FACT_CARD_CTA,
    leonardo_prompt: `Ultra realistic cinematic space scene about ${title}, NASA documentary style, physically believable lighting, dramatic but accurate composition, high detail, no text, no labels, no UI, no watermark.`,
  };
}

function makeFallbackHeadline(title: string, shortFact: string) {
  const lower = `${title} ${shortFact}`.toLowerCase();
  if (lower.includes("moon") && lower.includes("drift")) return "The Moon Is Drifting Away From Earth";
  if (lower.includes("moon") && lower.includes("leav")) return "The Moon Is Slowly Leaving Us";
  if (lower.includes("dark matter") || lower.includes("invisible matter")) return "Most Matter May Be Invisible";
  if (lower.includes("black hole")) return "We Captured a Black Hole's Shadow";
  if (lower.includes("exoplanet")) return "There Are Worlds Around Other Suns";
  if (lower.includes("neutron star")) return "A Star Can Collapse Into Almost Nothing";
  if (lower.includes("mars")) return title.replace(/\bcan\b/i, "").trim() || title;
  return title;
}

function makeFallbackCuriosityLine(title: string, shortFact: string) {
  const combined = `${title} ${shortFact}`.toLowerCase();
  if (combined.includes("moon") && (combined.includes("drift") || combined.includes("away"))) {
    return "A tiny yearly shift becomes huge across deep time.";
  }
  if (combined.includes("dark matter")) {
    return "Most of the mass is hidden, but gravity gives it away.";
  }
  if (combined.includes("black hole")) {
    return "The edge is invisible, but its shadow can be measured.";
  }
  if (combined.includes("mars")) {
    return "The red planet still carries clues from a wetter past.";
  }
  if (combined.includes("exoplanet")) {
    return "Some distant worlds are found by the light they block.";
  }
  if (combined.includes("sun") || combined.includes("solar")) {
    return "Small changes in solar activity can reach across space.";
  }
  if (combined.includes("neutron star")) {
    return "Matter this dense pushes physics to extreme limits.";
  }
  if (combined.includes("galaxy") || combined.includes("galaxies")) {
    return "On cosmic scales, gravity writes the architecture.";
  }
  if (/\d/.test(shortFact)) return "Tiny numbers can become enormous across cosmic time.";
  return "The quiet detail is where the universe gets interesting.";
}

export async function generateDailyFactContent({
  title,
  short_fact,
}: Pick<DailySpaceFact, "title" | "short_fact">): Promise<GeneratedDailyFactContent> {
  const fallback = buildFallbackDailyFactContent(title, short_fact);
  let parsed: Partial<GeneratedDailyFactContent> = {};

  try {
    const text = await generateAiText({
      maxOutputTokens: 1400,
      instructions: [
        "You generate reviewed draft content for Vanta Orbit Media's Daily Space Facts.",
        "Return only valid JSON. Do not wrap it in markdown.",
        "Be accurate and educational, exciting but not clickbait.",
        "Avoid fake facts, avoid overclaiming, and include cautious phrasing if certainty is limited.",
        "Keep captions concise and platform-optimised. Limit emoji usage.",
        "For card_headline, create a punchy emotional hook while staying accurate. Prefer 5-9 words. Avoid dull encyclopedia titles, clickbait, or fake claims.",
        "Good card_headline style examples: The Moon Is Slowly Leaving Us; The Moon Is Drifting Away From Earth; Earth Is Losing the Moon.",
        "For card_subtext, write one clean supporting sentence. If the fact includes a key number, preserve that exact number so the card can emphasize it visually.",
        "card_curiosity_line is optional for storage, but generate one whenever it adds value. Make it a short subject-specific second hook, 6-14 words, intriguing but scientifically cautious.",
        "Do not make card_curiosity_line vague. It must refer to the subject, scale, consequence, hidden mechanism, or measurement in the fact.",
        "Good card_curiosity_line examples: A tiny yearly shift becomes huge across deep time.; Gravity gives away what light cannot show.; The shadow reveals where normal physics breaks down.",
        `card_cta must be exactly: ${DEFAULT_DAILY_FACT_CARD_CTA}`,
        "Include a reminder in detailed_explanation or source-sensitive wording that science facts should be verified if uncertain.",
        "Generate a Leonardo prompt in this style: Ultra realistic cinematic space scene, NASA documentary style, physically believable lighting, dramatic but accurate composition, high detail, no text, no labels, no UI, no watermark.",
      ].join("\n"),
      input: JSON.stringify({
        title,
        short_fact,
        required_shape: {
          detailed_explanation: "3-5 concise paragraphs",
          facebook_caption: "under 280 characters where possible",
          instagram_caption: "short caption",
          tiktok_caption: "short spoken-caption style",
          youtube_caption: "YouTube Community style",
          hashtags: ["#SpaceFact"],
          card_headline: "punchy emotional accurate hook, 5-9 words",
          card_subtext: "one short clean support sentence, preserving key numbers where useful",
          card_curiosity_line: "short subject-specific curiosity line, 6-14 words, or empty string only if truly not useful",
          card_cta: DEFAULT_DAILY_FACT_CARD_CTA,
          leonardo_prompt: "cinematic realistic prompt",
        },
      }),
    });
    parsed = extractJson(text);
  } catch (error) {
    console.warn("[daily-facts] AI content generation fell back to local defaults", {
      title,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    detailed_explanation: asString(parsed.detailed_explanation) || fallback.detailed_explanation,
    facebook_caption: asString(parsed.facebook_caption) || fallback.facebook_caption,
    instagram_caption: asString(parsed.instagram_caption) || fallback.instagram_caption,
    tiktok_caption: asString(parsed.tiktok_caption) || fallback.tiktok_caption,
    youtube_caption: asString(parsed.youtube_caption) || fallback.youtube_caption,
    hashtags: asHashtags(parsed.hashtags).length > 0 ? asHashtags(parsed.hashtags) : fallback.hashtags,
    card_headline: asString(parsed.card_headline) || fallback.card_headline,
    card_subtext: asString(parsed.card_subtext) || fallback.card_subtext,
    card_curiosity_line: asString(parsed.card_curiosity_line) || fallback.card_curiosity_line,
    card_cta: DEFAULT_DAILY_FACT_CARD_CTA,
    leonardo_prompt: asString(parsed.leonardo_prompt) || fallback.leonardo_prompt,
  };
}

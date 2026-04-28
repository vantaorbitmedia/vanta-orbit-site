import { NextResponse } from "next/server";
import { isAuthenticatedAdmin } from "@/lib/admin-auth";
import { generateAiText, isAiConfigured } from "@/lib/server-ai";

type StructuredVideoIdeas = {
  titleIdeas: string[];
  hookIdeas: string[];
  deepDiveContext: string;
  keyFacts: string[];
  questionsAndSEO: {
    questions: string[];
    seoKeywords: string[];
  };
  articleStructure: string[];
  timedScriptStructure: Array<{
    time: string;
    section: string;
    voiceover: string;
    visual: string;
  }>;
  sceneBySceneVisualPlan: Array<{
    scene: string;
    description: string;
    camera: string;
    motion: string;
  }>;
  leonardoPrompts: string[];
  runwayPrompts: string[];
  visualProductionPlan: Array<{
    scene: string;
    timestamp: string;
    purpose: string;
    leonardoPrompt: string;
    generate: string;
    suggestedVariations: string[];
    editInstructions: string;
    textOverlay: string;
  }>;
  runwayAnimationPrompts: Array<{
    scene: string;
    timestamp: string;
    inputImageReference: string;
    durationSuggestion: string;
    runwayPrompt: string;
    avoid: string[];
    transition: string;
  }>;
  seriesParts: Array<{
    seriesName: string;
    partNumber: string;
    title: string;
    hook: string;
    script: string[];
    timedSceneBreakdown: string[];
    visualProductionPlan: string[];
    leonardoPrompts: string[];
    runwayAnimationPrompts: string[];
    textOverlays: string[];
    cta: string;
  }>;
  postingPlan: string[];
  captions: string[];
  hashtags: string[];
  thumbnailTextIdeas: string[];
};

type VideoDuration = "15s" | "20s" | "30s" | "1-3 min";

const videoIdeasJsonSchema = {
  type: "json_schema",
  name: "video_ideas",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "titleIdeas",
      "hookIdeas",
      "deepDiveContext",
      "keyFacts",
      "questionsAndSEO",
      "articleStructure",
      "timedScriptStructure",
      "sceneBySceneVisualPlan",
      "leonardoPrompts",
      "runwayPrompts",
      "visualProductionPlan",
      "runwayAnimationPrompts",
      "seriesParts",
      "postingPlan",
      "captions",
      "hashtags",
      "thumbnailTextIdeas",
    ],
    properties: {
      titleIdeas: { type: "array", minItems: 5, maxItems: 5, items: { type: "string" } },
      hookIdeas: { type: "array", minItems: 5, maxItems: 5, items: { type: "string" } },
      deepDiveContext: { type: "string" },
      keyFacts: { type: "array", minItems: 5, maxItems: 10, items: { type: "string" } },
      questionsAndSEO: {
        type: "object",
        additionalProperties: false,
        required: ["questions", "seoKeywords"],
        properties: {
          questions: { type: "array", items: { type: "string" } },
          seoKeywords: { type: "array", items: { type: "string" } },
        },
      },
      articleStructure: { type: "array", items: { type: "string" } },
      timedScriptStructure: {
        type: "array",
        minItems: 6,
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["time", "section", "voiceover", "visual"],
          properties: {
            time: { type: "string" },
            section: { type: "string" },
            voiceover: { type: "string" },
            visual: { type: "string" },
          },
        },
      },
      sceneBySceneVisualPlan: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["scene", "description", "camera", "motion"],
          properties: {
            scene: { type: "string" },
            description: { type: "string" },
            camera: { type: "string" },
            motion: { type: "string" },
          },
        },
      },
      leonardoPrompts: { type: "array", items: { type: "string" } },
      runwayPrompts: { type: "array", items: { type: "string" } },
      visualProductionPlan: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["scene", "timestamp", "purpose", "leonardoPrompt", "generate", "suggestedVariations", "editInstructions", "textOverlay"],
          properties: {
            scene: { type: "string" },
            timestamp: { type: "string" },
            purpose: { type: "string" },
            leonardoPrompt: { type: "string" },
            generate: { type: "string" },
            suggestedVariations: { type: "array", items: { type: "string" } },
            editInstructions: { type: "string" },
            textOverlay: { type: "string" },
          },
        },
      },
      runwayAnimationPrompts: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["scene", "timestamp", "inputImageReference", "durationSuggestion", "runwayPrompt", "avoid", "transition"],
          properties: {
            scene: { type: "string" },
            timestamp: { type: "string" },
            inputImageReference: { type: "string" },
            durationSuggestion: { type: "string" },
            runwayPrompt: { type: "string" },
            avoid: { type: "array", items: { type: "string" } },
            transition: { type: "string" },
          },
        },
      },
      seriesParts: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["seriesName", "partNumber", "title", "hook", "script", "timedSceneBreakdown", "visualProductionPlan", "leonardoPrompts", "runwayAnimationPrompts", "textOverlays", "cta"],
          properties: {
            seriesName: { type: "string" },
            partNumber: { type: "string" },
            title: { type: "string" },
            hook: { type: "string" },
            script: { type: "array", items: { type: "string" } },
            timedSceneBreakdown: { type: "array", items: { type: "string" } },
            visualProductionPlan: { type: "array", items: { type: "string" } },
            leonardoPrompts: { type: "array", items: { type: "string" } },
            runwayAnimationPrompts: { type: "array", items: { type: "string" } },
            textOverlays: { type: "array", items: { type: "string" } },
            cta: { type: "string" },
          },
        },
      },
      postingPlan: { type: "array", items: { type: "string" } },
      captions: { type: "array", items: { type: "string" } },
      hashtags: { type: "array", items: { type: "string" } },
      thumbnailTextIdeas: { type: "array", items: { type: "string" } },
    },
  },
};

function isVideoDuration(value: unknown): value is VideoDuration {
  return value === "15s" || value === "20s" || value === "30s" || value === "1-3 min";
}

function getDurationTimingRules(duration: VideoDuration) {
  const timingRules: Record<VideoDuration, string[]> = {
    "15s": [
      "0:00-0:02 Hook",
      "0:02-0:04 Setup",
      "0:04-0:07 Explanation",
      "0:07-0:10 Payoff",
      "0:10-0:13 Twist/Expansion",
      "0:13-0:15 CTA or final image",
    ],
    "20s": [
      "0:00-0:02 Hook",
      "0:02-0:05 Setup",
      "0:05-0:09 Explanation",
      "0:09-0:13 Payoff",
      "0:13-0:17 Twist/Expansion",
      "0:17-0:20 CTA or final image",
    ],
    "30s": [
      "0:00-0:02 Hook",
      "0:02-0:06 Setup",
      "0:06-0:12 Explanation",
      "0:12-0:18 Payoff",
      "0:18-0:25 Twist/Expansion",
      "0:25-0:30 CTA",
    ],
    "1-3 min": [
      "0:00-0:08 Hook",
      "0:08-0:28 Setup",
      "0:28-1:05 Explanation",
      "1:05-1:40 Payoff",
      "1:40-2:15 Twist/Expansion",
      "2:15-2:40 CTA or final image",
    ],
  };

  return timingRules[duration].map((rule) => `- ${rule}`).join("\n");
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function normalizeTimedScript(value: unknown): StructuredVideoIdeas["timedScriptStructure"] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const entry = item as Record<string, unknown>;

      return {
        time: typeof entry.time === "string" ? entry.time : "",
        section: typeof entry.section === "string" ? entry.section : "",
        voiceover: typeof entry.voiceover === "string" ? entry.voiceover : "",
        visual: typeof entry.visual === "string" ? entry.visual : "",
      };
    })
    .filter((item): item is StructuredVideoIdeas["timedScriptStructure"][number] => Boolean(item));
}

function normalizeScenes(value: unknown): StructuredVideoIdeas["sceneBySceneVisualPlan"] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const entry = item as Record<string, unknown>;

      return {
        scene: typeof entry.scene === "string" ? entry.scene : "",
        description: typeof entry.description === "string" ? entry.description : "",
        camera: typeof entry.camera === "string" ? entry.camera : "",
        motion: typeof entry.motion === "string" ? entry.motion : "",
      };
    })
    .filter((item): item is StructuredVideoIdeas["sceneBySceneVisualPlan"][number] => Boolean(item));
}

function normalizeVisualProductionPlan(value: unknown): StructuredVideoIdeas["visualProductionPlan"] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const entry = item as Record<string, unknown>;

      return {
        scene: typeof entry.scene === "string" ? entry.scene : "",
        timestamp: typeof entry.timestamp === "string" ? entry.timestamp : "",
        purpose: typeof entry.purpose === "string" ? entry.purpose : "",
        leonardoPrompt: typeof entry.leonardoPrompt === "string" ? entry.leonardoPrompt : "",
        generate: typeof entry.generate === "string" ? entry.generate : "1 image per scene.",
        suggestedVariations: toStringArray(entry.suggestedVariations).slice(0, 3),
        editInstructions: typeof entry.editInstructions === "string" ? entry.editInstructions : "",
        textOverlay: typeof entry.textOverlay === "string" ? entry.textOverlay : "",
      };
    })
    .filter((item): item is StructuredVideoIdeas["visualProductionPlan"][number] => Boolean(item));
}

function normalizeRunwayAnimationPrompts(value: unknown): StructuredVideoIdeas["runwayAnimationPrompts"] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const entry = item as Record<string, unknown>;

      return {
        scene: typeof entry.scene === "string" ? entry.scene : "",
        timestamp: typeof entry.timestamp === "string" ? entry.timestamp : "",
        inputImageReference: typeof entry.inputImageReference === "string" ? entry.inputImageReference : "",
        durationSuggestion: typeof entry.durationSuggestion === "string" ? entry.durationSuggestion : "",
        runwayPrompt: typeof entry.runwayPrompt === "string" ? entry.runwayPrompt : "",
        avoid: toStringArray(entry.avoid),
        transition: typeof entry.transition === "string" ? entry.transition : "",
      };
    })
    .filter((item): item is StructuredVideoIdeas["runwayAnimationPrompts"][number] => Boolean(item));
}

function normalizeSeriesParts(value: unknown): StructuredVideoIdeas["seriesParts"] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const entry = item as Record<string, unknown>;

      return {
        seriesName: typeof entry.seriesName === "string" ? entry.seriesName : "",
        partNumber: typeof entry.partNumber === "string" ? entry.partNumber : "",
        title: typeof entry.title === "string" ? entry.title : "",
        hook: typeof entry.hook === "string" ? entry.hook : "",
        script: toStringArray(entry.script),
        timedSceneBreakdown: toStringArray(entry.timedSceneBreakdown),
        visualProductionPlan: toStringArray(entry.visualProductionPlan),
        leonardoPrompts: toStringArray(entry.leonardoPrompts),
        runwayAnimationPrompts: toStringArray(entry.runwayAnimationPrompts),
        textOverlays: toStringArray(entry.textOverlays),
        cta: typeof entry.cta === "string" ? entry.cta : "",
      };
    })
    .filter((item): item is StructuredVideoIdeas["seriesParts"][number] => Boolean(item));
}

function normalizeStructuredIdeas(value: unknown): StructuredVideoIdeas | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Record<string, unknown>;
  const questionsAndSEO = raw.questionsAndSEO && typeof raw.questionsAndSEO === "object"
    ? raw.questionsAndSEO as Record<string, unknown>
    : {};
  const titleIdeas = toStringArray(raw.titleIdeas);
  const hookIdeas = toStringArray(raw.hookIdeas);

  if (titleIdeas.length === 0 || hookIdeas.length === 0) {
    return null;
  }

  return {
    titleIdeas: titleIdeas.slice(0, 5),
    hookIdeas: hookIdeas.slice(0, 5),
    deepDiveContext: typeof raw.deepDiveContext === "string" ? raw.deepDiveContext : "",
    keyFacts: toStringArray(raw.keyFacts).slice(0, 10),
    questionsAndSEO: {
      questions: toStringArray(questionsAndSEO.questions),
      seoKeywords: toStringArray(questionsAndSEO.seoKeywords),
    },
    articleStructure: toStringArray(raw.articleStructure),
    timedScriptStructure: normalizeTimedScript(raw.timedScriptStructure),
    sceneBySceneVisualPlan: normalizeScenes(raw.sceneBySceneVisualPlan),
    leonardoPrompts: toStringArray(raw.leonardoPrompts),
    runwayPrompts: toStringArray(raw.runwayPrompts),
    visualProductionPlan: normalizeVisualProductionPlan(raw.visualProductionPlan),
    runwayAnimationPrompts: normalizeRunwayAnimationPrompts(raw.runwayAnimationPrompts),
    seriesParts: normalizeSeriesParts(raw.seriesParts),
    postingPlan: toStringArray(raw.postingPlan),
    captions: toStringArray(raw.captions),
    hashtags: toStringArray(raw.hashtags),
    thumbnailTextIdeas: toStringArray(raw.thumbnailTextIdeas),
  };
}

function stripJsonFence(value: string) {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

export async function POST(request: Request) {
  if (!(await isAuthenticatedAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    prompt?: string;
    fallbackOutput?: unknown;
    model?: string;
    duration?: unknown;
  };

  if (!body.prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  if (!isAiConfigured()) {
    return NextResponse.json({
      error: "OPENAI_API_KEY is not configured. Add it to your deployment environment.",
      fallbackOutput: body.fallbackOutput ?? null,
    }, { status: 503 });
  }

  try {
    const duration = isVideoDuration(body.duration) ? body.duration : "30s";
    const input = `${body.prompt}

Server-side duration constraint:
The selected video duration is ${duration}. The timedScriptStructure must follow these exact ranges:
${getDurationTimingRules(duration)}
Do not include timings beyond ${duration}. For 15s, the script must end at 0:15, not 0:30.`;

    const text = await generateAiText({
      instructions: "You generate structured video ideas for a private admin tool. Return valid JSON only. No markdown, no explanations, no extra text.",
      input,
      maxOutputTokens: 12000,
      model: body.model,
      textFormat: videoIdeasJsonSchema,
    });

    const responseText = text;
    let ideas: unknown;
    let validJSON = true;

    try {
      const data = JSON.parse(stripJsonFence(responseText));
      ideas = data;
    } catch {
      validJSON = false;
    }

    const normalizedIdeas = validJSON ? normalizeStructuredIdeas(ideas) : null;

    if (!validJSON || !normalizedIdeas) {
      return NextResponse.json({
        rawOutput: responseText,
        validJSON: false,
      });
    }

    return NextResponse.json({ ideas: normalizedIdeas, validJSON: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI generation failed." },
      { status: 500 },
    );
  }
}

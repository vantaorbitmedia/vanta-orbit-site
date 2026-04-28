"use client";

import { Check, Copy, ImageIcon, RefreshCw, Save, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  calculateHookScore,
  contentTopics,
  formatTopicLabel,
  type ContentTopic,
  type VideoItem,
} from "@/lib/content";

type GeneratorState = {
  topic: ContentTopic;
  focusObject: string;
  length: "15s" | "20s" | "30s" | "1-3 min";
  platform:
    | "Facebook Reel"
    | "Instagram Reel"
    | "TikTok"
    | "YouTube Short"
    | "YouTube Longform";
  mood: "mind-blowing" | "eerie" | "cinematic" | "calm" | "dramatic";
  ctaStyle: "soft follow" | "dramatic cliffhanger" | "part 2 tease" | "no CTA";
  useHookLabData: boolean;
  multiPartSeries: boolean;
  numberOfParts: 2 | 3 | 4 | 5;
  includePostingPlan: boolean;
  includePinnedComments: boolean;
};

type SceneProductionPlan = {
  scene: string;
  timestamp: string;
  purpose: string;
  leonardoPrompt: string;
  generate: string;
  suggestedVariations: string[];
  editInstructions: string;
  textOverlay: string;
};

type RunwayAnimationPrompt = {
  scene: string;
  timestamp: string;
  inputImageReference: string;
  durationSuggestion: string;
  runwayPrompt: string;
  avoid: string[];
  transition: string;
};

type SeriesPart = {
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
};

type GeneratorOutput = {
  titles: string[];
  description: string;
  videoContext: string;
  keyFacts: string[];
  category: ContentTopic;
  contentType: "short" | "long";
  targetAudience: string;
  tone: string;
  depthLevel: string;
  relatedQuestions: string[];
  seoKeywords: string[];
  suggestedArticleStructure: string[];
  hooks: string[];
  timedScript: string[];
  visualPlan: string[];
  leonardoPrompts: string[];
  runwayPrompts: string[];
  visualProductionPlan: string[];
  runwayAnimationPrompts: string[];
  seriesParts: SeriesPart[];
  postingPlan: string[];
  caption: string;
  hashtags: string[];
  thumbnailText: string[];
  hookLabPrompt: string;
};

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
  visualProductionPlan?: SceneProductionPlan[];
  runwayAnimationPrompts?: RunwayAnimationPrompt[];
  seriesParts?: SeriesPart[];
  postingPlan?: string[];
  captions: string[];
  hashtags: string[];
  thumbnailTextIdeas: string[];
};

type SavedVideoIdea = {
  title: string;
  focusObject: string;
  selectedTitle: string;
  selectedHook: string;
  selectedThumbnailText: string;
  titleIdeas: string[];
  hookIdeas: string[];
  thumbnailTextIdeas: string[];
  description: string;
  videoContext: string;
  keyFacts: string[];
  category: ContentTopic;
  contentType: "short" | "long";
  targetAudience: string;
  tone: string;
  depthLevel: string;
  relatedQuestions: string[];
  seoKeywords: string[];
  suggestedArticleStructure: string[];
  sourceNotes: string;
  tags: string[];
  series: string;
  generatedImageUrls?: string[];
  thumbnail?: string;
};

type LeonardoGeneratedImage = {
  id: string;
  url: string;
  prompt: string;
};

type LeonardoGenerationState = {
  status: "idle" | "loading" | "complete" | "error" | "pending";
  message: string;
  images: LeonardoGeneratedImage[];
};

type SavedGeneration = {
  id: string;
  createdAt: string;
  formState: GeneratorState;
  output: GeneratorOutput;
  selectedImageUrls: string[];
  thumbnailCandidate: string;
};

const lengths: GeneratorState["length"][] = ["15s", "20s", "30s", "1-3 min"];
const platforms: GeneratorState["platform"][] = [
  "Facebook Reel",
  "Instagram Reel",
  "TikTok",
  "YouTube Short",
  "YouTube Longform",
];
const moods: GeneratorState["mood"][] = [
  "mind-blowing",
  "eerie",
  "cinematic",
  "calm",
  "dramatic",
];
const ctaStyles: GeneratorState["ctaStyle"][] = [
  "soft follow",
  "dramatic cliffhanger",
  "part 2 tease",
  "no CTA",
];

const initialState: GeneratorState = {
  topic: "moon",
  focusObject: "",
  length: "30s",
  platform: "YouTube Short",
  mood: "cinematic",
  ctaStyle: "soft follow",
  useHookLabData: false,
  multiPartSeries: false,
  numberOfParts: 3,
  includePostingPlan: true,
  includePinnedComments: true,
};

const VIDEO_MANAGER_DRAFT_KEY = "vanta-orbit-video-manager-draft";
const HOOK_INSIGHTS_KEY = "vanta-orbit-hook-lab-insights";
const VIDEO_IDEAS_HISTORY_KEY = "vanta-orbit-video-ideas-history";

type HookLabInsights = {
  topHooks?: string[];
  winningPatterns?: string[];
  phrasesThatWork?: string[];
  topicsThatPerformBest?: string[];
  hookStylesToReuse?: string[];
  hookStylesToAvoid?: string[];
  suggestedNewHooks?: string[];
};

function sentenceCase(value: string) {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function buildTimedStructure(
  length: GeneratorState["length"],
  topic: ContentTopic,
  ctaStyle: GeneratorState["ctaStyle"],
) {
  const cleanTopic = formatTopicLabel(topic);

  if (length === "1-3 min") {
    return [
      `0:00-0:08 - Shock open with the most unexpected claim about ${cleanTopic}.`,
      `0:08-0:28 - Establish the cosmic setup and why ${cleanTopic} matters right now.`,
      `0:28-1:05 - Deliver the main science reveal with one unforgettable comparison.`,
      `1:05-1:40 - Expand the stakes, mystery, or consequence for the viewer.`,
      `1:40-2:15 - Land the emotional payoff and connect it back to the opening hook.`,
      `2:15-2:40 - ${ctaStyle === "no CTA" ? "End on a clean final line with no CTA." : `Close with a ${ctaStyle} CTA.`}`,
    ];
  }

  const endings: Record<Exclude<GeneratorState["length"], "1-3 min">, string[]> = {
    "15s": [
      `0:00-0:03 - Drop the surprise fact about ${cleanTopic}.`,
      `0:03-0:09 - Explain the core mechanism in one sharp beat.`,
      `0:09-0:15 - Finish with ${ctaStyle === "no CTA" ? "a punchy closing image." : `a ${ctaStyle} CTA.`}`,
    ],
    "20s": [
      `0:00-0:04 - Hit the viewer with the strangest part of ${cleanTopic}.`,
      `0:04-0:12 - Unpack the science in two clean beats.`,
      `0:12-0:20 - End with ${ctaStyle === "no CTA" ? "an unresolved wonder line." : `a ${ctaStyle} CTA.`}`,
    ],
    "30s": [
      `0:00-0:05 - Open on the most mind-bending angle of ${cleanTopic}.`,
      `0:05-0:16 - Explain what is happening and why it feels impossible.`,
      `0:16-0:24 - Add the consequence, scale, or mystery layer.`,
      `0:24-0:30 - Close with ${ctaStyle === "no CTA" ? "a powerful last image." : `a ${ctaStyle} CTA.`}`,
    ],
  };

  return endings[length];
}

function getContentType(state: GeneratorState) {
  return state.platform === "YouTube Longform" || state.length === "1-3 min" ? "long" : "short";
}

function getFormatSpec(contentType: "short" | "long") {
  return contentType === "short"
    ? {
        prefix: "Vertical 9:16",
        resolution: "1536x2752",
        framing: "mobile-first composition, tight centered subject, readable negative space for later text overlays",
      }
    : {
        prefix: "Horizontal 16:9",
        resolution: "2752x1536",
        framing: "cinematic landscape composition, wider environmental detail, strong depth and scale",
      };
}

function getScenePurpose(scene: string, index: number, total: number) {
  const lower = scene.toLowerCase();
  if (index === 0 || lower.includes("hook") || lower.includes("open")) return "Hook";
  if (index === total - 1 || lower.includes("cta") || lower.includes("final")) return "Ending";
  if (lower.includes("twist") || lower.includes("expansion") || lower.includes("stakes")) return "Twist/Escalation";
  if (lower.includes("payoff") || lower.includes("scale") || lower.includes("reveal")) return "Reveal";
  return "Explanation";
}

function getSceneStyle(scene: string, purpose: string) {
  const lower = `${scene} ${purpose}`.toLowerCase();
  if (lower.includes("surface") || lower.includes("terrain") || lower.includes("crater") || lower.includes("regolith")) {
    return "surface";
  }
  if (lower.includes("explain") || lower.includes("diagram") || lower.includes("mechanism") || lower.includes("flow")) {
    return "abstract";
  }
  return "cinematic";
}

function buildLeonardoPrompt(scene: string, topic: string, state: GeneratorState, index: number, total: number) {
  const contentType = getContentType(state);
  const format = getFormatSpec(contentType);
  const purpose = getScenePurpose(scene, index, total);
  const style = getSceneStyle(scene, purpose);
  const camera = contentType === "short"
    ? "tight documentary lens, centered subject placement, close foreground depth"
    : "wide documentary lens, layered foreground and background, expansive environmental scale";
  const styleLanguage = style === "surface"
    ? "physical realism, natural material variation integrated into surface, lighting interacting with the surface, physically believable colour variation"
    : style === "abstract"
      ? "controlled grounded stylisation, readable particle flows and subtle energy effects, clear scientific composition"
      : "large-scale cinematic realism, dramatic contrast, scale, depth, atmospheric glow";

  return `${format.prefix}, ${topic}, ${purpose.toLowerCase()} scene from a high-end space documentary, subject: ${scene}, environment: ${format.framing}, camera perspective: ${camera}, lighting: high contrast lighting with volumetric lighting where appropriate, mood: ${state.mood}, ${styleLanguage}, ultra realistic, cinematic, NASA documentary style, 4k, physically believable textures, subtle tonal variation, Nano Banana Pro, resolution target ${format.resolution}, no text, no labels, no diagrams, no UI overlays, no arrows, no captions.`;
}

function buildVisualProductionPlan(scenes: string[], state: GeneratorState) {
  const topic = getStorySubject(state);

  return scenes.map((scene, index) => {
    const [timestamp = `Scene ${index + 1}`, details = scene] = scene.split(" - ");
    const purpose = getScenePurpose(scene, index, scenes.length);
    const prompt = buildLeonardoPrompt(scene, topic, state, index, scenes.length);
    const movement = purpose === "Hook"
      ? "slow push-in 100% to 108%, hold for impact, cross dissolve 0.3s"
      : purpose === "Ending"
        ? "gentle camera drift, hold frame, fade to black"
        : purpose === "Twist/Escalation"
          ? "slow pan with a restrained speed ramp into the reveal"
          : "slow cinematic push-in with subtle parallax";
    const overlay = purpose === "Ending"
      ? `${topic.toUpperCase()} / appears all at once, then fades`
      : `${details.replace(/^.*?:\s*/, "").slice(0, 64)} / staggered over two beats`;

    return [
      `Scene ${index + 1} - ${timestamp.trim()}`,
      `Purpose: ${purpose}`,
      `Leonardo AI Prompt: ${prompt}`,
      "Generate: 1 image for this scene. Use this prompt as-is first; create variations only if the first image misses the subject.",
      "Suggested Variations: camera angle shift, warmer or cooler lighting, wider or tighter framing.",
      `Edit Instructions: ${movement}.`,
      `Text Overlay: ${overlay}. Do not include this text inside the Leonardo image prompt.`,
    ].join("\n");
  });
}

function buildRunwayAnimationPrompts(scenes: string[], leonardoPrompts: string[], state: GeneratorState) {
  return scenes.map((scene, index) => {
    const [timestamp = `Scene ${index + 1}`] = scene.split(" - ");
    const purpose = getScenePurpose(scene, index, scenes.length);
    const duration = state.length === "1-3 min" ? "6-10 seconds" : "3-5 seconds";
    const energy = purpose === "Hook"
      ? "sharp, dramatic, and immediate"
      : purpose === "Ending"
        ? "calm, awe-filled, and polished"
        : purpose === "Twist/Escalation"
          ? "slightly more energetic with controlled motion"
          : purpose === "Reveal"
            ? "large-scale and cinematic"
            : "controlled, clear, and readable";

    return [
      `Scene ${index + 1} - ${timestamp.trim()}`,
      `Input image reference: Use the Leonardo Scene ${index + 1} image as the input image.`,
      `Duration suggestion: ${duration}.`,
      `Runway Prompt: Animate this exact still image: ${leonardoPrompts[index] || scene}. Make the shot feel ${energy}. Use a slow cinematic push-in, subtle parallax, gentle camera drift, faint particle movement where appropriate, and soft lighting movement. Preserve the original composition, keep the subject stable, no warping, no added objects. Add text overlays later in CapCut or DaVinci.`,
      "Avoid: no text, no captions, no added objects, no warping, no distorted planets, no unstable geometry, no cartoon style, no flickering.",
      `Transition: ${purpose === "Ending" ? "fade to black" : "cross dissolve 0.3s into the next shot"}.`,
    ].join("\n");
  });
}

function buildSeriesParts(base: GeneratorOutput, state: GeneratorState) {
  if (!state.multiPartSeries) return [];

  const topic = getStorySubject(state);
  const seriesName = `${topic} Files`;
  return Array.from({ length: state.numberOfParts }, (_, index) => {
    const part = index + 1;
    const isFinal = part === state.numberOfParts;
    const title = `${seriesName}: Part ${part}`;
    const hook = part === 1
      ? `Part 1 opens the mystery: ${base.hooks[0] || topic}`
      : `Previously: the story widened. Now Part ${part} reveals the next layer of ${topic}.`;
    const nextHook = isFinal ? "This final part lands the conclusion." : `Part ${part + 1} shows why this gets stranger.`;

    return {
      seriesName,
      partNumber: `Part ${part} of ${state.numberOfParts}`,
      title,
      hook,
      script: [
        hook,
        `Explain one clear layer of ${topic} without repeating the previous part.`,
        nextHook,
      ],
      timedSceneBreakdown: base.timedScript.map((scene) => `${scene} Part ${part} angle: ${isFinal ? "conclusion" : "continue the chain"}.`),
      visualProductionPlan: base.visualProductionPlan,
      leonardoPrompts: base.leonardoPrompts,
      runwayAnimationPrompts: base.runwayAnimationPrompts,
      textOverlays: base.visualProductionPlan.map((scene) => scene.split("Text Overlay: ")[1]?.split("\n")[0] ?? ""),
      cta: isFinal ? "Save this series and follow Vanta Orbit Media for the next cosmic story." : `Watch Part ${part + 1} next.`,
    };
  });
}

function formatSeriesPart(part: SeriesPart) {
  return [
    `Series name: ${part.seriesName}`,
    part.partNumber,
    `Title: ${part.title}`,
    `Hook: ${part.hook}`,
    `Script:\n${part.script.join("\n")}`,
    `Timed scene breakdown:\n${part.timedSceneBreakdown.join("\n")}`,
    `Visual Production Plan:\n${part.visualProductionPlan.join("\n\n")}`,
    `Leonardo prompts:\n${part.leonardoPrompts.join("\n\n")}`,
    `Runway Animation Prompts:\n${part.runwayAnimationPrompts.join("\n\n")}`,
    `Text overlays:\n${part.textOverlays.join("\n")}`,
    `CTA: ${part.cta}`,
  ].join("\n\n");
}

function buildKeyFacts(topic: string, state: GeneratorState) {
  return [
    `${topic} is best explained by connecting the visible phenomenon to the physical mechanism behind it.`,
    `Use at least one scale comparison so the audience can picture distance, size, time, or energy.`,
    `Lead with the strongest verified claim, then separate what scientists know from what remains uncertain.`,
    `For ${state.platform}, the opening needs a fast factual hook before the broader context begins.`,
    `The deep dive should define specialist terms before using them repeatedly.`,
    `Real numbers, mission names, or observed measurements should be added during source review.`,
    `The article should widen beyond the video by explaining causes, evidence, implications, and common misconceptions.`,
  ];
}

function buildRelatedQuestions(topic: string) {
  return [
    `What is the simplest explanation for ${topic}?`,
    `What evidence supports the main claim about ${topic}?`,
    `What numbers or timescales make ${topic} easier to understand?`,
    `What do people commonly get wrong about ${topic}?`,
    `Why does ${topic} matter beyond the original video hook?`,
  ];
}

function buildArticleStructure(topic: string) {
  return [
    "SEO title and meta description",
    `Introduction: why ${topic} is worth a deeper look`,
    "The core science in plain English",
    "Key facts, numbers, and evidence",
    "What the video leaves out",
    "Why it matters for space science",
    "FAQ",
    "Conclusion and internal link suggestions",
  ];
}

function readHookLabInsights() {
  if (typeof window === "undefined") return null;

  const saved = window.localStorage.getItem(HOOK_INSIGHTS_KEY);
  if (!saved) return null;

  try {
    return JSON.parse(saved) as HookLabInsights;
  } catch {
    return null;
  }
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeContentTopic(value: unknown): ContentTopic {
  return contentTopics.some((topic) => topic.value === value) ? (value as ContentTopic) : initialState.topic;
}

function normalizeContentType(value: unknown): "short" | "long" {
  return value === "long" ? "long" : "short";
}

function normalizeSeriesParts(value: unknown): SeriesPart[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((part): part is Partial<SeriesPart> => Boolean(part) && typeof part === "object")
    .map((part, index) => ({
      seriesName: stringValue(part.seriesName),
      partNumber: stringValue(part.partNumber) || `Part ${index + 1}`,
      title: stringValue(part.title),
      hook: stringValue(part.hook),
      script: stringArray(part.script),
      timedSceneBreakdown: stringArray(part.timedSceneBreakdown),
      visualProductionPlan: stringArray(part.visualProductionPlan),
      leonardoPrompts: stringArray(part.leonardoPrompts),
      runwayAnimationPrompts: stringArray(part.runwayAnimationPrompts),
      textOverlays: stringArray(part.textOverlays),
      cta: stringValue(part.cta),
    }));
}

function normalizeGeneratorOutput(value: unknown): GeneratorOutput | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Partial<GeneratorOutput>;
  const titles = stringArray(raw.titles);
  const hooks = stringArray(raw.hooks);
  const timedScript = stringArray(raw.timedScript);
  const visualPlan = stringArray(raw.visualPlan);
  const leonardoPrompts = stringArray(raw.leonardoPrompts);
  const runwayPrompts = stringArray(raw.runwayPrompts);
  const visualProductionPlan = stringArray(raw.visualProductionPlan);
  const runwayAnimationPrompts = stringArray(raw.runwayAnimationPrompts);

  if (titles.length === 0 && hooks.length === 0 && timedScript.length === 0) return null;

  return {
    titles,
    description: stringValue(raw.description),
    videoContext: stringValue(raw.videoContext),
    keyFacts: stringArray(raw.keyFacts),
    category: normalizeContentTopic(raw.category),
    contentType: normalizeContentType(raw.contentType),
    targetAudience: stringValue(raw.targetAudience),
    tone: stringValue(raw.tone),
    depthLevel: stringValue(raw.depthLevel),
    relatedQuestions: stringArray(raw.relatedQuestions),
    seoKeywords: stringArray(raw.seoKeywords),
    suggestedArticleStructure: stringArray(raw.suggestedArticleStructure),
    hooks,
    timedScript,
    visualPlan,
    leonardoPrompts,
    runwayPrompts,
    visualProductionPlan: visualProductionPlan.length > 0 ? visualProductionPlan : visualPlan,
    runwayAnimationPrompts: runwayAnimationPrompts.length > 0 ? runwayAnimationPrompts : runwayPrompts,
    seriesParts: normalizeSeriesParts(raw.seriesParts),
    postingPlan: stringArray(raw.postingPlan),
    caption: stringValue(raw.caption),
    hashtags: stringArray(raw.hashtags),
    thumbnailText: stringArray(raw.thumbnailText),
    hookLabPrompt: stringValue(raw.hookLabPrompt),
  };
}

function normalizeSavedGeneration(value: unknown): SavedGeneration | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Partial<SavedGeneration>;
  const output = normalizeGeneratorOutput(raw.output);
  if (!output) return null;

  return {
    id: stringValue(raw.id) || crypto.randomUUID(),
    createdAt: stringValue(raw.createdAt) || new Date().toISOString(),
    formState: { ...initialState, ...(raw.formState ?? {}) },
    output,
    selectedImageUrls: stringArray(raw.selectedImageUrls),
    thumbnailCandidate: stringValue(raw.thumbnailCandidate),
  };
}

function readGenerationHistory() {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(VIDEO_IDEAS_HISTORY_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeSavedGeneration)
      .filter((entry): entry is SavedGeneration => Boolean(entry));
  } catch {
    return [];
  }
}

function saveGenerationHistory(history: SavedGeneration[]) {
  window.localStorage.setItem(VIDEO_IDEAS_HISTORY_KEY, JSON.stringify(history.slice(0, 12)));
}

function getTopHookVideos(videos: VideoItem[], topic: ContentTopic) {
  const topicMatches = videos.filter((video) => video.category === topic && video.hookText.trim());
  const candidates = topicMatches.length > 0 ? topicMatches : videos.filter((video) => video.hookText.trim());

  return [...candidates]
    .sort((left, right) => calculateHookScore(right) - calculateHookScore(left))
    .slice(0, 5);
}

function buildHookLabHooks(topic: string, topHooks: string[], insights: HookLabInsights | null) {
  const reuseStyles = insights?.hookStylesToReuse?.slice(0, 3) ?? [];
  const phraseSeeds = insights?.phrasesThatWork?.slice(0, 3).map((phrase) => phrase.replace(/\s+\(\d+\)$/, "")) ?? [];
  const styleLine = reuseStyles.length ? reuseStyles.join(", ") : "curiosity gap, scale, mystery";
  const phraseLead = phraseSeeds[0] ?? "What if";

  return [
    `${phraseLead} ${topic} is pointing to something bigger than the video can show?`,
    `The ${topic} detail that turns a simple space fact into a ${styleLine} story.`,
    `Most people miss this part of ${topic}, and it changes the whole explanation.`,
    `Why ${topic} feels impossible until you see the hidden mechanism behind it.`,
    `This ${topic} pattern keeps working because it creates a clean question fast.`,
  ].filter((hook) => !topHooks.includes(hook));
}

function buildVideoIdeasHookLabPrompt(insights: HookLabInsights | null, topHooks: string[]) {
  const hookLabInsights = insights
    ? JSON.stringify(
        {
          winningPatterns: insights.winningPatterns ?? [],
          phrasesThatWork: insights.phrasesThatWork ?? [],
          topicsThatPerformBest: insights.topicsThatPerformBest ?? [],
          hookStylesToReuse: insights.hookStylesToReuse ?? [],
          hookStylesToAvoid: insights.hookStylesToAvoid ?? [],
          suggestedNewHooks: insights.suggestedNewHooks ?? [],
        },
        null,
        2,
      )
    : "No generated Hook Lab insights yet. Use available top-performing hooks and avoid copying them.";
  const topPerformingHooks = topHooks.length > 0
    ? topHooks.map((hook) => `- ${hook}`).join("\n")
    : "No top-performing hook text saved yet.";

  return `Before generating new video ideas, use the following Hook Lab insights:

${hookLabInsights}

Top-performing hooks:
${topPerformingHooks}

Generate ideas that follow similar successful patterns, but do not copy the old hooks word-for-word.

Prioritise:
- strong first 2 seconds
- curiosity
- scale
- surprise
- future consequences
- simple language
- high visual potential`;
}

function buildTimedScriptPromptRules(length: GeneratorState["length"]) {
  const timingRules: Record<GeneratorState["length"], string[]> = {
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

  return timingRules[length].map((rule) => `  - ${rule}`).join("\n");
}

function buildAvoidPreviousIdeaPrompt(previousOutput?: GeneratorOutput | null) {
  if (!previousOutput) return "";

  return `Previous generated idea to avoid:
${JSON.stringify(
  {
    titles: previousOutput.titles,
    hooks: previousOutput.hooks,
    description: previousOutput.description,
    videoContext: previousOutput.videoContext,
    keyFacts: previousOutput.keyFacts.slice(0, 5),
    timedScript: previousOutput.timedScript,
    visualPlan: previousOutput.visualPlan,
  },
  null,
  2,
)}

Regeneration rule:
- Do not reuse the same core subject, claim, phenomenon, fact pattern, or story angle from the previous idea.
- Do not simply reword the previous title, hook, or script.
- If the selected topic is broad and the focus object is empty, pick a different specific angle inside that topic.
- Example: if the previous Moon idea was about the Moon drifting away, the next Moon idea should be about a different Moon story such as moonquakes, permanently shadowed craters, lunar water ice, regolith, Earthshine, tidal locking, the far side, lava tubes, or another distinct angle.`;
}

function buildVideoIdeasPrompt(
  state: GeneratorState,
  output: GeneratorOutput,
  previousOutput?: GeneratorOutput | null,
) {
  // TODO: Move prompt construction server-side if these internal workflows
  // should not be visible in client-side admin bundles.
  return `Generate a production-ready Vanta Orbit Media video idea pack.

IMPORTANT:
- Return valid JSON only.
- No markdown.
- Do not wrap the JSON in code fences.
- No explanations.
- No extra text before or after the JSON.
- If a field is unknown, still return the field with a useful value.

Topic: ${formatTopicLabel(state.topic)}
Focus object / subject: ${state.focusObject.trim() || "None provided"}
Length: ${state.length}
Platform: ${state.platform}
Mood: ${state.mood}
CTA style: ${state.ctaStyle}
Multi-Part Series Mode: ${state.multiPartSeries ? `enabled, ${state.numberOfParts} parts` : "disabled"}
Include posting plan: ${state.includePostingPlan ? "yes" : "no"}
Include pinned comments: ${state.includePinnedComments ? "yes" : "no"}

${output.hookLabPrompt}

Selected topic:
${formatTopicLabel(state.topic)}

Focus object / subject:
${state.focusObject.trim() || "None provided"}

Generate content ideas that match the selected topic and are specifically focused on the focus object where provided.
${buildAvoidPreviousIdeaPrompt(previousOutput)}

Required JSON structure:
{
  "titleIdeas": [],
  "hookIdeas": [],
  "deepDiveContext": "",
  "keyFacts": [],
  "questionsAndSEO": {
    "questions": [],
    "seoKeywords": []
  },
  "articleStructure": [],
  "timedScriptStructure": [
    {
      "time": "",
      "section": "",
      "voiceover": "",
      "visual": ""
    }
  ],
  "sceneBySceneVisualPlan": [
    {
      "scene": "",
      "description": "",
      "camera": "",
      "motion": ""
    }
  ],
  "leonardoPrompts": [],
  "runwayPrompts": [],
  "visualProductionPlan": [
    {
      "scene": "",
      "timestamp": "",
      "purpose": "",
      "leonardoPrompt": "",
      "generate": "",
      "suggestedVariations": [],
      "editInstructions": "",
      "textOverlay": ""
    }
  ],
  "runwayAnimationPrompts": [
    {
      "scene": "",
      "timestamp": "",
      "inputImageReference": "",
      "durationSuggestion": "",
      "runwayPrompt": "",
      "avoid": [],
      "transition": ""
    }
  ],
  "seriesParts": [],
  "postingPlan": [],
  "captions": [],
  "hashtags": [],
  "thumbnailTextIdeas": []
}

Content requirements:
- titleIdeas: exactly 5 strong, clickable titles
- hookIdeas: exactly 5 scroll-stopping hooks for 0-2 seconds
- deepDiveContext: 3-5 sentences expanding the topic beyond the video
- keyFacts: 5-10 accurate, concise facts
- questions: engagement-style questions viewers might ask
- seoKeywords: relevant search terms for YouTube and Google
- articleStructure: ordered sections/headings for a blog deep dive
- timedScriptStructure must follow this timing exactly:
${buildTimedScriptPromptRules(state.length)}
- The timed script must fit ${state.length}. Do not write timings beyond the selected length.
- If the selected length is 15s, the final timedScriptStructure entry must end at 0:15, not 0:30.
- sceneBySceneVisualPlan: cinematic breakdown of each scene
- visualProductionPlan: one entry per timed scene, with the exact Scene X timestamp, Purpose, Leonardo AI Prompt, Generate, Suggested Variations, Edit Instructions, and Text Overlay fields
- leonardoPrompts: one copy-paste-ready Leonardo prompt per scene, optimized for Nano Banana Pro
- runwayAnimationPrompts: one image-to-video prompt per Leonardo scene, referencing "Use the Leonardo Scene X image as the input image."
- runwayPrompts: keep this legacy field useful, but the detailed image-to-video instructions belong in runwayAnimationPrompts
- captions: short-form captions for social media
- hashtags: relevant, non-spammy hashtags
- thumbnailTextIdeas: short, bold, high-CTR text options

Tone:
- cinematic
- slightly dramatic
- educational but engaging
- clear and simple

Rules:
- Hooks must be strong and immediate
- Avoid generic phrasing
- Focus on curiosity, scale, or surprising facts
- Make outputs feel like high-performing short-form content
- Every Leonardo prompt must include ultra realistic, cinematic, NASA documentary style, high contrast lighting, physically believable textures, no text, no labels, no diagrams, no UI overlays, no arrows, no captions.
- If contentType is short, start every Leonardo prompt with "Vertical 9:16" and use mobile-centered framing with resolution target 1536x2752.
- If contentType is long, start every Leonardo prompt with "Horizontal 16:9" and use cinematic landscape framing with resolution target 2752x1536.
- Terrain/surface scenes must avoid the words heatmap, overlay, highlight, and false color. Use integrated into surface, natural material variation, lighting interacting with the surface, physically believable colour variation.
- Runway prompts must animate the matching Leonardo still image, preserve the original composition, keep the subject stable, no warping, no added objects, and include: Add text overlays later in CapCut or DaVinci.
- If Multi-Part Series Mode is enabled, generate exactly ${state.numberOfParts} connected seriesParts. Each part must include seriesName, partNumber, title, hook, script, timedSceneBreakdown, visualProductionPlan, leonardoPrompts, runwayAnimationPrompts, textOverlays, and cta. Part 1 introduces the concept, middle parts continue logically, and the final part concludes.
- If Multi-Part Series Mode is disabled, return seriesParts as an empty array and postingPlan as an empty array.
- If posting plan is enabled, include a daily posting schedule, caption theme per part, and pinned comment suggestion per part.

Existing local scaffold to improve, not copy blindly:
${JSON.stringify(output, null, 2)}`;
}

function outputFromStructuredIdeas(
  ideas: StructuredVideoIdeas,
  state: GeneratorState,
  fallbackOutput: GeneratorOutput,
): GeneratorOutput {
  const titles = [...ideas.titleIdeas, ...fallbackOutput.titles].slice(0, 5);
  const hooks = [...ideas.hookIdeas, ...fallbackOutput.hooks].slice(0, 5);

  const timedScript = ideas.timedScriptStructure.length > 0 ? ideas.timedScriptStructure.map((item) =>
    `${item.time} - ${item.section}: ${item.voiceover} Visual: ${item.visual}`,
  ) : fallbackOutput.timedScript;
  const leonardoPrompts = ideas.leonardoPrompts.length > 0 ? ideas.leonardoPrompts : fallbackOutput.leonardoPrompts;
  const visualProductionPlan = ideas.visualProductionPlan && ideas.visualProductionPlan.length > 0
    ? ideas.visualProductionPlan.map((item, index) => [
        item.scene || `Scene ${index + 1}`,
        `Purpose: ${item.purpose}`,
        `Leonardo AI Prompt: ${item.leonardoPrompt}`,
        `Generate: ${item.generate}`,
        `Suggested Variations: ${item.suggestedVariations.join(", ")}`,
        `Edit Instructions: ${item.editInstructions}`,
        `Text Overlay: ${item.textOverlay}`,
      ].join("\n"))
    : buildVisualProductionPlan(timedScript, state);
  const runwayAnimationPrompts = ideas.runwayAnimationPrompts && ideas.runwayAnimationPrompts.length > 0
    ? ideas.runwayAnimationPrompts.map((item, index) => [
        item.scene || `Scene ${index + 1}`,
        `Input image reference: ${item.inputImageReference}`,
        `Duration suggestion: ${item.durationSuggestion}`,
        `Runway Prompt: ${item.runwayPrompt} Add text overlays later in CapCut or DaVinci.`,
        `Avoid: ${item.avoid.join(", ")}`,
        `Transition: ${item.transition}`,
      ].join("\n"))
    : buildRunwayAnimationPrompts(timedScript, leonardoPrompts, state);
  const baseOutput: GeneratorOutput = {
    ...fallbackOutput,
    titles,
    hooks,
    description: ideas.captions[0] || fallbackOutput.description,
    videoContext: ideas.deepDiveContext || fallbackOutput.videoContext,
    keyFacts: ideas.keyFacts.length > 0 ? ideas.keyFacts : fallbackOutput.keyFacts,
    category: state.topic,
    contentType: getContentType(state),
    targetAudience: fallbackOutput.targetAudience,
    tone: fallbackOutput.tone,
    depthLevel: fallbackOutput.depthLevel,
    relatedQuestions: ideas.questionsAndSEO.questions.length > 0
      ? ideas.questionsAndSEO.questions
      : fallbackOutput.relatedQuestions,
    seoKeywords: ideas.questionsAndSEO.seoKeywords.length > 0
      ? ideas.questionsAndSEO.seoKeywords
      : fallbackOutput.seoKeywords,
    suggestedArticleStructure: ideas.articleStructure.length > 0
      ? ideas.articleStructure
      : fallbackOutput.suggestedArticleStructure,
    timedScript,
    visualPlan: ideas.sceneBySceneVisualPlan.length > 0 ? ideas.sceneBySceneVisualPlan.map((item) =>
      `${item.scene} - ${item.description} Camera: ${item.camera}. Motion: ${item.motion}.`,
    ) : fallbackOutput.visualPlan,
    leonardoPrompts,
    runwayPrompts: ideas.runwayPrompts.length > 0 ? ideas.runwayPrompts : fallbackOutput.runwayPrompts,
    visualProductionPlan,
    runwayAnimationPrompts,
    seriesParts: state.multiPartSeries && ideas.seriesParts && ideas.seriesParts.length > 0
      ? ideas.seriesParts.slice(0, state.numberOfParts)
      : [],
    postingPlan: state.multiPartSeries && ideas.postingPlan && ideas.postingPlan.length > 0
      ? ideas.postingPlan
      : fallbackOutput.postingPlan,
    caption: ideas.captions[0] || fallbackOutput.caption,
    hashtags: ideas.hashtags.length > 0 ? ideas.hashtags : fallbackOutput.hashtags,
    thumbnailText: ideas.thumbnailTextIdeas.length > 0 ? ideas.thumbnailTextIdeas : fallbackOutput.thumbnailText,
  };

  return {
    ...baseOutput,
    seriesParts: state.multiPartSeries && baseOutput.seriesParts.length === 0
      ? buildSeriesParts(baseOutput, state)
      : baseOutput.seriesParts,
  };
}

function getStorySubject(state: GeneratorState) {
  return state.focusObject.trim() || formatTopicLabel(state.topic);
}

function generateOutput(state: GeneratorState, videos: VideoItem[], hookInsights: HookLabInsights | null): GeneratorOutput {
  const topic = getStorySubject(state);
  const moodLead = sentenceCase(state.mood);
  const topHookVideos = state.useHookLabData ? getTopHookVideos(videos, state.topic) : [];
  const topHooks = topHookVideos.map((video) => video.hookText);
  const hookLabHooks = state.useHookLabData ? buildHookLabHooks(topic, topHooks, hookInsights) : [];
  const hookLabPrompt = state.useHookLabData ? buildVideoIdeasHookLabPrompt(hookInsights, topHooks) : "";
  const ctaLine =
    state.ctaStyle === "soft follow"
      ? "Follow Vanta Orbit Media for more cosmic stories."
      : state.ctaStyle === "dramatic cliffhanger"
        ? "And this is only the beginning."
        : state.ctaStyle === "part 2 tease"
          ? "Part 2 goes even deeper."
          : "";

  const timedScript = buildTimedStructure(state.length, state.topic, state.ctaStyle);
  const visualPlan = [
    `Scene 1 - Cold open on ${topic} with a ${state.mood} nebula-lit reveal frame.`,
    `Scene 2 - Show the physical setting around ${topic} with documentary realism and no overlays.`,
    `Scene 3 - Explain the core mechanism with grounded particle flow or environmental motion.`,
    `Scene 4 - Show scale, danger, or wonder with a cinematic space vista tied to ${topic}.`,
    `Scene 5 - Resolve with a polished end beat built for ${state.platform}.`,
  ];
  const leonardoPrompts = timedScript.map((scene, index) => buildLeonardoPrompt(scene, topic, state, index, timedScript.length));
  const visualProductionPlan = buildVisualProductionPlan(timedScript, state);
  const runwayAnimationPrompts = buildRunwayAnimationPrompts(timedScript, leonardoPrompts, state);
  const baseOutput: GeneratorOutput = {
    titles: [
      `${topic} Is Stranger Than We Realized`,
      `The Hidden Truth About ${topic}`,
      `Why ${topic} Feels Almost Impossible`,
      `What Nobody Tells You About ${topic}`,
      `${moodLead} Facts About ${topic}`,
    ],
    description: `${topic} explained through a ${state.mood} space-science story built for ${state.platform}, with enough context to expand into a useful deep dive.`,
    videoContext: `This ${state.platform} idea frames ${topic} within the ${formatTopicLabel(state.topic)} category as a cinematic education story. The article should keep the emotional pull of the video but slow down to explain the mechanism, evidence, scale, open questions, and why the subject matters to a curious space audience.`,
    keyFacts: buildKeyFacts(topic, state),
    category: state.topic,
    contentType: state.platform === "YouTube Longform" || state.length === "1-3 min" ? "long" : "short",
    targetAudience: "Curious general viewers who enjoy space, science, cinematic facts, and clear explanations without heavy jargon.",
    tone: `${state.mood}, accurate, cinematic, accessible, and wonder-led`,
    depthLevel: state.platform === "YouTube Longform" ? "advanced beginner to intermediate" : "beginner-friendly with optional deeper context",
    relatedQuestions: buildRelatedQuestions(topic),
    seoKeywords: [
      topic.toLowerCase(),
      `${topic.toLowerCase()} explained`,
      "space facts",
      "space science",
      "Vanta Orbit Media",
      state.topic,
    ],
    suggestedArticleStructure: buildArticleStructure(topic),
    hooks: hookLabHooks.length > 0
      ? hookLabHooks
      : [
          `What if the weirdest thing about ${topic} is also the most real?`,
          `${topic} sounds like fiction until you see the science behind it.`,
          `This detail about ${topic} changes the whole story.`,
          `Most people think they understand ${topic}. They do not.`,
          `The universe hid something unsettling inside ${topic}.`,
        ],
    timedScript,
    visualPlan,
    leonardoPrompts,
    runwayPrompts: runwayAnimationPrompts,
    visualProductionPlan,
    runwayAnimationPrompts,
    seriesParts: [],
    postingPlan: state.multiPartSeries && state.includePostingPlan
      ? Array.from({ length: state.numberOfParts }, (_, index) =>
          `Day ${index + 1}: Post Part ${index + 1} with a caption theme around ${index === 0 ? "the opening mystery" : index === state.numberOfParts - 1 ? "the final payoff" : "the next reveal"}.${
            state.includePinnedComments ? ` Pinned comment: Watch Part ${Math.min(index + 2, state.numberOfParts)} for the next layer.` : ""
          }`,
        )
      : [],
    caption: `${topic} hits harder when you realize how much of it sounds impossible until the science clicks. ${ctaLine}`.trim(),
    hashtags: [
      "#VantaOrbitMedia",
      "#SpaceFacts",
      "#ScienceTok",
      `#${topic.replace(/[^A-Za-z0-9]/g, "")}`,
      state.platform === "YouTube Longform" ? "#SpaceDocumentary" : "#ShortFormScience",
      state.mood === "eerie" ? "#CosmicMystery" : "#Universe",
    ],
    thumbnailText: [
      `${topic} Explained`,
      `${topic} Is Real`,
      `This Changes ${topic}`,
      `The Truth About ${topic}`,
      `${topic} Feels Impossible`,
    ],
    hookLabPrompt,
  };

  return {
    ...baseOutput,
    seriesParts: buildSeriesParts(baseOutput, state),
  };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function OutputCard({
  title,
  items,
  copyText,
  action,
}: {
  title: string;
  items: string[];
  copyText: string;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_38px_rgba(124,58,237,0.16)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-lg font-bold uppercase tracking-[0.18em] text-white">
          {title}
        </h3>
        <div className="flex flex-wrap gap-2">
          {action}
          <CopyButton text={copyText} />
        </div>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-200">
        {items.map((item) => (
          <p key={item} className="whitespace-pre-line">{item}</p>
        ))}
      </div>
    </section>
  );
}

function SelectableOutputCard({
  title,
  items,
  selected,
  onSelect,
  onClear,
  copyText,
  action,
}: {
  title: string;
  items: string[];
  selected: string;
  onSelect: (value: string) => void;
  onClear: () => void;
  copyText: string;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_38px_rgba(124,58,237,0.16)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-lg font-bold uppercase tracking-[0.18em] text-white">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {selected ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10"
            >
              Clear
            </button>
          ) : null}
          {action}
          <CopyButton text={copyText} />
        </div>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-200">
        {items.map((item) => {
          const isSelected = selected === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`block w-full rounded-2xl border px-4 py-3 text-left transition ${
                isSelected
                  ? "border-violet-200/70 bg-violet-400/15 text-white"
                  : "border-white/8 bg-black/20 text-zinc-200 hover:border-violet-200/50 hover:bg-violet-400/10"
              }`}
            >
              <span>{item}</span>
              {isSelected ? (
                <span className="ml-3 rounded-full bg-violet-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-black">
                  Selected
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function AdminGenerator({ videos, aiModels }: { videos: VideoItem[]; aiModels: string[] }) {
  const [formState, setFormState] = useState(initialState);
  const [output, setOutput] = useState<GeneratorOutput | null>(null);
  const [saved, setSaved] = useState(false);
  const [hookInsights, setHookInsights] = useState<HookLabInsights | null>(null);
  const [rawOutput, setRawOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [selectedModel, setSelectedModel] = useState(aiModels[0] ?? "gpt-4.1-mini");
  const [generateLeonardoImages, setGenerateLeonardoImages] = useState(false);
  const [leonardoStates, setLeonardoStates] = useState<Record<string, LeonardoGenerationState>>({});
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);
  const [thumbnailCandidate, setThumbnailCandidate] = useState("");
  const [history, setHistory] = useState<SavedGeneration[]>([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [selectedHook, setSelectedHook] = useState("");
  const [selectedThumbnailText, setSelectedThumbnailText] = useState("");
  const [regeneratingSection, setRegeneratingSection] = useState<"" | "titles" | "hooks" | "visualPlan">("");

  const updateField = <K extends keyof GeneratorState>(key: K, value: GeneratorState[K]) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    setHistory(readGenerationHistory());
    setHookInsights(readHookLabInsights());
  }, []);

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const estimatedDuration = 32000;
      const nextProgress = Math.min(92, Math.round((elapsed / estimatedDuration) * 100));
      setProgress(nextProgress);
    }, 400);

    return () => window.clearInterval(timer);
  }, [loading]);

  const persistGeneration = (
    nextOutput: GeneratorOutput,
    nextFormState = formState,
    images = selectedImageUrls,
    thumbnail = thumbnailCandidate,
  ) => {
    const saved: SavedGeneration = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      formState: nextFormState,
      output: nextOutput,
      selectedImageUrls: images,
      thumbnailCandidate: thumbnail,
    };

    setHistory((current) => {
      const nextHistory = [saved, ...current].slice(0, 12);
      saveGenerationHistory(nextHistory);
      return nextHistory;
    });
  };

  const restoreGeneration = (saved: SavedGeneration) => {
    const normalized = normalizeSavedGeneration(saved);
    if (!normalized) {
      setError("This saved idea is too old or incomplete to load.");
      return;
    }

    setFormState({ ...initialState, ...normalized.formState });
    setOutput(normalized.output);
    setSelectedImageUrls(normalized.selectedImageUrls);
    setThumbnailCandidate(normalized.thumbnailCandidate);
    setSelectedTitle(normalized.output.titles[0] ?? "");
    setSelectedHook(normalized.output.hooks[0] ?? "");
    setSelectedThumbnailText(normalized.output.thumbnailText[0] ?? "");
    setRawOutput("");
    setError("");
    setSaved(false);
  };

  const clearHistory = () => {
    window.localStorage.removeItem(VIDEO_IDEAS_HISTORY_KEY);
    setHistory([]);
  };

  const handleGenerate = async (previousOutput?: GeneratorOutput | null) => {
    const fallbackOutput = generateOutput(formState, videos, hookInsights);
    setSaved(false);
    setRawOutput("");
    setError("");
    setLoading(true);
    setProgress(4);

    try {
      const response = await fetch("/api/generate-video-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: buildVideoIdeasPrompt(formState, fallbackOutput, previousOutput),
          fallbackOutput,
          model: selectedModel,
          duration: formState.length,
        }),
      });
      const result = (await response.json()) as {
        ideas?: StructuredVideoIdeas;
        rawOutput?: string;
        validJSON?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Video idea generation failed.");
      }

      if (result.rawOutput || result.validJSON === false) {
        setOutput(null);
        setRawOutput(result.rawOutput || "The AI response was not valid structured JSON.");
        setError("The AI response was not valid structured JSON, so the raw output is shown below.");
        setProgress(100);
        return;
      }

      if (!result.ideas) {
        throw new Error("Video ideas response did not include structured JSON or raw output.");
      }

      const structuredOutput = outputFromStructuredIdeas(result.ideas, formState, fallbackOutput);
      setOutput(structuredOutput);
      setSelectedTitle(structuredOutput.titles[0] ?? "");
      setSelectedHook(structuredOutput.hooks[0] ?? "");
      setSelectedThumbnailText(structuredOutput.thumbnailText[0] ?? "");
      setProgress(100);
      persistGeneration(structuredOutput);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Video idea generation failed.");
    } finally {
      setLoading(false);
    }
    setSaved(false);
  };

  const handleSaveToManager = () => {
    if (!output) return;
    const finalTitle = selectedTitle || output.titles[0] || "";
    const finalHook = selectedHook || output.hooks[0] || "";
    const finalThumbnailText = selectedThumbnailText || output.thumbnailText[0] || "";

    const draft: SavedVideoIdea = {
      title: finalTitle,
      focusObject: formState.focusObject.trim(),
      selectedTitle: finalTitle,
      selectedHook: finalHook,
      selectedThumbnailText: finalThumbnailText,
      titleIdeas: output.titles,
      hookIdeas: output.hooks,
      thumbnailTextIdeas: output.thumbnailText,
      description: output.description,
      videoContext: output.videoContext,
      keyFacts: output.keyFacts,
      category: output.category,
      contentType: output.contentType,
      targetAudience: output.targetAudience,
      tone: output.tone,
      depthLevel: output.depthLevel,
      relatedQuestions: output.relatedQuestions,
      seoKeywords: output.seoKeywords,
      suggestedArticleStructure: output.suggestedArticleStructure,
      sourceNotes: "Source review needed: add NASA, ESA, mission, journal, or observatory references before publishing.",
      tags: output.seoKeywords.slice(0, 5),
      series: `${formatTopicLabel(output.category)} Files`,
      generatedImageUrls: selectedImageUrls,
      thumbnail: thumbnailCandidate,
    };

    window.localStorage.setItem(VIDEO_MANAGER_DRAFT_KEY, JSON.stringify(draft));
    setSaved(true);
  };

  const generateLeonardoImage = async (prompt: string) => {
    setLeonardoStates((current) => ({
      ...current,
      [prompt]: { status: "loading", message: "Generating image...", images: current[prompt]?.images ?? [] },
    }));

    try {
      const response = await fetch("/api/generate-leonardo-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const result = (await response.json()) as {
        images?: Array<{ id: string; url: string }>;
        status?: string;
        message?: string;
        error?: string;
      };

      if (!response.ok && response.status !== 202) {
        throw new Error(result.error || "Leonardo image generation failed.");
      }

      const images = (result.images ?? []).map((image) => ({
        id: image.id || image.url,
        url: image.url,
        prompt,
      }));

      setLeonardoStates((current) => ({
        ...current,
        [prompt]: {
          status: response.status === 202 ? "pending" : "complete",
          message: result.message || (response.status === 202 ? "Still pending in Leonardo." : "Image ready."),
          images,
        },
      }));
    } catch (nextError) {
      setLeonardoStates((current) => ({
        ...current,
        [prompt]: {
          status: "error",
          message: nextError instanceof Error ? nextError.message : "Leonardo image generation failed.",
          images: current[prompt]?.images ?? [],
        },
      }));
    }
  };

  const generateAllLeonardoImages = async () => {
    if (!output) return;

    for (const prompt of output.leonardoPrompts) {
      await generateLeonardoImage(prompt);
    }
  };

  const toggleSelectedImage = (url: string) => {
    setSelectedImageUrls((current) =>
      current.includes(url) ? current.filter((item) => item !== url) : [...current, url],
    );
  };

  const regenerateSection = async (section: "titles" | "hooks" | "visualPlan") => {
    if (!output) return;

    setRegeneratingSection(section);
    setError("");

    try {
      const response = await fetch("/api/generate-video-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${buildVideoIdeasPrompt(formState, output)}

Regenerate only this section with fresh alternatives: ${section}.
Keep every other section useful and consistent with the same idea.`,
          fallbackOutput: output,
          model: selectedModel,
          duration: formState.length,
        }),
      });
      const result = (await response.json()) as {
        ideas?: StructuredVideoIdeas;
        rawOutput?: string;
        validJSON?: boolean;
        error?: string;
      };

      if (!response.ok) throw new Error(result.error || "Section regeneration failed.");
      if (!result.ideas || result.rawOutput || result.validJSON === false) {
        throw new Error("AI did not return structured JSON for section regeneration.");
      }

      const regenerated = outputFromStructuredIdeas(result.ideas, formState, output);
      setOutput((current) => {
        if (!current) return current;
        const next = { ...current };
        if (section === "titles") {
          next.titles = regenerated.titles;
          setSelectedTitle(regenerated.titles[0] ?? "");
        }
        if (section === "hooks") {
          next.hooks = regenerated.hooks;
          setSelectedHook(regenerated.hooks[0] ?? "");
        }
        if (section === "visualPlan") {
          next.visualPlan = regenerated.visualPlan;
        }
        return next;
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Section regeneration failed.");
    } finally {
      setRegeneratingSection("");
    }
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[22rem_minmax(0,1fr)]">
      <section className="rounded-[1.5rem] border border-white/10 bg-black/55 p-6 shadow-[0_0_42px_rgba(124,58,237,0.18)] backdrop-blur-xl">
        <div className="flex items-center gap-3 text-violet-200">
          <Sparkles className="size-5" />
          <p className="text-xs font-bold uppercase tracking-[0.24em]">Template Generator</p>
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-[0.14em] text-white">
          Build the next space story
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          This private tool generates title, hook, script, visual, and prompt scaffolds using your selected content angle.
        </p>

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Topic
            </span>
            <select
              value={formState.topic}
              onChange={(event) => updateField("topic", event.target.value as ContentTopic)}
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
            >
              {contentTopics.map((topic) => (
                <option key={topic.value} value={topic.value} className="bg-[#08060f]">
                  {topic.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Focus Object / Subject
            </span>
            <input
              value={formState.focusObject}
              onChange={(event) => updateField("focusObject", event.target.value)}
              placeholder="e.g. Mars, Europa, Artemis III, black holes, sound in space"
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-200/70"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Video length
            </span>
            <select
              value={formState.length}
              onChange={(event) => updateField("length", event.target.value as GeneratorState["length"])}
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
            >
              {lengths.map((length) => (
                <option key={length} value={length} className="bg-[#08060f]">
                  {length}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Platform
            </span>
            <select
              value={formState.platform}
              onChange={(event) => updateField("platform", event.target.value as GeneratorState["platform"])}
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
            >
              {platforms.map((platform) => (
                <option key={platform} value={platform} className="bg-[#08060f]">
                  {platform}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Mood
            </span>
            <select
              value={formState.mood}
              onChange={(event) => updateField("mood", event.target.value as GeneratorState["mood"])}
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
            >
              {moods.map((mood) => (
                <option key={mood} value={mood} className="bg-[#08060f]">
                  {sentenceCase(mood)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              CTA style
            </span>
            <select
              value={formState.ctaStyle}
              onChange={(event) => updateField("ctaStyle", event.target.value as GeneratorState["ctaStyle"])}
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
            >
              {ctaStyles.map((ctaStyle) => (
                <option key={ctaStyle} value={ctaStyle} className="bg-[#08060f]">
                  {sentenceCase(ctaStyle)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <input
              type="checkbox"
              checked={formState.useHookLabData}
              onChange={(event) => updateField("useHookLabData", event.target.checked)}
              className="size-4 rounded border-white/20 bg-transparent text-violet-300 focus:ring-violet-300"
            />
            <span className="text-sm text-zinc-200">Use Hook Lab Data</span>
          </label>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formState.multiPartSeries}
                onChange={(event) => updateField("multiPartSeries", event.target.checked)}
                className="size-4 rounded border-white/20 bg-transparent text-violet-300 focus:ring-violet-300"
              />
              <span className="text-sm text-zinc-200">Multi-Part Series Mode</span>
            </label>

            {formState.multiPartSeries ? (
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                    Parts
                  </span>
                  <select
                    value={formState.numberOfParts}
                    onChange={(event) => updateField("numberOfParts", Number(event.target.value) as GeneratorState["numberOfParts"])}
                    className="min-h-11 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
                  >
                    {[2, 3, 4, 5].map((partCount) => (
                      <option key={partCount} value={partCount} className="bg-[#08060f]">
                        {partCount}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formState.includePostingPlan}
                    onChange={(event) => updateField("includePostingPlan", event.target.checked)}
                    className="size-4 rounded border-white/20 bg-transparent text-violet-300 focus:ring-violet-300"
                  />
                  <span className="text-sm text-zinc-300">Include posting plan</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formState.includePinnedComments}
                    onChange={(event) => updateField("includePinnedComments", event.target.checked)}
                    className="size-4 rounded border-white/20 bg-transparent text-violet-300 focus:ring-violet-300"
                  />
                  <span className="text-sm text-zinc-300">Include pinned comments</span>
                </label>
              </div>
            ) : null}
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              AI model
            </span>
            <select
              value={selectedModel}
              onChange={(event) => setSelectedModel(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
            >
              {aiModels.map((model) => (
                <option key={model} value={model} className="bg-[#08060f]">
                  {model}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3">
            <input
              type="checkbox"
              checked={generateLeonardoImages}
              onChange={(event) => setGenerateLeonardoImages(event.target.checked)}
              className="size-4 rounded border-white/20 bg-transparent text-amber-200 focus:ring-amber-200"
            />
            <span className="text-sm leading-6 text-amber-100">
              Generate Leonardo images for this idea
            </span>
          </label>
          <p className="text-xs leading-5 text-zinc-400">
            Leonardo image generation uses API credits. Leave this off unless you want to spend credits.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleGenerate()}
          disabled={loading}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 text-sm font-bold uppercase tracking-[0.18em] text-black shadow-[0_0_32px_rgba(168,85,247,0.45)] transition hover:-translate-y-0.5 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? `Generating ${formState.length} idea...` : "Generate"}
        </button>
        {loading ? (
          <div className="mt-4 rounded-2xl border border-violet-300/20 bg-violet-400/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-100">
                Generating with {selectedModel}
              </p>
              <p className="text-xs font-semibold text-violet-100">{progress}%</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-violet-200 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-300">
              Building structured JSON through the secure server route. This usually takes around 20-40 seconds.
            </p>
          </div>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-2xl border border-amber-300/25 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
            {error}
          </p>
        ) : null}
      </section>

      <section className="space-y-6">
        {history.length > 0 ? (
          <section className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_38px_rgba(124,58,237,0.16)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-200">
                  Previous Ideas Generated
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  Saved locally in this browser so you can restore recent generations after a crash.
                </p>
              </div>
              <button
                type="button"
                onClick={clearHistory}
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/15 px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10"
              >
                Clear history
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => restoreGeneration(entry)}
                  className="rounded-2xl border border-white/10 bg-black/35 p-4 text-left transition hover:border-violet-200/60 hover:bg-violet-400/10"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                  <h3 className="mt-2 line-clamp-2 text-base font-semibold text-white">
                    {entry.output.titles[0] || "Untitled idea"}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-400">
                    {formatTopicLabel(entry.formState.topic)}
                    {entry.formState.focusObject ? ` / ${entry.formState.focusObject}` : ""} / {entry.formState.platform} / {entry.formState.length}
                  </p>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {loading && !output ? (
          <div className="flex min-h-[28rem] items-center justify-center rounded-[1.5rem] border border-violet-300/20 bg-violet-400/10 p-8 text-center backdrop-blur">
            <div className="w-full max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-100">Generating</p>
              <h3 className="mt-4 font-display text-2xl font-bold uppercase tracking-[0.14em] text-white">
                Building structured idea cards
              </h3>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-violet-200 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-4 text-sm leading-7 text-zinc-300">
                Waiting for the AI route to return valid JSON. The cards will populate when it finishes.
              </p>
            </div>
          </div>
        ) : rawOutput ? (
          <section className="rounded-[1.5rem] border border-amber-300/25 bg-amber-400/10 p-6 shadow-[0_0_42px_rgba(245,158,11,0.14)] backdrop-blur-xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-100">
              Raw AI Output
            </p>
            <h3 className="mt-4 font-display text-2xl font-bold uppercase tracking-[0.14em] text-white">
              The AI did not return valid structured JSON
            </h3>
            <p className="mt-3 text-sm leading-6 text-amber-50/90">
              The cards were not updated because the response did not match the required schema. The raw response is shown below.
            </p>
            <pre className="mt-5 max-h-[34rem] overflow-auto rounded-2xl border border-white/10 bg-black/45 p-4 text-xs leading-6 text-zinc-200">
              <code>{rawOutput}</code>
            </pre>
            <div className="mt-4">
              <CopyButton text={rawOutput} />
            </div>
          </section>
        ) : output ? (
          <>
            <section className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_38px_rgba(124,58,237,0.16)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-200">
                    Manager-ready idea
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{output.titles[0]}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{output.description}</p>
                  <div className="mt-4 grid gap-2 text-xs leading-5 text-zinc-300 md:grid-cols-3">
                    <p><span className="font-bold uppercase tracking-[0.14em] text-violet-200">Title:</span> {selectedTitle || output.titles[0]}</p>
                    <p><span className="font-bold uppercase tracking-[0.14em] text-violet-200">Hook:</span> {selectedHook || output.hooks[0]}</p>
                    <p><span className="font-bold uppercase tracking-[0.14em] text-violet-200">Thumbnail:</span> {selectedThumbnailText || output.thumbnailText[0]}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleGenerate(output)}
                    disabled={loading}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-violet-200/40 px-5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-violet-100 hover:bg-violet-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "Regenerating" : "Regenerate Idea"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveToManager}
                    disabled={loading}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saved ? <Check className="size-4" /> : <Save className="size-4" />}
                    {saved ? "Saved" : "Save to Video Manager"}
                  </button>
                </div>
              </div>
              {saved ? (
                <p className="mt-3 text-xs leading-5 text-zinc-400">
                  Open Video Manager to edit this saved draft as a structured video entry.
                </p>
              ) : null}
            </section>
            <div className="grid gap-6 xl:grid-cols-2">
              <SelectableOutputCard
                title="5 Title Ideas"
                items={output.titles}
                selected={selectedTitle}
                onSelect={setSelectedTitle}
                onClear={() => setSelectedTitle("")}
                copyText={output.titles.join("\n")}
                action={
                  <button
                    type="button"
                    onClick={() => regenerateSection("titles")}
                    disabled={regeneratingSection === "titles"}
                    className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10 disabled:opacity-60"
                  >
                    {regeneratingSection === "titles" ? "Regenerating" : "Regenerate"}
                  </button>
                }
              />
              <SelectableOutputCard
                title="5 Hook Ideas"
                items={output.hooks}
                selected={selectedHook}
                onSelect={setSelectedHook}
                onClear={() => setSelectedHook("")}
                copyText={output.hooks.join("\n")}
                action={
                  <button
                    type="button"
                    onClick={() => regenerateSection("hooks")}
                    disabled={regeneratingSection === "hooks"}
                    className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10 disabled:opacity-60"
                  >
                    {regeneratingSection === "hooks" ? "Regenerating" : "Regenerate"}
                  </button>
                }
              />
            </div>
            {formState.useHookLabData ? (
              <OutputCard
                title="Hook Lab Prompt"
                items={[
                  output.hookLabPrompt,
                ]}
                copyText={output.hookLabPrompt}
              />
            ) : null}
            {rawOutput ? (
              <OutputCard title="Raw AI Output" items={[rawOutput]} copyText={rawOutput} />
            ) : null}
            <div className="grid gap-6 xl:grid-cols-2">
              <OutputCard
                title="Deep Dive Context"
                items={[
                  output.videoContext,
                  `Audience: ${output.targetAudience}`,
                  `Tone: ${output.tone}`,
                  `Depth: ${output.depthLevel}`,
                ]}
                copyText={[output.videoContext, output.targetAudience, output.tone, output.depthLevel].join("\n\n")}
              />
              <OutputCard
                title="Key Facts"
                items={output.keyFacts}
                copyText={output.keyFacts.join("\n")}
              />
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <OutputCard
                title="Questions + SEO"
                items={[...output.relatedQuestions, output.seoKeywords.join(", ")]}
                copyText={[...output.relatedQuestions, output.seoKeywords.join(", ")].join("\n")}
              />
              <OutputCard
                title="Article Structure"
                items={output.suggestedArticleStructure}
                copyText={output.suggestedArticleStructure.join("\n")}
              />
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <OutputCard
                title="Timed Script Structure"
                items={output.timedScript}
                copyText={output.timedScript.join("\n")}
              />
              <OutputCard
                title="Scene-by-Scene Visual Plan"
                items={output.visualPlan}
                copyText={output.visualPlan.join("\n")}
                action={
                  <button
                    type="button"
                    onClick={() => regenerateSection("visualPlan")}
                    disabled={regeneratingSection === "visualPlan"}
                    className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-4 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10 disabled:opacity-60"
                  >
                    {regeneratingSection === "visualPlan" ? "Regenerating" : "Regenerate"}
                  </button>
                }
              />
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              <OutputCard
                title="Leonardo AI Prompts"
                items={output.leonardoPrompts}
                copyText={output.leonardoPrompts.join("\n\n")}
              />
              <OutputCard
                title="Runway Prompts"
                items={output.runwayPrompts}
                copyText={output.runwayPrompts.join("\n\n")}
              />
            </div>
            <OutputCard
              title="Visual Production Plan"
              items={output.visualProductionPlan}
              copyText={output.visualProductionPlan.join("\n\n")}
            />
            <OutputCard
              title="Runway Animation Prompts"
              items={output.runwayAnimationPrompts}
              copyText={output.runwayAnimationPrompts.join("\n\n")}
            />
            {output.seriesParts.length > 0 ? (
              <div className="grid gap-6 xl:grid-cols-2">
                {output.seriesParts.map((part) => (
                  <OutputCard
                    key={part.partNumber}
                    title={part.partNumber}
                    items={[formatSeriesPart(part)]}
                    copyText={formatSeriesPart(part)}
                  />
                ))}
              </div>
            ) : null}
            {output.postingPlan.length > 0 ? (
              <OutputCard
                title="Posting Plan"
                items={output.postingPlan}
                copyText={output.postingPlan.join("\n")}
              />
            ) : null}
            {generateLeonardoImages ? (
              <section className="rounded-[1.25rem] border border-amber-300/20 bg-amber-400/10 p-5 shadow-[0_0_38px_rgba(245,158,11,0.12)] backdrop-blur-xl">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-amber-100">
                      <ImageIcon className="size-5" />
                      <p className="text-xs font-bold uppercase tracking-[0.22em]">Leonardo Images</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-amber-50/90">
                      Generate only the images you need. Each request may use Leonardo API credits.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={generateAllLeonardoImages}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-amber-100 px-5 text-xs font-bold uppercase tracking-[0.16em] text-amber-950 transition hover:bg-white"
                  >
                    Generate Images for All Prompts
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  {output.leonardoPrompts.map((prompt) => {
                    const state = leonardoStates[prompt] ?? { status: "idle", message: "", images: [] };

                    return (
                      <div key={prompt} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <p className="text-sm leading-6 text-zinc-200">{prompt}</p>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <CopyButton text={prompt} />
                            <button
                              type="button"
                              onClick={() => generateLeonardoImage(prompt)}
                              disabled={state.status === "loading"}
                              className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/15 px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition hover:border-amber-200/70 hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {state.status === "loading" ? "Generating" : "Generate Image"}
                            </button>
                          </div>
                        </div>
                        {state.message ? (
                          <p className={`mt-3 text-xs leading-5 ${state.status === "error" ? "text-rose-200" : "text-amber-100"}`}>
                            {state.message}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Object.values(leonardoStates).flatMap((state) => state.images).map((image) => (
                    <div key={image.url} className="overflow-hidden rounded-2xl border border-white/10 bg-black/45">
                      <a href={image.url} target="_blank" rel="noreferrer" className="block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.url} alt="" className="aspect-video w-full object-cover" />
                      </a>
                      <div className="space-y-3 p-4">
                        <p className="line-clamp-3 text-xs leading-5 text-zinc-300">{image.prompt}</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSelectedImage(image.url)}
                            className={`inline-flex min-h-9 items-center rounded-full px-3 text-[10px] font-bold uppercase tracking-[0.14em] ${
                              selectedImageUrls.includes(image.url)
                                ? "bg-emerald-200 text-emerald-950"
                                : "border border-white/15 text-white"
                            }`}
                          >
                            {selectedImageUrls.includes(image.url) ? "Saved" : "Save to Manager"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setThumbnailCandidate(image.url);
                              if (!selectedImageUrls.includes(image.url)) {
                                setSelectedImageUrls((current) => [...current, image.url]);
                              }
                            }}
                            className={`inline-flex min-h-9 items-center rounded-full px-3 text-[10px] font-bold uppercase tracking-[0.14em] ${
                              thumbnailCandidate === image.url
                                ? "bg-violet-200 text-violet-950"
                                : "border border-white/15 text-white"
                            }`}
                          >
                            {thumbnailCandidate === image.url ? "Thumbnail" : "Mark Thumbnail"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            <div className="grid gap-6 xl:grid-cols-3">
              <OutputCard title="Caption" items={[output.caption]} copyText={output.caption} />
              <OutputCard title="Hashtags" items={[output.hashtags.join(" ")]} copyText={output.hashtags.join(" ")} />
              <SelectableOutputCard
                title="Thumbnail Text Ideas"
                items={output.thumbnailText}
                selected={selectedThumbnailText}
                onSelect={setSelectedThumbnailText}
                onClear={() => setSelectedThumbnailText("")}
                copyText={output.thumbnailText.join("\n")}
              />
            </div>
          </>
        ) : (
          <div className="flex min-h-[28rem] items-center justify-center rounded-[1.5rem] border border-dashed border-white/12 bg-black/35 p-8 text-center backdrop-blur">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-200">Output bay</p>
              <h3 className="mt-4 font-display text-2xl font-bold uppercase tracking-[0.14em] text-white">
                Generate a private content draft
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-zinc-300">
                Fill out the generator on the left and this panel will build titles, hooks, prompts, captions, and a scene plan tailored to your next Vanta Orbit Media video.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

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

function readGenerationHistory() {
  if (typeof window === "undefined") return [];

  try {
    const saved = window.localStorage.getItem(VIDEO_IDEAS_HISTORY_KEY);
    return saved ? (JSON.parse(saved) as SavedGeneration[]) : [];
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
- leonardoPrompts: highly detailed prompts for image generation
- runwayPrompts: prompts for animating scenes into video
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

  return {
    ...fallbackOutput,
    titles,
    hooks,
    description: ideas.captions[0] || fallbackOutput.description,
    videoContext: ideas.deepDiveContext || fallbackOutput.videoContext,
    keyFacts: ideas.keyFacts.length > 0 ? ideas.keyFacts : fallbackOutput.keyFacts,
    category: state.topic,
    contentType: state.platform === "YouTube Longform" || state.length === "1-3 min" ? "long" : "short",
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
    timedScript: ideas.timedScriptStructure.length > 0 ? ideas.timedScriptStructure.map((item) =>
      `${item.time} - ${item.section}: ${item.voiceover} Visual: ${item.visual}`,
    ) : fallbackOutput.timedScript,
    visualPlan: ideas.sceneBySceneVisualPlan.length > 0 ? ideas.sceneBySceneVisualPlan.map((item) =>
      `${item.scene} - ${item.description} Camera: ${item.camera}. Motion: ${item.motion}.`,
    ) : fallbackOutput.visualPlan,
    leonardoPrompts: ideas.leonardoPrompts.length > 0 ? ideas.leonardoPrompts : fallbackOutput.leonardoPrompts,
    runwayPrompts: ideas.runwayPrompts.length > 0 ? ideas.runwayPrompts : fallbackOutput.runwayPrompts,
    caption: ideas.captions[0] || fallbackOutput.caption,
    hashtags: ideas.hashtags.length > 0 ? ideas.hashtags : fallbackOutput.hashtags,
    thumbnailText: ideas.thumbnailTextIdeas.length > 0 ? ideas.thumbnailTextIdeas : fallbackOutput.thumbnailText,
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
  const platformTone =
    state.platform === "YouTube Longform" ? "expanded documentary style" : "fast vertical storytelling";
  const ctaLine =
    state.ctaStyle === "soft follow"
      ? "Follow Vanta Orbit Media for more cosmic stories."
      : state.ctaStyle === "dramatic cliffhanger"
        ? "And this is only the beginning."
        : state.ctaStyle === "part 2 tease"
          ? "Part 2 goes even deeper."
          : "";

  return {
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
    timedScript: buildTimedStructure(state.length, state.topic, state.ctaStyle),
    visualPlan: [
      `Scene 1 - Cold open on ${topic} with a ${state.mood} nebula-lit reveal frame.`,
      `Scene 2 - Overlay key science phrase and animate a clean orbital or environmental diagram.`,
      `Scene 3 - Punch into the core fact with documentary-style closeups and parallax motion.`,
      `Scene 4 - Show scale, danger, or wonder with a cinematic space vista tied to ${topic}.`,
      `Scene 5 - Resolve with a branded end beat built for ${state.platform}.`,
    ],
    leonardoPrompts: [
      `${topic}, deep space documentary still, ${state.mood} lighting, premium sci-fi realism, nebula glow, sharp planetary detail, ultra cinematic composition, high contrast, no text`,
      `${topic} macro cosmic environment, silver highlights, black background, violet accents, realistic volumetric light, polished premium science media aesthetic, no watermark`,
      `${topic} vertical key art for ${state.platform}, ${platformTone}, dramatic lensing, atmospheric particles, premium documentary style, no text overlay`,
    ],
    runwayPrompts: [
      `Create a ${state.length} ${state.platform} video about ${topic} with ${state.mood} pacing, slow cinematic camera drift, premium space documentary look, readable text moments, strong opening hook, clean branded ending.`,
      `Animate ${topic} with layered depth, orbital motion, subtle particles, and high-contrast cosmic lighting. Keep timing optimized for ${state.platform} and maintain a polished science-media tone.`,
      `Use a dark cinematic grade, silver-white typography, and restrained purple glow accents. Emphasize clarity, scale, and emotional wonder around ${topic}.`,
    ],
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
          <p key={item}>{item}</p>
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
    setFormState(saved.formState);
    setOutput(saved.output);
    setSelectedImageUrls(saved.selectedImageUrls);
    setThumbnailCandidate(saved.thumbnailCandidate);
    setSelectedTitle(saved.output.titles[0] ?? "");
    setSelectedHook(saved.output.hooks[0] ?? "");
    setSelectedThumbnailText(saved.output.thumbnailText[0] ?? "");
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

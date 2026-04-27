"use client";

import Image from "next/image";
import { Check, ChevronDown, Copy, FileJson, Sparkles, TriangleAlert, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  articles,
  contentTopics,
  extractYouTubeId,
  formatTopicLabel,
  getYouTubeThumbnails,
  videos,
  type ContentStatus,
  type ContentTopic,
  type VideoType,
} from "@/lib/content";

type VideoManagerState = {
  id: string;
  slug: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  title: string;
  focusObject: string;
  selectedHook: string;
  selectedThumbnailText: string;
  titleIdeas: string;
  hookIdeas: string;
  thumbnailTextIdeas: string;
  date: string;
  type: VideoType;
  topic: ContentTopic;
  description: string;
  youtubeUrl: string;
  featured: boolean;
  tags: string;
  series: string;
  relatedArticleSlug: string;
  deepDiveTitle: string;
  deepDiveContent: string;
  deepDiveMetaDescription: string;
  deepDivePrompt: string;
  thumbnail: string;
  videoContext: string;
  keyFacts: string;
  targetAudience: string;
  tone: string;
  depthLevel: string;
  suggestedArticleStructure: string;
  sourceNotes: string;
  relatedQuestions: string;
  seoKeywords: string;
  generatedImageUrls: string;
};

type GeneratedVideoJson = {
  id: string;
  slug: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  title: string;
  focusObject: string;
  selectedHook: string;
  selectedThumbnailText: string;
  titleIdeas: string[];
  hookIdeas: string[];
  thumbnailTextIdeas: string[];
  description: string;
  videoUrl: string;
  publishedDate: string;
  contentType: VideoType;
  category: ContentTopic;
  videoId: string;
  thumbnail: string;
  featured: boolean;
  tags: string[];
  series: string;
  relatedArticleSlug: string;
  deepDiveTitle: string;
  deepDiveContent: string;
  deepDiveMetaDescription: string;
  deepDiveAiPrompt: string;
  videoContext: string;
  keyFacts: string[];
  targetAudience: string;
  tone: string;
  depthLevel: string;
  suggestedArticleStructure: string[];
  sourceNotes: string;
  relatedQuestions: string[];
  seoKeywords: string[];
  generatedImageUrls: string[];
};

type GeneratedArticleJson = {
  slug: string;
  title: string;
  date: string;
  content: string;
  metaDescription: string;
  relatedVideoId: string;
};

type GeneratedPreview = {
  video: GeneratedVideoJson;
  article: GeneratedArticleJson | null;
};

const initialState: VideoManagerState = {
  id: "",
  slug: "",
  status: "draft",
  createdAt: "",
  updatedAt: "",
  title: "",
  focusObject: "",
  selectedHook: "",
  selectedThumbnailText: "",
  titleIdeas: "",
  hookIdeas: "",
  thumbnailTextIdeas: "",
  date: "",
  type: "short",
  topic: "moon",
  description: "",
  youtubeUrl: "",
  featured: false,
  tags: "",
  series: "",
  relatedArticleSlug: "",
  deepDiveTitle: "",
  deepDiveContent: "",
  deepDiveMetaDescription: "",
  deepDivePrompt: "",
  thumbnail: "",
  videoContext: "",
  keyFacts: "",
  targetAudience: "",
  tone: "",
  depthLevel: "",
  suggestedArticleStructure: "",
  sourceNotes: "",
  relatedQuestions: "",
  seoKeywords: "",
  generatedImageUrls: "",
};

const VIDEO_MANAGER_DRAFT_KEY = "vanta-orbit-video-manager-draft";

type SavedVideoIdea = Partial<{
  id: string;
  slug: string;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
  title: string;
  focusObject: string;
  selectedHook: string;
  selectedThumbnailText: string;
  titleIdeas: string[];
  hookIdeas: string[];
  thumbnailTextIdeas: string[];
  description: string;
  videoUrl: string;
  youtubeUrl: string;
  publishedDate: string;
  date: string;
  videoContext: string;
  keyFacts: string[];
  category: ContentTopic;
  contentType: VideoType;
  targetAudience: string;
  tone: string;
  depthLevel: string;
  suggestedArticleStructure: string[];
  sourceNotes: string;
  relatedQuestions: string[];
  seoKeywords: string[];
  tags: string[];
  series: string;
  featured: boolean;
  relatedArticleSlug: string;
  generatedImageUrls: string[];
  thumbnail: string;
  deepDiveTitle: string;
  deepDiveContent: string;
  deepDiveMetaDescription: string;
  deepDiveAiPrompt: string;
}>;

function readSavedDraft(): SavedVideoIdea | null {
  if (typeof window === "undefined") return null;

  const savedDraft = window.localStorage.getItem(VIDEO_MANAGER_DRAFT_KEY);
  if (!savedDraft) return null;

  try {
    return JSON.parse(savedDraft) as SavedVideoIdea;
  } catch {
    window.localStorage.removeItem(VIDEO_MANAGER_DRAFT_KEY);
    return null;
  }
}

function createInitialStateFromDraft(draft: SavedVideoIdea | null): VideoManagerState {
  if (!draft) return initialState;

  return {
    ...initialState,
    id: draft.id ?? initialState.id,
    slug: draft.slug ?? initialState.slug,
    status: draft.status ?? initialState.status,
    createdAt: draft.createdAt ?? initialState.createdAt,
    updatedAt: draft.updatedAt ?? initialState.updatedAt,
    title: draft.title ?? initialState.title,
    focusObject: draft.focusObject ?? initialState.focusObject,
    selectedHook: draft.selectedHook ?? initialState.selectedHook,
    selectedThumbnailText: draft.selectedThumbnailText ?? initialState.selectedThumbnailText,
    titleIdeas: Array.isArray(draft.titleIdeas) ? draft.titleIdeas.join("\n") : initialState.titleIdeas,
    hookIdeas: Array.isArray(draft.hookIdeas) ? draft.hookIdeas.join("\n") : initialState.hookIdeas,
    thumbnailTextIdeas: Array.isArray(draft.thumbnailTextIdeas)
      ? draft.thumbnailTextIdeas.join("\n")
      : initialState.thumbnailTextIdeas,
    description: draft.description ?? initialState.description,
    youtubeUrl: draft.videoUrl ?? draft.youtubeUrl ?? initialState.youtubeUrl,
    date: draft.publishedDate ?? draft.date ?? initialState.date,
    topic: draft.category ?? initialState.topic,
    type: draft.contentType ?? initialState.type,
    videoContext: draft.videoContext ?? initialState.videoContext,
    keyFacts: Array.isArray(draft.keyFacts) ? draft.keyFacts.join("\n") : initialState.keyFacts,
    targetAudience: draft.targetAudience ?? initialState.targetAudience,
    tone: draft.tone ?? initialState.tone,
    depthLevel: draft.depthLevel ?? initialState.depthLevel,
    suggestedArticleStructure: Array.isArray(draft.suggestedArticleStructure)
      ? draft.suggestedArticleStructure.join("\n")
      : initialState.suggestedArticleStructure,
    relatedQuestions: Array.isArray(draft.relatedQuestions)
      ? draft.relatedQuestions.join("\n")
      : initialState.relatedQuestions,
    seoKeywords: Array.isArray(draft.seoKeywords) ? draft.seoKeywords.join(", ") : initialState.seoKeywords,
    tags: Array.isArray(draft.tags) ? draft.tags.join(", ") : initialState.tags,
    series: draft.series ?? initialState.series,
    featured: draft.featured ?? initialState.featured,
    relatedArticleSlug: draft.relatedArticleSlug ?? initialState.relatedArticleSlug,
    thumbnail: draft.thumbnail ?? initialState.thumbnail,
    deepDiveTitle: draft.deepDiveTitle ?? initialState.deepDiveTitle,
    deepDiveContent: draft.deepDiveContent ?? initialState.deepDiveContent,
    deepDiveMetaDescription: draft.deepDiveMetaDescription ?? initialState.deepDiveMetaDescription,
    deepDivePrompt: draft.deepDiveAiPrompt ?? initialState.deepDivePrompt,
    generatedImageUrls: Array.isArray(draft.generatedImageUrls)
      ? draft.generatedImageUrls.join("\n")
      : initialState.generatedImageUrls,
    sourceNotes: [
      draft.sourceNotes ?? initialState.sourceNotes,
      Array.isArray(draft.generatedImageUrls) && draft.generatedImageUrls.length > 0
        ? `Generated image URLs:\n${draft.generatedImageUrls.join("\n")}`
        : "",
    ].filter(Boolean).join("\n\n"),
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function parseList(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function formatList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function buildVideoId(title: string, date: string) {
  const slug = slugify(title) || "untitled-video";
  const compactDate = date.replace(/-/g, "") || "draft";
  return `${slug}-${compactDate}`;
}

function buildPromptInputData(state: VideoManagerState) {
  const keyFacts = parseList(state.keyFacts);

  return `Title: ${state.title.trim()}
Focus: ${state.focusObject.trim()}
Hook: ${state.selectedHook.trim()}
Description: ${state.description.trim()}
Category: ${formatTopicLabel(state.topic)}

Context:
${state.videoContext.trim()}

Key Facts:
${keyFacts.length > 0 ? formatList(keyFacts) : ""}`;
}

function shortFormDeepDivePrompt(state: VideoManagerState) {
  return `Write a deep dive article based on a short-form video.

STYLE:
- Cinematic, slightly eerie, awe-inspiring
- Simple, clear, beginner-friendly
- Engaging, not academic
- Feels like a YouTube video expanded into an article
- Avoid Wikipedia or textbook tone

STRUCTURE:
- Hook-style intro (2-3 short lines max)
- Use 3-5 short section headings (##) to break up content
- 4-6 short sections with clear headings
- Each section = 2-5 short sentences
- Keep paragraphs short and mobile-friendly
- End with a strong, memorable closing line

CONTENT RULES:
- Explain concepts simply (no jargon overload)
- Use comparisons to make scale understandable
- Keep it engaging, not lecture-style
- Avoid long walls of text
- No "Quick Summary", no formal academic sections
- No bullet-point spam
- Do not output instruction phrases like "Answer this simply", "Explain this", "In this section", or "Write about"
- Only output finished article content
- If using related questions, answer them naturally or omit them
- Do not paste question prompts into the final content unless written as a proper FAQ section

LENGTH:
- 400-800 words maximum

TONE:
- Curious, slightly dramatic, but grounded in real science
- Designed for social media audiences

INPUT DATA:
${buildPromptInputData(state)}

GOAL:
Make the reader feel:
"That's insane... I didn't know that..."

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "deepDiveTitle": "",
  "deepDiveMetaDescription": "",
  "deepDiveContent": ""
}`;
}

function longFormDeepDivePrompt(state: VideoManagerState) {
  return `Write a long-form deep dive article based on a space/science video.

STYLE:
- Cinematic, immersive, and awe-inspiring
- Simple and understandable, not academic
- Feels like a documentary script turned into an article
- Engaging from start to finish
- Avoid Wikipedia or textbook tone

STRUCTURE:
- Strong hook intro that builds curiosity immediately
- Clear narrative flow, not random disconnected sections
- Use 6-10 meaningful section headings written as Markdown h2 headings with ##, for example: ## The Moon's Slow Drift
- Each section should build on the previous one
- Include explanation, context, scale, implications, and why it matters
- End with a powerful closing reflection

CONTENT RULES:
- Go deeper than a short-form explanation
- Explain the "why" and "how", not just the "what"
- Use comparisons to explain scale
- Avoid jargon overload
- Avoid bullet-point spam
- Avoid long walls of text
- Keep paragraphs readable on mobile
- Do not output instruction phrases like "Answer this simply", "Explain this", "In this section", or "Write about"
- Only output finished article content
- If using related questions, answer them naturally or omit them
- Do not paste question prompts into the final content unless written as a proper FAQ section

LENGTH:
- 1200-2500 words

TONE:
- Curious, cinematic, slightly dramatic
- Grounded in real science
- Designed to feel like a YouTube documentary

INPUT DATA:
${buildPromptInputData(state)}

GOAL:
Make the reader feel:
"This is bigger than I thought..."

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "deepDiveTitle": "",
  "deepDiveMetaDescription": "",
  "deepDiveContent": ""
}`;
}

function getDeepDivePromptMode(type: VideoType) {
  return type === "long" ? "long" : "short";
}

function buildDeepDivePrompt(state: VideoManagerState) {
  // TODO: Move prompt construction server-side if these internal workflows
  // should not be visible in client-side admin bundles.
  return getDeepDivePromptMode(state.type) === "long"
    ? longFormDeepDivePrompt(state)
    : shortFormDeepDivePrompt(state);
}

function buildDeepDiveDraft(state: VideoManagerState) {
  const topicLabel = formatTopicLabel(state.topic);
  const subject = state.focusObject.trim() || state.title.trim() || topicLabel;
  const title = state.deepDiveTitle.trim() || `${subject}: The deeper story behind the video`;
  const description = state.description.trim() || `${subject} has a bigger story than a short video can hold.`;
  const keyFacts = parseList(state.keyFacts);
  const questions = parseList(state.relatedQuestions);
  const content = [
    `## Why this feels bigger than it looks`,
    state.videoContext.trim() || `${description} The deep dive should slow the idea down and make the science feel vivid without turning it into a textbook.`,
    `## The simple version`,
    keyFacts.length > 0
      ? formatList(keyFacts.slice(0, 6))
      : "- Add verified facts, real numbers, and mission/source details before publishing.",
    questions.length > 0
      ? `## Questions viewers may still have\n${questions.slice(0, 4).map((question) => `### ${question}\nThe answer depends on the real mechanism behind the video: scale, motion, time, and the evidence scientists can actually measure. Keep the explanation grounded, visual, and easy to follow.`).join("\n\n")}`
      : `## What viewers should remember\nThe bigger story is that ${topicLabel.toLowerCase()} is not just a backdrop. It is a system of forces, distances, and time scales that can make a simple video idea feel much larger than it first appears.`,
  ].join("\n\n");

  return {
    title,
    content,
    metaDescription: description,
    relatedArticleSlug: slugify(state.relatedArticleSlug.trim() || title),
    prompt: buildDeepDivePrompt(state),
  };
}

function CopyButton({ text, label = "Copy JSON" }: { text: string; label?: string }) {
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
      {copied ? "Copied" : label}
    </button>
  );
}

function JsonBlock({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <section className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_38px_rgba(124,58,237,0.16)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-display text-lg font-bold uppercase tracking-[0.18em] text-white">
          {title}
        </h3>
        <CopyButton text={value} />
      </div>
      <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/8 bg-black/40 p-4 text-xs leading-6 text-zinc-200">
        <code>{value}</code>
      </pre>
    </section>
  );
}

export default function AdminVideoManager({ aiModels }: { aiModels: string[] }) {
  const [loadedDraft, setLoadedDraft] = useState(false);
  const [formState, setFormState] = useState<VideoManagerState>(initialState);
  const [errors, setErrors] = useState<string[]>([]);
  const [generated, setGenerated] = useState<GeneratedPreview | null>(null);
  const [aiContextOpen, setAiContextOpen] = useState(false);
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [deepDiveError, setDeepDiveError] = useState("");
  const [selectedModel, setSelectedModel] = useState(aiModels[0] ?? "gpt-4.1-mini");
  const [savingAction, setSavingAction] = useState<ContentStatus | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const restoreDraft = window.setTimeout(() => {
      const savedDraft = readSavedDraft();
      if (!savedDraft) return;

      setFormState(createInitialStateFromDraft(savedDraft));
      setAiContextOpen(true);
      setLoadedDraft(true);
    }, 0);

    return () => window.clearTimeout(restoreDraft);
  }, []);

  const knownArticleSlugs = useMemo(() => new Set(articles.map((article) => article.slug)), []);
  const existingFeaturedVideos = useMemo(() => videos.filter((video) => video.featured), []);
  const videoId = useMemo(() => extractYouTubeId(formState.youtubeUrl), [formState.youtubeUrl]);
  const thumbnailOptions = useMemo(() => getYouTubeThumbnails(videoId), [videoId]);
  const parsedTags = useMemo(() => parseTags(formState.tags), [formState.tags]);
  const parsedKeyFacts = useMemo(() => parseList(formState.keyFacts), [formState.keyFacts]);
  const parsedArticleStructure = useMemo(
    () => parseList(formState.suggestedArticleStructure),
    [formState.suggestedArticleStructure],
  );
  const parsedRelatedQuestions = useMemo(() => parseList(formState.relatedQuestions), [formState.relatedQuestions]);
  const parsedSeoKeywords = useMemo(() => parseList(formState.seoKeywords), [formState.seoKeywords]);
  const deepDivePromptMode = getDeepDivePromptMode(formState.type);

  const missingMetadata = useMemo(() => {
    const missing: string[] = [];

    if (!formState.description.trim()) missing.push("description");
    if (!formState.videoContext.trim()) missing.push("video context");
    if (parsedKeyFacts.length < 5) missing.push("5+ key facts");
    if (!formState.targetAudience.trim()) missing.push("target audience");
    if (!formState.tone.trim()) missing.push("tone");
    if (!formState.depthLevel.trim()) missing.push("depth level");

    return missing;
  }, [
    formState.depthLevel,
    formState.description,
    formState.targetAudience,
    formState.tone,
    formState.videoContext,
    parsedKeyFacts.length,
  ]);

  const completenessTotal = 6;
  const completenessScore = completenessTotal - missingMetadata.length;

  const warnings = useMemo(() => {
    const nextWarnings: string[] = [];

    if (formState.relatedArticleSlug && !knownArticleSlugs.has(formState.relatedArticleSlug.trim())) {
      nextWarnings.push(
        `Related article slug "${formState.relatedArticleSlug.trim()}" does not exist in articles.json yet.`,
      );
    }

    if (formState.featured && existingFeaturedVideos.length > 0) {
      nextWarnings.push(
        `There ${existingFeaturedVideos.length === 1 ? "is" : "are"} already ${existingFeaturedVideos.length} featured video${existingFeaturedVideos.length === 1 ? "" : "s"} in videos.json. Keep only one if you want a clean featured state.`,
      );
    }

    if (parsedKeyFacts.length > 0 && parsedKeyFacts.length < 5) {
      nextWarnings.push("Key facts are flexible, but 5 or more will give the Deep Dive Generator better context.");
    }

    return nextWarnings;
  }, [
    existingFeaturedVideos.length,
    formState.featured,
    formState.relatedArticleSlug,
    knownArticleSlugs,
    parsedKeyFacts.length,
  ]);

  const updateField = <K extends keyof VideoManagerState>(key: K, value: VideoManagerState[K]) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const handleGenerateDeepDive = async () => {
    const draft = buildDeepDiveDraft(formState);
    setFormState((current) => ({
      ...current,
      deepDiveTitle: draft.title,
      deepDiveContent: draft.content,
      deepDiveMetaDescription: draft.metaDescription,
      relatedArticleSlug: current.relatedArticleSlug || draft.relatedArticleSlug,
      deepDivePrompt: draft.prompt,
    }));
    setAiContextOpen(true);
    setDeepDiveError("");
    setDeepDiveLoading(true);

    try {
      const response = await fetch("/api/generate-deep-dive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: draft.prompt,
          fallbackTitle: draft.title,
          fallbackContent: draft.content,
          model: selectedModel,
        }),
      });
      const result = (await response.json()) as {
        deepDive?: {
          deepDiveTitle?: string;
          deepDiveContent?: string;
          deepDiveMetaDescription?: string;
          metaDescription?: string;
          relatedArticleSlug?: string;
        };
        rawOutput?: string;
        validJSON?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Deep dive generation failed.");
      }

      if (result.validJSON === false || !result.deepDive) {
        throw new Error("The AI did not return valid deep dive JSON.");
      }

      setFormState((current) => ({
        ...current,
        deepDiveTitle: result.deepDive?.deepDiveTitle || current.deepDiveTitle || draft.title,
        deepDiveContent: result.deepDive?.deepDiveContent || draft.content,
        deepDiveMetaDescription: result.deepDive?.deepDiveMetaDescription || result.deepDive?.metaDescription || draft.metaDescription,
        relatedArticleSlug: current.relatedArticleSlug || result.deepDive?.relatedArticleSlug || draft.relatedArticleSlug,
        deepDivePrompt: draft.prompt,
      }));
    } catch (error) {
      setDeepDiveError(error instanceof Error ? error.message : "Deep dive generation failed.");
    } finally {
      setDeepDiveLoading(false);
    }
  };

  const buildPreview = (status: ContentStatus = formState.status) => {
    const now = new Date().toISOString();
    const generatedVideoId = formState.id.trim() || buildVideoId(formState.title, formState.date);
    const slug = formState.slug.trim() || slugify(formState.title);
    const trimmedDeepDiveTitle = formState.deepDiveTitle.trim();
    const trimmedDeepDiveContent = formState.deepDiveContent.trim();
    const relatedArticleSlug = formState.relatedArticleSlug.trim()
      || (trimmedDeepDiveTitle ? slugify(trimmedDeepDiveTitle) : "");
    const videoJson: GeneratedVideoJson = {
      id: generatedVideoId,
      slug,
      status,
      createdAt: formState.createdAt || now,
      updatedAt: now,
      title: formState.title.trim(),
      focusObject: formState.focusObject.trim(),
      selectedHook: formState.selectedHook.trim(),
      selectedThumbnailText: formState.selectedThumbnailText.trim(),
      titleIdeas: parseList(formState.titleIdeas),
      hookIdeas: parseList(formState.hookIdeas),
      thumbnailTextIdeas: parseList(formState.thumbnailTextIdeas),
      description: formState.description.trim(),
      videoUrl: formState.youtubeUrl.trim(),
      publishedDate: formState.date,
      contentType: formState.type,
      category: formState.topic,
      videoId,
      thumbnail: formState.thumbnail.trim() || thumbnailOptions[0] || "",
      featured: formState.featured,
      tags: parsedTags,
      series: formState.series.trim(),
      relatedArticleSlug,
      deepDiveTitle: trimmedDeepDiveTitle,
      deepDiveContent: trimmedDeepDiveContent,
      deepDiveMetaDescription: formState.deepDiveMetaDescription.trim(),
      deepDiveAiPrompt: formState.deepDivePrompt.trim(),
      videoContext: formState.videoContext.trim(),
      keyFacts: parsedKeyFacts,
      targetAudience: formState.targetAudience.trim(),
      tone: formState.tone.trim(),
      depthLevel: formState.depthLevel.trim(),
      suggestedArticleStructure: parsedArticleStructure,
      sourceNotes: formState.sourceNotes.trim(),
      relatedQuestions: parsedRelatedQuestions,
      seoKeywords: parsedSeoKeywords,
      generatedImageUrls: parseList(formState.generatedImageUrls),
    };

    const articleJson =
      trimmedDeepDiveTitle && trimmedDeepDiveContent
        ? {
            slug: relatedArticleSlug || slugify(trimmedDeepDiveTitle),
            title: trimmedDeepDiveTitle,
            date: formState.date,
            content: trimmedDeepDiveContent,
            metaDescription: formState.deepDiveMetaDescription.trim(),
            relatedVideoId: generatedVideoId,
          }
        : null;

    return { video: videoJson, article: articleJson };
  };

  const validateRequiredFields = (status: ContentStatus) => {
    const nextErrors: string[] = [];

    if (!formState.title.trim()) nextErrors.push("Title is required.");
    if (!formState.date) nextErrors.push("Published date is required.");
    if (!formState.description.trim()) nextErrors.push("Description is required.");
    if (!formState.youtubeUrl.trim()) nextErrors.push("YouTube URL is required.");
    if (!formState.type) nextErrors.push("Content type is required.");
    if (!formState.topic) nextErrors.push("Category is required.");
    if (status === "published" && !(formState.thumbnail.trim() || thumbnailOptions[0])) {
      nextErrors.push("Thumbnail is required before publishing.");
    }
    if (!videoId) nextErrors.push("Enter a valid YouTube URL so a video ID can be extracted.");

    return nextErrors;
  };

  const handleSubmit = () => {
    const nextErrors = validateRequiredFields(formState.status);

    setErrors(nextErrors);

    if (nextErrors.length > 0 || !videoId) {
      setGenerated(null);
      return;
    }

    setGenerated(buildPreview(formState.status));
  };

  const handleSave = async (status: ContentStatus) => {
    const nextErrors = validateRequiredFields(status);
    setErrors(nextErrors);
    setSaveError("");
    setSaveMessage("");

    if (nextErrors.length > 0 || !videoId) {
      setGenerated(null);
      return;
    }

    const preview = buildPreview(status);
    setGenerated(preview);
    setSavingAction(status);

    try {
      const response = await fetch(status === "published" ? "/admin/api/videos/publish" : "/admin/api/videos/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preview.video),
      });
      const responseText = await response.text();
      let result: {
        video?: {
          id?: string;
          slug?: string;
          status?: ContentStatus;
          createdAt?: string;
          updatedAt?: string;
          relatedArticleSlug?: string;
          supabaseId?: string;
        };
        storage?: "supabase+json" | "supabase" | "json";
        warning?: string;
        errors?: string[];
        error?: string;
      };

      try {
        result = responseText
          ? JSON.parse(responseText)
          : { error: "Save API returned an empty response." };
      } catch {
        result = { error: responseText || "Save API returned a non-JSON response." };
      }

      if (!response.ok || !result.video) {
        throw new Error(result.errors?.join(" ") || result.error || "Save failed.");
      }

      setFormState((current) => ({
        ...current,
        id: result.video?.id ?? preview.video.id,
        slug: result.video?.slug ?? preview.video.slug,
        status: result.video?.status ?? status,
        createdAt: result.video?.createdAt ?? preview.video.createdAt,
        updatedAt: result.video?.updatedAt ?? preview.video.updatedAt,
        relatedArticleSlug: result.video?.relatedArticleSlug ?? current.relatedArticleSlug,
      }));
      const storageLabel = result.storage === "supabase+json"
        ? "Supabase and the local JSON mirror"
        : result.storage === "supabase"
          ? "Supabase"
          : "the local JSON fallback";
      const baseMessage = status === "published"
        ? `Published to ${storageLabel}. Public pages only use published entries.`
        : `Draft saved to ${storageLabel}. It stays hidden from public pages.`;
      setSaveMessage(result.warning ? `${baseMessage} ${result.warning}` : baseMessage);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSavingAction(null);
    }
  };

  const videoJsonText = generated ? JSON.stringify(generated.video, null, 2) : "";
  const articleJsonText = generated?.article ? JSON.stringify(generated.article, null, 2) : "";

  return (
    <div className="grid gap-8 xl:grid-cols-[24rem_minmax(0,1fr)]">
      <section className="rounded-[1.5rem] border border-white/10 bg-black/55 p-6 shadow-[0_0_42px_rgba(124,58,237,0.18)] backdrop-blur-xl">
        <div className="flex items-center gap-3 text-violet-200">
          <FileJson className="size-5" />
          <p className="text-xs font-bold uppercase tracking-[0.24em]">JSON Builder</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl font-bold uppercase tracking-[0.14em] text-white">
            Prepare a new video entry
          </h2>
          <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
            formState.status === "published"
              ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
              : "border-amber-300/30 bg-amber-400/10 text-amber-100"
          }`}>
            {formState.status === "published" ? "Published" : "Draft"}
          </span>
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          Edit the metadata, generate a deep dive, then save a hidden draft or publish directly to the current video data source.
        </p>

        {loadedDraft ? (
          <div className="mt-5 rounded-2xl border border-violet-300/25 bg-violet-400/10 px-4 py-3 text-sm leading-6 text-violet-100">
            Saved generator idea loaded. Edit it here, add the real video URL when ready, then save a draft or publish.
          </div>
        ) : null}

        <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
              Metadata completeness
            </p>
            <p className="text-sm font-semibold text-white">
              {completenessScore}/{completenessTotal}
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-violet-200 transition-all"
              style={{ width: `${(completenessScore / completenessTotal) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-xs leading-5 text-zinc-400">
            {missingMetadata.length > 0
              ? `Missing: ${missingMetadata.join(", ")}.`
              : "Ready for a strong deep dive prompt."}
          </p>
        </div>

        <div className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Title
            </span>
            <input
              value={formState.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
            />
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

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                Selected Hook
              </span>
              <input
                value={formState.selectedHook}
                onChange={(event) => updateField("selectedHook", event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                Selected Thumbnail Text
              </span>
              <input
                value={formState.selectedThumbnailText}
                onChange={(event) => updateField("selectedThumbnailText", event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                All Title Ideas
              </span>
              <textarea
                value={formState.titleIdeas}
                onChange={(event) => updateField("titleIdeas", event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-violet-200/70"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                All Hook Ideas
              </span>
              <textarea
                value={formState.hookIdeas}
                onChange={(event) => updateField("hookIdeas", event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-violet-200/70"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                All Thumbnail Text Ideas
              </span>
              <textarea
                value={formState.thumbnailTextIdeas}
                onChange={(event) => updateField("thumbnailTextIdeas", event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-violet-200/70"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Published date
            </span>
            <input
              type="date"
              value={formState.date}
              onChange={(event) => updateField("date", event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                Content type
              </span>
              <select
                value={formState.type}
                onChange={(event) => updateField("type", event.target.value as VideoType)}
                className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
              >
                <option value="short" className="bg-[#08060f]">
                  Short
                </option>
                <option value="long" className="bg-[#08060f]">
                  Long
                </option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                Category
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
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Description
            </span>
            <textarea
              value={formState.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-violet-200/70"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Video URL
            </span>
            <input
              value={formState.youtubeUrl}
              onChange={(event) => updateField("youtubeUrl", event.target.value)}
              placeholder="https://youtu.be/..."
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
            />
            <p className="mt-2 text-xs leading-5 text-zinc-400">
              Extracted video ID: <span className="text-zinc-200">{videoId || "Not detected yet"}</span>
            </p>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Thumbnail
            </span>
            <input
              value={formState.thumbnail}
              onChange={(event) => updateField("thumbnail", event.target.value)}
              placeholder={thumbnailOptions[0] || "/images/thumbnails/placeholder.jpg"}
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Tags
            </span>
            <input
              value={formState.tags}
              onChange={(event) => updateField("tags", event.target.value)}
              placeholder="moon, tides, orbital-mechanics"
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                Series
              </span>
              <input
                value={formState.series}
                onChange={(event) => updateField("series", event.target.value)}
                placeholder="Lunar Drift Files"
                className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                Related article slug
              </span>
              <input
                value={formState.relatedArticleSlug}
                onChange={(event) => updateField("relatedArticleSlug", event.target.value)}
                placeholder="why-the-moon-is-slowly-leaving-earth"
                className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <input
              type="checkbox"
              checked={formState.featured}
              onChange={(event) => updateField("featured", event.target.checked)}
              className="size-4 rounded border-white/20 bg-transparent text-violet-300 focus:ring-violet-300"
            />
            <span className="text-sm text-zinc-200">Mark as featured video</span>
          </label>
        </div>

        <div className="mt-8 rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-5">
          <button
            type="button"
            onClick={() => setAiContextOpen((current) => !current)}
            className="flex w-full items-center justify-between gap-4 text-left text-violet-200"
          >
            <span className="flex items-center gap-3">
              <WandSparkles className="size-4" />
              <span className="text-xs font-bold uppercase tracking-[0.24em]">AI / Deep Dive Context</span>
            </span>
            <ChevronDown className={`size-4 transition ${aiContextOpen ? "rotate-180" : ""}`} />
          </button>

          {aiContextOpen ? (
            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                  Video context
                </span>
                <textarea
                  value={formState.videoContext}
                  onChange={(event) => updateField("videoContext", event.target.value)}
                  rows={5}
                  className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-violet-200/70"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                  Key facts
                </span>
                <textarea
                  value={formState.keyFacts}
                  onChange={(event) => updateField("keyFacts", event.target.value)}
                  rows={7}
                  placeholder="One fact per line"
                  className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-violet-200/70"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                    Target audience
                  </span>
                  <input
                    value={formState.targetAudience}
                    onChange={(event) => updateField("targetAudience", event.target.value)}
                    className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                    Tone
                  </span>
                  <input
                    value={formState.tone}
                    onChange={(event) => updateField("tone", event.target.value)}
                    className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                    Depth level
                  </span>
                  <input
                    value={formState.depthLevel}
                    onChange={(event) => updateField("depthLevel", event.target.value)}
                    className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
                  />
                </label>
              </div>

            </div>
          ) : null}

          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Deep dive title
            </span>
            <input
              value={formState.deepDiveTitle}
              onChange={(event) => updateField("deepDiveTitle", event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
            />
          </label>

          <label className="mt-5 block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Deep dive meta description
            </span>
            <textarea
              value={formState.deepDiveMetaDescription}
              onChange={(event) => updateField("deepDiveMetaDescription", event.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-violet-200/70"
            />
          </label>

          <label className="mt-5 block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Deep dive content
            </span>
            <textarea
              value={formState.deepDiveContent}
              onChange={(event) => updateField("deepDiveContent", event.target.value)}
              rows={9}
              className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-violet-200/70"
            />
          </label>

          <label className="mt-5 block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Deep dive AI prompt
            </span>
            <textarea
              value={formState.deepDivePrompt}
              onChange={(event) => updateField("deepDivePrompt", event.target.value)}
              rows={10}
              className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 font-mono text-xs text-white outline-none transition focus:border-violet-200/70"
            />
          </label>

          <label className="mt-5 block">
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

          <button
            type="button"
            onClick={handleGenerateDeepDive}
            disabled={deepDiveLoading}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10"
          >
            {deepDiveLoading ? "Generating" : "Generate Deep Dive"}
          </button>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-violet-200">
            Using {deepDivePromptMode === "long" ? "long-form" : "short-form"} prompt
          </p>
          {deepDiveLoading ? (
            <p className="mt-3 text-xs leading-5 text-zinc-400">Generating through the secure server route. Long articles can take a moment.</p>
          ) : null}
          {deepDiveError ? (
            <p className="mt-3 rounded-2xl border border-amber-300/25 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
              {deepDiveError} Showing the local draft so development still works.
            </p>
          ) : null}
        </div>

        <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-200">Workflow actions</p>
          <div className="mt-4 grid gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/15 px-6 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10"
            >
              Generate Preview + JSON
            </button>
            <button
              type="button"
              onClick={() => handleSave("draft")}
              disabled={Boolean(savingAction)}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-amber-200/25 bg-amber-400/10 px-6 text-xs font-bold uppercase tracking-[0.16em] text-amber-50 transition hover:border-amber-100/70 hover:bg-amber-300/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingAction === "draft" ? "Saving Draft" : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={() => handleSave("published")}
              disabled={Boolean(savingAction)}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 text-sm font-bold uppercase tracking-[0.18em] text-black shadow-[0_0_32px_rgba(168,85,247,0.45)] transition hover:-translate-y-0.5 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingAction === "published" ? "Publishing" : "Publish Video"}
            </button>
          </div>
          {saveMessage ? (
            <p className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-3 text-xs leading-5 text-emerald-100">
              {saveMessage}
            </p>
          ) : null}
          {saveError ? (
            <p className="mt-4 rounded-2xl border border-rose-300/25 bg-rose-400/10 p-3 text-xs leading-5 text-rose-100">
              {saveError}
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-6">
        {errors.length > 0 ? (
          <div className="rounded-[1.25rem] border border-rose-400/25 bg-rose-400/10 p-5 text-sm leading-6 text-rose-100">
            <p className="text-xs font-bold uppercase tracking-[0.22em]">Fix these first</p>
            <ul className="mt-3 space-y-1">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {warnings.length > 0 ? (
          <div className="rounded-[1.25rem] border border-amber-300/25 bg-amber-400/10 p-5 text-sm leading-6 text-amber-100">
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-4" />
              <p className="text-xs font-bold uppercase tracking-[0.22em]">Warnings</p>
            </div>
            <ul className="mt-3 space-y-1">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {generated ? (
          <>
            <section className="rounded-[1.5rem] border border-white/10 bg-black/55 p-6 shadow-[0_0_42px_rgba(124,58,237,0.18)] backdrop-blur-xl">
              <div className="flex items-center gap-3 text-violet-200">
                <Sparkles className="size-5" />
                <p className="text-xs font-bold uppercase tracking-[0.24em]">Preview</p>
              </div>

              <div className="mt-5 grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/55">
                  <div className="relative aspect-video bg-black">
                    {generated.video.thumbnail ? (
                      <Image
                        src={generated.video.thumbnail}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover opacity-90"
                        sizes="20rem"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute left-4 top-4 rounded-full border border-violet-300/30 bg-black/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-100">
                      {formatTopicLabel(generated.video.category)}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                      {generated.video.contentType === "long" ? "Long" : "Short"} / {generated.video.publishedDate}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{generated.video.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-zinc-300">{generated.video.description}</p>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200">
                    Extracted assets
                  </p>
                  <p className="mt-4 text-sm text-zinc-300">
                    Video ID: <span className="text-white">{generated.video.videoId}</span>
                  </p>
                  <div className="mt-4 space-y-2 text-xs leading-6 text-zinc-300">
                    {thumbnailOptions.length > 0 ? (
                      thumbnailOptions.map((thumbnail) => (
                        <p key={thumbnail} className="break-all rounded-xl border border-white/8 bg-black/35 px-3 py-2">
                          {thumbnail}
                        </p>
                      ))
                    ) : (
                      <p>No valid thumbnail URLs yet. Add a valid YouTube URL first.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-2">
              <JsonBlock title="videos.json entry" value={videoJsonText} />
              {generated.article ? (
                <JsonBlock title="articles.json entry" value={articleJsonText} />
              ) : (
                <section className="rounded-[1.25rem] border border-dashed border-white/10 bg-black/35 p-6 text-sm leading-6 text-zinc-300">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-200">
                    articles.json entry
                  </p>
                  <p className="mt-4">
                    Add a deep dive title and content, or use Generate Deep Dive, and this panel will produce the matching article JSON.
                  </p>
                </section>
              )}
            </div>
            {formState.deepDivePrompt.trim() ? (
              <JsonBlock title="Deep dive AI prompt" value={formState.deepDivePrompt} />
            ) : null}
          </>
        ) : (
          <div className="flex min-h-[28rem] items-center justify-center rounded-[1.5rem] border border-dashed border-white/12 bg-black/35 p-8 text-center backdrop-blur">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-200">Preview bay</p>
              <h3 className="mt-4 font-display text-2xl font-bold uppercase tracking-[0.14em] text-white">
                Generate a preview before you paste
              </h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-zinc-300">
                Generate a preview to review the exact JSON, then save a hidden draft or publish it into the current video data file.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

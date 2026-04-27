"use client";

import { BarChart3, Check, Lightbulb, Save, Search, Sparkles, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import {
  calculateHookScore,
  contentTopics,
  formatTopicLabel,
  type ContentTopic,
  type HookPlatform,
  type VideoItem,
  type VideoType,
} from "@/lib/content";

type HookVideo = {
  id: string;
  title: string;
  hookText: string;
  topic: ContentTopic;
  contentType: VideoType;
  category: ContentTopic;
  publishedDate: string;
  views24h: number;
  views48h: number;
  views7d: number;
  rankingByViews: number;
  averageViewDuration: string;
  retentionPercent: number;
  likes: number;
  comments: number;
  shares: number;
  platform: HookPlatform;
  notes: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  tags: string[];
  featured: boolean;
  relatedArticleSlug: string;
};

type SaveState = {
  status: "idle" | "saving" | "saved" | "error";
  message: string;
};

type HookInsights = ReturnType<typeof buildInsights> & {
  analysisPrompt: string;
};

const HOOK_INSIGHTS_KEY = "vanta-orbit-hook-lab-insights";
const platforms: Array<"all" | HookPlatform> = ["all", "YouTube", "Facebook", "Instagram", "TikTok"];
const scoreSorts = [
  { value: "hookScore", label: "Hook score" },
  { value: "views24h", label: "24h views" },
  { value: "retentionPercent", label: "Retention" },
  { value: "comments", label: "Comments" },
  { value: "publishedDate", label: "Published date" },
] as const;

function toHookVideo(video: VideoItem): HookVideo {
  return {
    id: video.id,
    title: video.title,
    hookText: video.hookText || video.title,
    topic: video.topic,
    contentType: video.contentType,
    category: video.category,
    publishedDate: video.publishedDate,
    views24h: video.views24h,
    views48h: video.views48h,
    views7d: video.views7d,
    rankingByViews: video.rankingByViews,
    averageViewDuration: video.averageViewDuration,
    retentionPercent: video.retentionPercent,
    likes: video.likes,
    comments: video.comments,
    shares: video.shares,
    platform: video.platform,
    notes: video.notes,
    description: video.description,
    videoUrl: video.videoUrl,
    thumbnail: video.thumbnail,
    tags: video.tags,
    featured: video.featured,
    relatedArticleSlug: video.relatedArticleSlug,
  };
}

function hookScore(video: HookVideo) {
  return calculateHookScore(video);
}

function firstWords(value: string, count = 3) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, count)
    .join(" ");
}

function findTriggers(hook: string) {
  const lower = hook.toLowerCase();
  const triggers: Array<[string, string[]]> = [
    ["mystery", ["mystery", "unknown", "secret", "hidden", "strange"]],
    ["scale", ["bigger", "ancient", "massive", "tiny", "billions", "millions"]],
    ["fear", ["danger", "deadly", "killing", "threat", "storm"]],
    ["contradiction", ["shouldn't", "impossible", "but", "wrong", "not"]],
    ["urgency", ["now", "today", "right now", "just"]],
    ["curiosity gap", ["why", "what if", "nobody", "how", "truth"]],
  ];

  return triggers
    .filter(([, terms]) => terms.some((term) => lower.includes(term)))
    .map(([label]) => label);
}

function commonValues(values: string[], limit = 5) {
  const counts = new Map<string, number>();

  for (const value of values.map((item) => item.trim()).filter(Boolean)) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([value, count]) => `${value} (${count})`);
}

function buildInsights(videos: HookVideo[]) {
  const scored = videos
    .filter((video) => video.hookText.trim())
    .sort((left, right) => hookScore(right) - hookScore(left));
  const top = scored.slice(0, 6);
  const weak = scored.slice(-6).reverse();
  const topHooks = top.map((video) => video.hookText);
  const topTopics = commonValues(top.map((video) => formatTopicLabel(video.category)));
  const topOpenings = commonValues(topHooks.map((hook) => firstWords(hook)));
  const topTriggers = commonValues(topHooks.flatMap(findTriggers));
  const hookLengths = top.map((video) => video.hookText.split(/\s+/).filter(Boolean).length);
  const averageLength = hookLengths.length
    ? Math.round(hookLengths.reduce((sum, length) => sum + length, 0) / hookLengths.length)
    : 0;

  const winningPatterns = [
    topOpenings.length ? `Openings to test: ${topOpenings.join(", ")}.` : "Add hook text to detect winning openings.",
    topTriggers.length ? `Emotional triggers showing up: ${topTriggers.join(", ")}.` : "No strong trigger pattern yet.",
    topTopics.length ? `Best topic clusters: ${topTopics.join(", ")}.` : "No topic leader yet.",
    averageLength ? `Top hooks average around ${averageLength} words.` : "Hook length needs more data.",
  ];
  const avoidStyles = weak
    .filter((video) => hookScore(video) > 0)
    .map((video) => `${firstWords(video.hookText, 5)}... (score ${hookScore(video)})`)
    .slice(0, 4);
  const suggestedHooks = top.slice(0, 5).map((video) => {
    const trigger = findTriggers(video.hookText)[0] ?? "curiosity gap";
    return `What if ${formatTopicLabel(video.category).toLowerCase()} is hiding a ${trigger} most people miss?`;
  });

  return {
    topHooks,
    winningPatterns,
    phrasesThatWork: topOpenings,
    topicsThatPerformBest: topTopics,
    hookStylesToReuse: topTriggers,
    hookStylesToAvoid: avoidStyles.length ? avoidStyles : ["Hooks with unclear stakes, weak specificity, or no curiosity gap."],
    suggestedNewHooks: suggestedHooks.length ? suggestedHooks : ["What if the strangest part of this space story is the real science?"],
  };
}

function buildHookPerformanceData(videos: HookVideo[]) {
  return videos
    .filter((video) => video.hookText.trim())
    .sort((left, right) => hookScore(right) - hookScore(left))
    .map((video) => ({
      title: video.title,
      hookText: video.hookText,
      topic: video.topic,
      contentType: video.contentType,
      category: video.category,
      publishedDate: video.publishedDate,
      views24h: video.views24h,
      views48h: video.views48h,
      views7d: video.views7d,
      rankingByViews: video.rankingByViews,
      averageViewDuration: video.averageViewDuration,
      retentionPercent: video.retentionPercent,
      likes: video.likes,
      comments: video.comments,
      shares: video.shares,
      platform: video.platform,
      hookScore: hookScore(video),
      notes: video.notes,
    }));
}

function buildHookAnalysisPrompt(videos: HookVideo[]) {
  const hookPerformanceData = JSON.stringify(buildHookPerformanceData(videos), null, 2);

  return `You are analysing short-form video hook performance for a space education content brand.

Here is the performance data from published videos:

${hookPerformanceData}

Analyse the best-performing hooks and identify patterns.

Look for:
- opening words or phrases
- hook length
- emotional trigger
- curiosity gap
- topic category
- whether the hook uses fear, scale, mystery, contradiction, urgency, “right now”, or future consequences
- whether the hook is direct, cinematic, question-based, or statement-based
- relationship between hook style and performance metrics

Return:
1. Top 5 winning hook patterns
2. Top 5 weakest hook patterns
3. Phrases worth reusing
4. Phrases to avoid
5. Best topics by performance
6. Suggested hook templates
7. 10 new hook ideas based on the winning patterns

Rules:
- Do not copy old hooks exactly.
- Keep hooks short and scroll-stopping.
- Make them suitable for TikTok, Reels, YouTube Shorts, and Facebook Reels.
- Keep the tone cinematic, dramatic, educational, and clear.`;
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">{label}</span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-h-11 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-3 text-white outline-none transition focus:border-violet-200/70"
      />
    </label>
  );
}

export default function AdminHookLab({ videos, aiModels }: { videos: VideoItem[]; aiModels: string[] }) {
  const [items, setItems] = useState<HookVideo[]>(() => videos.map(toHookVideo));
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<"all" | HookPlatform>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | ContentTopic>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | VideoType>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<(typeof scoreSorts)[number]["value"]>("hookScore");
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [insights, setInsights] = useState<HookInsights | null>(null);
  const [analysisText, setAnalysisText] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [selectedModel, setSelectedModel] = useState(aiModels[0] ?? "gpt-4.1-mini");

  const filteredVideos = useMemo(() => {
    const query = search.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : Number.NEGATIVE_INFINITY;
    const toTime = dateTo ? new Date(dateTo).getTime() : Number.POSITIVE_INFINITY;

    return [...items]
      .filter((video) => {
        const haystack = `${video.title} ${video.hookText}`.toLowerCase();
        return query ? haystack.includes(query) : true;
      })
      .filter((video) => (platformFilter === "all" ? true : video.platform === platformFilter))
      .filter((video) => (categoryFilter === "all" ? true : video.category === categoryFilter))
      .filter((video) => (typeFilter === "all" ? true : video.contentType === typeFilter))
      .filter((video) => {
        const time = new Date(video.publishedDate).getTime();
        return time >= fromTime && time <= toTime;
      })
      .sort((left, right) => {
        if (sortBy === "publishedDate") {
          return new Date(right.publishedDate).getTime() - new Date(left.publishedDate).getTime();
        }
        const leftValue = sortBy === "hookScore" ? hookScore(left) : left[sortBy];
        const rightValue = sortBy === "hookScore" ? hookScore(right) : right[sortBy];
        return Number(rightValue) - Number(leftValue);
      });
  }, [categoryFilter, dateFrom, dateTo, items, platformFilter, search, sortBy, typeFilter]);

  const topPerformers = useMemo(
    () => [...items].filter((video) => hookScore(video) > 0).sort((left, right) => hookScore(right) - hookScore(left)).slice(0, 5),
    [items],
  );
  const weakHooks = useMemo(
    () => [...items].filter((video) => video.hookText.trim()).sort((left, right) => hookScore(left) - hookScore(right)).slice(0, 5),
    [items],
  );

  const updateVideo = <K extends keyof HookVideo>(id: string, key: K, value: HookVideo[K]) => {
    setItems((current) => current.map((video) => (video.id === id ? { ...video, [key]: value } : video)));
    setSaveStates((current) => ({ ...current, [id]: { status: "idle", message: "" } }));
  };

  const saveVideo = async (video: HookVideo) => {
    setSaveStates((current) => ({ ...current, [video.id]: { status: "saving", message: "Saving..." } }));

    const response = await fetch(`/admin/api/videos/${encodeURIComponent(video.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: video.title,
        description: video.description,
        videoUrl: video.videoUrl,
        publishedDate: video.publishedDate,
        contentType: video.contentType,
        category: video.category,
        tags: video.tags,
        featured: video.featured,
        thumbnail: video.thumbnail,
        relatedArticleSlug: video.relatedArticleSlug,
        hookText: video.hookText,
        views24h: video.views24h,
        views48h: video.views48h,
        views7d: video.views7d,
        rankingByViews: video.rankingByViews,
        averageViewDuration: video.averageViewDuration,
        retentionPercent: video.retentionPercent,
        likes: video.likes,
        comments: video.comments,
        shares: video.shares,
        platform: video.platform,
        notes: video.notes,
      }),
    });
    const result = (await response.json()) as { errors?: string[]; error?: string };

    setSaveStates((current) => ({
      ...current,
      [video.id]: response.ok
        ? { status: "saved", message: "Saved Hook Lab data." }
        : { status: "error", message: result.errors?.join(" ") || result.error || "Save failed." },
    }));
  };

  const generateInsights = async () => {
    const nextInsights = {
      ...buildInsights(items),
      analysisPrompt: buildHookAnalysisPrompt(items),
    };
    setInsights(nextInsights);
    window.localStorage.setItem(HOOK_INSIGHTS_KEY, JSON.stringify(nextInsights));
    setAnalysisText("");
    setAnalysisError("");
    setAnalysisLoading(true);

    try {
      const response = await fetch("/api/analyse-hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: nextInsights.analysisPrompt,
          fallbackInsights: nextInsights,
          model: selectedModel,
        }),
      });
      const result = (await response.json()) as { text?: string; error?: string };

      if (!response.ok) {
        throw new Error(result.error || "Hook analysis failed.");
      }

      setAnalysisText(result.text ?? "");
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Hook analysis failed.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/10 bg-black/55 p-6 shadow-[0_0_42px_rgba(124,58,237,0.18)] backdrop-blur-xl">
          <div className="flex items-center gap-3 text-violet-200">
            <BarChart3 className="size-5" />
            <p className="text-xs font-bold uppercase tracking-[0.24em]">Top Performing Hooks</p>
          </div>
          <div className="mt-5 space-y-3">
            {topPerformers.map((video) => (
              <div key={video.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-semibold text-white">{video.hookText || video.title}</p>
                  <span className="rounded-full bg-violet-200 px-3 py-1 text-xs font-bold text-black">{hookScore(video)}</span>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-zinc-400">
                  {video.views24h} views 24h / {video.retentionPercent}% retention / {formatTopicLabel(video.category)}
                </p>
              </div>
            ))}
            {topPerformers.length === 0 ? <p className="text-sm text-zinc-400">Add performance data to see winners.</p> : null}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-black/55 p-6 shadow-[0_0_42px_rgba(124,58,237,0.18)] backdrop-blur-xl">
          <div className="flex items-center gap-3 text-violet-200">
            <TriangleAlert className="size-5" />
            <p className="text-xs font-bold uppercase tracking-[0.24em]">Weak Hooks</p>
          </div>
          <div className="mt-5 space-y-3">
            {weakHooks.map((video) => (
              <div key={video.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-semibold text-white">{video.hookText || video.title}</p>
                  <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-zinc-200">{hookScore(video)}</span>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-zinc-400">
                  {video.views24h} views 24h / {video.retentionPercent}% retention / {formatTopicLabel(video.category)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-black/55 p-6 shadow-[0_0_42px_rgba(124,58,237,0.18)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3 text-violet-200">
              <Lightbulb className="size-5" />
              <p className="text-xs font-bold uppercase tracking-[0.24em]">Pattern Finder</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Generate reusable patterns from top hooks and feed them into the Video Ideas Generator.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Select
              label="AI model"
              value={selectedModel}
              onChange={setSelectedModel}
              options={aiModels.map((model) => ({ value: model, label: model }))}
            />
            <button
              type="button"
              onClick={generateInsights}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-bold uppercase tracking-[0.16em] text-black shadow-[0_0_28px_rgba(168,85,247,0.35)] transition hover:-translate-y-0.5 hover:bg-violet-100"
            >
              <Sparkles className="size-4" />
              {analysisLoading ? "Analysing" : "Generate Hook Insights"}
            </button>
          </div>
        </div>
        {analysisLoading ? (
          <p className="mt-4 text-xs leading-5 text-zinc-400">Analysing hooks through the secure server route. Give it a few seconds.</p>
        ) : null}
        {analysisError ? (
          <p className="mt-4 rounded-2xl border border-amber-300/25 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
            {analysisError} Showing local pattern detection for now.
          </p>
        ) : null}

        {insights ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <InsightList title="Winning patterns" items={insights.winningPatterns} />
            <InsightList title="Reuse" items={[...insights.phrasesThatWork, ...insights.hookStylesToReuse]} />
            <InsightList title="Suggested hooks" items={insights.suggestedNewHooks} />
          </div>
        ) : null}
        {insights ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200">
                Hook Lab Analysis Prompt
              </p>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(insights.analysisPrompt)}
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/15 px-4 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10"
              >
                Copy prompt
              </button>
            </div>
            <textarea
              readOnly
              value={insights.analysisPrompt}
              rows={14}
              className="mt-4 w-full rounded-2xl border border-white/12 bg-black/40 px-4 py-3 font-mono text-xs leading-5 text-zinc-200 outline-none"
            />
          </div>
        ) : null}
        {analysisText ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200">AI Hook Analysis</p>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{analysisText}</div>
          </div>
        ) : null}
      </section>

      <section className="rounded-[1.5rem] border border-white/10 bg-black/55 p-6 shadow-[0_0_42px_rgba(124,58,237,0.18)] backdrop-blur-xl">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_10rem_12rem_10rem_10rem_10rem_12rem]">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] pl-11 pr-4 text-white outline-none transition focus:border-violet-200/70"
              />
            </div>
          </label>
          <Select label="Platform" value={platformFilter} onChange={(value) => setPlatformFilter(value as "all" | HookPlatform)} options={platforms.map((value) => ({ value, label: value === "all" ? "All" : value }))} />
          <Select label="Category" value={categoryFilter} onChange={(value) => setCategoryFilter(value as "all" | ContentTopic)} options={[{ value: "all", label: "All" }, ...contentTopics.map((topic) => ({ value: topic.value, label: topic.label }))]} />
          <Select label="Type" value={typeFilter} onChange={(value) => setTypeFilter(value as "all" | VideoType)} options={[{ value: "all", label: "All" }, { value: "short", label: "Short" }, { value: "long", label: "Long" }]} />
          <DateInput label="From" value={dateFrom} onChange={setDateFrom} />
          <DateInput label="To" value={dateTo} onChange={setDateTo} />
          <Select label="Sort" value={sortBy} onChange={(value) => setSortBy(value as typeof sortBy)} options={scoreSorts.map((item) => ({ value: item.value, label: item.label }))} />
        </div>
      </section>

      <section className="grid gap-6">
        {filteredVideos.map((video) => {
          const saveState = saveStates[video.id] ?? { status: "idle", message: "" };

          return (
            <article key={video.id} className="rounded-[1.5rem] border border-white/10 bg-black/55 p-5 shadow-[0_0_42px_rgba(124,58,237,0.16)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200">
                    {video.platform} / {video.contentType === "long" ? "Long" : "Short"} / {formatTopicLabel(video.category)}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{video.title}</h2>
                </div>
                <div className="rounded-2xl border border-violet-200/25 bg-violet-400/10 px-5 py-3 text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-100">Hook Score</p>
                  <p className="text-3xl font-bold text-white">{hookScore(video)}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">Hook text</span>
                  <textarea
                    value={video.hookText}
                    onChange={(event) => updateVideo(video.id, "hookText", event.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-violet-200/70"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">Notes</span>
                  <textarea
                    value={video.notes}
                    onChange={(event) => updateVideo(video.id, "notes", event.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-violet-200/70"
                  />
                </label>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <Select label="Platform" value={video.platform} onChange={(value) => updateVideo(video.id, "platform", value as HookPlatform)} options={platforms.filter((value) => value !== "all").map((value) => ({ value, label: value }))} />
                <Select label="Content type" value={video.contentType} onChange={(value) => updateVideo(video.id, "contentType", value as VideoType)} options={[{ value: "short", label: "Short" }, { value: "long", label: "Long" }]} />
                <Select label="Category" value={video.category} onChange={(value) => updateVideo(video.id, "category", value as ContentTopic)} options={contentTopics.map((topic) => ({ value: topic.value, label: topic.label }))} />
                <DateInput label="Published date" value={video.publishedDate} onChange={(value) => updateVideo(video.id, "publishedDate", value)} />
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                <NumberInput label="Views 24h" value={video.views24h} onChange={(value) => updateVideo(video.id, "views24h", value)} />
                <NumberInput label="Views 48h" value={video.views48h} onChange={(value) => updateVideo(video.id, "views48h", value)} />
                <NumberInput label="Views 7d" value={video.views7d} onChange={(value) => updateVideo(video.id, "views7d", value)} />
                <NumberInput label="Ranking" value={video.rankingByViews} onChange={(value) => updateVideo(video.id, "rankingByViews", value)} />
                <NumberInput label="Retention %" value={video.retentionPercent} onChange={(value) => updateVideo(video.id, "retentionPercent", Math.min(100, value))} />
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">Avg duration</span>
                  <input
                    value={video.averageViewDuration}
                    onChange={(event) => updateVideo(video.id, "averageViewDuration", event.target.value)}
                    placeholder="0:18"
                    className="min-h-11 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-3 text-white outline-none transition focus:border-violet-200/70"
                  />
                </label>
                <NumberInput label="Likes" value={video.likes} onChange={(value) => updateVideo(video.id, "likes", value)} />
                <NumberInput label="Comments" value={video.comments} onChange={(value) => updateVideo(video.id, "comments", value)} />
                <NumberInput label="Shares" value={video.shares} onChange={(value) => updateVideo(video.id, "shares", value)} />
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-zinc-400">
                  Patterns: {findTriggers(video.hookText).join(", ") || "No trigger pattern detected yet"}.
                </p>
                <button
                  type="button"
                  onClick={() => saveVideo(video)}
                  disabled={saveState.status === "saving"}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-bold uppercase tracking-[0.16em] text-black shadow-[0_0_28px_rgba(168,85,247,0.35)] transition hover:-translate-y-0.5 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saveState.status === "saved" ? <Check className="size-4" /> : <Save className="size-4" />}
                  {saveState.status === "saving" ? "Saving" : saveState.status === "saved" ? "Saved" : "Save Hook Data"}
                </button>
              </div>
              {saveState.message ? (
                <p className={`mt-3 text-sm ${saveState.status === "error" ? "text-rose-200" : "text-emerald-200"}`}>
                  {saveState.message}
                </p>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-200">{title}</p>
      <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-200">
        {items.map((item) => <p key={item}>{item}</p>)}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#08060f]">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
      />
    </label>
  );
}

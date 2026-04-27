"use client";

import Image from "next/image";
import { Check, PenLine, Search, Save, Trash2, TriangleAlert, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  contentTopics,
  extractYouTubeId,
  formatTopicLabel,
  getYouTubeThumbnails,
  type ContentTopic,
  type VideoItem,
  type VideoType,
} from "@/lib/content";

type EditableVideo = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  publishedDate: string;
  contentType: VideoType;
  category: ContentTopic;
  tags: string;
  featured: boolean;
  thumbnail: string;
  relatedArticleSlug: string;
};

type SaveState = {
  status: "idle" | "saving" | "saved" | "error";
  message: string;
};

const typeOptions: Array<{ value: "all" | VideoType; label: string }> = [
  { value: "all", label: "All types" },
  { value: "short", label: "Short" },
  { value: "long", label: "Long Form" },
];
const VIDEO_MANAGER_DRAFT_KEY = "vanta-orbit-video-manager-draft";

function toEditableVideo(video: VideoItem): EditableVideo {
  return {
    id: video.id,
    title: video.title,
    description: video.description,
    videoUrl: video.videoUrl || video.youtubeUrl,
    publishedDate: video.publishedDate || video.date,
    contentType: video.contentType || video.type,
    category: video.category || video.topic,
    tags: video.tags.join(", "),
    featured: video.featured,
    thumbnail: video.thumbnail,
    relatedArticleSlug: video.relatedArticleSlug,
  };
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\n|,/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function validateVideo(video: EditableVideo) {
  const errors: string[] = [];

  if (!video.title.trim()) errors.push("Title is required.");
  if (!video.videoUrl.trim()) errors.push("URL is required.");
  if (!video.publishedDate) errors.push("Published date is required.");
  if (!video.contentType) errors.push("Content type is required.");

  return errors;
}

export default function AdminExistingVideosEditor({ videos }: { videos: VideoItem[] }) {
  const [items, setItems] = useState<EditableVideo[]>(() => videos.map(toEditableVideo));
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | VideoType>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | ContentTopic>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const filteredVideos = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...items]
      .filter((video) => (query ? video.title.toLowerCase().includes(query) : true))
      .filter((video) => (typeFilter === "all" ? true : video.contentType === typeFilter))
      .filter((video) => (categoryFilter === "all" ? true : video.category === categoryFilter))
      .sort((left, right) => {
        const leftTime = new Date(left.publishedDate).getTime();
        const rightTime = new Date(right.publishedDate).getTime();
        return sortOrder === "newest" ? rightTime - leftTime : leftTime - rightTime;
      });
  }, [categoryFilter, items, search, sortOrder, typeFilter]);

  const updateVideo = <K extends keyof EditableVideo>(id: string, key: K, value: EditableVideo[K]) => {
    setItems((current) =>
      current.map((video) => (video.id === id ? { ...video, [key]: value } : video)),
    );
    setSaveStates((current) => ({ ...current, [id]: { status: "idle", message: "" } }));
  };

  const editInVideoManager = (video: EditableVideo) => {
    const original = videos.find((item) => item.id === video.id);
    const draft = {
      id: video.id,
      slug: original?.slug ?? "",
      status: original?.status ?? "draft",
      createdAt: original?.createdAt ?? "",
      updatedAt: original?.updatedAt ?? "",
      title: video.title,
      focusObject: original?.focusObject ?? "",
      selectedHook: original?.selectedHook ?? original?.hookText ?? "",
      selectedThumbnailText: original?.selectedThumbnailText ?? "",
      titleIdeas: original?.titleIdeas ?? [],
      hookIdeas: original?.hookIdeas ?? [],
      thumbnailTextIdeas: original?.thumbnailTextIdeas ?? [],
      description: video.description,
      videoUrl: video.videoUrl,
      youtubeUrl: video.videoUrl,
      publishedDate: video.publishedDate,
      date: video.publishedDate,
      videoContext: original?.videoContext ?? "",
      keyFacts: original?.keyFacts ?? [],
      category: video.category,
      contentType: video.contentType,
      targetAudience: original?.targetAudience ?? "",
      tone: original?.tone ?? "",
      depthLevel: original?.depthLevel ?? "",
      suggestedArticleStructure: original?.suggestedArticleStructure ?? [],
      sourceNotes: original?.sourceNotes ?? "",
      relatedQuestions: original?.relatedQuestions ?? [],
      seoKeywords: original?.seoKeywords ?? [],
      tags: parseTags(video.tags),
      series: original?.series ?? "",
      featured: video.featured,
      relatedArticleSlug: video.relatedArticleSlug,
      generatedImageUrls: original?.generatedImageUrls ?? [],
      thumbnail: video.thumbnail,
      deepDiveTitle: original?.deepDiveTitle ?? "",
      deepDiveContent: original?.deepDiveContent ?? "",
      deepDiveMetaDescription: original?.deepDiveMetaDescription ?? "",
      deepDiveAiPrompt: original?.deepDiveAiPrompt ?? "",
    };

    window.localStorage.setItem(VIDEO_MANAGER_DRAFT_KEY, JSON.stringify(draft));
    window.location.href = "/admin/video-manager";
  };

  const saveVideo = async (video: EditableVideo) => {
    const errors = validateVideo(video);
    if (errors.length > 0) {
      setSaveStates((current) => ({
        ...current,
        [video.id]: { status: "error", message: errors.join(" ") },
      }));
      return;
    }

    setSaveStates((current) => ({
      ...current,
      [video.id]: { status: "saving", message: "Saving..." },
    }));

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
        tags: parseTags(video.tags),
        featured: video.featured,
        thumbnail: video.thumbnail,
        relatedArticleSlug: video.relatedArticleSlug,
      }),
    });

    const result = (await response.json()) as { errors?: string[]; error?: string };

    if (!response.ok) {
      setSaveStates((current) => ({
        ...current,
        [video.id]: {
          status: "error",
          message: result.errors?.join(" ") || result.error || "Save failed.",
        },
      }));
      return;
    }

    setSaveStates((current) => ({
      ...current,
      [video.id]: { status: "saved", message: "Saved to videos.json." },
    }));
  };

  const deleteVideo = async (video: EditableVideo) => {
    setSaveStates((current) => ({
      ...current,
      [video.id]: { status: "saving", message: "Deleting..." },
    }));

    const response = await fetch(`/admin/api/videos/${encodeURIComponent(video.id)}`, {
      method: "DELETE",
    });

    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setSaveStates((current) => ({
        ...current,
        [video.id]: {
          status: "error",
          message: result.error || "Delete failed.",
        },
      }));
      return;
    }

    setItems((current) => current.filter((item) => item.id !== video.id));
    setSaveStates((current) => {
      const next = { ...current };
      delete next[video.id];
      return next;
    });
    setConfirmingDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-white/10 bg-black/55 p-6 shadow-[0_0_42px_rgba(124,58,237,0.18)] backdrop-blur-xl">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem_14rem_11rem]">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Search title
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] pl-11 pr-4 text-white outline-none transition focus:border-violet-200/70"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Type
            </span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as "all" | VideoType)}
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#08060f]">
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Category
            </span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as "all" | ContentTopic)}
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
            >
              <option value="all" className="bg-[#08060f]">
                All categories
              </option>
              {contentTopics.map((topic) => (
                <option key={topic.value} value={topic.value} className="bg-[#08060f]">
                  {topic.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Sort
            </span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as "newest" | "oldest")}
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
            >
              <option value="newest" className="bg-[#08060f]">
                Newest
              </option>
              <option value="oldest" className="bg-[#08060f]">
                Oldest
              </option>
            </select>
          </label>
        </div>

        <p className="mt-4 text-sm leading-6 text-zinc-400">
          Showing {filteredVideos.length} of {items.length} videos.
        </p>
      </section>

      <section className="grid gap-6">
        {filteredVideos.map((video) => {
          const videoId = extractYouTubeId(video.videoUrl);
          const thumbnail = video.thumbnail || getYouTubeThumbnails(videoId)[0] || "/images/thumbnails/placeholder.jpg";
          const validationErrors = validateVideo(video);
          const saveState = saveStates[video.id] ?? { status: "idle", message: "" };

          return (
            <article
              key={video.id}
              className="rounded-[1.5rem] border border-white/10 bg-black/55 p-5 shadow-[0_0_42px_rgba(124,58,237,0.16)] backdrop-blur-xl"
            >
              <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-black">
                  <div className="relative aspect-video">
                    <Image
                      src={thumbnail}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover opacity-85"
                      sizes="18rem"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute left-4 top-4 rounded-full border border-violet-300/30 bg-black/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-100">
                      {video.contentType === "long" ? "Long Form" : "Short"}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="break-all text-xs leading-5 text-zinc-400">{video.id}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-200">
                      {formatTopicLabel(video.category)}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                      Title
                    </span>
                    <input
                      value={video.title}
                      onChange={(event) => updateVideo(video.id, "title", event.target.value)}
                      className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                      Description
                    </span>
                    <textarea
                      value={video.description}
                      onChange={(event) => updateVideo(video.id, "description", event.target.value)}
                      rows={3}
                      className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-violet-200/70"
                    />
                  </label>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                        Video URL
                      </span>
                      <input
                        value={video.videoUrl}
                        onChange={(event) => updateVideo(video.id, "videoUrl", event.target.value)}
                        className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                        Published date
                      </span>
                      <input
                        type="date"
                        value={video.publishedDate}
                        onChange={(event) => updateVideo(video.id, "publishedDate", event.target.value)}
                        className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
                      />
                    </label>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                        Content type
                      </span>
                      <select
                        value={video.contentType}
                        onChange={(event) => updateVideo(video.id, "contentType", event.target.value as VideoType)}
                        className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
                      >
                        <option value="short" className="bg-[#08060f]">
                          Short
                        </option>
                        <option value="long" className="bg-[#08060f]">
                          Long Form
                        </option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                        Category
                      </span>
                      <select
                        value={video.category}
                        onChange={(event) => updateVideo(video.id, "category", event.target.value as ContentTopic)}
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

                  <div className="grid gap-5 lg:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                        Tags / hashtags
                      </span>
                      <input
                        value={video.tags}
                        onChange={(event) => updateVideo(video.id, "tags", event.target.value)}
                        placeholder="moon, lunar-drift, #space"
                        className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                        Deep dive / blog link
                      </span>
                      <input
                        value={video.relatedArticleSlug}
                        onChange={(event) => updateVideo(video.id, "relatedArticleSlug", event.target.value)}
                        placeholder="why-the-moon-is-slowly-leaving-earth"
                        className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                      Thumbnail / image
                    </span>
                    <input
                      value={video.thumbnail}
                      onChange={(event) => updateVideo(video.id, "thumbnail", event.target.value)}
                      className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
                    />
                  </label>

                  <div className="flex flex-col gap-4 rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={video.featured}
                        onChange={(event) => updateVideo(video.id, "featured", event.target.checked)}
                        className="size-4 rounded border-white/20 bg-transparent text-violet-300 focus:ring-violet-300"
                      />
                      <span className="text-sm text-zinc-200">Featured / spotlight</span>
                    </label>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => saveVideo(video)}
                        disabled={saveState.status === "saving"}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-bold uppercase tracking-[0.16em] text-black shadow-[0_0_28px_rgba(168,85,247,0.35)] transition hover:-translate-y-0.5 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saveState.status === "saved" ? <Check className="size-4" /> : <Save className="size-4" />}
                        {saveState.status === "saving" ? "Saving" : saveState.status === "saved" ? "Saved" : "Save"}
                      </button>

                      <button
                        type="button"
                        onClick={() => editInVideoManager(video)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-violet-200/25 bg-violet-400/10 px-5 text-xs font-bold uppercase tracking-[0.16em] text-violet-50 transition hover:border-violet-100/70 hover:bg-violet-300/15"
                      >
                        <PenLine className="size-4" />
                        Edit in Video Manager
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteId(video.id)}
                        disabled={saveState.status === "saving"}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-rose-300/30 bg-rose-400/10 px-5 text-xs font-bold uppercase tracking-[0.16em] text-rose-100 transition hover:border-rose-200/70 hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {confirmingDeleteId === video.id ? (
                    <div className="rounded-[1.25rem] border border-rose-400/30 bg-rose-400/10 p-4 text-sm leading-6 text-rose-100">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.2em]">Are you sure?</p>
                          <p className="mt-2">
                            This will delete &quot;{video.title || video.id}&quot; and any linked deep dive/article.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => deleteVideo(video)}
                            disabled={saveState.status === "saving"}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-rose-100 px-4 text-xs font-bold uppercase tracking-[0.16em] text-rose-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 className="size-4" />
                            Yes, delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteId(null)}
                            disabled={saveState.status === "saving"}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/15 px-4 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <X className="size-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {validationErrors.length > 0 || saveState.message ? (
                    <div
                      className={`rounded-[1.25rem] border p-4 text-sm leading-6 ${
                        saveState.status === "error" || validationErrors.length > 0
                          ? "border-rose-400/25 bg-rose-400/10 text-rose-100"
                          : "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {saveState.status === "saved" ? <Check className="size-4" /> : <TriangleAlert className="size-4" />}
                        <p>
                          {saveState.message ||
                            validationErrors.join(" ")}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

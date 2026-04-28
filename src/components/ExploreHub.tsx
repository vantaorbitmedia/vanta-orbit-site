"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import ContentCard from "@/components/ContentCard";
import {
  archiveContent,
  contentTopics,
  topics,
  type ContentItem,
  type ContentTopic,
} from "@/lib/content";

export default function ExploreHub({
  initialTopic,
  items = archiveContent,
}: {
  initialTopic?: string;
  items?: ContentItem[];
}) {
  const mappedInitialTopic = contentTopics.some((topic) => topic.value === initialTopic)
    ? (initialTopic as ContentTopic)
    : topics.find((topic) => topic.name === initialTopic)?.contentTopic;
  const initial = mappedInitialTopic ?? "all";
  const [activeTopic, setActiveTopic] = useState<ContentTopic | "all">(initial);
  const [selectedType, setSelectedType] = useState<"all" | "video" | "article">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const results = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const matchesTopic = activeTopic === "all" || item.topic === activeTopic;
      const matchesType = selectedType === "all" || item.type === selectedType;
      const searchText = [
        item.title,
        item.description,
        item.topic,
        item.type,
        item.slug,
        item.series ?? "",
        ...(item.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
      return matchesTopic && matchesType && matchesQuery;
    });
  }, [activeTopic, items, selectedType, searchQuery]);
  const hasContent = items.length > 0;

  return (
    <div>
      <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_auto]">
        <label className="relative">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-violet-200" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search the archive"
            className="min-h-14 w-full rounded-full border border-white/15 bg-white/[0.04] pl-12 pr-5 text-white outline-none backdrop-blur transition placeholder:text-zinc-500 focus:border-violet-200/70"
          />
        </label>
        <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur">
          {(["all", "video", "article"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setSelectedType(option)}
              className={`rounded-full px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] transition ${
                selectedType === option ? "bg-white text-black" : "text-zinc-300 hover:text-white"
              }`}
            >
              {option === "all" ? "All" : option === "video" ? "Video" : "Article"}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-10 flex flex-wrap gap-3">
        {[{ value: "all", label: "All" }, ...contentTopics].map((topic) => (
          <button
            key={topic.value}
            type="button"
            onClick={() => setActiveTopic(topic.value as ContentTopic | "all")}
            className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
              activeTopic === topic.value
                ? "border-violet-200 bg-violet-300/15 text-white shadow-[0_0_24px_rgba(168,85,247,0.28)]"
                : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-violet-200/60 hover:text-white"
            }`}
          >
            {topic.label}
          </button>
        ))}
      </div>

      {hasContent && results.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => (
            <ContentCard key={item.slug} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur">
          <p className="font-display text-xl uppercase tracking-[0.18em] text-white">
            {hasContent ? "No signals found" : "Archive loading"}
          </p>
          <p className="mt-3 text-zinc-400">
            {hasContent
              ? "Try another topic, category, or search term."
              : "The shared content archive did not return any entries."}
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import VideoCard from "@/components/VideoCard";
import type { VideoItem } from "@/lib/content";

export default function VideosGrid({ videos }: { videos: VideoItem[] }) {
  const [filter, setFilter] = useState<"all" | "long" | "short">("all");

  const filteredVideos = useMemo(
    () => videos.filter((video) => filter === "all" || video.type === filter),
    [filter, videos],
  );

  return (
    <div>
      <div className="mb-8 flex justify-center">
        <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur">
          {(["all", "long", "short"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] transition ${
                filter === option ? "bg-white text-black" : "text-zinc-300 hover:text-white"
              }`}
            >
              {option === "all" ? "All" : option === "long" ? "Long" : "Short"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredVideos.map((video) => (
          <VideoCard key={video.slug} video={video} />
        ))}
      </div>
    </div>
  );
}

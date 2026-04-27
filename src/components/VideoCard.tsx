"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, FileText, Play } from "lucide-react";
import { useState } from "react";
import VideoModal from "@/components/VideoModal";
import {
  getYouTubeThumbnails,
  createYouTubeWatchUrl,
  formatVideoTypeLabel,
  formatTopicLabel,
  type VideoItem,
} from "@/lib/content";

const fallbackThumbnail = "/images/thumbnails/placeholder.jpg";

export default function VideoCard({ video }: { video: VideoItem }) {
  const thumbnailSources = [...getYouTubeThumbnails(video.youtubeId), fallbackThumbnail];
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const watchUrl = createYouTubeWatchUrl(video.youtubeId);
  const thumbnail = thumbnailSources[Math.min(thumbnailIndex, thumbnailSources.length - 1)];

  const watch = () => {
    if (!watchUrl && video.type === "short") return;

    if (video.type === "short") {
      window.open(watchUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setOpen(true);
  };

  return (
    <article className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] shadow-[0_0_34px_rgba(124,58,237,0.12)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-violet-300/50 hover:shadow-[0_0_48px_rgba(168,85,247,0.34)]">
      <button
        type="button"
        onClick={watch}
        className="block w-full text-left"
        aria-label={`Watch ${video.title}`}
      >
        <div className="relative aspect-video overflow-hidden bg-black">
          <Image
            src={thumbnail}
            alt=""
            fill
            loading="lazy"
            onError={() =>
              setThumbnailIndex((current) => Math.min(current + 1, thumbnailSources.length - 1))
            }
            className="object-cover opacity-80 transition duration-500 group-hover:scale-[1.06] group-hover:opacity-100"
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          <div className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-violet-100/50 bg-black/55 text-white shadow-[0_0_28px_rgba(168,85,247,0.65)] backdrop-blur transition duration-300 group-hover:scale-110">
            <Play className="ml-1 size-6 fill-white" />
          </div>
          <span className="absolute left-4 top-4 rounded-full border border-violet-300/30 bg-black/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-100 backdrop-blur">
            {formatVideoTypeLabel(video.type)}
          </span>
        </div>
      </button>

      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.14em] text-zinc-400">
          <span className="rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1 text-violet-100">
            {formatTopicLabel(video.topic)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-4" />
            {new Date(video.date).toLocaleDateString("en", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-white">{video.title}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{video.description}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={watch}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10"
          >
            <Play className="size-4 fill-white" />
            Watch Now
          </button>
          {video.relatedArticleSlug ? (
            <Link
              href={`/blog/${video.relatedArticleSlug}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10"
            >
              <FileText className="size-4" />
              Read the deep dive
            </Link>
          ) : null}
        </div>
      </div>
      {open && video.type === "long" ? (
        <VideoModal video={video} onClose={() => setOpen(false)} />
      ) : null}
    </article>
  );
}

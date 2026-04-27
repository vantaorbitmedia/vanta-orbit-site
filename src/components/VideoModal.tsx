"use client";

import Link from "next/link";
import { X } from "lucide-react";
import {
  createYouTubeEmbedUrl,
  createYouTubeWatchUrl,
  formatVideoTypeLabel,
  formatTopicLabel,
  isValidYouTubeId,
  type VideoItem,
} from "@/lib/content";

export default function VideoModal({
  video,
  onClose,
}: {
  video: VideoItem;
  onClose: () => void;
}) {
  const embedUrl = createYouTubeEmbedUrl(video.youtubeId);
  const embedSrc = embedUrl
    ? `${embedUrl}?autoplay=1&rel=0&modestbranding=1`
    : "";
  const watchUrl = createYouTubeWatchUrl(video.youtubeId);
  const canEmbed = isValidYouTubeId(video.youtubeId) && Boolean(embedUrl);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/82 px-2 py-16 backdrop-blur-md sm:px-4 lg:px-8">
      <div
        className="relative w-[98vw] max-w-[1180px] rounded-lg border border-violet-100/25 bg-black shadow-[0_0_70px_rgba(168,85,247,0.28)]"
      >
        <button
          type="button"
          aria-label="Close video"
          onClick={onClose}
          className="absolute right-0 top-[-3.75rem] grid size-11 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition hover:border-violet-200/70 hover:bg-violet-300/15 sm:right-[-0.25rem]"
        >
          <X className="size-5" />
        </button>

        <div className="aspect-video w-full bg-black">
          {canEmbed ? (
            <iframe
              src={embedSrc}
              title={video.title}
              className="block h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_52%),linear-gradient(180deg,rgba(12,10,18,0.98),rgba(3,2,7,1))] p-6 text-center">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-violet-200">Video unavailable</p>
                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300">
                  This entry is missing a valid YouTube ID, so the embedded player is disabled.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
              {formatTopicLabel(video.topic)} / {formatVideoTypeLabel(video.type)}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-white sm:text-xl">{video.title}</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {video.relatedArticleSlug ? (
              <Link
                href={`/blog/${video.relatedArticleSlug}`}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-violet-200/25 bg-violet-400/10 px-5 text-xs font-bold uppercase tracking-[0.16em] text-violet-50 transition hover:border-violet-100/70 hover:bg-violet-300/15"
              >
                Read Deep Dive
              </Link>
            ) : null}
            {watchUrl ? (
              <a
                href={watchUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10"
              >
                Watch on YouTube
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

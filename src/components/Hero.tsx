"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useState } from "react";
import ButtonLink from "@/components/ButtonLink";
import VideoModal from "@/components/VideoModal";
import { createYouTubeWatchUrl, type VideoItem } from "@/lib/content";

export default function Hero({ featuredVideo }: { featuredVideo: VideoItem }) {
  const [open, setOpen] = useState(false);
  const watchUrl = createYouTubeWatchUrl(featuredVideo.youtubeId);
  const watch = () => {
    if (!watchUrl && featuredVideo.type === "short") return;

    if (featuredVideo.type === "short") {
      window.open(watchUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setOpen(true);
  };

  return (
    <section className="relative z-10 min-h-[80vh] overflow-visible">
      <div className="hero-image-fade absolute inset-x-0 -bottom-44 top-0 overflow-hidden">
        <Image
          src="/vanta-banner.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="hero-bg-parallax object-cover opacity-70 saturate-125"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.72),rgba(0,0,0,0.62),rgba(0,0,0,0.78)),linear-gradient(180deg,rgba(0,0,0,0.46)_0%,rgba(0,0,0,0.6)_58%,rgba(0,0,0,0.22)_100%)]" />
      </div>

      <div className="relative z-20 mx-auto flex min-h-[80vh] max-w-7xl flex-col justify-center gap-8 px-4 pb-8 pt-28 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_30rem]">
          <div className="hero-copy-panel max-w-3xl rounded-lg border border-white/10 bg-black/70 p-6 shadow-[0_0_44px_rgba(0,0,0,0.65)] backdrop-blur-sm sm:p-8">
            <p className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold uppercase tracking-[0.3em] text-violet-100">
              <span>SPACE</span>
              <span aria-hidden="true">{"\u2022"}</span>
              <span>SCIENCE</span>
              <span aria-hidden="true">{"\u2022"}</span>
              <span>THE UNKNOWN</span>
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-[0.03em] text-white drop-shadow-[0_3px_24px_rgba(0,0,0,0.85)] sm:text-5xl lg:text-6xl">
              The universe is stranger than you think.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-100 sm:text-xl sm:leading-8">
              Cinematic space facts, short videos, and deeper science breakdowns.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/explore">Start Exploring</ButtonLink>
              <ButtonLink href="/videos" variant="secondary">
                Watch Latest
              </ButtonLink>
            </div>
          </div>

          <div className="featured-card-float">
            <article
              className="group overflow-hidden rounded-lg border border-violet-100/25 bg-black/75 shadow-[0_0_44px_rgba(124,58,237,0.3)] backdrop-blur-md transition duration-300 hover:-translate-y-2 hover:scale-[1.035] hover:border-violet-100/75 hover:shadow-[0_0_42px_rgba(216,180,254,0.38),0_0_88px_rgba(168,85,247,0.52)]"
            >
              <button
                type="button"
                onClick={watch}
                className="block w-full text-left"
                aria-label={`Watch ${featuredVideo.title}`}
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={featuredVideo.thumbnail}
                    alt=""
                    fill
                    className="object-cover opacity-90 transition duration-700 group-hover:scale-[1.1] group-hover:opacity-100"
                    sizes="(min-width: 1024px) 30rem, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <div className="play-pulse absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-violet-100/60 bg-black/55 text-white shadow-[0_0_30px_rgba(168,85,247,0.7)] backdrop-blur transition duration-300 group-hover:scale-[1.15] group-hover:shadow-[0_0_38px_rgba(216,180,254,0.9)]">
                    <Play className="ml-1 size-7 fill-white" />
                  </div>
                  <span className="absolute left-4 top-4 rounded-full border border-violet-100/25 bg-black/65 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-violet-100 backdrop-blur">
                    FEATURED VIDEO
                  </span>
                </div>
              </button>

              <div className="p-5 sm:p-6">
                <h2 className="text-2xl font-semibold leading-tight text-white">
                  {featuredVideo.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-200">
                  {featuredVideo.description}
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={watch}
                    className="glow-pulse group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold uppercase tracking-[0.18em] text-black shadow-[0_0_26px_rgba(168,85,247,0.78),0_0_70px_rgba(168,85,247,0.24)] transition duration-300 hover:-translate-y-0.5 hover:bg-violet-100 hover:shadow-[0_0_34px_rgba(216,180,254,0.95),0_0_90px_rgba(168,85,247,0.34)]"
                  >
                    Watch Now
                    <Play className="size-4 fill-black transition group-hover:translate-x-1" />
                  </button>
                  {featuredVideo.relatedArticleSlug ? (
                    <ButtonLink
                      href={`/blog/${featuredVideo.relatedArticleSlug}`}
                      variant="secondary"
                    >
                      Read Deep Dive
                    </ButtonLink>
                  ) : null}
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
      {open && featuredVideo.type === "long" ? (
        <VideoModal video={featuredVideo} onClose={() => setOpen(false)} />
      ) : null}
    </section>
  );
}

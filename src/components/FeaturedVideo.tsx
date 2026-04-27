import Image from "next/image";
import { Calendar, FileText, Play } from "lucide-react";
import ButtonLink from "@/components/ButtonLink";
import type { ContentItem } from "@/lib/content";

export default function FeaturedVideo({ video }: { video: ContentItem }) {
  return (
    <section
      id="featured-video"
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
    >
      <article
        className="group grid overflow-hidden rounded-lg border border-violet-200/15 bg-white/[0.045] shadow-[0_0_46px_rgba(124,58,237,0.16)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-violet-100/55 hover:shadow-[0_0_70px_rgba(168,85,247,0.28)] lg:grid-cols-[1.18fr_0.82fr]"
      >
        <div className="relative min-h-72 overflow-hidden md:min-h-[30rem]">
          <Image
            src={video.image}
            alt=""
            fill
            className="object-cover opacity-80 transition duration-700 group-hover:scale-105 group-hover:opacity-95"
            sizes="(min-width: 1024px) 60vw, 100vw"
            priority
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(216,180,254,0.3),transparent_20%),linear-gradient(90deg,rgba(0,0,0,0.2),rgba(0,0,0,0.78)),linear-gradient(0deg,rgba(0,0,0,0.82),transparent_48%)]" />
          <div className="absolute left-1/2 top-1/2 grid size-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-violet-100/50 bg-black/45 text-white shadow-[0_0_34px_rgba(168,85,247,0.7)] backdrop-blur transition duration-300 group-hover:scale-110 group-hover:bg-violet-300/20">
            <Play className="ml-1 size-8 fill-white" />
          </div>
          <div className="absolute bottom-5 left-5 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-100 backdrop-blur">
            Featured Video
          </div>
        </div>

        <div className="relative flex flex-col justify-center p-6 md:p-10">
          <div className="absolute -right-24 -top-24 size-64 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-5 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-zinc-300">
              <span className="rounded-full border border-violet-200/30 bg-violet-300/10 px-3 py-1 text-violet-100">
                {video.topic}
              </span>
              <span className="inline-flex items-center gap-2">
                <Calendar className="size-4" />
                {new Date(video.date).toLocaleDateString("en", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <h2 className="font-display text-3xl font-bold uppercase leading-tight tracking-[0.12em] text-white md:text-5xl">
              {video.title}
            </h2>
            <p className="mt-5 text-base leading-7 text-zinc-200 md:text-lg">
              {video.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/videos">Watch now</ButtonLink>
              {video.relatedArticleSlug ? (
                <ButtonLink href={`/blog/${video.relatedArticleSlug}`} variant="secondary">
                  Read deep dive
                </ButtonLink>
              ) : (
                <span className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 px-5 text-sm font-bold uppercase tracking-[0.18em] text-zinc-400">
                  <FileText className="size-4" />
                  Deep dive soon
                </span>
              )}
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

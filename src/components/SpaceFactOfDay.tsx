import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { DailySpaceFact } from "@/lib/daily-space-facts";

export default function SpaceFactOfDay({ fact }: { fact: DailySpaceFact | null }) {
  if (!fact) {
    return (
      <section className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-white/10 bg-black/45 p-6 text-sm leading-7 text-zinc-300 backdrop-blur-xl">
          Space Fact of the Day is preparing for launch.
        </div>
      </section>
    );
  }

  const isPublished = fact.status === "published";

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 pb-8 pt-14 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-lg border border-violet-200/20 bg-black/62 shadow-[0_0_58px_rgba(124,58,237,0.2)] backdrop-blur-xl">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex items-center gap-3 text-violet-100">
              <Sparkles className="size-5" />
              <p className="text-xs font-bold uppercase tracking-[0.24em]">
                Space Fact of the Day
              </p>
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold uppercase leading-tight tracking-[0.12em] text-white sm:text-4xl">
              {fact.title}
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-200 sm:text-lg">
              {fact.short_fact}
            </p>
            <div className="mt-6">
              {isPublished ? (
                <Link
                  href={`/daily-facts/${fact.slug}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-bold uppercase tracking-[0.16em] text-black shadow-[0_0_26px_rgba(168,85,247,0.4)] transition hover:-translate-y-0.5 hover:bg-violet-100"
                >
                  Read the full fact
                  <ArrowRight className="size-4" />
                </Link>
              ) : (
                <span className="inline-flex min-h-11 items-center rounded-full border border-white/12 bg-white/[0.04] px-5 text-xs font-bold uppercase tracking-[0.16em] text-zinc-300">
                  Full explanation coming soon
                </span>
              )}
            </div>
          </div>
          <div className="relative min-h-64 border-t border-white/10 bg-[radial-gradient(circle_at_50%_24%,rgba(168,85,247,0.22),transparent_32%),linear-gradient(180deg,rgba(8,5,15,0.92),rgba(2,1,4,1))] lg:border-l lg:border-t-0">
            {fact.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fact.image_url}
                alt={fact.image_alt || ""}
                className="absolute inset-0 size-full object-cover opacity-74"
              />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(2,1,4,0.86))]" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-100">
                {new Date(`${fact.publish_date}T00:00:00`).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                {fact.card_subtext || fact.short_fact}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

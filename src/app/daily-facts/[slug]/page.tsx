import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getDailyFactBySlug } from "@/lib/daily-space-facts";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return [];
}

function cleanDetailedExplanation(value: string, fallback: string) {
  const cleaned = value
    .replace(/This fact is designed as a short, accurate daily astronomy explainer for Vanta Orbit Media\./gi, "")
    .replace(/It can be expanded with current mission data, source links, or a longer article before publishing\./gi, "")
    .replace(/This draft needs source verification before publishing\./gi, "")
    .replace(/Expand it with mission data, measurements, and reputable references before it goes public\./gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned || fallback;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const fact = await getDailyFactBySlug(slug);

  if (!fact || fact.status !== "published") {
    return { title: "Daily Fact Not Found" };
  }

  return {
    title: fact.title,
    description: fact.short_fact,
    alternates: {
      canonical: `/daily-facts/${fact.slug}`,
    },
    openGraph: {
      title: fact.title,
      description: fact.short_fact,
      type: "article",
      url: `/daily-facts/${fact.slug}`,
      images: fact.image_url ? [fact.image_url] : undefined,
    },
  };
}

export default async function DailyFactPage({ params }: Props) {
  const { slug } = await params;
  const fact = await getDailyFactBySlug(slug);

  if (!fact || fact.status !== "published") notFound();
  const detailedExplanation = cleanDetailedExplanation(fact.detailed_explanation, fact.short_fact);

  return (
    <main className="space-page">
      <article>
        <header className="relative overflow-hidden px-4 pt-32 sm:px-6 lg:px-8">
          {fact.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fact.image_url} alt="" className="absolute inset-0 size-full object-cover opacity-45" />
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(0deg,#020104_0%,rgba(2,1,4,0.48)_50%,rgba(2,1,4,0.86)_100%)]" />
          <div className="relative z-10 mx-auto flex min-h-[58vh] max-w-4xl flex-col justify-end pb-16">
            <p className="mb-4 w-fit rounded-full border border-violet-200/30 bg-violet-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-violet-100 backdrop-blur">
              Daily Space Fact
            </p>
            <h1 className="font-display text-4xl font-bold uppercase leading-tight tracking-[0.12em] text-white md:text-6xl">
              {fact.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-200">
              {fact.short_fact}
            </p>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8">
          <div className="article-body rounded-lg border border-white/10 bg-white/[0.045] p-6 shadow-[0_0_58px_rgba(124,58,237,0.13)] backdrop-blur-xl md:p-10 lg:p-12">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mt-6 text-base leading-8 text-zinc-300 first:mt-0 sm:text-[1.06rem] md:leading-9">
                    {children}
                  </p>
                ),
                h2: ({ children }) => (
                  <h2 className="article-heading-glow mt-12 font-display text-2xl font-bold uppercase leading-tight tracking-[0.12em] text-white md:text-4xl">
                    {children}
                  </h2>
                ),
                ul: ({ children }) => (
                  <ul className="mt-6 list-disc space-y-3 pl-5 text-zinc-300 marker:text-violet-200">
                    {children}
                  </ul>
                ),
                li: ({ children }) => <li className="leading-8">{children}</li>,
              }}
            >
              {detailedExplanation}
            </ReactMarkdown>
          </div>

          <aside className="space-y-6">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-200">Follow</p>
              <p className="mt-3 text-lg font-semibold text-white">
                Follow Vanta Orbit Media for daily space facts
              </p>
              <Link
                href="/subscribe"
                className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-black"
              >
                Join the Orbit
              </Link>
            </div>
            <Link
              href="/"
              className="block rounded-lg border border-white/10 bg-black/35 p-6 text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300 transition hover:border-violet-200/60 hover:text-white"
            >
              Back to homepage
            </Link>
          </aside>
        </div>
      </article>
    </main>
  );
}

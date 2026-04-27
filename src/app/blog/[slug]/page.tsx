import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import ButtonLink from "@/components/ButtonLink";
import ContentCard from "@/components/ContentCard";
import NewsletterSignup from "@/components/NewsletterSignup";
import {
  articles,
  createYouTubeWatchUrl,
  formatTopicLabel,
  getArticle,
  getVideoById,
  isValidYouTubeId,
  relatedFor,
} from "@/lib/content";

type Props = {
  params: Promise<{ slug: string }>;
};

function looksLikePlainSectionHeading(line: string) {
  const text = line.trim();
  if (!text || text.startsWith("#") || text.startsWith("-") || text.startsWith(">")) return false;
  if (text.length < 8 || text.length > 96) return false;
  if (/[.!?;,]$/.test(text)) return false;

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 11) return false;

  const hasHeadingSignal = text.includes(":") || text.includes("—");
  const titleCaseWords = words.filter((word) => /^[A-Z0-9]/.test(word.replace(/^[“"']/, ""))).length;
  const titleCaseRatio = titleCaseWords / words.length;

  return hasHeadingSignal || titleCaseRatio >= 0.55;
}

function splitArticleBlocksForRendering(content: string) {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) {
    return { title: "Article Not Found" };
  }

  return {
    title: article.title,
    description: article.description,
    alternates: {
      canonical: `/blog/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      url: `/blog/${article.slug}`,
      images: [article.image],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle(slug);

  if (!article) notFound();

  const relatedVideo = article.relatedVideoId ? getVideoById(article.relatedVideoId) : undefined;
  const related = relatedFor(article);
  const canEmbedRelatedVideo = isValidYouTubeId(article.youtubeId);
  const articleWatchUrl = createYouTubeWatchUrl(article.youtubeId);
  const articleBlocks = splitArticleBlocksForRendering(article.content);

  return (
    <main className="space-page">
      <article>
        <header className="relative min-h-[76vh] overflow-hidden px-4 pt-32 sm:px-6 lg:px-8">
          <Image
            src={article.image}
            alt=""
            fill
            className="object-cover opacity-45"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,#020104_0%,rgba(2,1,4,0.42)_45%,rgba(2,1,4,0.78)_100%)]" />
          <div className="relative z-10 mx-auto flex min-h-[56vh] max-w-4xl flex-col justify-end pb-16">
            <p className="mb-4 w-fit rounded-full border border-violet-200/30 bg-violet-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-violet-100 backdrop-blur">
              {formatTopicLabel(article.topic)}
            </p>
            <h1 className="font-display text-4xl font-bold uppercase leading-tight tracking-[0.12em] text-white md:text-6xl">
              {article.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-200">
              {article.description}
            </p>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8">
          <div>
            <div className="mb-10 overflow-hidden rounded-lg border border-white/10 bg-black shadow-[0_0_42px_rgba(124,58,237,0.14)]">
              {canEmbedRelatedVideo ? (
                <iframe
                  src={article.youtubeUrl}
                  title={`Related video for ${article.title}`}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),transparent_56%),linear-gradient(180deg,rgba(10,8,16,0.96),rgba(2,1,4,1))] p-6 text-center">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-200">
                      Video unavailable
                    </p>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300">
                      This article does not currently have a valid embedded video.
                    </p>
                    {articleWatchUrl ? (
                      <a
                        href={articleWatchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex rounded-full border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10"
                      >
                        Watch on YouTube
                      </a>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            <div className="article-body rounded-lg border border-white/10 bg-white/[0.045] p-6 shadow-[0_0_58px_rgba(124,58,237,0.13)] backdrop-blur-xl md:p-10 lg:p-12">
              {articleBlocks.map((block, index) => {
                const isPlainHeading = !block.includes("\n") && looksLikePlainSectionHeading(block);

                if (isPlainHeading) {
                  return (
                    <h2
                      key={`${block}-${index}`}
                      className="article-reveal article-heading-glow mt-14 font-display text-2xl font-bold uppercase leading-tight tracking-[0.12em] text-white first:mt-0 md:text-4xl"
                    >
                      {block}
                    </h2>
                  );
                }

                return (
                  <ReactMarkdown
                    key={`${block.slice(0, 32)}-${index}`}
                    components={{
                      h2: ({ children }) => (
                        <h2 className="article-reveal article-heading-glow mt-14 font-display text-2xl font-bold uppercase leading-tight tracking-[0.12em] text-white first:mt-0 md:text-4xl">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="article-reveal article-heading-glow mt-10 text-xl font-bold leading-snug text-violet-100 md:text-2xl">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="article-reveal mt-6 text-base leading-8 text-zinc-300 sm:text-[1.06rem] md:leading-9">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="article-reveal mt-6 list-disc space-y-3 pl-5 text-zinc-300 marker:text-violet-200">
                          {children}
                        </ul>
                      ),
                      li: ({ children }) => (
                        <li className="leading-8">
                          {children}
                        </li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-extrabold text-white">
                          {children}
                        </strong>
                      ),
                      a: ({ href, children }) => (
                        <Link
                          href={href ?? "#"}
                          className="font-semibold text-violet-200 underline decoration-violet-300/35 underline-offset-4 transition hover:text-sky-200 hover:decoration-sky-200/70"
                        >
                          {children}
                        </Link>
                      ),
                    }}
                  >
                    {block}
                  </ReactMarkdown>
                );
              })}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-200">
                Watch
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Short Version</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                {relatedVideo?.description ?? "A related video will appear here when linked in the content file."}
              </p>
              <div className="mt-5">
                <ButtonLink href={articleWatchUrl || "/videos"} variant="secondary">
                  {articleWatchUrl ? "Watch the video" : "Browse videos"}
                </ButtonLink>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-200">
                Follow
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                Follow Vanta Orbit Media for more space facts
              </p>
              <Link
                href="/subscribe"
                className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-black"
              >
                Join the Orbit
              </Link>
            </div>
          </aside>
        </div>
      </article>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-violet-200">
              Explore More
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold uppercase tracking-[0.16em] text-white md:text-3xl">
              Related Deep Dives
            </h2>
          </div>
          <Link
            href="/blog"
            className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-300 transition hover:text-violet-100"
          >
            View all articles
          </Link>
        </div>
        {related.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((item) => (
              <ContentCard key={item.slug} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-sm leading-7 text-zinc-300">
            More connected space stories will appear here as the archive grows.
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <NewsletterSignup />
      </section>
    </main>
  );
}

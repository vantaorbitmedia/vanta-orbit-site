import type { Metadata } from "next";
import ContentCard from "@/components/ContentCard";
import SectionHeader from "@/components/SectionHeader";
import { getPublicArticles } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "Read deeper written breakdowns of Vanta Orbit Media space and science videos.",
};

export default async function BlogPage() {
  const articles = await getPublicArticles();

  return (
    <main className="space-page px-4 pb-24 pt-32 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Deep Dives"
          title="Written Signals"
          description="Each article expands a video into a clearer, deeper space-science story."
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <ContentCard key={article.slug} item={article} />
          ))}
        </div>
      </section>
    </main>
  );
}

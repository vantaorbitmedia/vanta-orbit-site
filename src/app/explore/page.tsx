import type { Metadata } from "next";
import ExploreHub from "@/components/ExploreHub";
import SectionHeader from "@/components/SectionHeader";
import { getPublicArchiveContent } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore Topics",
  description: "Browse Vanta Orbit Media videos and articles by space and science topic.",
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const [params, archiveContent] = await Promise.all([
    searchParams,
    getPublicArchiveContent(),
  ]);

  return (
    <main className="space-page px-4 pb-24 pt-32 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Topic Hub"
          title="Explore the Archive"
          description="Filter videos and articles by topic, format, and search signal."
        />
        <ExploreHub initialTopic={params.topic} items={archiveContent} />
      </section>
    </main>
  );
}

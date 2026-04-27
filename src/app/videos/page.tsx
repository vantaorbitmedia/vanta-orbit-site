import type { Metadata } from "next";
import SectionHeader from "@/components/SectionHeader";
import VideosGrid from "@/components/VideosGrid";
import { videos } from "@/lib/content";

export const metadata: Metadata = {
  title: "Videos",
  description: "Watch Vanta Orbit Media space videos with related deep-dive articles.",
};

export default function VideosPage() {
  return (
    <main className="space-page px-4 pb-24 pt-32 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Watch"
          title="Latest Videos"
          description="Browse long-form episodes and short-form space facts from Vanta Orbit Media."
        />
        <VideosGrid videos={videos} />
      </section>
    </main>
  );
}

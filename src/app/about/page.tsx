import type { Metadata } from "next";
import Image from "next/image";
import { Orbit, Radio, Telescope } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Vanta Orbit Media's mission and coverage.",
};

export default function AboutPage() {
  const sections = [
    {
      title: "Mission",
      icon: Orbit,
      copy: "Make space feel cinematic, intelligent, and close enough to wonder about every day.",
    },
    {
      title: "What We Cover",
      icon: Telescope,
      copy: "Earth, the Moon, the Sun, planets, deep space, cosmic mysteries, and science stories with visual weight.",
    },
    {
      title: "Where to Follow",
      icon: Radio,
      copy: "YouTube, Instagram, TikTok, and the Vanta Orbit newsletter as the archive grows.",
    },
  ];

  return (
    <main className="space-page px-4 pb-24 pt-32 sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] shadow-[0_0_60px_rgba(124,58,237,0.18)]">
          <Image src="/vanta-logo.png" alt="Vanta Orbit Media logo" fill className="object-cover" priority />
        </div>
        <div>
          <SectionHeader eyebrow="About" title="The Brand" />
          <p className="text-xl leading-9 text-zinc-200">
            Vanta Orbit Media explores space, science, and the unknown through cinematic storytelling, short-form videos, and deeper written breakdowns.
          </p>
          <div className="mt-8 grid gap-4">
            {sections.map(({ title, icon: Icon, copy }) => (
              <div key={title} className="rounded-lg border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                <Icon className="mb-4 size-7 text-violet-200" />
                <h2 className="font-display text-lg font-bold uppercase tracking-[0.18em] text-white">
                  {title}
                </h2>
                <p className="mt-2 leading-7 text-zinc-300">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

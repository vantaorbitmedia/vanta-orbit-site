"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { getTopicByHomeName, type HomeTopicName } from "@/lib/content";

export default function TopicCard({ topicName }: { topicName: HomeTopicName }) {
  const topic = getTopicByHomeName(topicName);

  if (!topic) {
    return null;
  }

  const Icon = topic.icon;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.025 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
    >
      <Link
        id={`topic-${topic.slug}`}
        href={`/explore?topic=${encodeURIComponent(topic.contentTopic)}`}
        className="group relative block min-h-80 scroll-mt-28 overflow-hidden rounded-lg border border-violet-200/15 bg-white/[0.05] p-6 shadow-[0_0_36px_rgba(124,58,237,0.18)] backdrop-blur-xl transition duration-300 ease-out hover:border-violet-100/60 hover:shadow-[0_0_52px_rgba(168,85,247,0.4),inset_0_0_28px_rgba(168,85,247,0.08)]"
      >
        <Image
          src={topic.image}
          alt=""
          fill
          loading="lazy"
          unoptimized
          className="object-cover object-center opacity-60 blur-[0.6px] saturate-110 transition duration-300 ease-out group-hover:scale-[1.03] group-hover:-translate-y-1 group-hover:opacity-70"
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/42 to-transparent" />
        <div className="absolute inset-0 bg-violet-500/[0.08] transition duration-300 ease-out group-hover:bg-violet-500/[0.12]" />
        <div className="relative z-10 flex h-full min-h-68 flex-col justify-between">
          <Icon className="size-9 text-violet-100 drop-shadow-[0_0_18px_rgba(196,181,253,0.9)]" />
          <div>
            <h3 className="font-display text-2xl font-bold uppercase tracking-[0.16em] text-white">
              {topic.name}
            </h3>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{topic.description}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

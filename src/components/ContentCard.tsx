"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, PlayCircle } from "lucide-react";
import { useState } from "react";
import VideoModal from "@/components/VideoModal";
import {
  createYouTubeWatchUrl,
  extractYouTubeId,
  formatTopicLabel,
  getVideoBySlug,
  type ArticleItem,
  type ContentItem,
  type VideoItem,
} from "@/lib/content";

const fallbackThumbnail = "/images/thumbnails/placeholder.jpg";

export default function ContentCard({ item }: { item: ContentItem | ArticleItem }) {
  const normalizedItem: ContentItem = "type" in item
    ? item
    : {
        title: item.title,
        slug: item.slug,
        topic: item.topic,
        type: "article",
        description: item.description,
        image: item.image,
        youtubeUrl: item.youtubeUrl,
        youtubeId: item.youtubeId,
        relatedVideoId: item.relatedVideoId,
        relatedVideoSlug: item.relatedVideoSlug,
        tags: item.tags,
        series: item.series,
        date: item.date,
        content: item.content,
        body: item.body,
      };
  const href = normalizedItem.type === "article"
    ? `/blog/${normalizedItem.slug}`
    : (createYouTubeWatchUrl(normalizedItem.youtubeId) || "/videos");
  const external = normalizedItem.type === "video";
  const [imageSrc, setImageSrc] = useState(normalizedItem.image);
  const [open, setOpen] = useState(false);
  const fallbackYoutubeId = extractYouTubeId(normalizedItem.youtubeId ?? normalizedItem.youtubeUrl);
  const modalVideo: VideoItem | null = normalizedItem.type === "video"
    ? getVideoBySlug(normalizedItem.slug) ?? {
          id: normalizedItem.slug,
          title: normalizedItem.title,
          focusObject: "",
          slug: normalizedItem.slug,
          status: "published",
          createdAt: normalizedItem.date,
          updatedAt: normalizedItem.date,
          type: normalizedItem.videoType ?? "short",
          contentType: normalizedItem.videoType ?? "short",
          topic: normalizedItem.topic,
          category: normalizedItem.topic,
          youtubeUrl: createYouTubeWatchUrl(fallbackYoutubeId),
          videoUrl: createYouTubeWatchUrl(fallbackYoutubeId),
          videoId: fallbackYoutubeId,
          youtubeId: fallbackYoutubeId,
          embedUrl: normalizedItem.youtubeUrl,
          thumbnail: normalizedItem.image,
          description: normalizedItem.description,
          featured: false,
          tags: normalizedItem.tags ?? [],
          series: normalizedItem.series ?? "",
          selectedHook: "",
          selectedThumbnailText: "",
          titleIdeas: [],
          hookIdeas: [],
          thumbnailTextIdeas: [],
          generatedImageUrls: [],
          deepDiveTitle: "",
          deepDiveContent: "",
          deepDiveMetaDescription: "",
          deepDiveAiPrompt: "",
          date: normalizedItem.date,
          publishedDate: normalizedItem.date,
          relatedArticleSlug: normalizedItem.relatedArticleSlug ?? "",
          videoContext: "",
          keyFacts: [],
          targetAudience: "",
          tone: "",
          depthLevel: "",
          suggestedArticleStructure: [],
          sourceNotes: "",
          relatedQuestions: [],
          seoKeywords: [],
          hookText: "",
          views24h: 0,
          views48h: 0,
          views7d: 0,
          rankingByViews: 0,
          averageViewDuration: "",
          retentionPercent: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          platform: "YouTube",
          notes: "",
          hookScore: 0,
        }
    : null;
  const watchUrl = modalVideo ? createYouTubeWatchUrl(modalVideo.youtubeId) : "";

  const handleVideoOpen = () => {
    if (!modalVideo || !watchUrl) return;

    if (modalVideo.type === "short") {
      window.open(watchUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setOpen(true);
  };

  return (
    <motion.article
      initial={false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      whileHover={{ y: -6 }}
      className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] shadow-[0_0_34px_rgba(124,58,237,0.12)] backdrop-blur-xl"
    >
      <Link
        href={href}
        className="block"
        onClick={(event) => {
          if (external) {
            event.preventDefault();
            handleVideoOpen();
          }
        }}
      >
        <div className="relative aspect-video overflow-hidden">
          <Image
          src={imageSrc}
          alt=""
          fill
          unoptimized={normalizedItem.type === "video"}
          onError={() => setImageSrc(fallbackThumbnail)}
          className="object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90"
          sizes="(min-width: 1024px) 33vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
        <div className="absolute left-4 top-4 rounded-full border border-violet-200/30 bg-black/50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-violet-100 backdrop-blur">
            {formatTopicLabel(normalizedItem.topic)}
          </div>
          {normalizedItem.type === "video" ? (
            <PlayCircle className="absolute bottom-4 right-4 size-9 text-white drop-shadow-[0_0_18px_rgba(168,85,247,0.8)]" />
          ) : null}
        </div>
        <div className="p-5">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-zinc-400">
            <Calendar className="size-4" />
            {new Date(normalizedItem.date).toLocaleDateString("en", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <h3 className="text-xl font-semibold leading-tight text-white">{normalizedItem.title}</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{normalizedItem.description}</p>
        </div>
      </Link>
      {open && modalVideo?.type === "long" ? (
        <VideoModal video={modalVideo} onClose={() => setOpen(false)} />
      ) : null}
    </motion.article>
  );
}

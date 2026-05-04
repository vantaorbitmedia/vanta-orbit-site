"use client";

import Link from "next/link";
import { Archive, Bot, Check, Download, ImageIcon, Loader2, Save, Send, Trash2, WandSparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DailyFactStatus, DailySpaceFact } from "@/lib/daily-space-facts";

const DEFAULT_CARD_CTA = "Follow for daily space facts 🚀";
const FACTS_PER_PAGE = 30;

const cardFormats = [
  { key: "feed", label: "Facebook / Instagram", width: 1080, height: 1350 },
  { key: "story", label: "TikTok / Reels", width: 1080, height: 1920 },
  { key: "youtube", label: "YouTube", width: 1280, height: 720 },
] as const;

type CardKey = (typeof cardFormats)[number]["key"];
type CardFormat = (typeof cardFormats)[number];
type CardLayout = {
  safeX: number;
  safeTop: number;
  safeBottom: number;
  textX: number;
  textStart: number;
  textWidth: number;
  headlineSize: number;
  headlineLineHeight: number;
  headlineMaxLines: number;
  bodySize: number;
  bodyLineHeight: number;
  curiositySize: number;
  curiosityLineHeight: number;
  ctaSize: number;
  ctaY: number;
  brandY: number;
  imageFocusX: number;
  imageFocusY: number;
};

function emptyFact(): DailySpaceFact {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  return {
    id: "",
    slug: "",
    title: "",
    short_fact: "",
    detailed_explanation: "",
    source_notes: "",
    publish_date: today,
    status: "scheduled",
    is_homepage_fact: false,
    facebook_caption: "",
    instagram_caption: "",
    tiktok_caption: "",
    youtube_caption: "",
    hashtags: [],
    leonardo_prompt: "",
    image_url: "",
    image_alt: "",
    card_headline: "",
    card_subtext: "",
    card_curiosity_line: "",
    card_cta: DEFAULT_CARD_CTA,
    created_at: now,
    updated_at: now,
    full_post_published_at: "",
  };
}

function sortFactsByPublishDate(facts: DailySpaceFact[]) {
  return [...facts].sort((a, b) => {
    const dateCompare = a.publish_date.localeCompare(b.publish_date);
    if (dateCompare !== 0) return dateCompare;
    return a.title.localeCompare(b.title);
  });
}

function statusClasses(status: DailyFactStatus) {
  const classes: Record<DailyFactStatus, string> = {
    scheduled: "border-zinc-400/25 bg-zinc-400/10 text-zinc-200",
    live_short_fact: "border-sky-300/25 bg-sky-400/10 text-sky-100",
    needs_review: "border-amber-300/25 bg-amber-400/10 text-amber-100",
    ready: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
    published: "border-violet-200/30 bg-violet-400/15 text-violet-100",
    archived: "border-rose-300/25 bg-rose-400/10 text-rose-100",
  };

  return classes[status];
}

function textAreaRows(value: string, minRows: number) {
  return Math.max(minRows, Math.min(12, value.split("\n").length + 1));
}

function getWrappedLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function drawWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 7) {
  const lines = getWrappedLines(ctx, text, maxWidth);
  lines.slice(0, maxLines).forEach((item, index) => ctx.fillText(item, x, y + index * lineHeight));
  return y + lines.slice(0, maxLines).length * lineHeight;
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  targetSize: number,
  minSize: number,
  maxLines: number,
  weight: number,
) {
  let size = targetSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px Arial`;
    if (getWrappedLines(ctx, text, maxWidth).length <= maxLines) return size;
    size -= 2;
  }
  return minSize;
}

function getKeyNumberMatch(text: string) {
  return text.match(/\b\d+(?:\.\d+)?\s?(?:cm|mm|km|miles|minutes?|seconds?|hours?|days?|years?|billion|million|trillion|%|degrees?)\b/i)
    ?? text.match(/\b\d+(?:\.\d+)?\b/);
}

function drawSubtextWithNumberAccent(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  lineHeight: number,
) {
  const match = getKeyNumberMatch(text);
  if (!match || match.index === undefined) {
    return drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, 4);
  }

  const before = text.slice(0, match.index).trim();
  const number = match[0].trim();
  const after = text.slice(match.index + match[0].length).trim();
  let nextY = y;

  if (before) {
    ctx.fillStyle = "#d4d4d8";
    ctx.font = `500 ${fontSize}px Arial`;
    nextY = drawWrappedText(ctx, before, x, nextY, maxWidth, lineHeight, 3);
    nextY += fontSize * 0.25;
  }

  ctx.fillStyle = "#f5d0fe";
  ctx.font = `800 ${Math.round(fontSize * 1.28)}px Arial`;
  ctx.shadowColor = "rgba(217, 70, 239, 0.42)";
  ctx.shadowBlur = Math.round(fontSize * 0.45);
  ctx.fillText(number, x, nextY);
  ctx.shadowBlur = 0;
  nextY += lineHeight * 1.08;

  if (after) {
    ctx.fillStyle = "#d4d4d8";
    ctx.font = `500 ${fontSize}px Arial`;
    nextY = drawWrappedText(ctx, after, x, nextY, maxWidth, lineHeight, 3);
  }

  return nextY;
}

function drawSpacedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  let currentX = x;

  for (const character of text) {
    ctx.fillText(character, currentX, y);
    currentX += ctx.measureText(character).width + spacing;
  }

  return currentX;
}

function getCardLayout(format: CardFormat): CardLayout {
  const ratio = format.width / format.height;
  const safeX = Math.round(format.width * (format.key === "youtube" ? 0.065 : 0.075));
  const safeTop = Math.round(format.height * (format.key === "youtube" ? 0.075 : 0.055));
  const safeBottom = Math.round(format.height * (format.key === "story" ? 0.22 : 0.075));

  if (ratio > 1.3) {
    return {
      safeX,
      safeTop,
      safeBottom,
      textX: safeX,
      textStart: Math.round(format.height * 0.38),
      textWidth: Math.round(format.width * 0.58),
      headlineSize: 56,
      headlineLineHeight: 60,
      headlineMaxLines: 2,
      bodySize: 28,
      bodyLineHeight: 34,
      curiositySize: 19,
      curiosityLineHeight: 24,
      ctaSize: 21,
      ctaY: format.height - safeBottom,
      brandY: safeTop,
      imageFocusX: 0.66,
      imageFocusY: 0.48,
    };
  }

  if (ratio > 0.72) {
    return {
      safeX,
      safeTop,
      safeBottom,
      textX: safeX,
      textStart: Math.round(format.height * 0.535),
      textWidth: format.width - safeX * 2,
      headlineSize: 70,
      headlineLineHeight: 75,
      headlineMaxLines: 3,
      bodySize: 37,
      bodyLineHeight: 45,
      curiositySize: 27,
      curiosityLineHeight: 34,
      ctaSize: 25,
      ctaY: format.height - safeBottom,
      brandY: safeTop,
      imageFocusX: 0.56,
      imageFocusY: 0.46,
    };
  }

  return {
    safeX,
    safeTop,
    safeBottom,
    textX: safeX,
    textStart: Math.round(format.height * 0.49),
    textWidth: format.width - safeX * 2,
    headlineSize: 74,
    headlineLineHeight: 79,
    headlineMaxLines: 4,
    bodySize: 38,
    bodyLineHeight: 46,
    curiositySize: 27,
    curiosityLineHeight: 34,
    ctaSize: 27,
    ctaY: format.height - safeBottom + Math.round(format.height * 0.015),
    brandY: safeTop,
    imageFocusX: 0.54,
    imageFocusY: 0.46,
  };
}

function drawCardBranding(ctx: CanvasRenderingContext2D, format: CardFormat, layout: CardLayout) {
  const margin = layout.safeX;
  const y = layout.brandY;
  const markSize = Math.round(format.width * (format.key === "youtube" ? 0.021 : 0.024));
  const fontSize = Math.round(format.width * (format.key === "youtube" ? 0.0155 : 0.0175));
  const textX = margin + markSize + Math.round(format.width * 0.022);
  const textY = y + markSize * 0.76;
  const brandWidth = Math.round(format.width * (format.key === "youtube" ? 0.24 : 0.245));
  const padX = Math.round(format.width * 0.012);
  const padY = Math.round(format.width * 0.009);

  ctx.save();
  const scrim = ctx.createLinearGradient(margin - padX, y - padY, margin + brandWidth, y + markSize + padY);
  scrim.addColorStop(0, "rgba(2, 1, 4, 0.52)");
  scrim.addColorStop(0.72, "rgba(2, 1, 4, 0.28)");
  scrim.addColorStop(1, "rgba(2, 1, 4, 0)");
  ctx.fillStyle = scrim;
  ctx.beginPath();
  ctx.roundRect(margin - padX, y - padY, brandWidth, markSize + padY * 2, Math.round(format.width * 0.012));
  ctx.fill();

  ctx.globalAlpha = 0.82;
  ctx.strokeStyle = "rgba(221, 214, 254, 0.86)";
  ctx.lineWidth = Math.max(1.2, format.width * 0.0016);
  ctx.shadowColor = "rgba(0, 0, 0, 0.74)";
  ctx.shadowBlur = Math.round(format.width * 0.014);
  ctx.beginPath();
  ctx.arc(margin + markSize / 2, y + markSize / 2, markSize / 2.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(
    margin + markSize / 2,
    y + markSize / 2,
    markSize * 0.56,
    markSize * 0.2,
    -0.42,
    0,
    Math.PI * 2,
  );
  ctx.stroke();

  ctx.fillStyle = "rgba(237, 233, 254, 0.82)";
  ctx.font = `500 ${fontSize}px Arial`;
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "rgba(216, 180, 254, 0.7)";
  ctx.shadowColor = "rgba(216, 180, 254, 0.52)";
  ctx.shadowBlur = Math.round(format.width * 0.018);
  drawSpacedText(ctx, "VANTA ORBIT", textX, textY, Math.max(2.4, format.width * 0.0044));
  ctx.restore();

  ctx.fillStyle = "rgba(237, 233, 254, 0.84)";
  ctx.shadowColor = "rgba(0, 0, 0, 0.76)";
  ctx.shadowBlur = Math.round(format.width * 0.011);
  drawSpacedText(ctx, "VANTA ORBIT", textX, textY, Math.max(2.4, format.width * 0.0044));
  ctx.restore();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  focusX = 0.5,
  focusY = 0.5,
) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = width / height;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;

  if (imageRatio > canvasRatio) {
    sourceWidth = image.naturalHeight * canvasRatio;
  } else {
    sourceHeight = image.naturalWidth / canvasRatio;
  }

  const sourceX = Math.max(0, Math.min(image.naturalWidth - sourceWidth, image.naturalWidth * focusX - sourceWidth / 2));
  const sourceY = Math.max(0, Math.min(image.naturalHeight - sourceHeight, image.naturalHeight * focusY - sourceHeight / 2));
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
}

type AdminDailyFactsProps = {
  initialFacts: DailySpaceFact[];
  initialFactId?: string;
};

export default function AdminDailyFacts({ initialFacts, initialFactId }: AdminDailyFactsProps) {
  const [facts, setFacts] = useState(() => sortFactsByPublishDate(initialFacts));
  const [selectedId, setSelectedId] = useState(initialFactId || initialFacts[0]?.id || "");
  const [selectedFactIds, setSelectedFactIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const selectedFact = useMemo(
    () => facts.find((fact) => fact.id === selectedId) ?? facts[0] ?? emptyFact(),
    [facts, selectedId],
  );
  const pageCount = Math.max(1, Math.ceil(facts.length / FACTS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * FACTS_PER_PAGE;
  const visibleFacts = facts.slice(pageStart, pageStart + FACTS_PER_PAGE);
  const [form, setForm] = useState<DailySpaceFact>(selectedFact);
  const [saving, setSaving] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generatingCardCopy, setGeneratingCardCopy] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canvasRefs = useRef<Record<CardKey, HTMLCanvasElement | null>>({
    feed: null,
    story: null,
    youtube: null,
  });

  useEffect(() => {
    for (const format of cardFormats) {
      const canvas = canvasRefs.current[format.key];
      if (!canvas) continue;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      canvas.width = format.width;
      canvas.height = format.height;
      const drawBase = () => {
        const gradient = ctx.createLinearGradient(0, 0, format.width, format.height);
        gradient.addColorStop(0, "#160923");
        gradient.addColorStop(0.48, "#05030a");
        gradient.addColorStop(1, "#020104");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, format.width, format.height);
        ctx.fillStyle = "rgba(168, 85, 247, 0.18)";
        ctx.beginPath();
        ctx.arc(format.width * 0.78, format.height * 0.16, format.width * 0.24, 0, Math.PI * 2);
        ctx.fill();
      };
      const drawOverlay = () => {
        const layout = getCardLayout(format);
        const isLandscape = format.key === "youtube";
        const overlay = isLandscape
          ? ctx.createLinearGradient(0, 0, format.width, 0)
          : ctx.createLinearGradient(0, format.height * 0.18, 0, format.height);

        if (isLandscape) {
          overlay.addColorStop(0, "rgba(2, 1, 4, 0.9)");
          overlay.addColorStop(0.46, "rgba(2, 1, 4, 0.52)");
          overlay.addColorStop(0.78, "rgba(2, 1, 4, 0.16)");
          overlay.addColorStop(1, "rgba(2, 1, 4, 0.04)");
        } else {
          overlay.addColorStop(0, "rgba(2, 1, 4, 0.04)");
          overlay.addColorStop(format.key === "feed" ? 0.36 : 0.42, "rgba(2, 1, 4, 0.43)");
          overlay.addColorStop(format.key === "feed" ? 0.68 : 0.72, "rgba(2, 1, 4, 0.82)");
          overlay.addColorStop(1, "rgba(2, 1, 4, 0.97)");
        }
        ctx.fillStyle = overlay;
        ctx.fillRect(0, 0, format.width, format.height);

        const sideShade = ctx.createLinearGradient(0, 0, format.width, 0);
        sideShade.addColorStop(0, isLandscape ? "rgba(2, 1, 4, 0.34)" : "rgba(2, 1, 4, 0.42)");
        sideShade.addColorStop(0.5, "rgba(2, 1, 4, 0.08)");
        sideShade.addColorStop(1, isLandscape ? "rgba(2, 1, 4, 0.06)" : "rgba(2, 1, 4, 0.32)");
        ctx.fillStyle = sideShade;
        ctx.fillRect(0, 0, format.width, format.height);

        drawCardBranding(ctx, format, layout);

        ctx.fillStyle = "#ffffff";
        const headline = form.card_headline || form.title;
        const headlineSize = fitFontSize(
          ctx,
          headline,
          layout.textWidth,
          layout.headlineSize,
          Math.round(layout.headlineSize * 0.82),
          layout.headlineMaxLines,
          800,
        );
        const headlineLineHeight = Math.round(layout.headlineLineHeight * (headlineSize / layout.headlineSize));
        ctx.font = `800 ${headlineSize}px Arial`;
        ctx.shadowColor = "rgba(0, 0, 0, 0.46)";
        ctx.shadowBlur = Math.round(headlineSize * 0.2);
        let y = drawWrappedText(ctx, headline, layout.textX, layout.textStart, layout.textWidth, headlineLineHeight, layout.headlineMaxLines);
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#d4d4d8";
        ctx.font = `500 ${layout.bodySize}px Arial`;
        y = drawSubtextWithNumberAccent(
          ctx,
          form.card_subtext || form.short_fact,
          layout.textX,
          y + layout.bodySize * 0.9,
          layout.textWidth,
          layout.bodySize,
          layout.bodyLineHeight,
        );

        if (form.card_curiosity_line) {
          ctx.save();
          ctx.globalAlpha = 0.82;
          ctx.fillStyle = "#d8b4fe";
          ctx.font = `600 ${layout.curiositySize}px Arial`;
          const curiosityY = y + layout.curiositySize * (isLandscape ? 0.85 : 0.75);
          const curiosityMaxLines = format.key === "story" ? 1 : isLandscape ? 1 : 2;
          if (curiosityY + layout.curiosityLineHeight * curiosityMaxLines < layout.ctaY - layout.ctaSize * 1.25) {
            drawWrappedText(ctx, form.card_curiosity_line, layout.textX, curiosityY, layout.textWidth, layout.curiosityLineHeight, curiosityMaxLines);
          }
          ctx.restore();
        }

        if (form.card_cta) {
          ctx.save();
          ctx.globalAlpha = 0.92;
          ctx.fillStyle = "#ffffff";
          ctx.font = `700 ${layout.ctaSize}px Arial`;
          ctx.fillText(form.card_cta, layout.textX, layout.ctaY);
          ctx.restore();
        }
      };

      drawBase();
      if (form.image_url) {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
          const layout = getCardLayout(format);
          drawImageCover(ctx, image, format.width, format.height, layout.imageFocusX, layout.imageFocusY);
          drawOverlay();
        };
        image.onerror = drawOverlay;
        image.src = form.image_url;
      } else {
        drawOverlay();
      }
    }
  }, [form]);

  const updateForm = <K extends keyof DailySpaceFact>(key: K, value: DailySpaceFact[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleSelectedFact = (id: string, checked: boolean) => {
    setSelectedFactIds((current) => {
      if (checked) return Array.from(new Set([...current, id]));
      return current.filter((item) => item !== id);
    });
  };

  const saveFact = async (nextForm = form) => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(nextForm.id ? `/admin/api/daily-facts/${nextForm.id}` : "/admin/api/daily-facts", {
        method: nextForm.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextForm),
      });
      const result = await response.json() as { success?: boolean; fact?: DailySpaceFact; error?: string };
      if (!response.ok || !result.fact) throw new Error(result.error || "Save failed.");
      const savedFact = result.fact;

      setFacts((current) => {
        const index = current.findIndex((fact) => fact.id === savedFact.id);
        if (index >= 0) {
          const next = [...current];
          next[index] = savedFact;
          return sortFactsByPublishDate(next);
        }
        return sortFactsByPublishDate([savedFact, ...current]);
      });
      setSelectedId(savedFact.id);
      setForm(savedFact);
      setMessage("Saved.");
      return savedFact;
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Save failed.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action: "ready" | "publish" | "archive") => {
    if (action === "publish" && !window.confirm("Publish the full post publicly?")) return;
    if (action === "archive" && !window.confirm("Archive this daily fact?")) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/admin/api/daily-facts/${form.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json() as { fact?: DailySpaceFact; error?: string };
      if (!response.ok || !result.fact) throw new Error(result.error || "Action failed.");
      setFacts((current) => sortFactsByPublishDate(current.map((fact) => fact.id === result.fact?.id ? result.fact : fact)));
      setForm(result.fact);
      setMessage(action === "publish" ? "Full post published." : action === "archive" ? "Archived." : "Marked ready.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Action failed.");
    } finally {
      setSaving(false);
    }
  };

  const runQuickAction = async (fact: DailySpaceFact, action: "publish" | "archive") => {
    if (action === "publish" && !window.confirm(`Publish the full post for "${fact.title}"?`)) return;
    if (action === "archive" && !window.confirm(`Archive "${fact.title}"?`)) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/admin/api/daily-facts/${fact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json() as { fact?: DailySpaceFact; error?: string };
      if (!response.ok || !result.fact) throw new Error(result.error || "Action failed.");
      setFacts((current) => sortFactsByPublishDate(current.map((item) => item.id === result.fact?.id ? result.fact : item)));
      if (form.id === result.fact.id) setForm(result.fact);
      setMessage(action === "publish" ? "Full post published." : "Archived.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Action failed.");
    } finally {
      setSaving(false);
    }
  };

  const deleteFacts = async (ids: string[]) => {
    const cleanIds = Array.from(new Set(ids.filter(Boolean)));
    if (cleanIds.length === 0) return;

    const label = cleanIds.length === 1
      ? facts.find((fact) => fact.id === cleanIds[0])?.title || "this daily fact"
      : `${cleanIds.length} daily facts`;
    if (!window.confirm(`Delete ${label} from Supabase? This cannot be undone.`)) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/admin/api/daily-facts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: cleanIds }),
      });
      const result = await response.json() as { success?: boolean; deleted?: number; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || "Delete failed.");

      const remaining = facts.filter((fact) => !cleanIds.includes(fact.id));
      setFacts(remaining);
      setSelectedFactIds((current) => current.filter((id) => !cleanIds.includes(id)));
      setPage((current) => Math.min(current, Math.max(1, Math.ceil(remaining.length / FACTS_PER_PAGE))));
      if (cleanIds.includes(form.id)) {
        const next = remaining[0] ?? emptyFact();
        setSelectedId(next.id);
        setForm(next);
      }
      setMessage(`Deleted ${result.deleted ?? cleanIds.length} daily fact${(result.deleted ?? cleanIds.length) === 1 ? "" : "s"}.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Delete failed.");
    } finally {
      setSaving(false);
    }
  };

  const generateContent = async () => {
    setGeneratingContent(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/ai/generate-fact-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, short_fact: form.short_fact }),
      });
      const result = await response.json() as Partial<DailySpaceFact> & { error?: string };
      if (!response.ok) throw new Error(result.error || "AI generation failed.");
      setForm((current) => ({
        ...current,
        detailed_explanation: result.detailed_explanation || current.detailed_explanation,
        facebook_caption: result.facebook_caption || current.facebook_caption,
        instagram_caption: result.instagram_caption || current.instagram_caption,
        tiktok_caption: result.tiktok_caption || current.tiktok_caption,
        youtube_caption: result.youtube_caption || current.youtube_caption,
        hashtags: Array.isArray(result.hashtags) ? result.hashtags : current.hashtags,
        card_headline: result.card_headline || current.card_headline,
        card_subtext: result.card_subtext || current.card_subtext,
        card_curiosity_line: result.card_curiosity_line || current.card_curiosity_line,
        card_cta: result.card_cta || current.card_cta || DEFAULT_CARD_CTA,
        leonardo_prompt: result.leonardo_prompt || current.leonardo_prompt,
        status: current.status === "published" ? current.status : "needs_review",
      }));
      setMessage("AI draft fields generated. Review and save when ready.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "AI generation failed.");
    } finally {
      setGeneratingContent(false);
    }
  };

  const generateCardCopy = async () => {
    setGeneratingCardCopy(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/ai/generate-fact-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, short_fact: form.short_fact }),
      });
      const result = await response.json() as Partial<DailySpaceFact> & { error?: string };
      if (!response.ok) throw new Error(result.error || "AI card copy generation failed.");

      setForm((current) => ({
        ...current,
        card_headline: result.card_headline || current.card_headline,
        card_subtext: result.card_subtext || current.card_subtext,
        card_curiosity_line: result.card_curiosity_line || current.card_curiosity_line,
        card_cta: result.card_cta || current.card_cta || DEFAULT_CARD_CTA,
      }));
      setMessage("Card copy generated. Review and save when ready.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "AI card copy generation failed.");
    } finally {
      setGeneratingCardCopy(false);
    }
  };

  const generateImage = async () => {
    setGeneratingImage(true);
    setError("");
    setMessage("");

    try {
      const saved = await saveFact(form);
      const factId = saved?.id || form.id;
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factId, leonardo_prompt: form.leonardo_prompt }),
      });
      const result = await response.json() as { image_url?: string; fact?: DailySpaceFact; error?: string; message?: string };
      if (!response.ok && response.status !== 202) throw new Error(result.error || "Image generation failed.");
      if (result.fact) {
        setFacts((current) => sortFactsByPublishDate(current.map((fact) => fact.id === result.fact?.id ? result.fact : fact)));
        setForm(result.fact);
      } else if (result.image_url) {
        updateForm("image_url", result.image_url);
      }
      setMessage(result.message || "Image generated.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Image generation failed.");
    } finally {
      setGeneratingImage(false);
    }
  };

  const downloadCard = (key: CardKey) => {
    const canvas = canvasRefs.current[key];
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${form.slug || "daily-space-fact"}-${key}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
      <aside className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_38px_rgba(124,58,237,0.16)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">Daily Facts</p>
            <p className="mt-1 text-xs text-zinc-400">
              {facts.length} total · showing {facts.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + FACTS_PER_PAGE, facts.length)}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {selectedFactIds.length > 0 ? (
              <button
                type="button"
                onClick={() => deleteFacts(selectedFactIds)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200/35 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-rose-100 disabled:opacity-60"
              >
                <Trash2 className="size-3.5" />
                Delete {selectedFactIds.length}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                const next = emptyFact();
                setFacts((current) => sortFactsByPublishDate([next, ...current]));
                setPage(1);
                setSelectedId("");
                setForm(next);
              }}
              className="rounded-full border border-white/12 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
            >
              New
            </button>
          </div>
        </div>
        {facts.length > FACTS_PER_PAGE ? (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-3 py-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
              className="rounded-full border border-white/12 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-xs font-semibold text-zinc-300">
              Page {currentPage} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={currentPage === pageCount}
              className="rounded-full border border-white/12 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
        <div className="mt-4 space-y-3">
          {facts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/12 p-5 text-sm leading-6 text-zinc-400">
              No daily facts found.
            </div>
          ) : visibleFacts.map((fact) => (
            <article
              key={fact.id || fact.title}
              className={`rounded-2xl border p-4 text-left transition ${
                fact.id === form.id
                  ? "border-violet-200/60 bg-violet-400/12"
                  : "border-white/10 bg-black/25 hover:border-violet-200/45"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <label className="flex min-w-0 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedFactIds.includes(fact.id)}
                    onChange={(event) => toggleSelectedFact(fact.id, event.target.checked)}
                    className="size-4 shrink-0"
                    aria-label={`Select ${fact.title}`}
                  />
                  <span className="truncate text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">{fact.publish_date}</span>
                </label>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${statusClasses(fact.status)}`}>
                  {fact.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-semibold text-white">{fact.title}</p>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-400">{fact.short_fact}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(fact.id);
                    setForm(fact);
                    setMessage("");
                    setError("");
                  }}
                  className="rounded-full border border-white/12 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-200"
                >
                  Select
                </button>
                <Link
                  href={`/admin/daily-facts/${fact.id}`}
                  className="rounded-full border border-white/12 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-200"
                >
                  Edit
                </Link>
                {fact.status === "published" ? (
                  <Link
                    href={`/daily-facts/${fact.slug}`}
                    className="rounded-full border border-violet-200/30 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-100"
                  >
                    Preview
                  </Link>
                ) : null}
                {fact.status !== "published" && fact.status !== "archived" ? (
                  <button
                    type="button"
                    onClick={() => runQuickAction(fact, "publish")}
                    className="rounded-full border border-violet-200/30 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-100"
                  >
                    Publish
                  </button>
                ) : null}
                {fact.status !== "archived" ? (
                  <button
                    type="button"
                    onClick={() => runQuickAction(fact, "archive")}
                    className="rounded-full border border-rose-200/30 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-rose-100"
                  >
                    Archive
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => deleteFacts([fact.id])}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/40 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-rose-100 disabled:opacity-60"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
        {facts.length > FACTS_PER_PAGE ? (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-3 py-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
              className="rounded-full border border-white/12 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-xs font-semibold text-zinc-300">
              {pageStart + 1}-{Math.min(pageStart + FACTS_PER_PAGE, facts.length)} of {facts.length}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              disabled={currentPage === pageCount}
              className="rounded-full border border-white/12 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </aside>

      <section className="space-y-6">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_38px_rgba(124,58,237,0.16)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">Editor</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{form.title || "New daily fact"}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => saveFact()} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-black disabled:opacity-60">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save Draft
              </button>
              <button type="button" onClick={() => runAction("ready")} disabled={saving || !form.id} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-200/30 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-100 disabled:opacity-60">
                <Check className="size-4" /> Mark Ready
              </button>
              <button type="button" onClick={() => runAction("publish")} disabled={saving || !form.id} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-violet-200/40 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-100 disabled:opacity-60">
                <Send className="size-4" /> Publish Full Post
              </button>
              <button type="button" onClick={() => runAction("archive")} disabled={saving || !form.id} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-rose-200/30 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-rose-100 disabled:opacity-60">
                <Archive className="size-4" /> Archive
              </button>
            </div>
          </div>
          {message ? <p className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{message}</p> : null}
          {error ? <p className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p> : null}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Title" value={form.title} onChange={(value) => updateForm("title", value)} />
            <Field label="Publish date" type="date" value={form.publish_date} onChange={(value) => updateForm("publish_date", value)} />
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">Status</span>
              <select value={form.status} onChange={(event) => updateForm("status", event.target.value as DailyFactStatus)} className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none">
                {["scheduled", "live_short_fact", "needs_review", "ready", "published", "archived"].map((status) => (
                  <option key={status} value={status} className="bg-[#08060f]">{status.replace(/_/g, " ")}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-3 self-end rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
              <input type="checkbox" checked={form.is_homepage_fact} onChange={(event) => updateForm("is_homepage_fact", event.target.checked)} className="size-4" />
              <span className="text-sm text-zinc-300">Homepage fact</span>
            </label>
          </div>

          <div className="mt-4 grid gap-4">
            <TextField label="Short fact" value={form.short_fact} rows={3} onChange={(value) => updateForm("short_fact", value)} />
            <TextField label="Detailed explanation" value={form.detailed_explanation} rows={textAreaRows(form.detailed_explanation, 6)} onChange={(value) => updateForm("detailed_explanation", value)} />
            <TextField label="Source notes" value={form.source_notes} rows={3} onChange={(value) => updateForm("source_notes", value)} />
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_38px_rgba(124,58,237,0.16)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">AI Draft Pack</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">AI outputs remain draft-only until you publish.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={generateContent} disabled={generatingContent || !form.title || !form.short_fact} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-violet-200/35 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-100 disabled:opacity-60">
                {generatingContent ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />} Generate AI Content
              </button>
              <button type="button" onClick={generateImage} disabled={generatingImage || !form.leonardo_prompt} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-amber-200/35 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-100 disabled:opacity-60">
                {generatingImage ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />} Generate Image
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <TextField label="Facebook caption" value={form.facebook_caption} rows={4} onChange={(value) => updateForm("facebook_caption", value)} />
            <TextField label="Instagram caption" value={form.instagram_caption} rows={4} onChange={(value) => updateForm("instagram_caption", value)} />
            <TextField label="TikTok caption" value={form.tiktok_caption} rows={4} onChange={(value) => updateForm("tiktok_caption", value)} />
            <TextField label="YouTube caption" value={form.youtube_caption} rows={4} onChange={(value) => updateForm("youtube_caption", value)} />
          </div>
          <div className="mt-4 grid gap-4">
            <Field label="Hashtags" value={form.hashtags.join(", ")} onChange={(value) => updateForm("hashtags", value.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean))} />
            <TextField label="Leonardo AI image prompt" value={form.leonardo_prompt} rows={4} onChange={(value) => updateForm("leonardo_prompt", value)} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Image URL" value={form.image_url} onChange={(value) => updateForm("image_url", value)} />
              <Field label="Image alt text" value={form.image_alt} onChange={(value) => updateForm("image_alt", value)} />
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_38px_rgba(124,58,237,0.16)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-violet-100">
              <WandSparkles className="size-5" />
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Social Card Preview</p>
            </div>
            <button
              type="button"
              onClick={generateCardCopy}
              disabled={generatingCardCopy || !form.title || !form.short_fact}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-violet-200/35 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-100 disabled:opacity-60"
            >
              {generatingCardCopy ? <Loader2 className="size-4 animate-spin" /> : <Bot className="size-4" />}
              Generate Card Copy
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Card headline" value={form.card_headline} onChange={(value) => updateForm("card_headline", value)} />
            <Field label="Card subtext" value={form.card_subtext} onChange={(value) => updateForm("card_subtext", value)} />
            <Field label="Curiosity line" value={form.card_curiosity_line} onChange={(value) => updateForm("card_curiosity_line", value)} />
            <Field label="Card CTA" value={form.card_cta} onChange={(value) => updateForm("card_cta", value)} />
          </div>
          <div className="mt-6 grid gap-5 xl:grid-cols-3">
            {cardFormats.map((format) => (
              <div key={format.key} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-white">{format.label}</p>
                    <p className="mt-1 text-xs text-zinc-400">{format.width}x{format.height}</p>
                  </div>
                  <button type="button" onClick={() => downloadCard(format.key)} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/12 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                    <Download className="size-4" /> Download
                  </button>
                </div>
                <canvas
                  ref={(node) => {
                    canvasRefs.current[format.key] = node;
                  }}
                  className="mt-4 w-full rounded-xl border border-white/10 bg-black"
                  style={{ aspectRatio: `${format.width} / ${format.height}` }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
      />
    </label>
  );
}

function TextField({ label, value, onChange, rows }: {
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-violet-200/70"
      />
    </label>
  );
}

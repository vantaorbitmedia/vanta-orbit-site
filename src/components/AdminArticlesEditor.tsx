"use client";

import Link from "next/link";
import { Calendar, FileText, Search, Trash2, TriangleAlert, X } from "lucide-react";
import { useMemo, useState } from "react";
import { formatTopicLabel, type ArticleItem } from "@/lib/content";

type EditableArticle = {
  slug: string;
  title: string;
  date: string;
  description: string;
  relatedVideoId: string;
  topic: ArticleItem["topic"];
};

type DeleteState = {
  status: "idle" | "deleting" | "deleted" | "error";
  message: string;
};

function toEditableArticle(article: ArticleItem): EditableArticle {
  return {
    slug: article.slug,
    title: article.title,
    date: article.date,
    description: article.description,
    relatedVideoId: article.relatedVideoId,
    topic: article.topic,
  };
}

export default function AdminArticlesEditor({ articles }: { articles: ArticleItem[] }) {
  const [items, setItems] = useState<EditableArticle[]>(() => articles.map(toEditableArticle));
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "title">("newest");
  const [confirmingDeleteSlug, setConfirmingDeleteSlug] = useState<string | null>(null);
  const [deleteStates, setDeleteStates] = useState<Record<string, DeleteState>>({});

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...items]
      .filter((article) => {
        if (!query) return true;
        return article.title.toLowerCase().includes(query) || article.slug.toLowerCase().includes(query);
      })
      .sort((left, right) => {
        if (sortOrder === "title") return left.title.localeCompare(right.title);

        const leftTime = new Date(left.date).getTime();
        const rightTime = new Date(right.date).getTime();
        return sortOrder === "newest" ? rightTime - leftTime : leftTime - rightTime;
      });
  }, [items, search, sortOrder]);

  const deleteArticle = async (article: EditableArticle) => {
    setDeleteStates((current) => ({
      ...current,
      [article.slug]: { status: "deleting", message: "Deleting..." },
    }));

    const response = await fetch(`/admin/api/articles/${encodeURIComponent(article.slug)}`, {
      method: "DELETE",
    });
    const result = (await response.json()) as { error?: string; warning?: string };

    if (!response.ok) {
      setDeleteStates((current) => ({
        ...current,
        [article.slug]: {
          status: "error",
          message: result.error || "Delete failed.",
        },
      }));
      return;
    }

    setItems((current) => current.filter((item) => item.slug !== article.slug));
    setDeleteStates((current) => {
      const next = { ...current };
      delete next[article.slug];
      return next;
    });
    setConfirmingDeleteSlug(null);

    if (result.warning) {
      setDeleteStates((current) => ({
        ...current,
        [article.slug]: { status: "error", message: result.warning ?? "" },
      }));
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-white/10 bg-black/55 p-6 shadow-[0_0_42px_rgba(124,58,237,0.18)] backdrop-blur-xl">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_13rem]">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Search title or slug
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] pl-11 pr-4 text-white outline-none transition focus:border-violet-200/70"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Sort
            </span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as "newest" | "oldest" | "title")}
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition focus:border-violet-200/70"
            >
              <option value="newest" className="bg-[#08060f]">Newest</option>
              <option value="oldest" className="bg-[#08060f]">Oldest</option>
              <option value="title" className="bg-[#08060f]">Title</option>
            </select>
          </label>
        </div>

        <p className="mt-4 text-sm leading-6 text-zinc-400">
          Showing {filteredArticles.length} of {items.length} articles.
        </p>
      </section>

      <section className="grid gap-5">
        {filteredArticles.map((article) => {
          const deleteState = deleteStates[article.slug] ?? { status: "idle", message: "" };

          return (
            <article
              key={article.slug}
              className="rounded-[1.5rem] border border-white/10 bg-black/55 p-5 shadow-[0_0_42px_rgba(124,58,237,0.16)] backdrop-blur-xl"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                    <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1 text-violet-100">
                      <FileText className="size-4" />
                      {formatTopicLabel(article.topic)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Calendar className="size-4" />
                      {article.date}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold text-white">{article.title}</h2>
                  <p className="mt-2 break-all text-xs leading-5 text-violet-200">{article.slug}</p>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">{article.description}</p>
                  {article.relatedVideoId ? (
                    <p className="mt-3 text-xs leading-5 text-zinc-500">
                      Related video ID: <span className="text-zinc-300">{article.relatedVideoId}</span>
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3 lg:justify-end">
                  <Link
                    href={`/blog/${article.slug}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteSlug(article.slug)}
                    disabled={deleteState.status === "deleting"}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-rose-300/30 bg-rose-400/10 px-5 text-xs font-bold uppercase tracking-[0.16em] text-rose-100 transition hover:border-rose-200/70 hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </button>
                </div>
              </div>

              {confirmingDeleteSlug === article.slug ? (
                <div className="mt-5 rounded-[1.25rem] border border-rose-400/30 bg-rose-400/10 p-4 text-sm leading-6 text-rose-100">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em]">Are you sure?</p>
                      <p className="mt-2">
                        This will delete &quot;{article.title || article.slug}&quot; and detach any linked video.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => deleteArticle(article)}
                        disabled={deleteState.status === "deleting"}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-rose-100 px-4 text-xs font-bold uppercase tracking-[0.16em] text-rose-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="size-4" />
                        Yes, delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteSlug(null)}
                        disabled={deleteState.status === "deleting"}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/15 px-4 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <X className="size-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {deleteState.message ? (
                <div className="mt-5 rounded-[1.25rem] border border-rose-400/25 bg-rose-400/10 p-4 text-sm leading-6 text-rose-100">
                  <div className="flex items-center gap-2">
                    <TriangleAlert className="size-4" />
                    <p>{deleteState.message}</p>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}

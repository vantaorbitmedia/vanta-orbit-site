import type { Metadata } from "next";
import Link from "next/link";
import AdminArticlesEditor from "@/components/AdminArticlesEditor";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { requireAdminSession } from "@/lib/admin-auth";
import { articles } from "@/lib/content";

export const metadata: Metadata = {
  title: "Edit Articles",
  description: "Private Vanta Orbit Media article editor.",
};

export default async function EditArticlesPage() {
  await requireAdminSession();

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.22),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(88,28,135,0.16),transparent_26%),linear-gradient(180deg,rgba(4,3,8,0.96),rgba(1,1,4,1))]" />
      <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-position:0_0] [background-size:38px_38px]" />

      <section className="relative mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-black/55 p-6 shadow-[0_0_55px_rgba(124,58,237,0.18)] backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
              <Link href="/admin/dashboard" className="transition hover:text-white">
                Admin
              </Link>
              <span>/</span>
              <span>Edit Articles</span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-[0.14em] text-white sm:text-4xl">
              Manage Deep Dive Articles
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
              Search and delete duplicate or messy deep dive articles. Deleted articles are removed from the article data source and detached from linked videos.
            </p>
          </div>
          <AdminLogoutButton />
        </div>

        <div className="mt-8">
          <AdminArticlesEditor articles={articles} />
        </div>
      </section>
    </main>
  );
}

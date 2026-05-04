import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdminDailyFacts from "@/components/AdminDailyFacts";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { requireAdminSession } from "@/lib/admin-auth";
import { getDailyFactById, listDailyFacts } from "@/lib/daily-space-facts";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const fact = await getDailyFactById(id);
  return { title: fact ? `Edit ${fact.title}` : "Edit Daily Fact" };
}

export default async function AdminDailyFactEditPage({ params }: Props) {
  await requireAdminSession();
  const { id } = await params;
  const [facts, fact] = await Promise.all([listDailyFacts(), getDailyFactById(id)]);
  if (!fact) notFound();

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.22),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(88,28,135,0.16),transparent_26%),linear-gradient(180deg,rgba(4,3,8,0.96),rgba(1,1,4,1))]" />
      <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-position:0_0] [background-size:38px_38px]" />

      <section className="relative mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-black/55 p-6 shadow-[0_0_55px_rgba(124,58,237,0.18)] backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
              <Link href="/admin/dashboard" className="transition hover:text-white">Admin</Link>
              <span>/</span>
              <Link href="/admin/daily-facts" className="transition hover:text-white">Daily Space Facts</Link>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-[0.14em] text-white sm:text-4xl">
              Edit Daily Fact
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
              Review and publish the full version only when it is ready.
            </p>
          </div>
          <AdminLogoutButton />
        </div>

        <div className="mt-8">
          <AdminDailyFacts initialFacts={facts} initialFactId={fact.id} />
        </div>
      </section>
    </main>
  );
}

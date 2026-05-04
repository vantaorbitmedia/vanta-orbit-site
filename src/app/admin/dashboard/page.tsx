import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, CalendarDays, FileText, FlaskConical, FileJson, ImageIcon, PencilLine, Sparkles, WandSparkles } from "lucide-react";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import { requireAdminSession } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Private Vanta Orbit Media dashboard.",
};

const dashboardCards = [
  {
    href: "/admin/video-generator",
    title: "Video Generator",
    description: "Build hooks, scripts, AI prompts, captions, and thumbnail copy for the next story.",
    icon: WandSparkles,
    status: "Ready now",
  },
  {
    href: "/admin/video-manager",
    title: "Video Manager",
    description: "Generate structured video and deep-dive JSON, preview entries, and validate metadata before you paste.",
    icon: FileJson,
    status: "Ready now",
  },
  {
    href: "/admin/image-generator",
    title: "Image Generator",
    description: "Send prompts to Leonardo from a private server-side route and inspect the raw generation response.",
    icon: ImageIcon,
    status: "Ready now",
  },
  {
    href: "/admin/daily-facts",
    title: "Daily Space Facts",
    description: "Schedule homepage facts, review expanded drafts, publish full posts, and export social cards.",
    icon: Sparkles,
    status: "Ready now",
  },
  {
    href: "/admin/edit-videos",
    title: "Edit Videos",
    description: "Search existing uploads, repair metadata, and save changes back to the live video data source.",
    icon: PencilLine,
    status: "Ready now",
  },
  {
    href: "/admin/edit-articles",
    title: "Edit Articles",
    description: "Find and delete duplicate deep dives, then detach linked videos cleanly.",
    icon: FileText,
    status: "Ready now",
  },
  {
    href: "/admin/hook-lab",
    title: "Hook Lab",
    description: "Track hook performance, score winners, and turn audience data into better future hooks.",
    icon: FlaskConical,
    status: "Ready now",
  },
  {
    href: "#",
    title: "Future Content Planner",
    description: "Map topics, release windows, series arcs, and platform-specific publishing beats.",
    icon: CalendarDays,
    status: "Coming next",
  },
  {
    href: "#",
    title: "Future Analytics Tracker",
    description: "Track retention, watch-through, click-through, and topic performance once connected.",
    icon: BarChart3,
    status: "Coming next",
  },
];

export default async function AdminDashboardPage() {
  await requireAdminSession();

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.22),transparent_34%),radial-gradient(circle_at_85%_18%,rgba(88,28,135,0.18),transparent_26%),linear-gradient(180deg,rgba(4,3,8,0.96),rgba(1,1,4,1))]" />
      <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] [background-position:0_0] [background-size:38px_38px]" />

      <section className="relative mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-black/55 p-6 shadow-[0_0_55px_rgba(124,58,237,0.18)] backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-200">Private Dashboard</p>
            <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-[0.14em] text-white sm:text-4xl">
              Internal Vanta Orbit tools
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
              A private workspace for shaping cinematic space stories, planning future releases, and growing the media engine behind the brand.
            </p>
          </div>
          <AdminLogoutButton />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {dashboardCards.map(({ href, title, description, icon: Icon, status }) => {
            const isReady = href !== "#";

            return (
              <article
                key={title}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_40px_rgba(124,58,237,0.15)] backdrop-blur-xl"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="grid size-12 place-items-center rounded-2xl border border-violet-200/20 bg-violet-400/10 text-violet-100">
                    <Icon className="size-6" />
                  </div>
                  <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-300">
                    {status}
                  </span>
                </div>
                <h2 className="mt-6 font-display text-2xl font-bold uppercase tracking-[0.12em] text-white">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-300">{description}</p>
                {isReady ? (
                  <Link
                    href={href}
                    className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-xs font-bold uppercase tracking-[0.16em] text-black shadow-[0_0_28px_rgba(168,85,247,0.35)] transition hover:-translate-y-0.5 hover:bg-violet-100"
                  >
                    Open tool
                  </Link>
                ) : (
                  <div className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 px-5 text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                    Planned
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

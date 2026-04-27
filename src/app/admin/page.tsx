import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminEnvConfigured, isAuthenticatedAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Private Vanta Orbit Media admin login.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAuthenticatedAdmin()) {
    redirect("/admin/dashboard");
  }

  const params = await searchParams;
  const errorMessage = params.error;

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-4 pb-20 pt-32 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.2),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(76,29,149,0.22),transparent_28%),linear-gradient(180deg,rgba(4,3,8,0.96),rgba(1,1,4,1))]" />
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.15)_1px,transparent_1px)] [background-position:0_0] [background-size:36px_36px]" />

      <section className="relative mx-auto max-w-md rounded-[2rem] border border-white/10 bg-black/65 p-7 shadow-[0_0_60px_rgba(124,58,237,0.22)] backdrop-blur-xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-violet-200">Private Admin</p>
        <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-[0.14em] text-white">
          Vanta Orbit Control
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-300">
          Sign in to access the private generator, planning tools, and future analytics workspace.
        </p>

        {!isAdminEnvConfigured() ? (
          <div className="mt-6 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
            `ADMIN_PASSWORD`, `SESSION_SECRET`, and `ADMIN_2FA_SECRET` need to be set in `.env.local` before admin access can work.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-6 rounded-3xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm leading-6 text-rose-100">
            {errorMessage}
          </div>
        ) : null}

        <form action="/admin/login" method="post" className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              Password
            </span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-200/70"
              placeholder="Enter admin password"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
              2FA Code
            </span>
            <input
              type="text"
              name="twoFactorCode"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              required
              className="min-h-12 w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-200/70"
              placeholder="Enter 6-digit code"
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 text-sm font-bold uppercase tracking-[0.18em] text-black shadow-[0_0_32px_rgba(168,85,247,0.45)] transition hover:-translate-y-0.5 hover:bg-violet-100"
          >
            Login
          </button>
        </form>
      </section>
    </main>
  );
}

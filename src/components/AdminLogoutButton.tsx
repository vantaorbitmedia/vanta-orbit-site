export default function AdminLogoutButton() {
  return (
    <form action="/admin/logout" method="post">
      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-violet-200/70 hover:bg-violet-400/10"
      >
        Logout
      </button>
    </form>
  );
}

import { Camera, Music2, Play, Share2 } from "lucide-react";

const socialLinks = [
  {
    href: "https://www.youtube.com/@VantaOrbitMedia",
    icon: Play,
    label: "YouTube",
    glow: "hover:shadow-[0_0_30px_rgba(255,0,0,0.6)]",
    ring: "hover:ring-1 hover:ring-red-500/40",
  },
  {
    href: "https://www.instagram.com/vantaorbitmedia",
    icon: Camera,
    label: "Instagram",
    glow: "hover:shadow-[0_0_30px_rgba(225,48,108,0.6)]",
    ring: "hover:ring-1 hover:ring-pink-500/40",
  },
  {
    href: "https://www.tiktok.com/@vantaorbitmedia",
    icon: Music2,
    label: "TikTok",
    glow: "hover:shadow-[0_0_30px_rgba(0,255,255,0.5)]",
    ring: "hover:ring-1 hover:ring-cyan-400/40",
  },
  {
    href: "https://www.facebook.com/vantaorbitmedia",
    icon: Share2,
    label: "Facebook",
    glow: "hover:shadow-[0_0_30px_rgba(24,119,242,0.6)]",
    ring: "hover:ring-1 hover:ring-blue-500/40",
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-lg font-bold uppercase tracking-[0.28em] text-white">
            Vanta Orbit Media
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
            Cinematic space facts, science stories, and deeper breakdowns from Earth to the unknown.
          </p>
        </div>
        <div className="md:text-right">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-violet-200/80">
            Follow the journey
          </p>
          <div className="flex items-center gap-3 md:justify-end">
 {socialLinks.map(({ href, icon: Icon, label, glow, ring }) => (
<a
  key={label}
  href={href}
  target="_blank"
  rel="noopener noreferrer"
className={`relative group grid size-11 place-items-center rounded-full border border-white/12 bg-white/[0.04] text-zinc-200 backdrop-blur transition duration-300 hover:-translate-y-1 hover:scale-105 hover:text-white ${glow} ${ring}`}  aria-label={`Follow Vanta Orbit Media on ${label}`}
>
  <Icon className="size-5" />

  <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white opacity-0 shadow-[0_0_18px_rgba(168,85,247,0.25)] backdrop-blur transition duration-200 group-hover:opacity-100">
    {label}
  </span>
</a>
))}
        </div>
      </div>
      </div>
    </footer>
  );
}
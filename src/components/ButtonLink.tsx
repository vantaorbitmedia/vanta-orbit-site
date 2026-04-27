import Link from "next/link";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

export default function ButtonLink({
  href,
  children,
  variant = "primary",
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={clsx(
        "glow-pulse group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold uppercase tracking-[0.18em] transition duration-300 hover:-translate-y-0.5",
        variant === "primary"
          ? "bg-white text-black shadow-[0_0_26px_rgba(168,85,247,0.78),0_0_70px_rgba(168,85,247,0.24)] hover:bg-violet-100 hover:shadow-[0_0_34px_rgba(216,180,254,0.95),0_0_90px_rgba(168,85,247,0.34)]"
          : "border border-violet-200/35 bg-violet-300/10 text-white shadow-[0_0_24px_rgba(168,85,247,0.34)] backdrop-blur hover:border-violet-100 hover:bg-violet-300/18 hover:shadow-[0_0_36px_rgba(168,85,247,0.58)]",
      )}
    >
      {children}
      <ArrowRight className="size-4 transition group-hover:translate-x-1" />
    </Link>
  );
}

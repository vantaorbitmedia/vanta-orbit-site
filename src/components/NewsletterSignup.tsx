"use client";

import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { useState } from "react";

export default function NewsletterSignup() {
  const [message, setMessage] = useState("");

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden rounded-lg border border-violet-200/20 bg-white/[0.04] p-6 shadow-[0_0_60px_rgba(124,58,237,0.18)] backdrop-blur-xl md:p-10"
    >
      <div className="absolute -right-24 -top-24 size-72 rounded-full bg-violet-500/25 blur-3xl" />
      <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-300">
            Transmission
          </p>
          <h2 className="mt-3 font-display text-3xl font-bold uppercase tracking-[0.14em] text-white md:text-5xl">
            Join the Orbit
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
            Get the latest space stories, videos, and deep dives.
          </p>
        </div>
        <form
          className="grid gap-3 sm:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage("Newsletter signups are coming soon.");
          }}
        >
          <label className="relative">
            <Mail className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-violet-200" />
            <input
              type="email"
              placeholder="you@orbit.com"
              className="min-h-14 w-full rounded-full border border-white/15 bg-black/50 pl-12 pr-4 text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-200/70"
            />
          </label>
          <button
            type="submit"
            className="min-h-14 rounded-full bg-white px-6 text-sm font-bold uppercase tracking-[0.18em] text-black shadow-[0_0_30px_rgba(168,85,247,0.4)] transition hover:bg-violet-100"
          >
            Coming Soon
          </button>
        </form>
        {message ? (
          <p className="text-sm leading-6 text-violet-100 lg:col-start-2">{message}</p>
        ) : null}
      </div>
    </motion.section>
  );
}

"use client";

import { ImageIcon, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";

const aspectRatios = [
  { label: "1:1", width: 1024, height: 1024 },
  { label: "9:16", width: 832, height: 1472 },
  { label: "16:9", width: 1472, height: 832 },
] as const;

type AspectRatio = (typeof aspectRatios)[number]["label"];

function getAspectRatio(value: AspectRatio) {
  return aspectRatios.find((ratio) => ratio.label === value) ?? aspectRatios[0];
}

function getFriendlyError(value: unknown, fallback: string) {
  if (value && typeof value === "object" && "error" in value && typeof value.error === "string") {
    return value.error;
  }

  return fallback;
}

export default function LeonardoImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [responseJson, setResponseJson] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanPrompt = prompt.trim();

    if (!cleanPrompt) {
      setError("Enter a prompt before generating an image.");
      setResponseJson("");
      return;
    }

    const ratio = getAspectRatio(aspectRatio);
    setLoading(true);
    setError("");
    setResponseJson("");

    try {
      const response = await fetch("/api/leonardo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: cleanPrompt,
          negativePrompt: negativePrompt.trim() || undefined,
          width: ratio.width,
          height: ratio.height,
          numImages: 1,
        }),
      });

      const data = (await response.json()) as unknown;
      setResponseJson(JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(getFriendlyError(data, "Leonardo image generation failed."));
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Leonardo image generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_38px_rgba(124,58,237,0.16)] backdrop-blur-xl sm:p-6"
      >
        <div className="flex items-center gap-3 text-violet-100">
          <ImageIcon className="size-5" />
          <p className="text-xs font-bold uppercase tracking-[0.22em]">Image Prompt</p>
        </div>

        <label className="mt-5 block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-300">Prompt</span>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={7}
            className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-200/70"
            placeholder="A cinematic documentary-style view of..."
          />
        </label>

        <label className="mt-5 block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-300">Negative Prompt</span>
          <textarea
            value={negativePrompt}
            onChange={(event) => setNegativePrompt(event.target.value)}
            rows={4}
            className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-200/70"
            placeholder="text, captions, UI overlays, distorted geometry..."
          />
        </label>

        <fieldset className="mt-5">
          <legend className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-300">Aspect Ratio</legend>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {aspectRatios.map((ratio) => (
              <button
                key={ratio.label}
                type="button"
                onClick={() => setAspectRatio(ratio.label)}
                className={`min-h-12 rounded-2xl border px-3 text-xs font-bold uppercase tracking-[0.14em] transition ${
                  aspectRatio === ratio.label
                    ? "border-violet-100 bg-violet-200 text-violet-950"
                    : "border-white/12 bg-black/35 text-white hover:border-violet-200/60"
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-zinc-400">
            {getAspectRatio(aspectRatio).width}x{getAspectRatio(aspectRatio).height}
          </p>
        </fieldset>

        {error ? (
          <p className="mt-5 rounded-2xl border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-bold uppercase tracking-[0.16em] text-black shadow-[0_0_28px_rgba(168,85,247,0.35)] transition hover:-translate-y-0.5 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
          {loading ? "Generating" : "Generate Image"}
        </button>
      </form>

      <section className="rounded-[1.5rem] border border-white/10 bg-black/45 p-5 shadow-[0_0_38px_rgba(124,58,237,0.16)] backdrop-blur-xl sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-violet-200">Raw Generation Response</p>
        {responseJson ? (
          <pre className="mt-5 max-h-[42rem] overflow-auto rounded-2xl border border-white/10 bg-black/60 p-4 text-xs leading-6 text-zinc-200">
            <code>{responseJson}</code>
          </pre>
        ) : (
          <div className="mt-5 flex min-h-[24rem] items-center justify-center rounded-2xl border border-dashed border-white/12 bg-white/[0.03] p-6 text-center">
            <p className="max-w-sm text-sm leading-6 text-zinc-400">
              The Leonardo response will appear here after a request completes.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

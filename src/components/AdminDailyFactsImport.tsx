"use client";

import { Check, Loader2, Upload } from "lucide-react";
import { useMemo, useState } from "react";

type ImportResult = {
  success?: boolean;
  total?: number;
  valid?: number;
  imported?: number;
  skipped?: number;
  errors?: string[];
  skippedProtected?: string[];
  error?: string;
};

function validatePaste(value: string, options: { allowDuplicatePublishDates: boolean; allowDuplicateSlugs: boolean }) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return { parsed: null, errors: ["JSON must be an array."], count: 0 };
    }

    const errors: string[] = [];
    const dates = new Set<string>();
    const slugs = new Map<string, string>();

    parsed.forEach((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        errors.push(`Item ${index + 1}: expected an object.`);
        return;
      }
      const fact = item as Record<string, unknown>;
      const title = typeof fact.title === "string" ? fact.title.trim() : "";
      const shortFact = typeof fact.short_fact === "string" ? fact.short_fact.trim() : "";
      const publishDate = typeof fact.publish_date === "string" ? fact.publish_date.trim() : "";
      const slug = typeof fact.slug === "string" ? fact.slug.trim() : "";

      if (!title) errors.push(`Item ${index + 1}: title is required.`);
      if (!shortFact) errors.push(`Item ${index + 1}: short_fact is required.`);
      if (!publishDate) errors.push(`Item ${index + 1}: publish_date is required.`);
      if (!slug) errors.push(`Item ${index + 1}: slug is required.`);
      if (publishDate && dates.has(publishDate) && !options.allowDuplicatePublishDates) {
        errors.push(`Item ${index + 1}: duplicate publish_date ${publishDate}.`);
      }
      if (publishDate) dates.add(publishDate);
      if (slug && slugs.has(slug) && slugs.get(slug) !== publishDate && !options.allowDuplicateSlugs) {
        errors.push(`Item ${index + 1}: duplicate slug ${slug} on different dates.`);
      }
      if (slug) slugs.set(slug, publishDate);
    });

    return { parsed, errors, count: parsed.length };
  } catch (error) {
    return { parsed: null, errors: [error instanceof Error ? error.message : "Invalid JSON."], count: 0 };
  }
}

export default function AdminDailyFactsImport() {
  const [jsonText, setJsonText] = useState("");
  const [force, setForce] = useState(false);
  const [allowDuplicatePublishDates, setAllowDuplicatePublishDates] = useState(false);
  const [allowDuplicateSlugs, setAllowDuplicateSlugs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const validation = useMemo(
    () => validatePaste(jsonText, { allowDuplicatePublishDates, allowDuplicateSlugs }),
    [allowDuplicatePublishDates, allowDuplicateSlugs, jsonText],
  );

  const importFacts = async () => {
    if (!validation.parsed || validation.errors.length > 0) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/admin/api/daily-facts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facts: validation.parsed, force, allowDuplicatePublishDates, allowDuplicateSlugs }),
      });
      const data = await response.json() as ImportResult;
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : "Import failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_38px_rgba(124,58,237,0.16)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">JSON Import</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Paste Daily Space Facts</h2>
          </div>
          <button
            type="button"
            onClick={importFacts}
            disabled={loading || !validation.parsed || validation.errors.length > 0}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-bold uppercase tracking-[0.16em] text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Import
          </button>
        </div>

        <textarea
          value={jsonText}
          onChange={(event) => setJsonText(event.target.value)}
          rows={22}
          className="mt-5 w-full resize-y rounded-2xl border border-white/12 bg-black/45 p-4 font-mono text-xs leading-6 text-zinc-100 outline-none transition focus:border-violet-200/70"
          placeholder='[{"slug":"moon-drifting-away","title":"The Moon Is Slowly Leaving Us","short_fact":"...","publish_date":"2026-05-04"}]'
        />

        <div className="mt-4 grid gap-3">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <input type="checkbox" checked={force} onChange={(event) => setForce(event.target.checked)} className="size-4" />
            <span className="text-sm leading-6 text-zinc-300">
              Force overwrite protected live/published statuses
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <input
              type="checkbox"
              checked={allowDuplicatePublishDates}
              onChange={(event) => setAllowDuplicatePublishDates(event.target.checked)}
              className="size-4"
            />
            <span className="text-sm leading-6 text-zinc-300">
              Allow duplicate publish dates
            </span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <input
              type="checkbox"
              checked={allowDuplicateSlugs}
              onChange={(event) => setAllowDuplicateSlugs(event.target.checked)}
              className="size-4"
            />
            <span className="text-sm leading-6 text-zinc-300">
              Allow duplicate slugs across different dates
            </span>
          </label>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-200">Validation</p>
          <p className="mt-3 text-3xl font-semibold text-white">{validation.count}</p>
          <p className="text-sm text-zinc-400">records detected</p>
          {validation.errors.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-xs leading-5 text-rose-100">
              {validation.errors.slice(0, 12).map((error) => <p key={error}>{error}</p>)}
            </div>
          ) : validation.parsed ? (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              <Check className="size-4" />
              Ready to import
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-zinc-400">Paste a JSON array to preview import count.</p>
          )}
        </div>

        {result ? (
          <div className={`rounded-[1.5rem] border p-5 backdrop-blur-xl ${result.success ? "border-emerald-300/20 bg-emerald-400/10" : "border-rose-300/20 bg-rose-400/10"}`}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white">Result</p>
            {result.error ? <p className="mt-3 text-sm leading-6 text-rose-100">{result.error}</p> : null}
            <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-100">
              <p>Total: {result.total ?? 0}</p>
              <p>Valid: {result.valid ?? 0}</p>
              <p>Imported/updated: {result.imported ?? 0}</p>
              <p>Skipped protected: {result.skipped ?? 0}</p>
            </div>
            {result.errors && result.errors.length > 0 ? (
              <div className="mt-4 text-xs leading-5 text-rose-100">
                {result.errors.map((error) => <p key={error}>{error}</p>)}
              </div>
            ) : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}

"use client";
// Find in your materials (#32): a search box over the advisor's own sources.
// "/" focuses it from anywhere on the meeting screen; Escape clears it.
import { useMemo, useState } from "react";
import type { PrepSource } from "@/lib/types";
import { figureParts, findInMaterials } from "./find";
import { LABELS } from "./replay";

export const FIND_INPUT_ID = "find-in-materials";

export default function Find({ sources }: { sources: PrepSource[] }) {
  const [query, setQuery] = useState("");
  // Re-run only when the words or the materials change, not on every meeting update.
  const hits = useMemo(() => findInMaterials(sources, query), [sources, query]);
  const q = query.trim();

  return (
    <section aria-label="Find in your materials" className="mb-5">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 focus-within:border-sky-300/60">
        <input
          id={FIND_INPUT_ID}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setQuery("");
              e.currentTarget.blur();
            }
          }}
          placeholder="Find in your materials"
          aria-describedby={query.trim() ? undefined : "find-hint"}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
        <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-sans text-xs text-slate-400">/</kbd>
      </div>

      {!q && (
        <p id="find-hint" className="mt-2 px-1 text-xs text-slate-500">
          {sources.length
            ? "Type a word like reserve or tranches. Searches only your own materials, instantly."
            : "No materials loaded yet. Add them on the prep screen."}
        </p>
      )}

      {q && hits.length === 0 && (
        <p role="status" className="mt-2 px-1 text-sm text-slate-400">
          Nothing in your materials mentions &ldquo;{q}&rdquo;.
        </p>
      )}

      {hits.length > 0 && (
        <ul role="list" aria-label={`${hits.length} matches`} className="mt-3 space-y-2">
          {hits.map((h, i) => (
            <li key={`${h.sourceId}-${i}`} className={`border-l-2 pl-3 text-sm ${LABELS.PREPARED_FACT.rule}`}>
              <p className="text-slate-200">
                {figureParts(h.line).map((p, j) =>
                  p.figure ? (
                    <mark key={j} className="rounded bg-emerald-400/15 px-0.5 font-semibold text-emerald-200">
                      {p.text}
                    </mark>
                  ) : (
                    <span key={j}>{p.text}</span>
                  ),
                )}
              </p>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-emerald-200/70">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${LABELS.PREPARED_FACT.chip}`}>
                  {LABELS.PREPARED_FACT.text}
                </span>
                from {h.title}
                {h.date ? ` · ${h.date}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

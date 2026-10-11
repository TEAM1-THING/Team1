"use client";
// Find in your materials (#32): a search box over the advisor's own sources.
// "/" focuses it from anywhere on the meeting screen; Escape clears it.
import { useMemo, useState } from "react";
import type { PrepSource } from "@/lib/types";
import { figureParts, findInMaterials } from "./findMatches";
import { LABELS } from "./replay";
import { ui } from "./ui";

export const FIND_INPUT_ID = "find-in-materials";

export default function Find({ sources }: { sources: PrepSource[] }) {
  const [query, setQuery] = useState("");
  // Re-run only when the words or the materials change, not on every meeting update.
  const hits = useMemo(() => findInMaterials(sources, query), [sources, query]);
  const q = query.trim();

  return (
    <section aria-label="Find in your materials" className="mb-6">
      <label htmlFor={FIND_INPUT_ID} className="sr-only">
        Find in your materials
      </label>
      <div className="flex h-10 items-center gap-2 rounded-lg border border-[#1c1a3a]/20 bg-white px-3 transition-colors focus-within:border-[#2f6bff]">
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
          className="min-w-0 flex-1 bg-transparent text-sm text-[#1c1a3a] placeholder:text-[#646282] focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
        />
        <kbd className={ui.kbd}>/</kbd>
      </div>

      {!q && (
        <p id="find-hint" className={`mt-2 text-xs text-pretty ${ui.faint}`}>
          {sources.length
            ? "Type a word like reserve or tranches. Searches only your own materials, instantly."
            : "No materials loaded yet. Add them on the prep screen."}
        </p>
      )}

      {q && hits.length === 0 && (
        <p role="status" className={`mt-2 text-sm ${ui.muted}`}>
          Nothing in your materials mentions &ldquo;{q}&rdquo;.
        </p>
      )}

      {hits.length > 0 && (
        <ul role="list" aria-label={`${hits.length} matches`} className="mt-3 space-y-3">
          {hits.map((h, i) => (
            <li key={`${h.sourceId}-${i}`} className="text-sm">
              <p className="text-pretty text-[#1c1a3a]">
                {figureParts(h.line).map((p, j) =>
                  p.figure ? (
                    <mark key={j} className="rounded-sm bg-[#cff5dc] px-0.5 font-semibold text-[#0e5a2c]">
                      {p.text}
                    </mark>
                  ) : (
                    <span key={j}>{p.text}</span>
                  ),
                )}
              </p>
              <p className={`mt-1 flex flex-wrap items-center gap-2 text-xs ${ui.faint}`}>
                <span className={`${ui.chip} ${LABELS.PREPARED_FACT.chip}`}>{LABELS.PREPARED_FACT.text}</span>
                From {h.title}
                {h.date ? `, ${h.date}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// Step 5: the worries this client is likely to raise, each with a prepared
// answer and the facts behind it (#38). Read from the files on upload, or
// prepared here on demand. The advisor edits or removes each one; the meeting
// starts a live card from the prepared answer when the worry comes up.
"use client";

import { useState } from "react";
import { LABELS } from "@/components/meeting/replay";
import { extractNumbers } from "@/lib/provenance";
import type { AnticipatedWorry, Prep } from "@/lib/types";
import { btnGhost, CHIPS, inputClass, tone } from "./ui";

// Label colours for the cream page. LABELS (meeting track) still carries the
// names; its colours follow the meeting screen's theme, not this one.
const CHIP = { PREPARED_FACT: CHIPS.green, CALCULATED: CHIPS.amber, SUGGESTION: CHIPS.rose, DO_NOT_CLAIM: CHIPS.grey } as const;

// The same rule the meeting applies: a figure in the answer must be in the
// files or in a calculation shown on this worry, or the meeting leaves it out.
function traces(w: AnticipatedWorry, known: Set<number>): boolean {
  const calc = new Set(w.facts.filter((f) => f.label === "CALCULATED").flatMap((f) => extractNumbers(`${f.text} ${f.math ?? ""}`)));
  return extractNumbers(w.answer).every((n) => known.has(n) || calc.has(n));
}

type Props = { prep: Prep; value: AnticipatedWorry[]; onChange: (next: AnticipatedWorry[]) => void };

export function AnticipatedPanel({ prep, value, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const titleOf = (id?: string) => prep.sources.find((s) => s.id === id)?.title.trim();
  const known = new Set(prep.sources.flatMap((s) => extractNumbers(s.text)));

  async function prepare() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/anticipate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting: prep.meeting,
          clientFile: prep.clientFile,
          sources: prep.sources.filter((s) => s.text.trim()).map(({ id, title, text }) => ({ id, title, text })),
        }),
      });
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { anticipated?: AnticipatedWorry[] };
      const next = json.anticipated ?? [];
      if (next.length === 0) setNote("No worries could be prepared from these materials. Add your own notes and try again.");
      else onChange(next);
    } catch {
      setNote("Preparing worries failed. You can still start the meeting without them.");
    } finally {
      setBusy(false);
    }
  }

  const edit = (i: number, answer: string) => onChange(value.map((w, j) => (j === i ? { ...w, answer } : w)));
  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={btnGhost} disabled={busy} onClick={prepare}>
          {busy ? "Preparing…" : value.length ? "Prepare again from my materials" : "Prepare likely worries"}
        </button>
        <span className="text-sm text-[#5b5248]">Edit each answer in your own words. Figures must come from your files.</span>
      </div>

      {value.length === 0 && !busy && !note && (
        <p className="text-sm text-[#5b5248]">None yet. Upload your files or press the button to prepare them.</p>
      )}

      <ol className="flex flex-col gap-4">
        {value.map((w, i) => (
          <li key={i} className="flex flex-col gap-2 rounded-xl border border-[#161412]/15 bg-[#faf6ef] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-[#161412]">“{w.worry}”</p>
              <button type="button" className="shrink-0 text-xs text-[#5b5248] underline hover:text-[#161412]" onClick={() => remove(i)}>
                Remove
              </button>
            </div>
            {/* The reason as written, after a label rather than inside a sentence:
                lower-casing its first letter turned "Dana holds" into "dana holds". */}
            {w.why && <p className="text-sm text-[#5b5248]">Why it is likely: {w.why}</p>}
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-[#5b5248]">Prepared answer</span>
              <textarea rows={3} className={inputClass} value={w.answer} onChange={(e) => edit(i, e.target.value)} />
            </label>
            {!traces(w, known) && (
              <p role="note" className="text-sm text-[#6e4600]">
                This answer has a figure that is not in your files, so the meeting will leave it out.
              </p>
            )}
            {w.facts.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {w.facts.map((f, k) => (
                  <li key={k} className="flex items-start gap-2 text-sm">
                    <span className={`${tone.chip} ${CHIP[f.label]}`}>
                      {LABELS[f.label].text}
                    </span>
                    <span className="text-[#161412]">
                      {f.text}
                      {titleOf(f.sourceId) && <span className="text-[#74695d]"> · from {titleOf(f.sourceId)}</span>}
                      {f.math && <span className="text-[#74695d]"> · {f.math}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      {note && (
        <p role="status" className="text-sm text-[#6e4600]">
          {note}
        </p>
      )}
    </div>
  );
}

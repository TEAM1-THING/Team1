// Step 2: the advisor's plan and materials, one textarea per source.
// Owned by the prep track.
import type { PrepSource } from "@/lib/types";
import { addSource, removeSource, updateSource } from "./prepModel";
import { btnGhost, inputClass } from "./ui";

const KINDS: PrepSource["kind"][] = ["plan", "deck", "client_file", "note"];

export function SourcesEditor({ value, onChange }: { value: PrepSource[]; onChange: (next: PrepSource[]) => void }) {
  return (
    <div className="flex flex-col gap-4">
      {value.map((s) => (
        <div key={s.id} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <select
              aria-label="Kind"
              className="rounded-xl border border-white/15 bg-slate-950/40 px-2 text-sm text-slate-100"
              value={s.kind}
              onChange={(e) => onChange(updateSource(value, s.id, { kind: e.target.value as PrepSource["kind"] }))}
            >
              {KINDS.map((k) => (
                <option key={k} value={k} className="bg-slate-900">
                  {k.replace("_", " ")}
                </option>
              ))}
            </select>
            <input
              aria-label="Title"
              placeholder="Title"
              className={inputClass}
              value={s.title}
              onChange={(e) => onChange(updateSource(value, s.id, { title: e.target.value }))}
            />
            <button
              type="button"
              aria-label={`Remove ${s.title || "source"}`}
              className="rounded-full px-2.5 text-slate-400 hover:bg-white/10 hover:text-white"
              onClick={() => onChange(removeSource(value, s.id))}
            >
              ✕
            </button>
          </div>
          <textarea
            aria-label={`${s.title || "Source"} text`}
            rows={4}
            placeholder="Paste the plan, deck text or notes"
            className={inputClass}
            value={s.text}
            onChange={(e) => onChange(updateSource(value, s.id, { text: e.target.value }))}
          />
        </div>
      ))}
      <button
        type="button"
        className={`self-start ${btnGhost}`}
        onClick={() => onChange(addSource(value))}
      >
        + Add source
      </button>
    </div>
  );
}

// Step 2: the advisor's plan and materials, one textarea per source.
// Owned by the prep track.
import type { PrepSource } from "@/lib/types";
import { addSource, removeSource, updateSource } from "./prepModel";
import { inputClass } from "./ui";

const KINDS: PrepSource["kind"][] = ["plan", "deck", "client_file", "note"];

export function SourcesEditor({ value, onChange }: { value: PrepSource[]; onChange: (next: PrepSource[]) => void }) {
  return (
    <div className="flex flex-col gap-4">
      {value.map((s) => (
        <div key={s.id} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <select
              aria-label="Kind"
              className="rounded border border-neutral-300 bg-white px-2 text-sm"
              value={s.kind}
              onChange={(e) => onChange(updateSource(value, s.id, { kind: e.target.value as PrepSource["kind"] }))}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
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
              className="rounded px-2 text-neutral-500 hover:bg-neutral-100 hover:text-black"
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
        className="self-start rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100"
        onClick={() => onChange(addSource(value))}
      >
        + Add source
      </button>
    </div>
  );
}

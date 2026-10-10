// Step 1: the client file, every field editable. Owned by the prep track.
import type { ClientFile } from "@/lib/types";
import { fromLines, toLines, toNumber } from "./prepModel";
import { Field, inputClass } from "./ui";

const RISK = ["low", "moderate", "high"] as const;

export function ClientFileForm({ value, onChange }: { value: ClientFile; onChange: (next: ClientFile) => void }) {
  const set = (patch: Partial<ClientFile>) => onChange({ ...value, ...patch });
  const num = (key: "age" | "horizonYears" | "cashOnHand" | "investable", label: string) => (
    <Field label={label}>
      <input
        type="number"
        min={0}
        className={inputClass}
        value={value[key]}
        onChange={(e) => set({ [key]: toNumber(e.target.value) })}
      />
    </Field>
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Name">
        <input className={inputClass} value={value.name} onChange={(e) => set({ name: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        {num("age", "Age")}
        {num("horizonYears", "Horizon (years)")}
      </div>
      {num("cashOnHand", "Cash on hand ($)")}
      {num("investable", "Investable ($)")}
      <fieldset className="flex flex-col gap-1 text-sm sm:col-span-2">
        <legend className="mb-1 font-medium text-neutral-700">Risk tolerance</legend>
        <div className="flex gap-4">
          {RISK.map((r) => (
            <label key={r} className="flex items-center gap-1.5">
              <input type="radio" name="risk" checked={value.riskTolerance === r} onChange={() => set({ riskTolerance: r })} />
              {r}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Goals (one per line)">
        <textarea
          rows={3}
          className={inputClass}
          value={toLines(value.statedGoals)}
          onChange={(e) => set({ statedGoals: fromLines(e.target.value) })}
        />
      </Field>
      <Field label="Concerns (one per line)">
        <textarea
          rows={3}
          className={inputClass}
          value={toLines(value.statedConcerns)}
          onChange={(e) => set({ statedConcerns: fromLines(e.target.value) })}
        />
      </Field>
    </div>
  );
}

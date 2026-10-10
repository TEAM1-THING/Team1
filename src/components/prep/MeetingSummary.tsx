// Who the meeting is with and what it is for, as read from the files.
// Editable, because the read can be wrong.
import type { Meeting } from "@/lib/types";
import { Field, inputClass } from "./ui";

export function MeetingSummary({ value, onChange }: { value: Meeting; onChange: (next: Meeting) => void }) {
  const set = (patch: Partial<Meeting>) => onChange({ ...value, ...patch });
  return (
    <section className="rounded-2xl border border-indigo-300/20 bg-indigo-500/10 p-4">
      <p className="mb-3 text-sm font-medium text-indigo-100">This meeting, as read from your files</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="With">
          <input className={inputClass} value={value.with} onChange={(e) => set({ with: e.target.value })} />
        </Field>
        <Field label="Who they are">
          <input className={inputClass} value={value.role} onChange={(e) => set({ role: e.target.value })} />
        </Field>
        <Field label="Purpose" className="sm:col-span-3">
          <input className={inputClass} value={value.purpose} onChange={(e) => set({ purpose: e.target.value })} />
        </Field>
      </div>
    </section>
  );
}

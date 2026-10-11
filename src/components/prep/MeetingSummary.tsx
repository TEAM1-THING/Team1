// Who the meeting is with and what it is for, as read from the files.
// Editable, because the read can be wrong.
import type { Meeting } from "@/lib/types";
import { Field, inputClass } from "./ui";

export function MeetingSummary({ value, onChange }: { value: Meeting; onChange: (next: Meeting) => void }) {
  const set = (patch: Partial<Meeting>) => onChange({ ...value, ...patch });
  return (
    <section className="rounded-2xl border border-[#161412]/15 bg-[#faf6ef] p-4">
      <p className="mb-3 text-sm font-medium text-[#5b5248]">This meeting, as read from your files</p>
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

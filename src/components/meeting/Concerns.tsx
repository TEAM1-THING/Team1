import type { Concern } from "@/lib/types";

export default function Concerns({ concerns }: { concerns: Concern[] }) {
  const sorted = [...concerns].sort((a, b) => Number(a.status === "resolved") - Number(b.status === "resolved"));
  const open = concerns.filter((c) => c.status === "open").length;
  return (
    <section aria-labelledby="concerns-h" className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md">
      <h2 id="concerns-h" className="mb-3 flex items-baseline justify-between text-sm font-semibold text-slate-200">
        Client concerns
        <span className="text-xs font-normal text-slate-500">{open} open</span>
      </h2>
      {sorted.length === 0 && <p className="text-sm text-slate-500">Nothing raised yet.</p>}
      <ul className="space-y-1.5">
        {sorted.map((c) => (
          <li key={c.id} className="flex items-baseline gap-2 text-sm">
            <span
              aria-hidden
              className={`mt-1 inline-block size-2 shrink-0 rounded-full ${c.status === "open" ? "bg-rose-400" : "bg-slate-600"}`}
            />
            <span className={c.status === "open" ? "text-slate-100" : "text-slate-500 line-through"}>{c.topic}</span>
            <span className="ml-auto shrink-0 text-xs text-slate-500">
              {c.status === "open" ? `since ${c.raisedAtTurn}` : `${c.raisedAtTurn} to ${c.resolvedAtTurn}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

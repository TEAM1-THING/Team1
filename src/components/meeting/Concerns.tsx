import type { Concern } from "@/lib/types";

export default function Concerns({ concerns }: { concerns: Concern[] }) {
  const sorted = [...concerns].sort((a, b) => Number(a.status === "resolved") - Number(b.status === "resolved"));
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">Concerns</h2>
      {sorted.length === 0 && <p className="text-sm text-neutral-500">None raised yet.</p>}
      <ul className="space-y-2">
        {sorted.map((c) => (
          <li
            key={c.id}
            className={`rounded border px-3 py-2 text-sm ${
              c.status === "open" ? "border-rose-300 bg-rose-50 text-rose-900" : "border-neutral-200 text-neutral-500 line-through"
            }`}
          >
            <span className="font-medium">{c.topic}</span>
            <span className="ml-2 text-xs no-underline">
              raised {c.raisedAtTurn}
              {c.resolvedAtTurn && `, resolved ${c.resolvedAtTurn}`}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

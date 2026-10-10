import type { TranscriptTurn } from "@/lib/types";

export default function Transcript({ turns }: { turns: TranscriptTurn[] }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">Transcript</h2>
      {turns.length === 0 && <p className="text-sm text-neutral-500">Press Next turn to start the replay.</p>}
      <ol className="space-y-2">
        {turns.map((t) => (
          <li
            key={t.id}
            className={`rounded px-3 py-2 text-sm ${
              t.speaker === "client" ? "bg-sky-50 text-sky-950" : "bg-neutral-100 text-neutral-800"
            }`}
          >
            <span className="mr-2 text-xs font-semibold uppercase">{t.speaker}</span>
            <span className="text-xs text-neutral-500">{t.id}</span>
            <p>{t.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

import type { TranscriptTurn } from "@/lib/types";

// Reads like live captions under the call: newest line brightest.
export default function Transcript({ turns }: { turns: TranscriptTurn[] }) {
  return (
    <section aria-label="Transcript" aria-live="polite">
      {turns.length === 0 && (
        <p className="text-sm text-slate-500">
          Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-slate-300">→</kbd> or Next turn to start
          the replay.
        </p>
      )}
      <ol className="space-y-3">
        {turns.map((t, i) => {
          const latest = i === turns.length - 1;
          return (
            <li key={t.id} className={`text-[15px] leading-snug ${latest ? "text-slate-50" : "text-slate-400"}`}>
              <span className={`mr-2 text-xs font-semibold ${t.speaker === "client" ? "text-sky-300" : "text-slate-500"}`}>
                {t.speaker === "client" ? "Client" : "You"}
              </span>
              {t.text}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

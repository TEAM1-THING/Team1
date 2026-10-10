import type { TranscriptTurn } from "@/lib/types";
import { isLiveTurn } from "./live";

// Reads like live captions under the call: newest line brightest.
// onToggle: flips who said a live mic line, for when the guess is wrong.
export default function Transcript({ turns, onToggle }: { turns: TranscriptTurn[]; onToggle?: (id: string) => void }) {
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
              {onToggle && isLiveTurn(t.id) ? (
                <button
                  type="button"
                  title="Wrong speaker? Click to switch"
                  onClick={() => onToggle(t.id)}
                  className={`mr-2 rounded px-1 text-xs font-semibold underline decoration-dotted underline-offset-2 hover:bg-white/10 ${t.speaker === "client" ? "text-sky-300" : "text-slate-500"}`}
                >
                  {t.speaker === "client" ? "Client" : "You"}
                </button>
              ) : (
                <span className={`mr-2 text-xs font-semibold ${t.speaker === "client" ? "text-sky-300" : "text-slate-500"}`}>
                  {t.speaker === "client" ? "Client" : "You"}
                </span>
              )}
              {t.text}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

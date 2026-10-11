import type { TranscriptTurn } from "@/lib/types";
import { isLiveTurn } from "./live";
import { ui } from "./ui";

// Reads like live captions under the call: newest line brightest.
// onToggle: flips who said a live mic line, for when the guess is wrong.
export default function Transcript({ turns, onToggle }: { turns: TranscriptTurn[]; onToggle?: (id: string) => void }) {
  return (
    <section aria-label="Transcript" aria-live="polite">
      {turns.length === 0 && (
        <p className={`text-sm ${ui.faint}`}>The conversation appears here, line by line.</p>
      )}
      <ol className="space-y-3">
        {turns.map((t, i) => {
          const latest = i === turns.length - 1;
          return (
            <li key={t.id} className={`grid grid-cols-[3rem_1fr] gap-x-1 text-sm leading-relaxed ${latest ? "text-[#1c1a3a]" : ui.muted}`}>
              {onToggle && isLiveTurn(t.id) ? (
                <button
                  type="button"
                  title="Wrong speaker? Click to switch"
                  onClick={() => onToggle(t.id)}
                  className={`h-fit w-fit rounded px-1 -ml-1 pt-0.5 text-left text-xs font-medium underline decoration-dotted underline-offset-2 hover:bg-[#1c1a3a]/[0.06] ${t.speaker === "client" ? "text-[#1c1a3a]" : ui.faint}`}
                >
                  {t.speaker === "client" ? "Client" : "You"}
                </button>
              ) : (
                <span className={`pt-0.5 text-xs font-medium ${t.speaker === "client" ? "text-[#1c1a3a]" : ui.faint}`}>
                  {t.speaker === "client" ? "Client" : "You"}
                </span>
              )}
              <span>{t.text}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

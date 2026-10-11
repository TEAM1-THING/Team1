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
      <ol className="space-y-3.5">
        {turns.map((t, i) => {
          const latest = i === turns.length - 1;
          return (
            <li key={t.id} className={`text-[15px] leading-relaxed ${latest ? "text-[#ecebe8]" : ui.muted}`}>
              {onToggle && isLiveTurn(t.id) ? (
                <button
                  type="button"
                  title="Wrong speaker? Click to switch"
                  onClick={() => onToggle(t.id)}
                  className={`mr-2 rounded px-1 text-xs font-medium underline decoration-dotted underline-offset-2 hover:bg-white/[0.06] ${t.speaker === "client" ? "text-[#ecebe8]" : ui.faint}`}
                >
                  {t.speaker === "client" ? "Client" : "You"}
                </button>
              ) : (
                <span className={`mr-2 text-xs font-medium ${t.speaker === "client" ? "text-[#ecebe8]" : ui.faint}`}>
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

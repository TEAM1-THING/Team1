import type { Card, PrepSource } from "@/lib/types";
import { LABELS } from "./replay";
import { ui } from "./ui";

const momentText = (m: string) => {
  const s = m.replace(/_/g, " ");
  return s[0].toUpperCase() + s.slice(1);
};

function Chip({ label }: { label: keyof typeof LABELS }) {
  return <span className={`${ui.chip} ${LABELS[label].chip}`}>{LABELS[label].text}</span>;
}

// Where a fact came from, and when that document was made (tester feedback:
// "I like it when they ... cite their sources and when the sources were made").
function sourceLine(sourceId: string | undefined, sources: PrepSource[]): string | null {
  const s = sourceId ? sources.find((x) => x.id === sourceId) : undefined;
  return s ? `From ${s.title}${s.date ? `, ${s.date}` : ""}` : null;
}

// One glance (#37 order): the worry, what to say, your move in a line, the facts
// behind it, what not to say. The reasoning waits behind "Why". Every figure
// still carries its provenance label.
export default function MomentCard({
  card,
  dimmed = false,
  sources = [],
}: {
  card: Card;
  dimmed?: boolean;
  sources?: PrepSource[];
}) {
  if (dimmed) {
    // The previous card collapses to its headline so the new one owns the eye.
    return (
      <article data-testid="previous-card" className={`${ui.surface} px-5 py-3 opacity-70`}>
        <p className={`text-xs ${ui.faint}`}>
          Earlier, at {card.turnId}: {momentText(card.moment).toLowerCase()}
        </p>
        <p className={`truncate text-sm ${ui.muted}`}>{card.concern}</p>
      </article>
    );
  }

  const backing = card.facts.filter((f) => f.label !== "DO_NOT_CLAIM");
  const avoid = [...card.facts.filter((f) => f.label === "DO_NOT_CLAIM").map((f) => f.text), ...card.doNotClaim];

  return (
    <article data-testid="current-card" className={`sc-arrive ${ui.raised} p-5 md:p-6`}>
      <p className={`mb-4 text-sm leading-snug text-pretty ${ui.muted}`}>
        <span className="font-medium text-[#ecebe8]">{momentText(card.moment)}.</span> {card.concern}
      </p>

      <blockquote className="mb-4">
        <Chip label="SUGGESTION" />
        <p className="mt-2 text-[19px] leading-[1.45] font-medium tracking-[-0.01em] text-pretty text-[#f4f3f0] md:text-[22px]">
          “{card.phrasing}”
        </p>
      </blockquote>

      <p data-testid="your-move" title={card.recommendedMove} className={`mb-5 line-clamp-2 text-sm text-pretty ${ui.muted}`}>
        <span className="font-medium text-[#ecebe8]">Your move. </span>
        {card.recommendedMove}
      </p>

      {card.defer ? (
        <div className="mb-4 rounded-lg border border-orange-400/25 bg-orange-400/[0.07] px-4 py-3 text-sm text-orange-100">
          <strong className="font-medium">Defer this one.</strong> It is outside the confirmed Mandate, so offer to follow
          up rather than answer now.
          {card.deferReason && <span className="mt-1 block text-orange-200/80">{card.deferReason}</span>}
        </div>
      ) : (
        backing.length > 0 && (
          <ul data-testid="backing" className="mb-4 space-y-2.5 border-t border-white/[0.06] pt-4">
            {backing.map((f, i) => (
              <li key={i} className="grid grid-cols-1 items-baseline gap-x-3 gap-y-1 sm:grid-cols-[6.5rem_1fr] text-sm">
                <Chip label={f.label} />
                <div>
                  <p className="text-pretty text-[#dedcd6]">{f.text}</p>
                  {f.math && <p className="mt-0.5 font-mono text-xs text-amber-200/80">{f.math}</p>}
                  {f.label === "PREPARED_FACT" && sourceLine(f.sourceId, sources) && (
                    <p className={`mt-0.5 text-xs ${ui.faint}`}>{sourceLine(f.sourceId, sources)}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      {avoid.length > 0 && (
        <div data-testid="avoid" className="mb-4 grid grid-cols-1 items-baseline gap-x-3 gap-y-1 sm:grid-cols-[6.5rem_1fr] text-sm">
          <Chip label="DO_NOT_CLAIM" />
          <ul className={`space-y-0.5 text-pretty ${ui.muted}`}>
            {avoid.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      <details className={`text-sm ${ui.faint}`}>
        <summary className="w-fit cursor-pointer select-none rounded transition-colors hover:text-[#cfccc5] focus-visible:outline-2 focus-visible:outline-[#ecebe8]">
          Why
        </summary>
        <div className={`mt-2 space-y-2 ${ui.muted}`}>
          <p className="text-pretty">{card.why}</p>
          <p className={`text-xs ${ui.faint}`}>Anything we can&apos;t trace is shown as a suggestion, never a fact.</p>
        </div>
      </details>
    </article>
  );
}

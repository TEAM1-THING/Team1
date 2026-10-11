import type { Card, PrepSource } from "@/lib/types";
import { cite } from "./cite";
import { LABELS } from "./replay";
import { ui } from "./ui";

const momentText = (m: string) => {
  const s = m.replace(/_/g, " ");
  return s[0].toUpperCase() + s.slice(1);
};

function Chip({ label }: { label: keyof typeof LABELS }) {
  return <span className={`${ui.chip} ${LABELS[label].chip}`}>{LABELS[label].text}</span>;
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
  const citations = cite(backing, sources);

  return (
    <article data-testid="current-card" className={`sc-arrive ${ui.raised} p-5 md:p-6`}>
      <p className={`mb-4 text-sm leading-snug text-pretty ${ui.muted}`}>
        <span className="font-medium text-[#ecebe8]">{momentText(card.moment)}.</span> {card.concern}
      </p>

      <blockquote className="mb-4">
        <Chip label="SUGGESTION" />
        <p className="mt-2 text-[18px] leading-[1.5] font-medium tracking-[-0.01em] text-pretty text-[#f4f3f0] lg:text-[20px]">
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
          <div className="mb-4 border-t border-white/[0.06] pt-4">
            <ul data-testid="backing" className="space-y-2">
              {backing.map((f, i) => (
                <li key={i} className="flex items-baseline gap-2.5 text-sm">
                  <Chip label={f.label} />
                  <div className="min-w-0">
                    <p className="text-pretty text-[#dedcd6]">
                      {f.text}
                      {citations.numberOf(f) && (
                        <sup className={`ml-0.5 text-[10px] tabular-nums ${ui.faint}`}>{citations.numberOf(f)}</sup>
                      )}
                    </p>
                    {f.math && <p className="mt-0.5 font-mono text-xs text-amber-200/80">{f.math}</p>}
                  </div>
                </li>
              ))}
            </ul>
            {citations.list.length > 0 && (
              <ol aria-label="Sources" className={`mt-3 space-y-0.5 text-xs ${ui.faint}`}>
                {citations.list.map((c) => (
                  <li key={c.n} className="flex gap-1.5">
                    <span className="tabular-nums">{c.n}</span>
                    <span>
                      {c.title}
                      {c.date ? `, ${c.date}` : ""}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )
      )}

      {avoid.length > 0 && (
        <div data-testid="avoid" className="mb-4 flex items-baseline gap-2.5 text-sm">
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

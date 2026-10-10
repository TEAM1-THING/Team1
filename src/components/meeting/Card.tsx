import type { Card, PrepSource } from "@/lib/types";
import { LABELS } from "./replay";

const momentText = (m: string) => {
  const s = m.replace(/_/g, " ");
  return s[0].toUpperCase() + s.slice(1);
};

function Chip({ label }: { label: keyof typeof LABELS }) {
  return (
    <span className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${LABELS[label].chip}`}>
      {LABELS[label].text}
    </span>
  );
}

// Where a fact came from, and when that document was made (tester feedback:
// "I like it when they ... cite their sources and when the sources were made").
function sourceLine(sourceId: string | undefined, sources: PrepSource[]): string | null {
  const s = sourceId ? sources.find((x) => x.id === sourceId) : undefined;
  return s ? `from ${s.title}${s.date ? ` · ${s.date}` : ""}` : null;
}

// One glance, like Cluely's single answer block: what to say, the facts behind
// it, what not to say. The move and the reasoning wait behind "Details".
// Every figure still carries its provenance chip.
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
      <article
        data-testid="previous-card"
        className="sc-glass rounded-2xl border border-white/5 bg-slate-900/40 px-5 py-3 text-slate-400 opacity-60 backdrop-blur-md"
      >
        <p className="text-xs">
          Earlier, {card.turnId}: {momentText(card.moment).toLowerCase()}
        </p>
        <p className="truncate text-sm">{card.concern}</p>
      </article>
    );
  }

  const backing = card.facts.filter((f) => f.label !== "DO_NOT_CLAIM");
  const avoid = [...card.facts.filter((f) => f.label === "DO_NOT_CLAIM").map((f) => f.text), ...card.doNotClaim];

  return (
    <article
      data-testid="current-card"
      className="sc-arrive sc-glass rounded-2xl border border-white/10 bg-slate-900/75 p-5 text-slate-100 backdrop-blur-xl"
    >
      <p className="mb-3 text-sm leading-snug text-slate-400">
        <span className="font-semibold text-sky-300">{momentText(card.moment)}.</span> {card.concern}
      </p>

      <blockquote className="mb-4">
        <div className="mb-1.5">
          <Chip label="SUGGESTION" />
        </div>
        <p className="text-[21px] leading-relaxed font-medium tracking-tight text-slate-50">“{card.phrasing}”</p>
      </blockquote>

      {card.defer ? (
        <div className="mb-4 rounded-xl bg-orange-400/10 px-4 py-3 text-sm text-orange-200">
          <strong className="font-semibold">Defer this one.</strong> It is outside the confirmed Mandate, so offer to
          follow up rather than answer now.
          {card.deferReason && <span className="mt-1 block text-orange-300/80">{card.deferReason}</span>}
        </div>
      ) : (
        backing.length > 0 && (
          <ul data-testid="backing" className="mb-3 space-y-1.5">
            {backing.map((f, i) => (
              <li key={i} className={`border-l-2 pl-3 text-sm ${LABELS[f.label].rule}`}>
                <div className="flex items-start gap-2">
                  <Chip label={f.label} />
                  <span className="text-slate-200">{f.text}</span>
                </div>
                {f.math && <div className="mt-0.5 font-mono text-xs text-amber-200/90">{f.math}</div>}
                {f.label === "PREPARED_FACT" && sourceLine(f.sourceId, sources) && (
                  <div className="mt-0.5 text-xs text-emerald-200/70">{sourceLine(f.sourceId, sources)}</div>
                )}
              </li>
            ))}
          </ul>
        )
      )}

      {avoid.length > 0 && (
        <div data-testid="avoid" className="mb-3 flex items-start gap-2 text-sm">
          <Chip label="DO_NOT_CLAIM" />
          <ul className="space-y-0.5 text-slate-400">
            {avoid.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      <details className="text-sm text-slate-400">
        <summary className="cursor-pointer select-none hover:text-slate-200">Details</summary>
        <div className="mt-2 space-y-2 text-slate-300">
          <p>
            <span className="font-semibold text-slate-100">Next move. </span>
            {card.recommendedMove}
          </p>
          <p>
            <span className="font-semibold text-slate-100">Why. </span>
            {card.why}
          </p>
          <p className="text-xs text-slate-500">Anything we can&apos;t trace is shown as a suggestion, never a fact.</p>
        </div>
      </details>
    </article>
  );
}

import type { Card } from "@/lib/types";
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

export default function MomentCard({ card, dimmed = false }: { card: Card; dimmed?: boolean }) {
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

  return (
    <article
      data-testid="current-card"
      className="sc-arrive sc-glass rounded-2xl border border-white/10 bg-slate-900/75 p-5 text-slate-100 backdrop-blur-xl"
    >
      <header className="mb-1 flex items-baseline gap-2">
        <span className="text-sm font-semibold text-sky-300">{momentText(card.moment)}</span>
        <span className="text-xs text-slate-500">heard at {card.turnId}</span>
      </header>
      <p className="mb-4 text-[15px] leading-snug text-slate-300">{card.concern}</p>

      <blockquote className="mb-5">
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
        <ul className="mb-4 space-y-2.5">
          {card.facts.map((f, i) => (
            <li key={i} className={`border-l-2 pl-3 text-sm ${LABELS[f.label].rule}`}>
              <div className="flex items-start gap-2">
                <Chip label={f.label} />
                <span className="text-slate-200">{f.text}</span>
              </div>
              {f.math && <div className="mt-1 font-mono text-xs text-amber-200/90">{f.math}</div>}
            </li>
          ))}
        </ul>
      )}

      <p className="mb-3 text-sm text-slate-300">
        <span className="font-semibold text-slate-100">Next move. </span>
        {card.recommendedMove}
      </p>

      {card.doNotClaim.length > 0 && (
        <div className="mb-3 rounded-xl bg-white/5 px-3 py-2 text-sm">
          <Chip label="DO_NOT_CLAIM" />
          <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-slate-400">
            {card.doNotClaim.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      <details className="text-sm text-slate-400">
        <summary className="cursor-pointer select-none hover:text-slate-200">Why this card</summary>
        <p className="mt-1.5 text-slate-300">{card.why}</p>
      </details>
    </article>
  );
}

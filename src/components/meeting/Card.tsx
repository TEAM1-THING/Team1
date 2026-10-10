import type { Card } from "@/lib/types";
import { LABELS } from "./replay";

const momentText = (m: string) => m.replace(/_/g, " ");

export default function MomentCard({ card, dimmed = false }: { card: Card; dimmed?: boolean }) {
  return (
    <article
      data-testid={dimmed ? "previous-card" : "current-card"}
      className={`rounded-lg border border-neutral-300 bg-white p-4 text-neutral-900 shadow-sm transition-opacity ${
        dimmed ? "opacity-40" : ""
      }`}
    >
      <header className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
          {momentText(card.moment)}
        </span>
        <span className="text-xs text-neutral-500">at {card.turnId}</span>
      </header>
      <p className="mb-3 text-base font-semibold">{card.concern}</p>

      {card.defer ? (
        <div className="mb-3 rounded border border-orange-300 bg-orange-50 p-3 text-sm text-orange-900">
          <strong>Defer.</strong> Outside the Mandate: do not answer now.
          {card.deferReason && <span> {card.deferReason}</span>}
        </div>
      ) : (
        <ul className="mb-3 space-y-2">
          {card.facts.map((f, i) => (
            <li key={i} className="text-sm">
              <span className={`mr-2 inline-block rounded border px-1.5 py-0.5 text-xs font-medium ${LABELS[f.label].chip}`}>
                {LABELS[f.label].text}
              </span>
              {f.text}
              {f.math && <div className="ml-1 mt-1 font-mono text-xs text-amber-800">{f.math}</div>}
            </li>
          ))}
        </ul>
      )}

      <p className="mb-2 text-sm">
        <span className="font-semibold">Move: </span>
        {card.recommendedMove}
      </p>
      <blockquote className="mb-2 border-l-4 border-rose-300 bg-rose-50 px-3 py-2 text-sm italic">
        <span className={`mr-2 not-italic rounded border px-1.5 py-0.5 text-xs ${LABELS.SUGGESTION.chip}`}>
          {LABELS.SUGGESTION.text}
        </span>
        “{card.phrasing}”
      </blockquote>
      <details className="mb-2 text-sm">
        <summary className="cursor-pointer text-neutral-600">Why</summary>
        <p className="mt-1">{card.why}</p>
      </details>
      {card.doNotClaim.length > 0 && (
        <div className="text-sm">
          <span className={`mr-2 rounded border px-1.5 py-0.5 text-xs ${LABELS.DO_NOT_CLAIM.chip}`}>
            {LABELS.DO_NOT_CLAIM.text}
          </span>
          <ul className="mt-1 list-disc pl-5 text-neutral-600">
            {card.doNotClaim.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

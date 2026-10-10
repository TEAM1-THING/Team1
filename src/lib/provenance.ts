// The number-trace check. Invariant: no number reaches the advisor as a
// PREPARED_FACT unless it appears in the advisor's own materials.
import type { Card, CardFact, Prep } from "./types";

const NUMBER = /\$?\d[\d,]*(?:\.\d+)?\s*(?:[kKmM](?![a-zA-Z])|%)?/g;

// "$180K" -> 180000, "1.2M" -> 1200000, "180,000" -> 180000, "4.5%" -> 4.5
export function parseNumber(raw: string): number | null {
  const s = raw.replace(/[$,\s]/g, "");
  const m = s.match(/^(\d+(?:\.\d+)?)([kKmM%]?)$/);
  if (!m) return null;
  const n = Number(m[1]);
  const suffix = m[2].toLowerCase();
  if (suffix === "k") return n * 1_000;
  if (suffix === "m") return n * 1_000_000;
  return n;
}

export function extractNumbers(text: string): number[] {
  return (text.match(NUMBER) ?? [])
    .map(parseNumber)
    .filter((n): n is number => n !== null);
}

// Every number the advisor prepared: source texts plus the client file.
export function preparedNumbers(prep: Prep): Set<number> {
  const out = new Set<number>();
  for (const s of prep.sources) for (const n of extractNumbers(s.text)) out.add(n);
  for (const v of Object.values(prep.clientFile)) {
    if (typeof v === "number") out.add(v);
  }
  return out;
}

export function isTraced(fact: CardFact, known: Set<number>): boolean {
  return extractNumbers(fact.text).every((n) => known.has(n));
}

// Downgrade, never upgrade: an untraced PREPARED_FACT becomes CALCULATED if it
// shows its math, otherwise SUGGESTION. CALCULATED without math is SUGGESTION.
export function enforceFact(fact: CardFact, known: Set<number>): CardFact {
  if (fact.label === "PREPARED_FACT" && !(fact.sourceId && isTraced(fact, known))) {
    return { ...fact, label: fact.math ? "CALCULATED" : "SUGGESTION" };
  }
  if (fact.label === "CALCULATED" && !fact.math) {
    return { ...fact, label: "SUGGESTION" };
  }
  return fact;
}

export function enforceNumberTrace(card: Card, prep: Prep): Card {
  const known = preparedNumbers(prep);
  return { ...card, facts: card.facts.map((f) => enforceFact(f, known)) };
}

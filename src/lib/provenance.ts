// The number-trace check. Invariant: no number reaches the advisor as a
// PREPARED_FACT unless it appears in the advisor's own materials.
import type { Card, CardFact, FileConflict, Prep, PrepSource } from "./types";

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

// A conflict value is a figure, not a passage.
const MAX_CONFLICT_VALUE_CHARS = 80;

// Files that disagree. Keep a value only if every number in it appears in the
// source it names, and a conflict only if two or more different figures from
// two or more sources survive. The same figure written two ways ("$180K" and
// "180,000") is not a conflict.
export function traceConflicts(
  conflicts: FileConflict[],
  sources: Pick<PrepSource, "id" | "text">[],
): FileConflict[] {
  const bySource = new Map(sources.map((s) => [s.id, new Set(extractNumbers(s.text))]));
  const out: FileConflict[] = [];
  for (const c of conflicts) {
    const quantity = c.quantity.trim();
    const seen = new Set<string>();
    const figures = new Set<string>();
    const files = new Set<string>();
    const values = c.values.flatMap((v) => {
      const value = v.value.trim();
      const nums = extractNumbers(value);
      const known = bySource.get(v.sourceId);
      if (!known || value.length > MAX_CONFLICT_VALUE_CHARS || nums.length === 0) return [];
      if (!nums.every((n) => known.has(n))) return [];
      const figure = nums.join("|");
      if (seen.has(`${figure}@${v.sourceId}`)) return [];
      seen.add(`${figure}@${v.sourceId}`);
      figures.add(figure);
      files.add(v.sourceId);
      return [{ value, sourceId: v.sourceId }];
    });
    if (quantity && figures.size >= 2 && files.size >= 2) out.push({ quantity, values });
  }
  return out;
}

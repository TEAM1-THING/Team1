// Citations on a card: a prepared fact carries a number pointing at its source,
// and each source is listed once with its date, instead of repeating the full
// source line under every fact (tester: "cite their sources and when the
// sources were made").
import type { CardFact, PrepSource } from "@/lib/types";

export type Citation = { n: number; title: string; date?: string };

export function cite(facts: CardFact[], sources: PrepSource[]) {
  const byId = new Map(sources.map((s) => [s.id, s]));
  const numbers = new Map<string, number>();
  const list: Citation[] = [];
  for (const f of facts) {
    const s = f.label === "PREPARED_FACT" && f.sourceId ? byId.get(f.sourceId) : undefined;
    if (!s || numbers.has(s.id)) continue;
    numbers.set(s.id, list.length + 1);
    list.push({ n: list.length + 1, title: s.title, date: s.date });
  }
  const numberOf = (f: CardFact) => (f.label === "PREPARED_FACT" && f.sourceId ? numbers.get(f.sourceId) : undefined);
  return { list, numberOf };
}

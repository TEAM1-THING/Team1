// Deterministic out-of-scope floor: the model is asked to defer, but a turn
// that names an outOfScope entry defers even if it does not. Matching is on
// the entry's key words: whole word (plus s/es) for short words, word prefix
// for five letters or more ("crypto" catches "cryptocurrency").
const SCOPE_FILLER = new Set([
  "about", "advice", "advise", "and", "any", "for", "general", "individual", "investing", "investment",
  "investments", "issues", "matters", "other", "personal", "picking", "picks", "planning", "product",
  "products", "question", "questions", "recommendation", "recommendations", "related", "specific",
  "strategies", "strategy", "the", "topics", "filing", "with",
]);
const SCOPE_ALIASES: Record<string, string[]> = { crypto: ["bitcoin", "ethereum"] };

export function outOfScopeHit(text: string, outOfScope: string[]): string | null {
  // "the stock market" is the plan's own subject, not a stock pick.
  const said = text.toLowerCase().replace(/\bstock\s+markets?\b/g, " ");
  for (const entry of outOfScope) {
    const words = entry.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !SCOPE_FILLER.has(w));
    const terms = words.flatMap((w) => [w, ...(SCOPE_ALIASES[w] ?? [])]);
    const hit = terms.some((t) => new RegExp(t.length >= 5 ? `\\b${t}` : `\\b${t}(?:s|es)?\\b`).test(said));
    if (hit) return entry;
  }
  return null;
}

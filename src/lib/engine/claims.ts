import type { CardFact } from "../types";

// The card shows DO_NOT_CLAIM facts and doNotClaim as one list, so a claim
// the model gave both ways, or twice, shows once.
const FILLER = new Set(["that", "the", "and", "for", "are", "was", "will", "can", "has", "have", "with", "this", "any", "not", "its", "already", "plan"]);
const claimWords = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .replace(/'s\b/g, "")
      .match(/[a-z0-9$%]+/g)
      ?.filter((w) => w.length > 2 && !FILLER.has(w)) ?? [],
  );
// Mostly the same words ("the plan already includes help for the son's down
// payment" vs "...accounts for a down payment for the son") is the same claim.
const sameClaim = (a: Set<string>, b: Set<string>) =>
  [...a].filter((w) => b.has(w)).length / Math.max(1, Math.min(a.size, b.size)) >= 0.6;
export function distinctClaims(claims: string[], facts: CardFact[]): string[] {
  const seen = facts.filter((f) => f.label === "DO_NOT_CLAIM").map((f) => claimWords(f.text));
  return claims.filter((c) => {
    const w = claimWords(c);
    if (!w.size || seen.some((s) => sameClaim(s, w))) return false;
    seen.push(w);
    return true;
  });
}

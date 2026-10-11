// What the end screen shows, kept free of React so a test can check it.
import type { Card, Concern } from "@/lib/types";

export type MomentLine = { id: string; turnId: string; moment: string; concern: string; resolved: boolean };

export type EndSummary = { moments: MomentLine[]; resolved: number; open: number };

export const momentLabel = (m: string) => {
  const s = m.replace(/_/g, " ");
  return s ? s[0].toUpperCase() + s.slice(1) : s;
};

// A moment counts as resolved when concerns were raised at its turn and every
// one of them is resolved. One turn can open several ("open the others as
// concerns"), so a single resolved one is not enough.
export function endSummary(cards: Card[], concerns: Concern[]): EndSummary {
  const byTurn = new Map<string, Concern[]>();
  for (const c of concerns) byTurn.set(c.raisedAtTurn, [...(byTurn.get(c.raisedAtTurn) ?? []), c]);
  const resolvedAt = new Set(
    [...byTurn].filter(([, cs]) => cs.every((c) => c.status === "resolved")).map(([turn]) => turn),
  );
  return {
    moments: cards.map((c) => ({
      id: c.id,
      turnId: c.turnId,
      moment: momentLabel(c.moment),
      concern: c.concern,
      resolved: resolvedAt.has(c.turnId),
    })),
    resolved: concerns.filter((c) => c.status === "resolved").length,
    open: concerns.filter((c) => c.status === "open").length,
  };
}

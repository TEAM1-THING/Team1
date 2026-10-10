// What the end screen shows, kept free of React so a test can check it.
import type { Card, Concern } from "@/lib/types";

export type MomentLine = { id: string; turnId: string; moment: string; concern: string; resolved: boolean };

export type EndSummary = { moments: MomentLine[]; resolved: number; open: number };

export const momentLabel = (m: string) => {
  const s = m.replace(/_/g, " ");
  return s[0].toUpperCase() + s.slice(1);
};

// A moment counts as resolved when a concern raised at its turn was resolved.
export function endSummary(cards: Card[], concerns: Concern[]): EndSummary {
  const resolvedAt = new Set(concerns.filter((c) => c.status === "resolved").map((c) => c.raisedAtTurn));
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

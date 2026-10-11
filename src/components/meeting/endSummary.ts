// What the end screen shows and keeps, free of React so a test can check it.
import type { CardGrade, Grade } from "@/lib/record";
import type { Card, Concern, ConversationState } from "@/lib/types";

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

// The advisor's grades by card id (#42). The meeting screen holds them, not the
// end screen, so they survive Back to meeting and a second End meeting.
export type Grades = Record<string, CardGrade>;

// Pressing the chosen grade again clears it back to ungraded.
export function toggleGrade(prev: Grades, cardId: string, g: Exclude<Grade, "ungraded">, at = new Date().toISOString()): Grades {
  const next = { ...prev };
  if (next[cardId]?.grade === g) delete next[cardId];
  else next[cardId] = { cardId, grade: g, gradedAt: at };
  return next;
}

// The grades for the cards on screen, in card order. A grade for a card the
// screen no longer shows is not counted.
export const gradedFor = (cards: Card[], grades: Grades): CardGrade[] => cards.flatMap((c) => grades[c.id] ?? []);

// The record downloads by itself only at the first End meeting, so after the
// meeting goes on the file on disk can be behind what the end screen shows.
// Current means it holds exactly these cards and concerns.
export function recordIsCurrent(downloaded: ConversationState | null, now: Pick<ConversationState, "cards" | "concerns">): boolean {
  if (!downloaded) return false;
  const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);
  return same(downloaded.cards, now.cards) && same(downloaded.concerns, now.concerns);
}

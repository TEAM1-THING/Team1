import { describe, expect, it } from "vitest";
import { endSummary, momentLabel } from "@/components/meeting/endSummary";
import { mockMoment } from "@/lib/mock";
import { demoTranscript } from "@/data/demo";
import { emptyState, type Card, type Concern } from "@/lib/types";

const concern = (id: string, raisedAtTurn: string, status: Concern["status"]): Concern => ({
  id,
  topic: id,
  status,
  raisedAtTurn,
  ...(status === "resolved" ? { resolvedAtTurn: "t9" } : {}),
});

describe("endSummary", () => {
  it("counts resolved and open concerns and marks the moments they came from", () => {
    const cards = [
      { id: "c2", turnId: "t2", moment: "emotional_concern", concern: "Access" },
      { id: "c4", turnId: "t4", moment: "hesitation", concern: "Timing" },
    ] as Card[];
    const s = endSummary(cards, [concern("liquidity", "t2", "resolved"), concern("timing", "t4", "open"), concern("house", "t6", "open")]);
    expect(s.resolved).toBe(1);
    expect(s.open).toBe(2);
    expect(s.moments.map((m) => [m.turnId, m.moment, m.resolved])).toEqual([
      ["t2", "Emotional concern", true],
      ["t4", "Hesitation", false],
    ]);
  });

  it("is empty for a meeting with no cards", () => {
    expect(endSummary([], [])).toEqual({ moments: [], resolved: 0, open: 0 });
  });

  it("summarises the canned demo meeting", () => {
    let state = emptyState();
    const cards: Card[] = [];
    for (const turn of demoTranscript) {
      const res = mockMoment(turn.id, state);
      state = res.state;
      if (res.card) cards.push(res.card);
    }
    const s = endSummary(cards, state.concerns);
    expect(s.moments.map((m) => [m.turnId, m.resolved])).toEqual([
      ["t2", true],
      ["t4", false],
      ["t6", false],
    ]);
    expect([s.resolved, s.open]).toEqual([1, 2]);
  });
});

it("labels moment types for people", () => {
  expect(momentLabel("buying_signal")).toBe("Buying signal");
  expect(momentLabel("")).toBe("");
});

it("marks a moment resolved only when every concern raised at its turn is resolved", () => {
  const cards = [{ id: "c2", turnId: "t2", moment: "objection", concern: "Access" }] as Card[];
  const s = endSummary(cards, [concern("liquidity", "t2", "resolved"), concern("request: fee schedule", "t2", "open")]);
  expect(s.moments[0].resolved).toBe(false);
  expect([s.resolved, s.open]).toEqual([1, 1]);
});

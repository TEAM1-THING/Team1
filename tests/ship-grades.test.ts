// #42: every card is graded in the record (ungraded by default), with the
// card's time and model, so the records database can audit Second Chair.
import type Anthropic from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoPrep, demoTranscript } from "@/data/demo";
import { LIVE_MODEL, setClientForTests } from "@/lib/engine/client";
import { runMoment, type LlmMoment } from "@/lib/engine/moment";
import { mockMoment } from "@/lib/mock";
import { buildRecord, cardGrades, recordFileName } from "@/lib/record";
import { emptyState, type Card } from "@/lib/types";

const card = (id: string, extra: Partial<Card> = {}): Card => ({
  ...mockMoment("t2", emptyState()).card!,
  id,
  ...extra,
});

describe("cardGrades", () => {
  it("marks every card ungraded unless the advisor graded it", () => {
    const cards = [card("c-t2", { at: 8, model: "claude-sonnet-5-5" }), card("c-t4", { at: 31, model: "canned" })];
    expect(cardGrades(cards)).toEqual([
      { cardId: "c-t2", grade: "ungraded", at: 8, model: "claude-sonnet-5-5" },
      { cardId: "c-t4", grade: "ungraded", at: 31, model: "canned" },
    ]);
    const graded = cardGrades(cards, { "c-t4": { grade: "wrong", gradedAt: "2026-10-10T20:00:00.000Z" } });
    expect(graded[1]).toEqual({ cardId: "c-t4", grade: "wrong", gradedAt: "2026-10-10T20:00:00.000Z", at: 31, model: "canned" });
    expect(graded[0].grade).toBe("ungraded");
  });

  it("leaves out time and model a card does not carry (cards from before #42)", () => {
    expect(cardGrades([card("c-old")])).toEqual([{ cardId: "c-old", grade: "ungraded" }]);
  });
});

describe("buildRecord with grades", () => {
  it("adds one grade per card and keeps the earlier fields unchanged", () => {
    const { state } = mockMoment("t2", emptyState());
    const record = buildRecord(demoPrep, state, { "c-t2": { grade: "helpful", gradedAt: "2026-10-10T20:00:00.000Z" } });
    expect(record.cards).toEqual(state.cards);
    expect(record.concerns).toEqual(state.concerns);
    expect(record.grades).toEqual([{ cardId: "c-t2", grade: "helpful", gradedAt: "2026-10-10T20:00:00.000Z" }]);
    expect(buildRecord(demoPrep, state).grades?.map((g) => g.grade)).toEqual(["ungraded"]);
  });

  it("still names a record saved before grades existed", () => {
    expect(recordFileName({ client: "Dana", endedAt: "2026-10-10T20:00:00.000Z", concerns: [], cards: [] })).toBe(
      "second-chair-record-dana-2026-10-10.json",
    );
  });
});

describe("the engine stamps time and model on each card", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    setClientForTests(undefined);
    vi.restoreAllMocks();
  });
  const upToT2 = demoTranscript.slice(0, 2);
  const t2 = upToT2[1];

  it("records the model that answered and the turn's time", async () => {
    const live: LlmMoment = {
      speaker: "client",
      relevant: true,
      moment: "objection",
      concern: "Worried about access to cash.",
      facts: [{ text: "The plan keeps a $180,000 liquid reserve.", label: "PREPARED_FACT", sourceId: "plan-1" }],
      recommendedMove: "Anchor to the reserve.",
      phrasing: "The plan keeps $180,000 liquid.",
      why: "She asked about access.",
      doNotClaim: [],
      defer: false,
      concernUpdates: { open: ["liquidity"], resolve: [] },
    };
    const parse = vi.fn().mockResolvedValue({ stop_reason: "end_turn", parsed_output: live, model: "claude-opus-5-5" });
    setClientForTests({ beta: { messages: { parse } } } as unknown as Anthropic);
    const res = await runMoment({ prep: demoPrep, turns: upToT2, state: emptyState() });
    expect(res.card).toMatchObject({ at: t2.t, model: "claude-opus-5-5" });

    parse.mockResolvedValue({ stop_reason: "end_turn", parsed_output: live });
    const noModel = await runMoment({ prep: demoPrep, turns: upToT2, state: emptyState() });
    expect(noModel.card?.model).toBe(LIVE_MODEL);
  });

  it("marks a canned demo card as canned", async () => {
    setClientForTests(null);
    const res = await runMoment({ prep: demoPrep, turns: upToT2, state: emptyState() });
    expect(res.card).toMatchObject({ id: "c-t2", at: t2.t, model: "canned" });
  });
});

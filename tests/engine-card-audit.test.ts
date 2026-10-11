// #42: each card carries when in the meeting it came and which model wrote
// it, so the graded record can be audited over time. D's record (#58) keeps
// the grades; the cards it carries keep the time and model.
import type Anthropic from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoPrep, demoTranscript } from "@/data/demo";
import { LIVE_MODEL, setClientForTests } from "@/lib/engine/client";
import { runMoment, type LlmMoment } from "@/lib/engine/moment";
import { buildRecord } from "@/lib/record";
import { Card, emptyState } from "@/lib/types";

const upToT2 = demoTranscript.slice(0, 2);
const t2 = upToT2[1];

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

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  setClientForTests(undefined);
  vi.restoreAllMocks();
});

describe("the engine stamps time and model on each card", () => {
  it("records the model that answered and the turn's time", async () => {
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

  it("still parses a card from before #42, with neither field", () => {
    const old = { id: "c-old", turnId: "t2", moment: "objection", concern: "c", facts: [], recommendedMove: "m", phrasing: "p", why: "w", doNotClaim: [], defer: false };
    expect(Card.safeParse(old).success).toBe(true);
  });
});

describe("the graded record carries each card's time and model", () => {
  it("keeps them on the cards next to D's grades", async () => {
    setClientForTests(null);
    const { state } = await runMoment({ prep: demoPrep, turns: upToT2, state: emptyState() });
    const record = buildRecord(demoPrep, state, [{ cardId: "c-t2", grade: "helpful", gradedAt: "2026-10-10T20:00:00.000Z" }]);
    expect(record.grades).toEqual([{ cardId: "c-t2", grade: "helpful", gradedAt: "2026-10-10T20:00:00.000Z" }]);
    expect(record.cards[0]).toMatchObject({ id: "c-t2", at: t2.t, model: "canned" });
  });
});

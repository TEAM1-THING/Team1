// #41: the same worry, reworded, gets the same prepared facts and move.
import type Anthropic from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoPrep, demoTranscript } from "@/data/demo";
import { setClientForTests } from "@/lib/engine/client";
import { buildMomentParts, runMoment, type LlmMoment } from "@/lib/engine/moment";
import { MomentResponse, emptyState, type ConversationState, type TranscriptTurn } from "@/lib/types";

function returning(...outs: LlmMoment[]) {
  const parse = vi.fn();
  for (const parsed_output of outs) parse.mockResolvedValueOnce({ stop_reason: "end_turn", parsed_output });
  setClientForTests({ beta: { messages: { parse } } } as unknown as Anthropic);
  return parse;
}

const t2 = demoTranscript.find((t) => t.id === "t2")!;
const reworded: TranscriptTurn = {
  id: "m9",
  speaker: "client",
  t: 70,
  text: "Sorry, say again: if an emergency hits, can I actually get at my money?",
};

const first: LlmMoment = {
  speaker: "client",
  relevant: true,
  moment: "objection",
  concern: "Worried that investing leaves too little cash for emergencies.",
  facts: [
    { text: "The plan keeps a $180,000 liquid reserve.", label: "PREPARED_FACT", sourceId: "plan-1" },
    { text: "$120,000 sits above the reserve.", label: "CALCULATED", math: "$300,000 - $180,000 = $120,000" },
  ],
  recommendedMove: "Anchor to the reserve before defending returns.",
  phrasing: "The plan keeps $180,000 liquid, 24 months of expenses, whatever the market does.",
  why: "She asked about access, not returns.",
  doNotClaim: ["That the reserve covers every emergency."],
  defer: false,
  concernUpdates: { open: ["liquidity"], resolve: [] },
};

// What a model might drift to on a reworded question: other facts, another move.
const drifted: LlmMoment = {
  ...first,
  moment: "question",
  concern: "Wants to know she can reach cash in an emergency.",
  facts: [{ text: "Monthly expenses $7,500.", label: "PREPARED_FACT", sourceId: "plan-2" }],
  recommendedMove: "Walk through monthly expenses first.",
  phrasing: "Yes. $180,000 stays liquid for exactly that, about 24 months of expenses.",
  why: "Expenses frame the reserve.",
  doNotClaim: [],
  concernUpdates: { open: ["cash access"], resolve: [] },
  sameAs: "c-t2",
  addsNew: false,
};

async function afterFirst(): Promise<ConversationState> {
  returning(first);
  const res = await runMoment({ prep: demoPrep, turns: demoTranscript.slice(0, 2), state: emptyState() });
  expect(res.card?.id).toBe("c-t2");
  return res.state;
}

const turnsWith = (latest: TranscriptTurn) => [...demoTranscript.slice(0, 4), latest];

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  setClientForTests(undefined);
  vi.restoreAllMocks();
});

describe("earlier cards in the prompt", () => {
  it("shows earlier cards in the live part and leaves the cached part unchanged", async () => {
    const state = await afterFirst();
    const turns = turnsWith(reworded);
    const withCards = buildMomentParts(demoPrep, turns, state, reworded);
    const without = buildMomentParts(demoPrep, turns, emptyState(), reworded);
    expect(withCards.prep).toBe(without.prep);
    expect(withCards.live).toContain("<earlier_cards>");
    expect(withCards.live).toContain('"id":"c-t2"');
    expect(withCards.live).toContain(t2.text.slice(0, 40));
    expect(without.live).not.toContain("<earlier_cards>");
  });

  it("does not show the latest turn's own card as an earlier one", async () => {
    const state = await afterFirst();
    const parts = buildMomentParts(demoPrep, demoTranscript.slice(0, 2), state, t2);
    expect(parts.live).not.toContain("<earlier_cards>");
  });
});

describe("holding to the earlier card", () => {
  it("keeps the earlier card's facts and move when the client rewords the worry", async () => {
    const state = await afterFirst();
    const before = state.cards[0];
    returning(drifted);
    const res = await runMoment({ prep: demoPrep, turns: turnsWith(reworded), state });
    expect(MomentResponse.safeParse(res).success).toBe(true);
    expect(res.card?.id).toBe("c-m9");
    expect(res.card?.facts).toEqual(before.facts);
    expect(res.card?.recommendedMove).toBe(before.recommendedMove);
    expect(res.card?.moment).toBe(before.moment);
    expect(res.card?.doNotClaim).toEqual(before.doNotClaim);
    // Only the wording of the line answers the new words.
    expect(res.card?.phrasing).toBe(drifted.phrasing);
    // No reworded duplicate in the ledger: "liquidity" is still the one concern.
    expect(res.state.concerns.map((c) => c.topic)).toEqual(["liquidity"]);
  });

  it("reopens the earlier topic if it had been resolved", async () => {
    const state = await afterFirst();
    const resolved: ConversationState = {
      ...state,
      concerns: state.concerns.map((c) => ({ ...c, status: "resolved" as const, resolvedAtTurn: "t4" })),
    };
    returning(drifted);
    const res = await runMoment({ prep: demoPrep, turns: turnsWith(reworded), state: resolved });
    const open = res.state.concerns.filter((c) => c.status === "open").map((c) => c.topic);
    expect(open).toEqual(["liquidity"]);
  });

  it("two rewordings in a row give the same facts and move", async () => {
    const state = await afterFirst();
    returning(drifted);
    const a = await runMoment({ prep: demoPrep, turns: turnsWith(reworded), state });
    const again: TranscriptTurn = { id: "m10", speaker: "client", t: 80, text: "So if something goes wrong, is the cash there?" };
    returning({ ...drifted, facts: [], recommendedMove: "Reassure her.", sameAs: "c-m9" });
    const b = await runMoment({ prep: demoPrep, turns: [...turnsWith(reworded), again], state: a.state });
    expect(b.card?.facts).toEqual(a.card?.facts);
    expect(b.card?.recommendedMove).toBe(a.card?.recommendedMove);
    // The second rewording holds to the first, which opened nothing itself.
    expect(b.state.concerns.map((c) => c.topic)).toEqual(["liquidity"]);
  });

  it("answers fresh when the client adds something new", async () => {
    const state = await afterFirst();
    returning({ ...drifted, addsNew: true });
    const res = await runMoment({ prep: demoPrep, turns: turnsWith(reworded), state });
    expect(res.card?.recommendedMove).toBe(drifted.recommendedMove);
    expect(res.card?.facts.map((f) => f.text)).toEqual(["Monthly expenses $7,500."]);
  });

  it("answers fresh when the client says a figure the earlier card did not have", async () => {
    const state = await afterFirst();
    const withFigure: TranscriptTurn = { ...reworded, text: "If a $40,000 roof repair hits, can I get at my money?" };
    returning(drifted);
    const res = await runMoment({ prep: demoPrep, turns: turnsWith(withFigure), state });
    expect(res.card?.recommendedMove).toBe(drifted.recommendedMove);
  });

  it("ignores a sameAs that names no earlier card", async () => {
    const state = await afterFirst();
    returning({ ...drifted, sameAs: "c-nope" });
    const res = await runMoment({ prep: demoPrep, turns: turnsWith(reworded), state });
    expect(res.card?.recommendedMove).toBe(drifted.recommendedMove);
    expect(res.state.concerns.map((c) => c.topic)).toEqual(["liquidity", "cash access"]);
  });

  it("keeps an earlier defer whole rather than mixing it with an answer", async () => {
    const stock: TranscriptTurn = { id: "m1", speaker: "client", t: 60, text: "Should I just buy Nvidia instead?" };
    const deferOut: LlmMoment = {
      ...first,
      moment: "question",
      concern: "Wants a single-stock bet.",
      facts: [{ text: "Whether any single stock will outperform.", label: "DO_NOT_CLAIM" }],
      recommendedMove: "Defer stock picks to a follow-up.",
      phrasing: "That's outside what we prepared today; let's note it for a follow-up.",
      why: "Stock picks are out of scope.",
      defer: true,
      deferReason: "Out of scope: Individual stock picks.",
      concernUpdates: { open: ["stock pick"], resolve: [] },
    };
    returning(deferOut);
    const a = await runMoment({ prep: demoPrep, turns: [stock], state: emptyState() });
    expect(a.card?.defer).toBe(true);
    const reask: TranscriptTurn = { id: "m2", speaker: "client", t: 75, text: "But wouldn't one big tech name do better than all this?" };
    returning({ ...first, sameAs: "c-m1", addsNew: false });
    const b = await runMoment({ prep: demoPrep, turns: [stock, reask], state: a.state });
    expect(b.card?.defer).toBe(true);
    expect(b.card?.phrasing).toBe(a.card?.phrasing);
    expect(b.card?.facts.every((f) => f.label === "DO_NOT_CLAIM")).toBe(true);
  });
});

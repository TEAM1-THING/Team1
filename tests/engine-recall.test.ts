// The misremembered-figure catch (#30): the client's figures checked against
// the materials, unit included, and the trace that keeps the card's guess
// about a mix-up from showing as a prepared fact.
import type Anthropic from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoPrep, demoTranscript } from "@/data/demo";
import { setClientForTests } from "@/lib/engine/client";
import { buildMomentPrompt, runMoment, type LlmMoment } from "@/lib/engine/moment";
import { checkClientFigures, figures } from "@/lib/engine/recall";
import { mockMoment } from "@/lib/mock";
import { emptyState, type TranscriptTurn } from "@/lib/types";

const returning = (parsed_output: LlmMoment) =>
  setClientForTests({
    beta: { messages: { parse: async () => ({ stop_reason: "end_turn", parsed_output }) } },
  } as unknown as Anthropic);

const upTo = (id: string) => demoTranscript.slice(0, demoTranscript.findIndex((t) => t.id === id) + 1);
const afterT6 = () => ["t2", "t4", "t6"].reduce((s, id) => mockMoment(id, s).state, emptyState());
// An off-script client line in place of t8.
const saying = (text: string): TranscriptTurn[] => [...upTo("t7"), { id: "x8", speaker: "client", t: 75, text }];
const labels = (facts: { label: string }[] | undefined) => facts?.map((f) => f.label);

// t8: Dana recalls the reserve as $200,000; the plan says $180,000, and
// $200,000 is the monthly tranche size.
const liveT8: LlmMoment = {
  speaker: "client",
  relevant: true,
  moment: "contradiction",
  concern: "Recalls the reserve as $200,000; the plan says $180,000.",
  facts: [
    { text: "The plan keeps a $180,000 liquid reserve.", label: "PREPARED_FACT", sourceId: "plan-1" },
    { text: "Enter the market in 6 equal monthly tranches of $200,000 to reduce timing risk.", label: "PREPARED_FACT", sourceId: "plan-1" },
  ],
  recommendedMove: "Give the plan's reserve figure gently, then name the tranche size.",
  phrasing: "The reserve is $180,000. The $200,000 you may be remembering is each monthly tranche.",
  why: "$200,000 is the plan's monthly tranche size, the likely mix-up.",
  doNotClaim: ["That the reserve is $200,000."],
  defer: false,
  concernUpdates: { open: [], resolve: [] },
};

// The plan assumes a 5% return; there is no 6% anywhere in the materials.
const RETURN_6 = "Hold on, wasn't the return assumption 6%?";
const live6: LlmMoment = {
  ...liveT8,
  concern: "Recalls the return assumption as 6%; the plan assumes 5%.",
  facts: [
    { text: "Projected income at 70: $9,000 a month under a 5% average return assumption.", label: "PREPARED_FACT", sourceId: "plan-1" },
    { text: "The plan also has 6 equal monthly tranches of $200,000, which is likely where the 6 comes from.", label: "PREPARED_FACT", sourceId: "plan-1" },
  ],
  phrasing: "Good thing to check. The plan assumes a 5% average return.",
  why: "Her figure differs from the plan's assumption.",
  doNotClaim: ["That the plan assumes 6%."],
};

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  setClientForTests(undefined);
  vi.restoreAllMocks();
});

describe("checkClientFigures", () => {
  it("hands Claude the client's figures and where the plan holds them", () => {
    const turns = upTo("t8");
    expect(buildMomentPrompt(demoPrep, turns, emptyState(), turns.at(-1)!)).toContain("<client_figures>");
    const check = checkClientFigures(turns.at(-1)!.text, demoPrep, 12);
    expect(check?.figures).toEqual([
      {
        said: "$200,000",
        inMaterials: true,
        foundIn: [{ sourceId: "plan-1", text: "Enter the market in 6 equal monthly tranches of $200,000 to reduce timing risk." }],
      },
    ]);
    expect(check?.planLines.map((l) => l.sourceId)).toEqual(["plan-1", "plan-2"]);
    expect(check?.planLines[0].text).toContain("$180,000 liquid reserve");
  });

  it("matches the unit: 6% is not the 6 tranches, 24% is not 24 months", () => {
    const six = checkClientFigures(RETURN_6, demoPrep, 12);
    expect(six?.figures).toEqual([{ said: "6%", inMaterials: false, foundIn: [] }]);
    expect(six?.planLines.map((l) => l.text)).toContain("Projected income at 70: $9,000 a month under a 5% average return assumption.");
    const pct = checkClientFigures("Wasn't 24% of the portfolio kept in cash?", demoPrep, 12);
    expect(pct?.figures).toEqual([{ said: "24%", inMaterials: false, foundIn: [] }]);
    // The same unit still matches.
    expect(checkClientFigures("Is the return still 5%?", demoPrep, 12)?.figures[0]).toMatchObject({ inMaterials: true, foundIn: [{ sourceId: "plan-1" }] });
    // Speech-to-text writes "percent" as a word.
    expect(checkClientFigures("Is the return still 5 percent?", demoPrep, 12)?.figures[0]).toMatchObject({ said: "5 percent", inMaterials: true });
    expect(figures("What if returns are 4 percent?")).toEqual(["%4"]);
  });

  it("matches a bare figure to a dollar amount, since speech-to-text can drop the $", () => {
    const check = checkClientFigures("I thought the reserve was 200,000?", demoPrep, 12);
    expect(check?.figures[0]).toMatchObject({ said: "200,000", inMaterials: true, foundIn: [{ sourceId: "plan-1" }] });
    expect(check?.figures[0].foundIn[0].text).toContain("tranches of $200,000");
  });

  it("leaves the prompt alone when nothing in the materials can hold the figure", () => {
    // t6 names 2008: no source holds it and no plan line is on its topic.
    const t6 = upTo("t6");
    expect(checkClientFigures(t6.at(-1)!.text, demoPrep, 12)).toBeNull();
    expect(buildMomentPrompt(demoPrep, t6, emptyState(), t6.at(-1)!)).not.toContain("<client_figures>");
    const t2 = upTo("t2");
    expect(buildMomentPrompt(demoPrep, t2, emptyState(), t2.at(-1)!)).not.toContain("<client_figures>");
  });
});

describe("misremembered figure card", () => {
  it("names both figures, the plan's green with its source, the other the source's own sentence", async () => {
    returning(liveT8);
    const res = await runMoment({ prep: demoPrep, turns: upTo("t8"), state: afterT6() });
    expect(res.card).toMatchObject({ id: "c-t8", moment: "contradiction", concern: liveT8.concern, phrasing: liveT8.phrasing });
    expect(res.card?.facts).toEqual(liveT8.facts);
    expect(res.card?.phrasing).toContain("$180,000");
    expect(res.card?.phrasing).toContain("$200,000");
    // The meeting card shows the cited document and its date under the fact.
    expect(demoPrep.sources.find((s) => s.id === res.card?.facts[0].sourceId)?.date).toBeTruthy();
  });

  it("does not show the card's guess about a mix-up as a prepared fact", async () => {
    // A 6% the plan never says, explained by the 6 tranches.
    returning(live6);
    const six = await runMoment({ prep: demoPrep, turns: saying(RETURN_6), state: afterT6() });
    expect(six.card?.moment).toBe("contradiction");
    expect(labels(six.card?.facts)).toEqual(["PREPARED_FACT", "SUGGESTION"]);

    // A 24% explained by the 24 months, and a paraphrase of what $7,500 is.
    for (const [said, text, sourceId] of [
      ["Wasn't 24% of the portfolio kept in cash?", "The 24 in the plan is months of expenses, not a percentage of the portfolio.", "plan-2"],
      ["Is the reserve still based on $7,500 a month?", "$7,500 a month is the monthly expenses figure in the plan, used to size the reserve.", "plan-2"],
    ]) {
      returning({ ...live6, concern: "Asks about a figure in the plan.", facts: [{ text, label: "PREPARED_FACT", sourceId }] });
      const res = await runMoment({ prep: demoPrep, turns: saying(said), state: afterT6() });
      expect(labels(res.card?.facts)).toEqual(["SUGGESTION"]);
    }
  });

  it("downgrades a prepared fact that pins the client's figure on the wrong thing", async () => {
    returning({
      ...liveT8,
      facts: [
        { text: "The report lists the reserve at $200,000.", label: "PREPARED_FACT", sourceId: "plan-1" },
        { text: "Each of the 6 monthly tranches is $200,000.", label: "PREPARED_FACT", sourceId: "plan-1" },
      ],
    });
    const res = await runMoment({ prep: demoPrep, turns: upTo("t8"), state: afterT6() });
    expect(labels(res.card?.facts)).toEqual(["SUGGESTION", "PREPARED_FACT"]);
  });

  it("allows the client's own figure in the phrasing even when no source has it", async () => {
    returning({
      ...liveT8,
      concern: "Recalls the reserve as $250,000; the plan says $180,000.",
      facts: [
        { text: "The plan keeps a $180,000 liquid reserve.", label: "PREPARED_FACT", sourceId: "plan-1" },
        { text: "The reserve is $250,000.", label: "PREPARED_FACT", sourceId: "plan-1" },
      ],
      phrasing: "You mentioned $250,000; the plan's reserve is $180,000, 24 months of expenses.",
      why: "Her figure and the plan's differ.",
    });
    const res = await runMoment({ prep: demoPrep, turns: saying("I thought the reserve was $250,000?"), state: afterT6() });
    expect(res.card?.phrasing).toContain("$250,000");
    expect(labels(res.card?.facts)).toEqual(["PREPARED_FACT", "SUGGESTION"]);
  });

  it("still rejects or downgrades an invented third figure", async () => {
    returning({ ...liveT8, phrasing: "The reserve is $180,000, not $200,000; with interest it reaches $220,000." });
    const spoken = await runMoment({ prep: demoPrep, turns: upTo("t8"), state: afterT6() });
    expect(spoken.card?.phrasing).toBe(mockMoment("t8", afterT6()).card?.phrasing);
    expect(spoken.card?.phrasing).not.toContain("$220,000");

    returning({ ...liveT8, facts: [...liveT8.facts, { text: "With interest the reserve reaches $220,000.", label: "PREPARED_FACT", sourceId: "plan-1" }] });
    const fact = await runMoment({ prep: demoPrep, turns: upTo("t8"), state: afterT6() });
    expect(labels(fact.card?.facts)).toEqual(["PREPARED_FACT", "PREPARED_FACT", "SUGGESTION"]);
  });

  it("falls back to a canned mismatch card for t8 that survives the trace and opens no follow-up", async () => {
    setClientForTests(null);
    const res = await runMoment({ prep: demoPrep, turns: upTo("t8"), state: afterT6() });
    expect(res.card?.id).toBe("c-t8");
    expect(res.card?.moment).toBe("contradiction");
    expect(res.card?.facts.map((f) => [f.label, f.sourceId])).toEqual([
      ["PREPARED_FACT", "plan-1"],
      ["PREPARED_FACT", "plan-1"],
    ]);
    expect(res.state.concerns).toEqual(afterT6().concerns);
  });
});

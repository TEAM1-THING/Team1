// #38: anticipated worries at prep, each with a prepared answer and traced facts.
import type Anthropic from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/anticipate/route";
import { demoPrep } from "@/data/demo";
import { anticipateWorries, checkPrepared, traceWorries } from "@/lib/engine/anticipate";
import { setClientForTests } from "@/lib/engine/client";
import { ingestFiles } from "@/lib/engine/ingest";
import { buildMomentParts } from "@/lib/engine/moment";
import { emptyState, type AnticipatedWorry, type TranscriptTurn } from "@/lib/types";

const sources = demoPrep.sources; // plan-1 (index 1), plan-2 (index 2)

type Fact = { text: string; label: string; source: number; math: string };
const worry = (answer: string, facts: Fact[], extra: Partial<{ worry: string; why: string }> = {}) => ({
  worry: "Will I have cash if something happens?",
  why: "Her stated concern is running short of cash in an emergency.",
  answer,
  facts,
  ...extra,
});
const reserveFact: Fact = { text: "Keep a $180,000 liquid reserve, equal to 24 months of expenses.", label: "PREPARED_FACT", source: 1, math: "" };
const goodAnswer =
  "That's a fair worry. Your plan keeps $180,000 liquid, 24 months of expenses, so retiring at 70 stays on track. Does that cover what you had in mind?";

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  setClientForTests(undefined);
  vi.restoreAllMocks();
});

describe("traceWorries", () => {
  it("keeps a traced worry and maps the source index to its id", () => {
    const [w] = traceWorries({ worries: [worry(goodAnswer, [reserveFact])] }, sources);
    expect(w.answer).toBe(goodAnswer);
    expect(w.facts).toEqual([{ text: reserveFact.text, label: "PREPARED_FACT", sourceId: "plan-1" }]);
  });

  it("downgrades a PREPARED_FACT whose figure is not in the source it cites", () => {
    // $1,200,000 is in plan-1, not plan-2.
    const fact: Fact = { text: "Invest $1,200,000 in a 60/40 portfolio.", label: "PREPARED_FACT", source: 2, math: "" };
    const [w] = traceWorries({ worries: [worry(goodAnswer, [fact])] }, sources);
    expect(w.facts[0].label).toBe("SUGGESTION");
  });

  it("downgrades a fact with no source or an off-list label, and keeps a do-not-claim", () => {
    const facts: Fact[] = [
      { text: "Keep a $180,000 liquid reserve.", label: "PREPARED_FACT", source: 0, math: "" },
      { text: "That the reserve covers everything.", label: "DO_NOT_CLAIM", source: 0, math: "" },
      { text: "Markets recover.", label: "GREEN", source: 1, math: "" },
    ];
    const [w] = traceWorries({ worries: [worry(goodAnswer, facts)] }, sources);
    expect(w.facts.map((f) => f.label)).toEqual(["SUGGESTION", "DO_NOT_CLAIM", "SUGGESTION"]);
  });

  it("drops a worry whose answer, worry or why carries a figure in no file", () => {
    const out = traceWorries(
      {
        worries: [
          worry("Your plan keeps $250,000 liquid. Does that help?", [reserveFact]),
          worry(goodAnswer, [reserveFact], { worry: "Is the reserve really $210,000?" }),
          worry(goodAnswer, [reserveFact], { why: "She has 3 rental properties." }),
        ],
      },
      sources,
    );
    expect(out).toEqual([]);
  });

  it("lets the answer use a figure from a CALCULATED fact with its math", () => {
    const calc: Fact = { text: "$120,000 sits above the reserve.", label: "CALCULATED", source: 0, math: "$300,000 - $180,000 = $120,000" };
    const [w] = traceWorries({ worries: [worry("About $120,000 sits above your reserve. Shall we look at it?", [calc])] }, sources);
    expect(w.facts[0].label).toBe("CALCULATED");
    const noMath = traceWorries({ worries: [worry("About $95,000 is spare. Okay?", [{ ...calc, text: "$95,000 spare.", math: "" }])] }, sources);
    expect(noMath).toEqual([]);
  });

  it("keeps at most five worries and three facts each", () => {
    const many = Array.from({ length: 7 }, () => worry(goodAnswer, [reserveFact, reserveFact, reserveFact, reserveFact]));
    const out = traceWorries({ worries: many }, sources);
    expect(out).toHaveLength(5);
    expect(out[0].facts).toHaveLength(3);
  });
});

describe("checkPrepared", () => {
  it("drops a prepared answer the advisor edited to carry an untraced figure", () => {
    const [w] = traceWorries({ worries: [worry(goodAnswer, [reserveFact])] }, sources);
    const edited: AnticipatedWorry = { ...w, answer: "You'll have $500,000 liquid." };
    expect(checkPrepared([w, edited], sources)).toEqual([w]);
  });
});

describe("anticipateWorries", () => {
  it("returns no worries without Claude", async () => {
    setClientForTests(null);
    expect(await anticipateWorries({ clientFile: demoPrep.clientFile, sources })).toEqual({ anticipated: [], source: "fallback" });
  });

  it("returns traced worries from Claude, and none on a refusal", async () => {
    const parse = vi.fn().mockResolvedValueOnce({ stop_reason: "end_turn", parsed_output: { worries: [worry(goodAnswer, [reserveFact])] } });
    parse.mockResolvedValueOnce({ stop_reason: "refusal", parsed_output: null });
    setClientForTests({ beta: { messages: { parse } } } as unknown as Anthropic);
    const ok = await anticipateWorries({ clientFile: demoPrep.clientFile, sources });
    expect(ok.source).toBe("claude");
    expect(ok.anticipated[0].facts[0].sourceId).toBe("plan-1");
    const prompt = (parse.mock.calls[0][0] as { messages: { content: string }[] }).messages[0].content;
    expect(prompt).toContain("Running short of cash in an emergency");
    expect(prompt).toContain('<source index="1"');
    expect(await anticipateWorries({ clientFile: demoPrep.clientFile, sources })).toEqual({ anticipated: [], source: "fallback" });
  });
});

describe("ingestFiles anticipates beside the Mandate", () => {
  it("returns the worries from the parallel call", async () => {
    const plan = { name: "plan.txt", data: Buffer.from(sources[0].text) };
    const read = {
      documents: [{ index: 1, title: "Retirement plan", kind: "plan", date: "", transcript: "" }],
      meeting: { with: "Dana Whitfield", role: "client", purpose: "Review the plan." },
      clientFile: { ...demoPrep.clientFile, cashOnHand: 0, age: 0, horizonYears: 0 },
      missing: [],
      conflicts: [],
    };
    const parse = vi.fn(async (params: { system: string }) => {
      if (params.system.startsWith("You draft a Mandate")) return { stop_reason: "refusal", parsed_output: null };
      if (params.system.startsWith("You help a financial advisor prepare"))
        return { stop_reason: "end_turn", parsed_output: { worries: [worry(goodAnswer, [reserveFact])] } };
      return { stop_reason: "end_turn", parsed_output: read };
    });
    setClientForTests({ beta: { messages: { parse } } } as unknown as Anthropic);
    const r = await ingestFiles([plan]);
    expect(r.source).toBe("claude");
    expect(r.anticipated).toHaveLength(1);
    expect(r.anticipated[0].facts[0]).toMatchObject({ label: "PREPARED_FACT", sourceId: "file-1" });
  });
});

describe("the meeting uses the prepared answers", () => {
  const latest: TranscriptTurn = { id: "t2", speaker: "client", t: 8, text: "Will I have cash if something happens?" };

  it("puts traced worries in the cached prep part, not the live part", () => {
    const anticipated = traceWorries({ worries: [worry(goodAnswer, [reserveFact])] }, sources);
    const parts = buildMomentParts({ ...demoPrep, anticipated }, [latest], emptyState(), latest);
    expect(parts.prep).toContain("<anticipated>");
    expect(parts.prep).toContain("24 months of expenses, so retiring at 70");
    expect(parts.live).not.toContain("<anticipated>");
  });

  it("leaves out an edited answer that no longer traces", () => {
    const [w] = traceWorries({ worries: [worry(goodAnswer, [reserveFact])] }, sources);
    const parts = buildMomentParts({ ...demoPrep, anticipated: [{ ...w, answer: "You'll have $500,000." }] }, [latest], emptyState(), latest);
    expect(parts.prep).not.toContain("<anticipated>");
  });
});

describe("POST /api/anticipate", () => {
  const post = (body: unknown) =>
    POST(new Request("http://x/api/anticipate", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));

  it("rejects a body that is not JSON or not a prep", async () => {
    expect((await post("nope")).status).toBe(400);
    expect((await post({ sources: [] })).status).toBe(400);
  });

  it("answers with an empty list without Claude", async () => {
    setClientForTests(null);
    const res = await post({ clientFile: demoPrep.clientFile, sources });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ anticipated: [], source: "fallback" });
  });
});

describe("demo prep", () => {
  it("carries anticipated worries that all pass the trace unchanged", () => {
    const prepared = demoPrep.anticipated ?? [];
    expect(prepared.length).toBeGreaterThanOrEqual(3);
    expect(checkPrepared(prepared, demoPrep.sources)).toEqual(prepared);
  });
});

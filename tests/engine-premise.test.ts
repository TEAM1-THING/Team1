import type Anthropic from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoPrep } from "@/data/demo";
import { setClientForTests } from "@/lib/engine/client";
import { runMoment, type LlmMoment } from "@/lib/engine/moment";
import {
  PREMISE_GRACE_MS,
  checkPremise,
  clearPremiseCacheForTests,
  mayStatePublicFact,
  premiseCheckEnabled,
  safeQuery,
  withPremise,
  type PremiseFinding,
} from "@/lib/engine/premise";
import { emptyState, type Card, type TranscriptTurn } from "@/lib/types";

const FED_URL = "https://www.federalreserve.gov/newsevents/pressreleases/monetary20261008a.htm";
const SAID = "Since the Fed cut rates by a full point last week, shouldn't we move the reserve into long bonds?";

// Fake Bright Data: answers like the SERP API with format "raw" + brd_json.
function fakeBrightData(organic = [{ link: FED_URL, title: "Federal Reserve issues FOMC statement", description: "The Committee decided to maintain the target range at 3.75 to 4 percent." }]) {
  const spy = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    if (init?.signal?.aborted) throw new DOMException("aborted", "AbortError");
    const body = JSON.parse(String(init?.body)) as { url: string };
    const q = new URL(body.url).searchParams.get("q") ?? "";
    return new Response(JSON.stringify({ general: { query: q }, organic }), { status: 200 });
  });
  vi.stubGlobal("fetch", spy);
  return spy;
}

type Verdict = { id: string; status: string; note: string; sourceUrl: string };
type Script = { claims?: { claim: string; query: string }[]; verdicts?: Verdict[]; moment?: LlmMoment };

// One fake client for all three calls, told apart by their system prompts.
function fakeClient(script: Script) {
  const spy = vi.fn(async (params: { system: string }) => {
    if (params.system.includes("Find statements of fact")) return { stop_reason: "end_turn", parsed_output: { claims: script.claims ?? [] } };
    if (params.system.includes("You check statements")) return { stop_reason: "end_turn", parsed_output: { verdicts: script.verdicts ?? [] } };
    return { stop_reason: "end_turn", parsed_output: script.moment ?? null };
  });
  setClientForTests({ beta: { messages: { parse: spy } } } as unknown as Anthropic);
  return spy;
}

const fedClaim = { claim: "the Fed cut rates by a full point last week", query: "Federal Reserve rate decision October 2026" };
const held: Verdict = {
  id: "p1",
  status: "contradicted",
  note: "The Fed held its target range at 3.75 to 4 percent.",
  sourceUrl: FED_URL,
};

const moment: LlmMoment = {
  speaker: "client",
  relevant: true,
  moment: "question",
  concern: "Wants to chase a rate move with the reserve.",
  facts: [{ text: "The plan keeps a $180,000 liquid reserve.", label: "PREPARED_FACT", sourceId: "plan-1" }],
  recommendedMove: "Separate the reserve from the rate question.",
  phrasing: "Let's keep the reserve doing its job and look at the bond question on its own.",
  why: "The reserve is for emergencies, not returns.",
  doNotClaim: [],
  defer: false,
  concernUpdates: { open: ["rates"], resolve: [] },
};

beforeEach(() => {
  clearPremiseCacheForTests();
  vi.stubEnv("BRIGHTDATA_API_KEY", "test-key");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  setClientForTests(undefined);
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("which turns are checked", () => {
  it("runs on statements about markets, rates, policy or news", () => {
    expect(mayStatePublicFact(SAID)).toBe(true);
    expect(mayStatePublicFact("I read that the 401k limit doubled this year.")).toBe(true);
    expect(mayStatePublicFact("Inflation is back above 6%, right?")).toBe(true);
  });

  it("skips turns about the client's own life", () => {
    expect(mayStatePublicFact("Can we lower my monthly withdrawal?")).toBe(false);
    expect(mayStatePublicFact("My daughter starts college next fall.")).toBe(false);
  });

  it("is on only with Bright Data and Claude, and PREMISE_CHECK=0 turns it off", () => {
    fakeClient({});
    expect(premiseCheckEnabled()).toBe(true);
    vi.stubEnv("PREMISE_CHECK", "0");
    expect(premiseCheckEnabled()).toBe(false);
    vi.stubEnv("PREMISE_CHECK", "");
    vi.stubEnv("BRIGHTDATA_API_KEY", "");
    expect(premiseCheckEnabled()).toBe(false);
    vi.stubEnv("BRIGHTDATA_API_KEY", "test-key");
    setClientForTests(null);
    expect(premiseCheckEnabled()).toBe(false);
  });
});

describe("what leaves for Google", () => {
  it("keeps a plain public query", () => {
    expect(safeQuery("  Federal Reserve rate decision   October 2026 ", demoPrep)).toBe("Federal Reserve rate decision October 2026");
  });

  it("refuses a query carrying the client's name, an email or an account number", () => {
    const first = demoPrep.clientFile.name.split(" ")[0];
    expect(safeQuery(`${first} retirement rates`, demoPrep)).toBeNull();
    expect(safeQuery("rates for someone@example.com", demoPrep)).toBeNull();
    expect(safeQuery("account 4417 1234 5678 balance", demoPrep)).toBeNull();
  });

  it("catches numbers split by dots, slashes or brackets, and names with accents", () => {
    expect(safeQuery("account 4417.1234.5678", demoPrep)).toBeNull();
    expect(safeQuery("ref 12/34/567", demoPrep)).toBeNull();
    expect(safeQuery("call (415) 555-0199", demoPrep)).toBeNull();
    const [first, last] = demoPrep.clientFile.name.split(" ");
    expect(safeQuery(`${first.replace("a", "á")} retirement`, demoPrep)).toBeNull();
    expect(safeQuery(`${last.toUpperCase()} pension rules`, demoPrep)).toBeNull();
  });

  it("refuses the name of whoever the meeting is with", () => {
    const prep = { ...demoPrep, meeting: { with: "the Okonkwo family trust", role: "client", purpose: "review" } };
    expect(safeQuery("Okonkwo trust tax rules", prep)).toBeNull();
    expect(safeQuery("family trust tax rules 2026", prep)).toBe("family trust tax rules 2026");
  });

  it("keeps public queries with years, plan names and figures", () => {
    expect(safeQuery("IRS 401k contribution limit 2026", demoPrep)).not.toBeNull();
    expect(safeQuery("401k limit 2026 401k catch-up", demoPrep)).not.toBeNull();
    expect(safeQuery("Federal Reserve rate decision October 8 2026", demoPrep)).not.toBeNull();
    expect(safeQuery("401k limit 47,000", demoPrep)).not.toBeNull();
  });
});

describe("checkPremise", () => {
  it("names a contradicted premise with the source it relied on", async () => {
    const brightData = fakeBrightData();
    fakeClient({ claims: [fedClaim], verdicts: [held] });
    const [finding] = await checkPremise(SAID, demoPrep);
    expect(finding).toMatchObject({ claim: fedClaim.claim, status: "contradicted", note: held.note });
    expect(finding.source?.url).toBe(FED_URL);
    const sent = JSON.parse(String(brightData.mock.calls[0][1]?.body)) as { url: string };
    expect(new URL(sent.url).searchParams.get("q")).toBe(fedClaim.query);
  });

  it("makes no call at all when the turn is about the client's own life", async () => {
    const brightData = fakeBrightData();
    const claude = fakeClient({ claims: [fedClaim], verdicts: [held] });
    expect(await checkPremise("Can we lower my monthly withdrawal?", demoPrep)).toEqual([]);
    expect(claude).not.toHaveBeenCalled();
    expect(brightData).not.toHaveBeenCalled();
  });

  it("never searches a query that names the client", async () => {
    const brightData = fakeBrightData();
    fakeClient({ claims: [{ claim: "rates fell", query: `${demoPrep.clientFile.name} rates` }], verdicts: [held] });
    expect(await checkPremise(SAID, demoPrep)).toEqual([]);
    expect(brightData).not.toHaveBeenCalled();
  });

  it("is unclear when the cited source was not among the results", async () => {
    fakeBrightData();
    fakeClient({ claims: [fedClaim], verdicts: [{ ...held, sourceUrl: "https://example.com/made-up" }] });
    const [finding] = await checkPremise(SAID, demoPrep);
    expect(finding.status).toBe("unclear");
    expect(finding.source).toBeUndefined();
  });

  it("is unclear when the note carries a figure the source does not", async () => {
    fakeBrightData();
    fakeClient({ claims: [fedClaim], verdicts: [{ ...held, note: "The Fed raised rates to 6 percent." }] });
    const [finding] = await checkPremise(SAID, demoPrep);
    expect(finding.status).toBe("unclear");
  });

  it("gives up quietly when Bright Data fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("upstream error", { status: 502 })));
    fakeClient({ claims: [fedClaim], verdicts: [held] });
    expect(await checkPremise(SAID, demoPrep)).toEqual([]);
  });

  it("stops at its budget when the search hangs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string | URL | Request, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
          }),
      ),
    );
    fakeClient({ claims: [fedClaim], verdicts: [held] });
    const startedAt = Date.now();
    expect(await checkPremise(SAID, demoPrep, undefined, 150)).toEqual([]);
    expect(Date.now() - startedAt).toBeLessThan(2_000);
  });
});

describe("withPremise", () => {
  const card: Card = {
    id: "c1",
    turnId: "t1",
    moment: "question",
    concern: "x",
    facts: [{ text: "The plan keeps a $180,000 liquid reserve.", label: "PREPARED_FACT", sourceId: "plan-1" }],
    recommendedMove: "y",
    phrasing: "z",
    why: "w",
    doNotClaim: ["That the reserve covers every emergency."],
    defer: false,
  };
  const source = { title: "FOMC statement", url: FED_URL, snippet: "maintain the target range", date: "Oct 8, 2026" };

  it("leads the card with a red premise fact and a do-not-claim", () => {
    const out = withPremise(card, [{ claim: fedClaim.claim, status: "contradicted", note: held.note, source }]);
    expect(out.facts[0]).toEqual({
      text: `Check the premise: the client said ${fedClaim.claim}. ${held.note} (federalreserve.gov, Oct 8, 2026)`,
      label: "SUGGESTION",
    });
    expect(out.facts.slice(1)).toEqual(card.facts);
    expect(out.doNotClaim[0]).toBe(`Do not repeat as fact: ${fedClaim.claim}`);
  });

  it("leaves the card alone when the premise holds or is unclear", () => {
    const fine: PremiseFinding[] = [
      { claim: "a", status: "supported", note: "n", source },
      { claim: "b", status: "unclear", note: "" },
    ];
    expect(withPremise(card, fine)).toBe(card);
  });
});

describe("runMoment with the premise check", () => {
  const turns: TranscriptTurn[] = [{ id: "t1", speaker: "client", t: 30, text: SAID }];

  it("puts a contradicted premise on the live card", async () => {
    fakeBrightData();
    fakeClient({ claims: [fedClaim], verdicts: [held], moment });
    const res = await runMoment({ prep: demoPrep, turns, state: emptyState() });
    expect(res.card?.facts[0]).toMatchObject({ label: "SUGGESTION" });
    expect(res.card?.facts[0].text).toContain("Check the premise");
    expect(res.card?.facts[0].text).toContain("federalreserve.gov");
    expect(res.card?.doNotClaim[0]).toBe(`Do not repeat as fact: ${fedClaim.claim}`);
    expect(res.state.cards.at(-1)?.facts[0].text).toContain("Check the premise");
  });

  it("never holds the card longer than the grace period for a slow check", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string | URL | Request, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
          }),
      ),
    );
    fakeClient({ claims: [fedClaim], verdicts: [held], moment });
    const startedAt = Date.now();
    const res = await runMoment({ prep: demoPrep, turns, state: emptyState() });
    expect(Date.now() - startedAt).toBeLessThan(PREMISE_GRACE_MS + 1_000);
    expect(res.card?.facts.some((f) => f.text.includes("Check the premise"))).toBe(false);
    expect(res.card?.concern).toBe(moment.concern);
  });

  it("leaves the live card as it was when PREMISE_CHECK=0", async () => {
    vi.stubEnv("PREMISE_CHECK", "0");
    const brightData = fakeBrightData();
    const claude = fakeClient({ claims: [fedClaim], verdicts: [held], moment });
    const res = await runMoment({ prep: demoPrep, turns, state: emptyState() });
    expect(res.card?.facts.some((f) => f.text.includes("Check the premise"))).toBe(false);
    expect(brightData).not.toHaveBeenCalled();
    expect(claude).toHaveBeenCalledTimes(1);
  });
});

// Drives the meeting replay through the real /api/moment handler, the same
// path the screen takes, and checks the PB B1 "done when" outcomes.
import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/moment/route";
import { followUpTasks, processTurn, type PostMoment } from "@/components/meeting/replay";
import { demoPrep, demoTranscript } from "@/data/demo";
import { emptyState, type Card, type MomentResponse } from "@/lib/types";

const viaRoute: PostMoment = async (req) => {
  const res = await POST(new Request("http://x/api/moment", { method: "POST", body: JSON.stringify(req) }));
  return (await res.json()) as MomentResponse;
};

async function replayAll() {
  let state = emptyState();
  const cards: Card[] = [];
  let calls = 0;
  const counting: PostMoment = (req) => {
    calls += 1;
    return viaRoute(req);
  };
  for (let i = 1; i <= demoTranscript.length; i++) {
    const res = await processTurn(demoPrep, demoTranscript.slice(0, i), state, counting);
    state = res.state;
    if (res.card) cards.push(res.card);
  }
  return { state, cards, calls };
}

describe("meeting replay", () => {
  it("calls the engine only after client turns", async () => {
    const { calls } = await replayAll();
    expect(calls).toBe(demoTranscript.filter((t) => t.speaker === "client").length);
  });

  it("shows three cards: objection, hesitation, disclosure", async () => {
    const { cards } = await replayAll();
    expect(cards.map((c) => c.moment)).toEqual(["objection", "hesitation", "disclosure"]);
  });

  it("opens liquidity at t2, resolves it at t4, leaves timing and down payment open", async () => {
    const { state } = await replayAll();
    const byTopic = Object.fromEntries(state.concerns.map((c) => [c.topic, c]));
    expect(byTopic["liquidity"]).toMatchObject({ raisedAtTurn: "t2", status: "resolved", resolvedAtTurn: "t4" });
    expect(byTopic["market timing"]?.status).toBe("open");
    expect(byTopic["down payment"]?.status).toBe("open");
  });

  it("every CALCULATED fact on a shown card carries its math", async () => {
    const { cards } = await replayAll();
    const calculated = cards.flatMap((c) => c.facts).filter((f) => f.label === "CALCULATED");
    expect(calculated.length).toBeGreaterThan(0);
    for (const f of calculated) expect(f.math).toBeTruthy();
  });

  it("end-of-meeting tasks list exactly the concerns still open", async () => {
    const { state } = await replayAll();
    const tasks = followUpTasks(state.concerns, demoPrep.clientFile.name);
    const open = state.concerns.filter((c) => c.status === "open");
    expect(tasks).toHaveLength(open.length);
    expect(tasks.length).toBeGreaterThan(0);
    for (const c of open) expect(tasks.some((t) => t.includes(c.topic))).toBe(true);
    expect(tasks.some((t) => t.includes("liquidity"))).toBe(false);
  });
});

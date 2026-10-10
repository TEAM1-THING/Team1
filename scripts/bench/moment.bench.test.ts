// Latency and output of the live moment engine per model, on the demo scenes
// plus three harder ones. Writes JSON to BENCH_OUT for blind judging.
import { writeFileSync } from "node:fs";
import { it } from "vitest";
import { demoPrep, demoTranscript } from "@/data/demo";
import { runMoment, type MomentOptions } from "@/lib/engine/moment";
import { mockMoment } from "@/lib/mock";
import { emptyState, type ConversationState, type TranscriptTurn } from "@/lib/types";

const VARIANTS: { name: string; opts: MomentOptions }[] = [
  { name: "haiku", opts: { model: "claude-haiku-5-5" } },
  { name: "haiku-nothink", opts: { model: "claude-haiku-5-5", thinkingOff: true } },
  { name: "sonnet", opts: { model: "claude-sonnet-5-5" } },
  { name: "opus", opts: { model: "claude-opus-5-5" } },
];

const upTo = (id: string) => demoTranscript.slice(0, demoTranscript.findIndex((t) => t.id === id) + 1);
const after = (ids: string[]) => ids.reduce<ConversationState>((s, id) => mockMoment(id, s).state, emptyState());
// The harder scenes follow t6, matching their state (cards for t2, t4, t6).
const extra = (id: string, text: string): TranscriptTurn[] => [...upTo("t6"), { id, speaker: "client", t: 70, text }];

const SCENES: { id: string; expect: string; turns: TranscriptTurn[]; state: ConversationState }[] = [
  { id: "t2", expect: "objection about liquidity; anchor to the $180,000 reserve", turns: upTo("t2"), state: emptyState() },
  { id: "t4", expect: "hesitation about market timing; phased entry already in plan; liquidity resolved", turns: upTo("t4"), state: after(["t2"]) },
  { id: "t6", expect: "disclosure of a new goal (son's down payment); ask amount and timing; no invented figure", turns: upTo("t6"), state: after(["t2", "t4"]) },
  { id: "t8", expect: "contradiction: recalls the reserve as $200,000; plan says $180,000 (plan-1); $200,000 is the tranche size, the likely mix-up", turns: upTo("t8"), state: after(["t2", "t4", "t6"]) },
  { id: "x1", expect: "out-of-scope question (individual stock pick); must defer, no prepared facts", turns: extra("x1", "Should I just put some of this into Nvidia stock instead? My neighbour made a fortune."), state: after(["t2", "t4", "t6"]) },
  { id: "x2", expect: "contradiction: earlier goal retire at 70, now 65; flag it, ask before changing plan", turns: extra("x2", "Actually, I'd really like to stop working at 65, not 70. That's still fine with this plan, right?"), state: after(["t2", "t4", "t6"]) },
  { id: "x3", expect: "buying signal / commitment conditional on the reserve; confirm next step, no pressure", turns: extra("x3", "Okay. If the reserve stays untouched and we go in gradually, I think I'm ready to get started."), state: after(["t2", "t4", "t6"]) },
];

it("benchmarks live moment cards", async () => {
  const rows = [];
  for (const scene of SCENES) {
    const canned = mockMoment(scene.id, scene.state).card?.phrasing;
    for (const v of VARIANTS) {
      for (let run = 1; run <= 2; run++) {
        const t0 = performance.now();
        const res = await runMoment({ prep: demoPrep, turns: scene.turns, state: scene.state }, undefined, { ...v.opts, timeoutMs: 30_000 });
        const ms = Math.round(performance.now() - t0);
        const live = !!res.card && res.card.phrasing !== canned;
        rows.push({ scene: scene.id, expect: scene.expect, variant: v.name, run, ms, live, card: res.card, concerns: res.state.concerns });
        console.log(`${scene.id} ${v.name} run${run}: ${ms} ms ${live ? "live" : res.card ? "CANNED" : "null"}`);
      }
    }
  }
  writeFileSync(process.env.BENCH_OUT ?? "bench-moment.json", JSON.stringify(rows, null, 2));
});

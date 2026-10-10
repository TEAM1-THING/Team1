// Demo scene t2 on the live model: latency, and is the reserve figure spoken?
import { it } from "vitest";
import { demoPrep, demoTranscript } from "@/data/demo";
import { runMoment } from "@/lib/engine/moment";
import { emptyState } from "@/lib/types";

it("t2 card", async () => {
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now();
    const res = await runMoment({ prep: demoPrep, turns: demoTranscript.slice(0, 2), state: emptyState() });
    console.log(`t2 run${i + 1}: ${Math.round(performance.now() - t0)} ms | ${res.card?.phrasing} | doNotClaim=${JSON.stringify(res.card?.doNotClaim)}`);
  }
});

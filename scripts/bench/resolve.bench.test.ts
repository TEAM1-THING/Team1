// Does the live model close a concern the client accepts? Demo turn t4.
import { expect, it } from "vitest";
import { demoPrep, demoTranscript } from "@/data/demo";
import { runMoment } from "@/lib/engine/moment";
import { emptyState } from "@/lib/types";

it("resolves liquidity at t4 on the live model", async () => {
  const t2 = await runMoment({ prep: demoPrep, turns: demoTranscript.slice(0, 2), state: emptyState() });
  let resolved = 0;
  for (let i = 0; i < 4; i++) {
    const t0 = performance.now();
    const t4 = await runMoment({ prep: demoPrep, turns: demoTranscript.slice(0, 4), state: t2.state });
    const ok = t4.state.concerns.some((c) => c.status === "resolved");
    resolved += ok ? 1 : 0;
    console.log(`t4 run${i + 1}: ${Math.round(performance.now() - t0)} ms resolved=${ok} concerns=${JSON.stringify(t4.state.concerns.map((c) => [c.topic, c.status]))}`);
  }
  expect(resolved).toBeGreaterThanOrEqual(3);
});

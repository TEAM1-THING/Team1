// Does the live model log a client request as an open item? Block 1 tester 1.
import { expect, it } from "vitest";
import { demoPrep, demoTranscript } from "@/data/demo";
import { runMoment } from "@/lib/engine/moment";
import { emptyState } from "@/lib/types";

it("logs a client request as an open item", async () => {
  const turns = [...demoTranscript, { id: "r1", speaker: "client" as const, t: 70, text: "Oh, and could you send me something on college savings options for my grandkids before next week?" }];
  let logged = 0;
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now();
    const res = await runMoment({ prep: demoPrep, turns, state: emptyState() });
    const ok = res.state.concerns.some((c) => c.status === "open" && /^request/i.test(c.topic));
    logged += ok ? 1 : 0;
    console.log(`r1 run${i + 1}: ${Math.round(performance.now() - t0)} ms ${JSON.stringify(res.state.concerns.map((c) => c.topic))} | ${res.card?.moment}`);
  }
  expect(logged).toBeGreaterThanOrEqual(2);
});

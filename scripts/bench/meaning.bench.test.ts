// Does the live model catch word-meaning moments? From Block 1 tester 2.
import { expect, it } from "vitest";
import { demoPrep, demoTranscript } from "@/data/demo";
import { runMoment } from "@/lib/engine/moment";
import { emptyState, type TranscriptTurn } from "@/lib/types";

const SCENES: TranscriptTurn[][] = [
  [
    ...demoTranscript.slice(0, 3),
    { id: "m1", speaker: "advisor", t: 25, text: "Before we commit, I'll scrutinize every account you hold." },
    { id: "m2", speaker: "client", t: 30, text: "Scrutinize? Wait, am I being audited or something? Did I do something wrong?" },
  ],
  [
    ...demoTranscript.slice(0, 3),
    { id: "m3", speaker: "client", t: 30, text: "Honestly, between the house and my son, I've been going to the basement a lot lately." },
  ],
];

it("catches misunderstanding and idiom moments", async () => {
  let caught = 0;
  for (const turns of SCENES) {
    for (let i = 0; i < 2; i++) {
      const t0 = performance.now();
      const res = await runMoment({ prep: demoPrep, turns, state: emptyState() });
      const ms = Math.round(performance.now() - t0);
      const ok = res.card?.moment === "misunderstanding" || /scrutin|audit|basement/i.test(res.card?.concern ?? "");
      caught += ok ? 1 : 0;
      console.log(`${turns.at(-1)!.id} run${i + 1}: ${ms} ms moment=${res.card?.moment} | ${res.card?.concern} | ${res.card?.phrasing}`);
    }
  }
  expect(caught).toBeGreaterThanOrEqual(3);
});

// #41 on the live model: the t2 worry, then two rewordings of it. Do the
// rewordings keep the same prepared facts and move, and within the live time limit?
import { it } from "vitest";
import { demoPrep, demoTranscript } from "@/data/demo";
import { runMoment } from "@/lib/engine/moment";
import { emptyState, type Card, type TranscriptTurn } from "@/lib/types";

const rewordings: TranscriptTurn[] = [
  { id: "r1", speaker: "client", t: 70, text: "Sorry, say again: if an emergency hits, can I actually get at my money?" },
  { id: "r2", speaker: "client", t: 85, text: "So if something goes wrong with my health, is there cash I can reach quickly?" },
];

const show = (c: Card | null | undefined) =>
  c ? `move=${c.recommendedMove} | facts=${JSON.stringify(c.facts.map((f) => `${f.label}:${f.text}`))}` : "no card";

it("rewordings keep facts and move", async () => {
  for (let run = 1; run <= 2; run++) {
    let turns = demoTranscript.slice(0, 4);
    let t0 = performance.now();
    let res = await runMoment({ prep: demoPrep, turns: demoTranscript.slice(0, 2), state: emptyState() });
    console.log(`run${run} t2 ${Math.round(performance.now() - t0)} ms | ${show(res.card)}`);
    const base = res.card;
    for (const r of rewordings) {
      turns = [...turns, r];
      t0 = performance.now();
      res = await runMoment({ prep: demoPrep, turns, state: res.state });
      const same =
        !!base &&
        JSON.stringify(res.card?.facts) === JSON.stringify(base.facts) &&
        res.card?.recommendedMove === base.recommendedMove;
      console.log(`run${run} ${r.id} ${Math.round(performance.now() - t0)} ms same=${same} | ${res.card?.phrasing} | ${show(res.card)}`);
      console.log(`  concerns=${JSON.stringify(res.state.concerns.map((c) => `${c.topic}:${c.status}`))}`);
    }
  }
});

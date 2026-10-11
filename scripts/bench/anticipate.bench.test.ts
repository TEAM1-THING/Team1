// #38 on the live model: anticipated worries from the demo prep, and from the
// sample files through the full upload path. Latency and what comes back.
import { readFileSync } from "node:fs";
import { it } from "vitest";
import { demoPrep } from "@/data/demo";
import { anticipateWorries } from "@/lib/engine/anticipate";
import { ingestFiles } from "@/lib/engine/ingest";
import type { AnticipatedWorry } from "@/lib/types";

const show = (ws: AnticipatedWorry[]) =>
  ws
    .map(
      (w, i) =>
        `  ${i + 1}. "${w.worry}"\n     why: ${w.why}\n     answer: ${w.answer}\n` +
        w.facts.map((f) => `     - ${f.label}${f.sourceId ? `@${f.sourceId}` : ""}: ${f.text}${f.math ? ` [${f.math}]` : ""}`).join("\n"),
    )
    .join("\n");

it("demo prep", async () => {
  const t0 = performance.now();
  const r = await anticipateWorries(demoPrep);
  console.log(`demo prep ${Math.round(performance.now() - t0)} ms source=${r.source} n=${r.anticipated.length}\n${show(r.anticipated)}`);
  console.log(JSON.stringify(r.anticipated));
});

it("sample files through ingest", async () => {
  const files = ["dana-whitfield-plan.pdf", "dana-whitfield-client.csv"].map((name) => ({
    name,
    data: readFileSync(`public/samples/${name}`),
  }));
  const t0 = performance.now();
  const r = await ingestFiles(files);
  console.log(`ingest ${Math.round(performance.now() - t0)} ms source=${r.source} n=${r.anticipated.length}\n${show(r.anticipated)}`);
});

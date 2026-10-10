import { describe, expect, it } from "vitest";
import { isLiveTurn, relabel, windowThrough } from "@/components/meeting/live";
import type { TranscriptTurn } from "@/lib/types";

const turns: TranscriptTurn[] = [
  { id: "m1", speaker: "client", t: 0, text: "I'm worried about cash." },
  { id: "m2", speaker: "client", t: 4, text: "What kind of emergency are you picturing?" },
  { id: "m3", speaker: "client", t: 9, text: "A new roof, maybe." },
];

describe("live mic helpers", () => {
  it("analyzes the transcript through the line it is about, ignoring lines that came later", () => {
    expect(windowThrough(turns, "m2").map((t) => t.id)).toEqual(["m1", "m2"]);
    expect(windowThrough(turns, "nope")).toHaveLength(3);
  });

  it("relabels one line and leaves the rest", () => {
    const next = relabel(turns, "m2", "advisor");
    expect(next.map((t) => t.speaker)).toEqual(["client", "advisor", "client"]);
    expect(turns[1].speaker).toBe("client");
  });

  it("only live mic lines can be relabeled", () => {
    expect(isLiveTurn("m12")).toBe(true);
    expect(isLiveTurn("t2")).toBe(false);
  });
});

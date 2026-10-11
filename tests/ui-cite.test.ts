// Citations on a card: each prepared fact points to a numbered source, listed once.
import { describe, expect, it } from "vitest";
import { cite } from "@/components/meeting/cite";
import type { CardFact, PrepSource } from "@/lib/types";

const sources: PrepSource[] = [
  { id: "plan-1", title: "Retirement plan", kind: "plan", text: "", date: "September 28, 2026" },
  { id: "plan-2", title: "Cash-reserve analysis", kind: "deck", text: "" },
];
const fact = (label: CardFact["label"], sourceId?: string): CardFact => ({ text: "x", label, sourceId });

describe("cite", () => {
  it("numbers sources in order of first use and lists each once", () => {
    const c = cite([fact("PREPARED_FACT", "plan-2"), fact("PREPARED_FACT", "plan-1"), fact("PREPARED_FACT", "plan-2")], sources);
    expect(c.list).toEqual([
      { n: 1, title: "Cash-reserve analysis", date: undefined },
      { n: 2, title: "Retirement plan", date: "September 28, 2026" },
    ]);
    expect(c.numberOf(fact("PREPARED_FACT", "plan-2"))).toBe(1);
    expect(c.numberOf(fact("PREPARED_FACT", "plan-1"))).toBe(2);
  });

  it("cites only prepared facts with a known source", () => {
    const c = cite([fact("CALCULATED", "plan-1"), fact("PREPARED_FACT", "nope"), fact("PREPARED_FACT")], sources);
    expect(c.list).toEqual([]);
    expect(c.numberOf(fact("CALCULATED", "plan-1"))).toBeUndefined();
    expect(c.numberOf(fact("PREPARED_FACT", "nope"))).toBeUndefined();
  });
});

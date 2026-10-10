import { describe, expect, it } from "vitest";
import { demoPrep } from "@/data/demo";
import { mockMoment } from "@/lib/mock";
import { enforceFact, enforceNumberTrace, extractNumbers, parseNumber, preparedNumbers } from "@/lib/provenance";
import { Card, MomentResponse, emptyState } from "@/lib/types";

describe("parseNumber", () => {
  it("reads currency, suffixes and percentages", () => {
    expect(parseNumber("$180K")).toBe(180000);
    expect(parseNumber("1.2M")).toBe(1200000);
    expect(parseNumber("$1,200,000")).toBe(1200000);
    expect(parseNumber("4.5%")).toBe(4.5);
  });
  it("extracts every number from prose", () => {
    expect(extractNumbers("Keep $180,000 for 24 months at 5%")).toEqual([180000, 24, 5]);
  });
});

describe("number-trace invariant", () => {
  const known = preparedNumbers(demoPrep);

  it("keeps a traced prepared fact green", () => {
    const f = { text: "Reserve is $180,000.", label: "PREPARED_FACT" as const, sourceId: "plan-1" };
    expect(enforceFact(f, known).label).toBe("PREPARED_FACT");
  });

  it("never shows an untraced number as a prepared fact", () => {
    const f = { text: "Reserve is $250,000.", label: "PREPARED_FACT" as const, sourceId: "plan-1" };
    expect(enforceFact(f, known).label).toBe("SUGGESTION");
  });

  it("downgrades an untraced number with math to calculated", () => {
    const f = { text: "Surplus is $95,000.", label: "PREPARED_FACT" as const, sourceId: "plan-1", math: "x - y" };
    expect(enforceFact(f, known).label).toBe("CALCULATED");
  });

  it("downgrades a prepared fact with no source", () => {
    const f = { text: "Reserve is $180,000.", label: "PREPARED_FACT" as const };
    expect(enforceFact(f, known).label).toBe("SUGGESTION");
  });

  it("downgrades a calculation that hides its math", () => {
    const f = { text: "Surplus is $120,000.", label: "CALCULATED" as const };
    expect(enforceFact(f, known).label).toBe("SUGGESTION");
  });
});

describe("mock engine honours the contract", () => {
  it("returns schema-valid cards whose prepared facts survive the trace", () => {
    let state = emptyState();
    for (const id of ["t2", "t4", "t6", "t8"]) {
      const res = MomentResponse.parse(mockMoment(id, state));
      const card = Card.parse(res.card);
      expect(enforceNumberTrace(card, demoPrep)).toEqual(card);
      state = res.state;
    }
    expect(state.concerns.map((c) => c.status)).toEqual(["resolved", "open", "open", "open"]);
  });
});

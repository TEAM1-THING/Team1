// Find in your materials (#32): instant lookup over the advisor's own sources.
import { describe, expect, it } from "vitest";
import { figureParts, findInMaterials } from "@/components/meeting/findMatches";
import { demoPrep } from "@/data/demo";

const sources = demoPrep.sources;

describe("findInMaterials", () => {
  it("returns the lines that mention a word, each with its source", () => {
    const hits = findInMaterials(sources, "reserve");
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) {
      expect(h.line.toLowerCase()).toContain("reserve");
      expect(sources.some((s) => s.id === h.sourceId && s.title === h.title)).toBe(true);
    }
    expect(new Set(hits.map((h) => h.sourceId))).toEqual(new Set(["plan-1", "plan-2"]));
  });

  it("returns a line, not the whole document", () => {
    const [hit] = findInMaterials(sources, "tranches");
    expect(hit.line).toMatch(/6 equal monthly tranches of \$200,000/);
    expect(hit.line).not.toMatch(/Projected income/);
  });

  it("needs every word of the query, in any case", () => {
    const hits = findInMaterials(sources, "LIQUID reserve");
    expect(hits.length).toBeGreaterThan(0);
    for (const h of hits) expect(h.line.toLowerCase()).toMatch(/(?=.*liquid)(?=.*reserve)/);
  });

  it("finds nothing for an unknown word or a blank query", () => {
    expect(findInMaterials(sources, "cryptocurrency")).toEqual([]);
    expect(findInMaterials(sources, "   ")).toEqual([]);
  });

  it("carries the source date when the document has one", () => {
    const dated = sources.map((s) => ({ ...s, date: "Sep 28, 2026" }));
    expect(findInMaterials(dated, "reserve")[0].date).toBe("Sep 28, 2026");
  });
});

describe("findInMaterials on real-world text", () => {
  const src = (text: string) => [{ id: "s", title: "Notes", kind: "note" as const, text }];

  it("does not cut a line after an abbreviation", () => {
    expect(findInMaterials(src("Keep a buffer, e.g. 5% of assets. Review yearly."), "buffer")[0].line).toBe(
      "Keep a buffer, e.g. 5% of assets.",
    );
    expect(findInMaterials(src("Hold U.S. Treasury bills at 4.1%. Then rebalance."), "treasury")[0].line).toBe(
      "Hold U.S. Treasury bills at 4.1%.",
    );
  });

  it("shows a short window around the match in a huge unpunctuated source", () => {
    const text = `${"word ".repeat(50000)}reserve of $180,000 ${"word ".repeat(50000)}`;
    const [hit] = findInMaterials(src(text), "reserve");
    expect(hit.line.length).toBeLessThanOrEqual(320);
    expect(hit.line).toContain("reserve of $180,000");
  });
});

describe("figureParts", () => {
  it("keeps signs and magnitude suffixes on a figure", () => {
    const figures = figureParts("Down -5% to $1.2M, then 300k.").filter((p) => p.figure).map((p) => p.text);
    expect(figures).toEqual(["-5%", "$1.2M", "300k"]);
  });

  it("marks the figures in a line and keeps the text intact", () => {
    const line = "Keep a $180,000 liquid reserve, equal to 24 months of expenses at 5%.";
    const parts = figureParts(line);
    expect(parts.map((p) => p.text).join("")).toBe(line);
    expect(parts.filter((p) => p.figure).map((p) => p.text.trim())).toEqual(["$180,000", "24", "5%"]);
  });
});

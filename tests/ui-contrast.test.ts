// Card text colours against the backgrounds they sit on, by the WCAG 2 formula.
// Small text needs 4.5:1. The theme tokens are checked, not copies of them.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LABELS } from "@/components/meeting/replay";
import { ui } from "@/components/meeting/ui";

// The first #rrggbb in a class string, or the one after a prefix such as "bg-".
const hexIn = (classes: string, prefix = "") => {
  const m = classes.match(new RegExp(`${prefix}\\[#([0-9a-f]{6})\\]`, "i"));
  if (!m) throw new Error(`no ${prefix || "colour"} in "${classes}"`);
  return m[1];
};

const luminance = (hex: string) => {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (fg: string, bg: string) => {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
};

const cream = hexIn(ui.page, "bg-");
const paper = hexIn(ui.raised, "bg-");

describe("card text contrast", () => {
  it("the previous card's faint and muted text pass on the cream page", () => {
    expect(ratio(hexIn(ui.faint), cream)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(hexIn(ui.muted), cream)).toBeGreaterThanOrEqual(4.5);
  });

  it("the current card's ink, muted, faint and orange text pass on its paper", () => {
    for (const token of [ui.page, ui.muted, ui.faint, ui.accent]) {
      expect(ratio(hexIn(token, "text-"), paper)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("every provenance chip passes on its own fill", () => {
    for (const { chip } of Object.values(LABELS)) {
      expect(ratio(hexIn(chip, "text-"), hexIn(chip, "bg-"))).toBeGreaterThanOrEqual(4.5);
    }
  });

  // Opacity blends text toward the page, so the ratios above would no longer
  // hold: at 70% the faint text on cream falls to about 2.6:1.
  it("no part of the card is drawn translucent", () => {
    const source = readFileSync(new URL("../src/components/meeting/Card.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch(/\bopacity-\d+/);
  });
});

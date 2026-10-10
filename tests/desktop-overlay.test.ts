import { describe, expect, it } from "vitest";
import { colorAlpha, ignoreMouse, initialMode, isPainted, onScreen, type PaintStyle } from "../desktop/src/core/clickThrough";

const style = (over: Partial<PaintStyle> = {}): PaintStyle => ({
  backgroundColor: "rgba(0, 0, 0, 0)",
  backgroundImage: "none",
  borderTopWidth: "0px",
  borderTopColor: "rgb(0, 0, 0)",
  opacity: "1",
  visibility: "visible",
  ...over,
});

describe("click-through decision", () => {
  const m = initialMode();

  it("passes clicks through the transparent corners and catches them on the panel", () => {
    expect(ignoreMouse({ ...m, hit: "none" })).toBe(true);
    expect(ignoreMouse({ ...m, hit: "content" })).toBe(false);
    expect(ignoreMouse({ ...m, hit: "bar" })).toBe(false);
  });

  it("click-through mode passes the panel's clicks to the call", () => {
    expect(ignoreMouse({ ...m, ghost: true, hit: "content" })).toBe(true);
  });

  it("the title bar stays clickable in click-through mode, so the mouse can turn it off", () => {
    expect(ignoreMouse({ ...m, ghost: true, hit: "bar" })).toBe(false);
  });

  it("typing mode owns the mouse everywhere", () => {
    expect(ignoreMouse({ typing: true, ghost: true, hit: "none" })).toBe(false);
  });
});

describe("saved position", () => {
  const laptop = { x: 0, y: 25, width: 1512, height: 920 };
  it("is reused when it is on a display", () => {
    expect(onScreen({ x: 1000, y: 40, width: 440, height: 680 }, [laptop])).toBe(true);
  });
  it("is dropped when its monitor is gone", () => {
    expect(onScreen({ x: 2000, y: 40, width: 440, height: 680 }, [laptop])).toBe(false);
  });
  it("counts area across two displays", () => {
    const right = { x: 1512, y: 0, width: 1920, height: 1080 };
    expect(onScreen({ x: 1400, y: 40, width: 440, height: 680 }, [laptop, right])).toBe(true);
  });
});

describe("colorAlpha", () => {
  it.each([
    ["transparent", 0],
    ["rgba(0, 0, 0, 0)", 0],
    ["rgb(15, 23, 42)", 1],
    ["rgba(15, 23, 42, 0.75)", 0.75],
    ["rgb(15 23 42 / 0.4)", 0.4],
    ["rgb(15 23 42 / 40%)", 0.4],
  ])("%s -> %s", (c, a) => expect(colorAlpha(c)).toBeCloseTo(a));
});

describe("isPainted", () => {
  it("a transparent layout box is not content", () => {
    expect(isPainted(style())).toBe(false);
  });

  it("a glass card (translucent background) is content", () => {
    expect(isPainted(style({ backgroundColor: "rgba(15, 23, 42, 0.75)" }))).toBe(true);
  });

  it("a dashed placeholder (border only) is content", () => {
    expect(isPainted(style({ borderTopWidth: "1px", borderTopColor: "rgba(255, 255, 255, 0.1)" }))).toBe(true);
  });

  it("a gradient is content", () => {
    expect(isPainted(style({ backgroundImage: "radial-gradient(red, blue)" }))).toBe(true);
  });

  it("invisible or nearly invisible boxes are not content", () => {
    expect(isPainted(style({ backgroundColor: "rgb(0, 0, 0)", visibility: "hidden" }))).toBe(false);
    expect(isPainted(style({ backgroundColor: "rgb(0, 0, 0)", opacity: "0" }))).toBe(false);
    expect(isPainted(style({ backgroundColor: "rgba(0, 0, 0, 0.01)" }))).toBe(false);
  });
});

// Meeting screen shortcuts: → next turn, a auto-play, h hide, / find.
import { describe, expect, it } from "vitest";
import { meetingShortcut, NO_SHORTCUTS } from "@/components/meeting/shortcuts";

const key = (k: string, mods: Partial<{ metaKey: boolean; ctrlKey: boolean; altKey: boolean }> = {}) => ({
  key: k,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  ...mods,
});

// A focused element with no ancestors: closest() matches when its own tag or
// attribute is one of the selectors, as the browser's would.
const focused = (selector: string) => ({
  closest: (selectors: string) => (selectors.split(",").map((s) => s.trim()).includes(selector) ? {} : null),
});

describe("meetingShortcut", () => {
  it("drives the replay from a focused button, as End meeting is after the end screen closes", () => {
    const endMeeting = focused("button");
    expect(meetingShortcut(key("ArrowRight"), endMeeting)).toBe("next");
    expect(meetingShortcut(key("a"), endMeeting)).toBe("auto");
    expect(meetingShortcut(key("h"), endMeeting)).toBe("hide");
    expect(meetingShortcut(key("/"), endMeeting)).toBe("find");
  });

  it("works with nothing focused", () => {
    expect(meetingShortcut(key("ArrowRight"), null)).toBe("next");
  });

  it("leaves the keys to text fields and to a dialog over the meeting", () => {
    for (const where of ["input", "textarea", "select", "[contenteditable]", "[role=dialog]"]) {
      expect(meetingShortcut(key("ArrowRight"), focused(where))).toBeNull();
      expect(meetingShortcut(key("/"), focused(where))).toBeNull();
    }
  });

  it("ignores keys held with a modifier and keys that are not shortcuts", () => {
    expect(meetingShortcut(key("a", { metaKey: true }), null)).toBeNull();
    expect(meetingShortcut(key("h", { ctrlKey: true }), null)).toBeNull();
    expect(meetingShortcut(key("ArrowRight", { altKey: true }), null)).toBeNull();
    expect(meetingShortcut(key("Enter"), null)).toBeNull();
  });

  it("does not list buttons or summaries among the places shortcuts stop", () => {
    const list = NO_SHORTCUTS.split(",").map((s) => s.trim());
    expect(list).not.toContain("button");
    expect(list).not.toContain("summary");
  });
});

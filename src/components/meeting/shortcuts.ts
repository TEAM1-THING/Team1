// Meeting screen keyboard shortcuts, kept apart from React so they can be tested.
export type Shortcut = "find" | "next" | "auto" | "hide";

// Where the keys belong to something else: text fields, where they type, and a
// dialog over the meeting (the mic's consent popup). A focused button is not on
// the list. Closing the end screen puts focus on End meeting, and the arrow and
// letters have no job on a button, so the replay keeps going from there.
export const NO_SHORTCUTS = "input, textarea, select, [contenteditable], [role=dialog]";

type Key = { key: string; metaKey: boolean; ctrlKey: boolean; altKey: boolean };
type Target = { closest(selectors: string): unknown } | null;

export function meetingShortcut(e: Key, target: Target): Shortcut | null {
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  if (target?.closest(NO_SHORTCUTS)) return null;
  if (e.key === "/") return "find";
  if (e.key === "ArrowRight") return "next";
  if (e.key === "a") return "auto";
  if (e.key === "h") return "hide";
  return null;
}

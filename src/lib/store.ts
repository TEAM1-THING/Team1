// Where the prep screen hands the Prep to the meeting screen: localStorage,
// falling back to the demo client. Frozen after Stage 0.
import { demoPrep } from "@/data/demo";
import { Prep } from "./types";

const KEY = "secondchair.prep";

export function loadPrep(): Prep {
  try {
    const raw = typeof window === "undefined" ? null : window.localStorage.getItem(KEY);
    if (raw) return Prep.parse(JSON.parse(raw));
  } catch {
    // corrupt or blocked storage: use the demo client
  }
  return demoPrep;
}

export function savePrep(prep: Prep): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(Prep.parse(prep)));
  } catch {
    // storage blocked: the meeting screen falls back to the demo client
  }
}

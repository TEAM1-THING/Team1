// Pure helpers behind the prep screen, kept apart from React so they can be
// tested without a DOM. Owned by the prep track.
import { z } from "zod";
import { Mandate, Prep, type PrepSource } from "@/lib/types";

// Where "Enter by hand" starts: the advisor's own meeting, so no client and no
// sources. The demo client comes only from the sample files or the demo meeting.
export const emptyPrep = (): Prep => ({
  clientFile: {
    name: "",
    age: 0,
    horizonYears: 0,
    cashOnHand: 0,
    investable: 0,
    riskTolerance: "moderate",
    statedGoals: [],
    statedConcerns: [],
  },
  sources: [],
  mandate: { thesis: "", assumptions: [], riskStance: "", disclaimers: [], outOfScope: [] },
  confirmed: false,
  conflicts: [],
  anticipated: [],
});

// Why Confirm is not available yet, or null when it is. The Mandate tick sits
// beside the button and speaks for itself, so only the name needs saying.
export function whyNotReady(prep: Prep): string | null {
  return prep.clientFile.name.trim() ? null : "Add the client's name in step 2 to confirm.";
}

// A pre-flight check's run time as the viewer's own date. The engine sends a
// full ISO timestamp because a date-only UTC value reads as tomorrow during an
// evening meeting in California; a date-only value is shown as sent.
// timeZone is for tests; the screen leaves it to the browser.
export function checkedOn(checkedAt: string, timeZone?: string): string {
  if (!checkedAt.includes("T")) return checkedAt;
  const when = new Date(checkedAt);
  if (Number.isNaN(when.getTime())) return checkedAt;
  return when.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", timeZone });
}

// Multi-line fields keep blank lines while the advisor types; clean() drops
// them on confirm.
export const toLines = (items: string[]): string => items.join("\n");
export const fromLines = (text: string): string[] => text.split("\n");

const tidy = (items: string[]): string[] => items.map((s) => s.trim()).filter(Boolean);

// A number input that was cleared gives "": treat it as 0 rather than NaN.
export function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function addSource(sources: PrepSource[]): PrepSource[] {
  const taken = new Set(sources.map((s) => s.id));
  let n = sources.length + 1;
  while (taken.has(`source-${n}`)) n++;
  return [...sources, { id: `source-${n}`, title: "", kind: "note", text: "" }];
}

export function removeSource(sources: PrepSource[], id: string): PrepSource[] {
  return sources.filter((s) => s.id !== id);
}

export function updateSource(sources: PrepSource[], id: string, patch: Partial<PrepSource>): PrepSource[] {
  return sources.map((s) => (s.id === id ? { ...s, ...patch } : s));
}

// What /api/mandate is sent: the plan text only.
export const sourcesBody = (sources: PrepSource[]) => ({
  sources: sources.filter((s) => s.text.trim()).map((s) => ({ text: s.text })),
});

// What /api/preflight is sent: the whole Prep, cleaned, so the route checks
// the Mandate on screen rather than falling back to the demo.
export const preflightBody = (prep: Prep) => ({ prep: clean(prep) });

export function clean(prep: Prep): Prep {
  const { clientFile, mandate } = prep;
  return {
    ...prep,
    clientFile: {
      ...clientFile,
      name: clientFile.name.trim(),
      statedGoals: tidy(clientFile.statedGoals),
      statedConcerns: tidy(clientFile.statedConcerns),
    },
    sources: prep.sources
      .filter((s) => s.text.trim())
      .map((s) => ({ ...s, title: s.title.trim() || "Untitled source" })),
    mandate: {
      thesis: mandate.thesis.trim(),
      assumptions: tidy(mandate.assumptions),
      riskStance: mandate.riskStance.trim(),
      disclaimers: tidy(mandate.disclaimers),
      outOfScope: tidy(mandate.outOfScope),
    },
  };
}

// The Prep handed to the meeting screen: cleaned, confirmed, and valid
// against the contract (throws if not).
export function confirmPrep(prep: Prep): Prep {
  return Prep.parse({ ...clean(prep), confirmed: true });
}

// Reads a /api/mandate response; null if it does not match the contract.
export function readMandate(json: unknown): Mandate | null {
  const parsed = Mandate.safeParse((json as { mandate?: unknown } | null)?.mandate);
  return parsed.success ? parsed.data : null;
}

// Work in progress on the prep screen, so a reload does not lose it. Session
// storage, not local: a draft holds client details and goes with the tab. The
// confirmed prep reaches the meeting through store.ts, not through this.
// Storage that is blocked or full just means no draft is kept.
export const DRAFT_KEY = "secondchair.prep.draft";
const Draft = z.object({ prep: Prep, reviewing: z.boolean(), missing: z.array(z.string()) });
export type Draft = z.infer<typeof Draft>;
type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const session = (): DraftStorage => window.sessionStorage;

export function loadDraft(storage: () => DraftStorage = session): Draft | null {
  try {
    const raw = storage().getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = Draft.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: Draft, storage: () => DraftStorage = session): void {
  try {
    storage().setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // blocked or full: the prep still works, it just will not survive a reload
  }
}

export function clearDraft(storage: () => DraftStorage = session): void {
  try {
    storage().removeItem(DRAFT_KEY);
  } catch {
    // blocked: nothing was kept to clear
  }
}

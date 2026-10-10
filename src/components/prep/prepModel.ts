// Pure helpers behind the prep screen, kept apart from React so they can be
// tested without a DOM. Owned by the prep track.
import { Mandate, Prep, type PrepSource } from "@/lib/types";

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

// What /api/mandate and /api/preflight are sent: the plan text only.
export const sourcesBody = (sources: PrepSource[]) => ({
  sources: sources.filter((s) => s.text.trim()).map((s) => ({ text: s.text })),
});

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

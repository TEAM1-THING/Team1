// The client's figures, checked against the advisor's materials before the
// live call. A client who remembers a different number than the report ("I
// thought the reserve was $200,000") is easy to miss mid-meeting, so each
// figure in the latest client turn goes to Claude as data: whether the plan
// holds that figure, the source sentences that hold it, and the plan's figures
// on the same topic. Deterministic and instant: no extra call.
import { extractNumbers, parseNumber } from "../provenance";
import type { CardFact, Prep, PrepSource } from "../types";

// Figures keep their unit: "$180000", "%5", "24".
const FIGURE = /\$?\d[\d,]*(?:\.\d+)?\s*(?:[kKmM](?![a-zA-Z])|%)?/g;

export function figures(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.match(FIGURE) ?? []) {
    const value = parseNumber(raw);
    if (value === null) continue;
    out.push(`${raw.includes("$") ? "$" : raw.trim().endsWith("%") ? "%" : ""}${value}`);
  }
  return out;
}

// Prompt budget: a few figures, a few short lines each.
const MAX_FIGURES = 4;
const MAX_LINES = 3;
const MAX_LINE_CHARS = 300;

export type SourceLine = { sourceId: string; text: string };
export type ClientFigure = {
  said: string; // as the client said it
  inMaterials: boolean; // the same figure, unit included, is in a source or the client file
  foundIn: SourceLine[]; // the source sentences that hold that figure
};
export type ClientFigures = { figures: ClientFigure[]; planLines: SourceLine[] };

// Words that say what a figure is about ("reserve", "tranche"), without the
// filler a client or a fact wraps around it.
const STOP = new Set([
  "about", "also", "been", "being", "could", "does", "each", "equal", "from", "have", "into", "just", "keep",
  "keeps", "kept", "know", "like", "made", "make", "maybe", "mean", "more", "much", "over", "plan", "plans",
  "really", "report", "right", "said", "says", "should", "some", "sure", "than", "that", "their", "them", "then",
  "there", "they", "think", "this", "thought", "today", "under", "wait", "were", "what", "when", "which", "will",
  "with", "would", "your",
]);

function topics(text: string): Set<string> {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  return new Set(words.filter((w) => w.length >= 4 && !STOP.has(w)).map((w) => (w.length > 4 ? w.replace(/s$/, "") : w)));
}

type Line = SourceLine & { figs: Set<string>; values: Set<number>; topics: Set<string> };

function sentences(sources: PrepSource[]): Line[] {
  return sources.flatMap((s) =>
    s.text
      .split(/(?<=[.!?;])\s+|\n+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({
        sourceId: s.id,
        text,
        figs: new Set(figures(text)),
        values: new Set(extractNumbers(text)),
        topics: topics(text),
      })),
  );
}

// Unit-aware: a figure the client says with "$" or "%" matches only the same
// unit, so "6%" never matches "6 tranches", nor "24%" "24 months". A bare
// figure also matches a dollar amount, since speech-to-text can drop the "$".
const holds = (figs: Set<string>, said: string) => figs.has(said) || (/^\d/.test(said) && figs.has(`$${said}`));

// Every figure the advisor prepared, unit included. Client-file numbers carry
// no unit, so they count bare and as dollars (as textTraced counts them).
function materialFigures(prep: Prep): Set<string> {
  const out = new Set(prep.sources.flatMap((s) => figures(s.text)));
  for (const v of Object.values(prep.clientFile)) if (typeof v === "number") out.add(`${v}`).add(`$${v}`);
  return out;
}

const show = (l: Line): SourceLine => ({
  sourceId: l.sourceId,
  text: l.text.length > MAX_LINE_CHARS ? `${l.text.slice(0, MAX_LINE_CHARS)}…` : l.text,
});
const shares = (a: Set<string>, b: Set<string>) => [...a].some((w) => b.has(w));

// null when the turn has no figure, so the prompt is unchanged, and when the
// materials have nothing to hold its figures against (a year, a neighbour's
// number), so the live call stays as short as it was.
export function checkClientFigures(text: string, prep: Prep, maxSources: number): ClientFigures | null {
  const said = (text.match(FIGURE) ?? []).slice(0, MAX_FIGURES);
  if (!said.length) return null;
  const lines = sentences(prep.sources.slice(0, maxSources));
  const known = materialFigures(prep);
  const listed = new Set<Line>();
  const out: ClientFigure[] = [];
  for (const raw of said) {
    const [fig] = figures(raw);
    if (!fig) continue;
    const foundIn = lines.filter((l) => holds(l.figs, fig)).slice(0, MAX_LINES);
    for (const l of foundIn) listed.add(l);
    out.push({ said: raw.trim(), inMaterials: holds(known, fig), foundIn: foundIn.map(show) });
  }
  const asked = topics(text);
  const planLines = lines.filter((l) => !listed.has(l) && l.figs.size > 0 && shares(l.topics, asked));
  if (!out.some((f) => f.inMaterials) && !planLines.length) return null;
  return { figures: out, planLines: planLines.slice(0, MAX_LINES).map(show) };
}

// Money and percentages, or any value from 1,000 up: the figures a client
// mixes up. Small counts (6 tranches, 24 months) recur too often to check.
const checkable = (raw: string) => /[$%]/.test(raw) || (parseNumber(raw) ?? 0) >= 1_000;

// A PREPARED_FACT that carries the value of a figure the client just said,
// with or without its unit ("6%" said, "6 tranches" written), is about the
// client's number, so it may say only what its source says there: every topic
// word in it must come from a sentence of the cited source that holds that
// value. "The reserve is $200,000" (where $200,000 is the tranche) and "...which
// is likely where the 6 comes from" (the likely reason belongs in why) are the
// card's guess, not a fact.
export function misattributed(fact: CardFact, prep: Prep, clientText: string): boolean {
  const source = prep.sources.find((s) => s.id === fact.sourceId);
  if (fact.label !== "PREPARED_FACT" || !source) return false;
  const said = new Set((clientText.match(FIGURE) ?? []).filter(checkable).map(parseNumber));
  const repeated = extractNumbers(fact.text).filter((v) => said.has(v));
  if (!repeated.length) return false;
  const there = sentences([source]).filter((l) => repeated.some((v) => l.values.has(v)));
  const words = new Set(there.flatMap((l) => [...l.topics]));
  return [...topics(fact.text)].some((w) => !words.has(w));
}

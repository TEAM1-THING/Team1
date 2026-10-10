// The client's figures, checked against the advisor's materials before the
// live call. A client who remembers a different number than the report ("I
// thought the reserve was $200,000") is easy to miss mid-meeting, so each
// figure in the latest client turn goes to Claude as data: whether the plan
// holds that value, the source sentences that hold it, and the plan's figures
// on the same topic. Deterministic and instant: no extra call.
import { extractNumbers, parseNumber, preparedNumbers } from "../provenance";
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
  inMaterials: boolean; // the same value appears in a source or the client file
  foundIn: SourceLine[]; // the source sentences that hold that value
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

type Line = SourceLine & { values: Set<number>; topics: Set<string> };

function sentences(sources: PrepSource[]): Line[] {
  return sources.flatMap((s) =>
    s.text
      .split(/(?<=[.!?;])\s+|\n+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ sourceId: s.id, text, values: new Set(extractNumbers(text)), topics: topics(text) })),
  );
}

const show = (l: Line): SourceLine => ({
  sourceId: l.sourceId,
  text: l.text.length > MAX_LINE_CHARS ? `${l.text.slice(0, MAX_LINE_CHARS)}…` : l.text,
});
const shares = (a: Set<string>, b: Set<string>) => [...a].some((w) => b.has(w));

// null when the turn has no figure, so the prompt is unchanged.
export function checkClientFigures(text: string, prep: Prep, maxSources: number): ClientFigures | null {
  const said = (text.match(FIGURE) ?? []).slice(0, MAX_FIGURES);
  if (!said.length) return null;
  const lines = sentences(prep.sources.slice(0, maxSources));
  const known = preparedNumbers(prep);
  const listed = new Set<Line>();
  const out: ClientFigure[] = [];
  for (const raw of said) {
    const value = parseNumber(raw);
    if (value === null) continue;
    const foundIn = lines.filter((l) => l.values.has(value)).slice(0, MAX_LINES);
    for (const l of foundIn) listed.add(l);
    out.push({ said: raw.trim(), inMaterials: known.has(value), foundIn: foundIn.map(show) });
  }
  if (!out.length) return null;
  const asked = topics(text);
  const planLines = lines.filter((l) => !listed.has(l) && l.values.size > 0 && shares(l.topics, asked));
  return { figures: out, planLines: planLines.slice(0, MAX_LINES).map(show) };
}

// Money and percentages, or any value from 1,000 up: the figures a client
// mixes up. Small counts (6 tranches, 24 months) recur too often to check.
const checkable = (raw: string) => /[$%]/.test(raw) || (parseNumber(raw) ?? 0) >= 1_000;

// A PREPARED_FACT that repeats a figure the client just said must say what its
// source says that figure is: the fact shares a topic word with a sentence of
// the cited source that holds the value. "The reserve is $200,000" cited to a
// plan where $200,000 is the tranche size is the client's mix-up, not a fact.
export function misattributed(fact: CardFact, prep: Prep, clientText: string): boolean {
  const source = prep.sources.find((s) => s.id === fact.sourceId);
  if (fact.label !== "PREPARED_FACT" || !source) return false;
  const said = new Set((clientText.match(FIGURE) ?? []).filter(checkable).map(parseNumber));
  const repeated = extractNumbers(fact.text).filter((v) => said.has(v));
  if (!repeated.length) return false;
  const about = topics(fact.text);
  const lines = sentences([source]);
  return !repeated.every((v) => lines.some((l) => l.values.has(v) && shares(l.topics, about)));
}

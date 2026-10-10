// Find in your materials (#32): plain text search over the advisor's own
// sources. No model call, so it is instant, works offline and cannot invent a
// figure. Kept free of React so a test can drive it.
import type { PrepSource } from "@/lib/types";

export type FindHit = { sourceId: string; title: string; date?: string; line: string };

const MAX_HITS = 8;

// A source's sentences and lines: what a result shows instead of the whole
// document. A sentence ends at . ! or ? before a capital, except after an
// abbreviation (e.g., U.S., Mr.), so a figure is never cut from its sentence.
const SENTENCE_END = /\n+|(?<=[.!?])(?<!\b(?:e\.g|i\.e|approx|vs|etc|Mr|Mrs|Ms|Dr|Inc|No|St|[A-Z]\.[A-Z])\.)\s+(?=[A-Z])/;
const MAX_LINE = 300;

function lines(text: string): string[] {
  return text
    .split(SENTENCE_END)
    .map((l) => l.trim())
    .filter(Boolean);
}

// A source with no punctuation would come back whole: show the match in context.
function around(line: string, term: string): string {
  if (line.length <= MAX_LINE) return line;
  const start = Math.max(0, line.toLowerCase().indexOf(term) - 120);
  const end = Math.min(line.length, start + MAX_LINE);
  return `${start > 0 ? "…" : ""}${line.slice(start, end).trim()}${end < line.length ? "…" : ""}`;
}

// Lines containing every word of the query, case-insensitive, most matches first.
export function findInMaterials(sources: PrepSource[], query: string): FindHit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const scored: { hit: FindHit; score: number }[] = [];
  for (const s of sources) {
    for (const line of lines(s.text)) {
      const lower = line.toLowerCase();
      if (!terms.every((t) => lower.includes(t))) continue;
      const score = terms.reduce((n, t) => n + lower.split(t).length - 1, 0);
      scored.push({ hit: { sourceId: s.id, title: s.title, date: s.date, line: around(line, terms[0]) }, score });
    }
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_HITS)
    .map((x) => x.hit);
}

const FIGURE = /-?\$?\d+(?:,\d{3})*(?:\.\d+)?(?:%|[kKmMbB](?![a-zA-Z]))?/g;

// A line cut into plain text and figures, so the figures can be highlighted.
export function figureParts(line: string): { text: string; figure: boolean }[] {
  const parts: { text: string; figure: boolean }[] = [];
  let at = 0;
  for (const m of line.matchAll(FIGURE)) {
    if (m.index > at) parts.push({ text: line.slice(at, m.index), figure: false });
    parts.push({ text: m[0], figure: true });
    at = m.index + m[0].length;
  }
  if (at < line.length) parts.push({ text: line.slice(at), figure: false });
  return parts;
}

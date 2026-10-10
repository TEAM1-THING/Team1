// Find in your materials (#32): plain text search over the advisor's own
// sources. No model call, so it is instant, works offline and cannot invent a
// figure. Kept free of React so a test can drive it.
import type { PrepSource } from "@/lib/types";

export type FindHit = { sourceId: string; title: string; date?: string; line: string };

const MAX_HITS = 8;

// A source's sentences and lines: what a result shows instead of the whole document.
function lines(text: string): string[] {
  return text
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z$0-9])/)
    .map((l) => l.trim())
    .filter(Boolean);
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
      scored.push({ hit: { sourceId: s.id, title: s.title, date: s.date, line }, score });
    }
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_HITS)
    .map((x) => x.hit);
}

const FIGURE = /\$?\d+(?:,\d{3})*(?:\.\d+)?%?/g;

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

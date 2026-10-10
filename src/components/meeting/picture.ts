// Client picture (#39): the concern ledger read as kinds, from a prefix on the
// topic ("life event: son's down payment"); the contract does not change. The
// engine emits "request: " today; the other prefixes are asked of track A on
// #39. An untagged topic is a worry, so older ledgers read the same.
import type { Concern } from "@/lib/types";

export const KINDS = [
  { kind: "worry", label: "Worries" },
  { kind: "learn", label: "Wants to learn" },
  { kind: "decide", label: "Deciding" },
  { kind: "life event", label: "Life events" },
  { kind: "request", label: "Requests" },
] as const;
export type Kind = (typeof KINDS)[number]["kind"];

const PREFIX = /^\s*(worry|learn|decide|life event|request)\s*:\s*/i;

export function kindOf(topic: string): { kind: Kind; text: string } {
  const m = topic.match(PREFIX);
  if (!m) return { kind: "worry", text: topic };
  // A bare prefix ("request:") keeps its whole topic rather than show an empty line.
  const text = topic.slice(m[0].length).trim();
  return { kind: m[1].toLowerCase() as Kind, text: text || topic };
}

export type PictureItem = Concern & { text: string };
export type PictureGroup = { kind: Kind; label: string; items: PictureItem[] };

// Groups in KINDS order, empty kinds left out, open items before resolved ones.
export function clientPicture(concerns: Concern[]): PictureGroup[] {
  return KINDS.map(({ kind, label }) => ({
    kind,
    label,
    items: concerns
      .flatMap((c) => {
        const k = kindOf(c.topic);
        return k.kind === kind ? [{ ...c, text: k.text }] : [];
      })
      .sort((a, b) => Number(a.status === "resolved") - Number(b.status === "resolved")),
  })).filter((g) => g.items.length > 0);
}

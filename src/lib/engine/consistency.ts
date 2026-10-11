// Same question, reworded, gets the same answer (#41). A Block 2 tester
// distrusted an AI tool that changed its result when a few words changed.
// Claude sees the cards already shown in this meeting and names the one the
// latest client turn is about; the engine then keeps that card's facts, move
// and do-not-claims, so only the wording of the concern and the suggested line
// can change. Something new from the client releases the hold.
import { extractNumbers } from "../provenance";
import type { Card, ConversationState, TranscriptTurn } from "../types";

// The newest few cards are enough: a rewording comes back to a recent worry.
const MAX_EARLIER = 6;
const MAX_TEXT = 300;

const clip = (s: string, max = MAX_TEXT) => (s.length > max ? `${s.slice(0, max)}…` : s);

// What the model is shown of each earlier card. Goes in the live prompt part,
// never the cached prep part, which must stay byte-identical across a meeting.
export function earlierCards(state: ConversationState, latest: TranscriptTurn, turns: TranscriptTurn[]) {
  return state.cards
    .filter((c) => c.turnId !== latest.id)
    .slice(-MAX_EARLIER)
    .map((c) => {
      const said = turns.find((t) => t.id === c.turnId)?.text;
      return {
        id: clip(c.id, 100),
        ...(said ? { clientSaid: clip(said) } : {}),
        concern: clip(c.concern),
        moment: c.moment,
        recommendedMove: clip(c.recommendedMove),
        facts: c.facts.map((f) => ({ text: clip(f.text), label: f.label, ...(f.sourceId ? { sourceId: f.sourceId } : {}) })),
        doNotClaim: c.doNotClaim.map((d) => clip(d)),
        defer: c.defer,
      };
    });
}

export const CONSISTENCY_RULE = `- <earlier_cards> lists the cards already shown in this meeting. If the latest client turn raises the same worry or question as one of them, in other words, set sameAs to that card's id: keep its facts, recommendedMove and doNotClaim exactly, and change only the wording of concern and phrasing to answer what the client just said. Set addsNew to true only if the client added something that card did not cover (a new figure, person, life event, deadline or constraint). If no earlier card is about the same thing, leave sameAs empty.`;

// The part of the model's output this module reads and rewrites.
type Held = {
  moment: string;
  concern: string;
  facts: { text: string; label: string; sourceId?: string; math?: string }[];
  recommendedMove: string;
  phrasing: string;
  why: string;
  doNotClaim: string[];
  defer: boolean;
  deferReason?: string;
  concernUpdates: { open: string[]; resolve: string[] };
  sameAs?: string;
  addsNew?: boolean;
};

// A figure the client just said that neither the earlier card nor the turn
// it answered contains is new information, whatever the model judged.
function saysNewFigure(latest: TranscriptTurn, earlier: Card, turns: TranscriptTurn[]): boolean {
  const before = [
    turns.find((t) => t.id === earlier.turnId)?.text ?? "",
    earlier.concern,
    earlier.phrasing,
    ...earlier.facts.map((f) => f.text),
  ].join(" ");
  const known = new Set(extractNumbers(before));
  return extractNumbers(latest.text).some((n) => !known.has(n));
}

// The earlier card this output should hold to, or null when it answers fresh.
export function heldCard(out: Held, state: ConversationState, latest: TranscriptTurn, turns: TranscriptTurn[]): Card | null {
  const id = out.sameAs?.trim();
  if (!id || out.addsNew) return null;
  const earlier = state.cards.find((c) => c.turnId !== latest.id && clip(c.id, 100) === id);
  if (!earlier || saysNewFigure(latest, earlier, turns)) return null;
  return earlier;
}

// Keep the earlier card's substance: moment, facts, move, why, do-not-claims
// and whether it deferred. The fresh concern and phrasing stay, so the advisor
// can answer the client's new words, unless the model flipped the defer: then
// the earlier line stays too, because a defer line and an answer do not mix.
// The concern ledger reopens the earlier topic instead of a reworded duplicate.
// Facts still go through the number trace in toCard afterwards.
export function holdSteady<T extends Held>(out: T, state: ConversationState, latest: TranscriptTurn, turns: TranscriptTurn[]): T {
  const earlier = heldCard(out, state, latest, turns);
  if (!earlier) return out;
  const flipped = earlier.defer !== out.defer;
  // The earlier card may itself have held to an older one, and opened nothing:
  // its topics are the ones raised at any turn in that chain (same move).
  const chain = new Set(state.cards.filter((c) => c.recommendedMove === earlier.recommendedMove).map((c) => c.turnId));
  const topics = [...new Set(state.concerns.filter((c) => chain.has(c.raisedAtTurn)).map((c) => c.topic))];
  const requests = out.concernUpdates.open.filter((t) => /^request:/i.test(t.trim()));
  return {
    ...out,
    moment: earlier.moment,
    facts: earlier.facts.map((f) => ({ ...f })),
    recommendedMove: earlier.recommendedMove,
    why: earlier.why,
    doNotClaim: [...earlier.doNotClaim],
    defer: earlier.defer,
    deferReason: earlier.deferReason,
    ...(flipped ? { concern: earlier.concern, phrasing: earlier.phrasing } : {}),
    concernUpdates: {
      open: topics.length ? [...topics, ...requests] : out.concernUpdates.open,
      resolve: out.concernUpdates.resolve,
    },
  };
}

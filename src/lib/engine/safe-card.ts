// When a live card fails its own checks (a figure that cannot be traced, a
// malformed field), the client still asked something. Rather than leave the
// advisor's screen empty, show a safe card with fixed wording and no figures:
// acknowledge, and offer to run it properly after the meeting. Nothing on it
// is a prepared fact, so the provenance rule holds.
import type { Card, TranscriptTurn } from "../types";

export function safeCard(latest: TranscriptTurn, doNotClaim: string[]): Card {
  return {
    id: `c-${latest.id}`,
    turnId: latest.id,
    moment: "question",
    concern: "A question the prepared figures do not answer directly.",
    facts: [],
    recommendedMove: "Acknowledge it and offer to run the numbers properly after the meeting.",
    phrasing:
      "That's a fair question. I'd rather run that scenario properly than guess, so let me model it and come back to you. What matters most to you in it?",
    why: "Answering needs figures that are not in the prepared materials.",
    doNotClaim: doNotClaim.slice(0, 2),
    defer: true,
    deferReason: "Needs figures outside the prepared materials; run it after the meeting.",
  };
}

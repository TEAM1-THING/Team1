// Canned cards for the demo transcript, so the UI track can build before the
// engine exists. The engine track keeps this as the no-API-key fallback.
import type { Card, ConversationState, MomentResponse } from "./types";

const cards: Record<string, Card> = {
  t2: {
    id: "c-t2",
    turnId: "t2",
    moment: "objection",
    concern: "Access and optionality: fear of being unable to reach cash in an emergency.",
    facts: [
      { text: "The plan keeps a $180,000 liquid reserve, 24 months of expenses.", label: "PREPARED_FACT", sourceId: "plan-1" },
      { text: "Cash on hand today is $300,000.", label: "PREPARED_FACT", sourceId: "plan-2" },
      { text: "$120,000 sits above the reserve target.", label: "CALCULATED", math: "$300,000 - $180,000 = $120,000" },
    ],
    recommendedMove: "Acknowledge the worry, separate required liquidity from idle cash, anchor to the reserve, offer an off-ramp.",
    phrasing: "That's exactly why we built in a 24-month reserve. $180,000 stays liquid no matter what the market does, and if you'd like we can start with less invested and add later.",
    why: "She asked about access, not returns. Leading with the reserve answers the real question before defending the plan.",
    doNotClaim: ["That the reserve covers every possible emergency."],
    defer: false,
  },
  t4: {
    id: "c-t4",
    turnId: "t4",
    moment: "hesitation",
    concern: "Fear of a temporary loss right after investing.",
    facts: [
      { text: "The plan already enters in 6 monthly tranches of $200,000.", label: "PREPARED_FACT", sourceId: "plan-1" },
      { text: "Her horizon is 12 years.", label: "PREPARED_FACT", sourceId: "plan-1" },
    ],
    recommendedMove: "Return to the long horizon and surface the phased entry already in the plan; ask what is behind the hesitation.",
    phrasing: "We're not going in all at once. The plan spreads it over six months. Can I ask, is it the idea of a drop right after we start, or is there something coming up where you'd need the cash?",
    why: "Waiting is often fear of a near-term loss. The phased entry is already the answer; the question finds out if it's really a cash need.",
    doNotClaim: ["That the market will not fall in the next six months."],
    defer: false,
  },
  t6: {
    id: "c-t6",
    turnId: "t6",
    moment: "disclosure",
    concern: "New priority: a possible down payment for her son next year changes the liquidity need.",
    facts: [
      { text: "The plan did not include a down payment.", label: "PREPARED_FACT", sourceId: "plan-1" },
      { text: "$120,000 above the reserve could be held back for it.", label: "CALCULATED", math: "$300,000 - $180,000 = $120,000" },
      { text: "A typical down payment amount for her son.", label: "DO_NOT_CLAIM" },
    ],
    recommendedMove: "Treat the down payment as a new goal: ask the amount and timing before changing the plan.",
    phrasing: "That's important, and it's new to me. Roughly how much might he need, and when? We may want to keep some of that extra $120,000 out of the market for it.",
    why: "This is the real reason behind 'wait six months'. Changing the plan without a number would be guessing.",
    doNotClaim: ["Any down payment figure: she has not given one."],
    defer: false,
  },
  t8: {
    id: "c-t8",
    turnId: "t8",
    moment: "contradiction",
    concern: "She recalls the reserve as $200,000; the plan says $180,000.",
    facts: [
      { text: "The plan keeps a $180,000 liquid reserve, equal to 24 months of expenses.", label: "PREPARED_FACT", sourceId: "plan-1" },
      { text: "Each of the 6 monthly tranches is $200,000.", label: "PREPARED_FACT", sourceId: "plan-1" },
    ],
    recommendedMove: "Give the plan's reserve figure gently, then name the tranche size she likely recalled.",
    phrasing: "Good thing to check. The reserve is $180,000, 24 months of expenses. The $200,000 you may be remembering is each monthly investment tranche.",
    why: "$200,000 is the plan's monthly tranche size, the likely source of the mix-up.",
    doNotClaim: ["That the reserve is $200,000."],
    defer: false,
  },
};

export function mockMoment(turnId: string, state: ConversationState): MomentResponse {
  const card = cards[turnId] ?? null;
  if (!card) return { card: null, state };
  const concerns = state.concerns.map((c) =>
    turnId === "t4" && c.topic === "liquidity" ? { ...c, status: "resolved" as const, resolvedAtTurn: turnId } : c,
  );
  const topic = { t2: "liquidity", t4: "market timing", t6: "down payment", t8: "reserve figure" }[turnId]!;
  concerns.push({ id: `k-${turnId}`, topic, status: "open", raisedAtTurn: turnId });
  return { card, state: { concerns, cards: [...state.cards, card] } };
}

// Fictional client and plan for the demo. No real client data, ever.
// Owned by the prep track; the three scenes follow handoff section 02.
import type { Prep, TranscriptTurn } from "@/lib/types";

export const demoPrep: Prep = {
  clientFile: {
    name: "Dana Whitfield",
    age: 58,
    horizonYears: 12,
    cashOnHand: 300000,
    investable: 1500000,
    riskTolerance: "moderate",
    statedGoals: ["Retire at 70 with income of $9,000 a month", "Help fund two grandchildren's college"],
    statedConcerns: ["Running short of cash in an emergency", "Buying in right before a downturn"],
  },
  sources: [
    {
      id: "plan-1",
      title: "Retirement plan, prepared for Dana Whitfield",
      date: "September 28, 2026",
      kind: "plan",
      text:
        "Invest $1,200,000 of $1,500,000 investable assets in a 60/40 portfolio. " +
        "Keep a $180,000 liquid reserve, equal to 24 months of expenses at $7,500 a month. " +
        "Enter the market in 6 equal monthly tranches of $200,000 to reduce timing risk. " +
        "Projected income at 70: $9,000 a month under a 5% average return assumption.",
    },
    {
      id: "plan-2",
      title: "Cash-reserve analysis",
      date: "September 28, 2026",
      kind: "deck",
      text:
        "Monthly expenses $7,500. Reserve target 24 months = $180,000. " +
        "Cash on hand today $300,000, so $120,000 above target can be invested or held.",
    },
  ],
  mandate: {
    thesis: "A phased 60/40 portfolio funds retirement at 70 while a 24-month reserve covers emergencies.",
    assumptions: ["5% average annual return", "Expenses of $7,500 a month", "Retirement at 70"],
    riskStance: "Moderate. No concentrated positions, no leverage.",
    disclaimers: ["Projections are not guarantees.", "Past performance does not predict future results."],
    outOfScope: ["Individual stock picks", "Tax filing advice", "Crypto"],
  },
  // Likely worries with prepared answers (#38), as the engine wrote them from
  // this prep on the live model; the prep screen can prepare them again.
  anticipated: [
    {
      worry: "If an emergency hits, will I have enough cash on hand?",
      why: "Running short of cash in an emergency is one of Dana's stated concerns, and the plan sets aside a liquid reserve.",
      answer:
        "That worry makes sense, since your security comes first. The plan keeps a $180,000 liquid reserve, 24 months of expenses at $7,500 a month, outside the market. Does that cushion feel like enough, or would you want to change it?",
      facts: [
        { text: "Keep a $180,000 liquid reserve, equal to 24 months of expenses at $7,500 a month.", label: "PREPARED_FACT", sourceId: "plan-1" },
      ],
    },
    {
      worry: "What if I invest right before a downturn?",
      why: "Buying in right before a downturn is a stated concern, and the plan uses staged entry to address it.",
      answer:
        "Nobody can time the market, so that fear is understandable. The plan enters in 6 equal monthly tranches of $200,000, which reduces timing risk but can't remove it. How would you feel about that pace, or would you prefer another?",
      facts: [
        { text: "Enter the market in 6 equal monthly tranches of $200,000 to reduce timing risk.", label: "PREPARED_FACT", sourceId: "plan-1" },
        { text: "That staging guarantees against losses.", label: "DO_NOT_CLAIM" },
      ],
    },
    {
      worry: "Will I really have $9,000 a month when I retire at 70?",
      why: "Retiring at 70 with $9,000 a month is Dana's main goal, and the projection rests on an assumed return.",
      answer:
        "It's wise to test that number. The plan projects $9,000 a month at 70, but that assumes a 5% average return, which is not guaranteed. Would it help to look at how the income changes if returns come in lower?",
      facts: [
        { text: "Projected income at 70: $9,000 a month under a 5% average return assumption.", label: "PREPARED_FACT", sourceId: "plan-1" },
      ],
    },
    {
      worry: "Why is so much cash being held when I could be investing it?",
      why: "Dana holds $300,000 in cash today, while the plan keeps a $180,000 reserve.",
      answer:
        "Fair question. You hold $300,000 in cash, and the reserve target is $180,000, so $120,000 sits above target. You can invest or hold that amount, and it's your call. What would you like that extra money to do for you?",
      facts: [
        { text: "Cash on hand today $300,000, so $120,000 above target can be invested or held.", label: "PREPARED_FACT", sourceId: "plan-2" },
      ],
    },
    {
      worry: "Can I still help with my grandchildren's college?",
      why: "Helping fund two grandchildren's college is a stated goal, though the plan sets no college amount.",
      answer:
        "That goal matters, and I want it planned, not squeezed in. The plan as written focuses on your retirement income and reserve, and has no college figure yet. What amount or timing would you like us to model?",
      facts: [{ text: "That the plan already sets aside an amount for college.", label: "DO_NOT_CLAIM" }],
    },
  ],
  confirmed: true,
};

export const demoTranscript: TranscriptTurn[] = [
  { id: "t1", speaker: "advisor", t: 0, text: "So that's the plan: we put most of it to work and keep a reserve on the side." },
  { id: "t2", speaker: "client", t: 8, text: "I'm worried that locking this much in means I won't have enough access to cash if something happens." },
  { id: "t3", speaker: "advisor", t: 20, text: "That's a fair worry. Let's look at what stays liquid." },
  { id: "t4", speaker: "client", t: 31, text: "Okay, that helps. But honestly, the market seems too uncertain right now. Maybe I should just wait six months." },
  { id: "t5", speaker: "advisor", t: 44, text: "I hear you. Tell me more about what's behind that." },
  { id: "t6", speaker: "client", t: 52, text: "My sister lost a lot in 2008. And my son might need help with a house down payment next year." },
];

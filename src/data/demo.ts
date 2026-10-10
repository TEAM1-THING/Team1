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

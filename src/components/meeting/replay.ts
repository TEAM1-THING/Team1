// Replay logic for the meeting screen, kept free of React so a test can drive
// it through the real /api/moment handler.
import type { Card, Concern, ConversationState, MomentRequest, MomentResponse, Prep, TranscriptTurn } from "@/lib/types";
import { kindOf } from "./picture";

export type PostMoment = (req: MomentRequest, signal?: AbortSignal) => Promise<MomentResponse>;

// Only a client turn can raise a moment; advisor turns just extend the transcript.
export async function processTurn(
  prep: Prep,
  turns: TranscriptTurn[],
  state: ConversationState,
  post: PostMoment,
): Promise<{ card: Card | null; state: ConversationState }> {
  if (turns.at(-1)?.speaker !== "client") return { card: null, state };
  const res = await post({ prep, turns, state });
  return { card: res.card, state: res.state };
}

export const postMoment: PostMoment = async (req, signal) => {
  const res = await fetch("/api/moment", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok) throw new Error(`/api/moment answered ${res.status}`);
  return (await res.json()) as MomentResponse;
};

// chip: the colours of the label.
export const LABELS = {
  PREPARED_FACT: { text: "Prepared fact", chip: "bg-[#cff5dc] text-[#0e5a2c]" },
  CALCULATED: { text: "Calculation", chip: "bg-[#ffe9a8] text-[#6a4500]" },
  SUGGESTION: { text: "Suggestion", chip: "bg-[#ffd3de] text-[#8c1238]" },
  DO_NOT_CLAIM: { text: "Do not claim", chip: "bg-[#e6e6ee] text-[#3b3a52]" },
} as const;

// End-of-meeting follow-ups: one task line per concern still open.
export function followUpTasks(concerns: Concern[], client: string): string[] {
  return concerns.filter((c) => c.status === "open").map((c) => `Follow up with ${client}: ${kindOf(c.topic).text} (raised at ${c.raisedAtTurn})`);
}

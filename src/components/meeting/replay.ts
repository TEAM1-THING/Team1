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
  PREPARED_FACT: { text: "Prepared fact", chip: "bg-[#dde9d0] text-[#2f5a1e]" },
  CALCULATED: { text: "Calculation", chip: "bg-[#f5e2b3] text-[#6e4600]" },
  SUGGESTION: { text: "Suggestion", chip: "bg-[#f6d3d8] text-[#8a1f35]" },
  DO_NOT_CLAIM: { text: "Do not claim", chip: "bg-[#e3dcd0] text-[#4a433a]" },
} as const;

// End-of-meeting follow-ups: one task line per concern still open.
export function followUpTasks(concerns: Concern[], client: string): string[] {
  return concerns.filter((c) => c.status === "open").map((c) => `Follow up with ${client}: ${kindOf(c.topic).text} (raised at ${c.raisedAtTurn})`);
}

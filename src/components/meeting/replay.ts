// Replay logic for the meeting screen, kept free of React so a test can drive
// it through the real /api/moment handler.
import type { Card, Concern, ConversationState, MomentRequest, MomentResponse, Prep, TranscriptTurn } from "@/lib/types";

export type PostMoment = (req: MomentRequest) => Promise<MomentResponse>;

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

export const postMoment: PostMoment = async (req) => {
  const res = await fetch("/api/moment", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`/api/moment answered ${res.status}`);
  return (await res.json()) as MomentResponse;
};

// chip: the label pill; rule: the left edge of the fact it labels.
export const LABELS = {
  PREPARED_FACT: { text: "Prepared fact", chip: "bg-emerald-400/15 text-emerald-300", rule: "border-emerald-400" },
  CALCULATED: { text: "Calculation", chip: "bg-amber-400/15 text-amber-300", rule: "border-amber-400" },
  SUGGESTION: { text: "Suggestion", chip: "bg-rose-400/15 text-rose-300", rule: "border-rose-400" },
  DO_NOT_CLAIM: { text: "Do not claim", chip: "bg-slate-400/15 text-slate-300", rule: "border-slate-500" },
} as const;

// End-of-meeting follow-ups: one task line per concern still open.
export function followUpTasks(concerns: Concern[], client: string): string[] {
  return concerns.filter((c) => c.status === "open").map((c) => `Follow up with ${client}: ${c.topic} (raised at ${c.raisedAtTurn})`);
}

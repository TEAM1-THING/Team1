// Replay logic for the meeting screen, kept free of React so a test can drive
// it through the real /api/moment handler.
import type { Card, ConversationState, MomentRequest, MomentResponse, Prep, TranscriptTurn } from "@/lib/types";

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

export const LABELS = {
  PREPARED_FACT: { text: "Prepared fact", chip: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  CALCULATED: { text: "Calculation", chip: "bg-amber-100 text-amber-900 border-amber-300" },
  SUGGESTION: { text: "Suggestion", chip: "bg-rose-100 text-rose-900 border-rose-300" },
  DO_NOT_CLAIM: { text: "Do not claim", chip: "bg-neutral-200 text-neutral-700 border-neutral-300" },
} as const;

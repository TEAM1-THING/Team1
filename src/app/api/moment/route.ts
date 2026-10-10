// POST /api/moment: the newest turn in, a card and updated state out.
// Stage 0 stub: answers from the canned cards. The engine track replaces the
// body with a Claude call and keeps mockMoment as the fallback.
import { NextResponse } from "next/server";
import { mockMoment } from "@/lib/mock";
import { enforceNumberTrace } from "@/lib/provenance";
import { MomentRequest } from "@/lib/types";

export async function POST(req: Request) {
  const parsed = MomentRequest.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { prep, turns, state } = parsed.data;
  const latest = turns.at(-1);
  if (!latest) return NextResponse.json({ card: null, state });
  const res = mockMoment(latest.id, state);
  const card = res.card ? enforceNumberTrace(res.card, prep) : null;
  return NextResponse.json({ ...res, card });
}

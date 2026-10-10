// POST /api/moment: the newest turn in, a card and updated state out.
// runMoment calls Claude and falls back to the canned cards on any failure,
// so valid input never gets a 5xx.
import { NextResponse } from "next/server";
import { runMoment } from "@/lib/engine/moment";
import { MomentRequest } from "@/lib/types";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

// The contract has no size bounds, so the route sets one before parsing.
const MAX_BODY_BYTES = 256 * 1024;
const tooLarge = () => NextResponse.json({ error: "Body too large." }, { status: 413 });

export async function POST(req: Request) {
  if (Number(req.headers.get("content-length")) > MAX_BODY_BYTES) return tooLarge();
  let body: unknown;
  try {
    const text = await req.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return tooLarge();
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = MomentRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  return NextResponse.json(await runMoment(parsed.data, req.signal));
}

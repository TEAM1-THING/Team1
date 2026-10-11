// POST /api/anticipate: the prep on screen in, the worries this client is
// likely to raise out, each with a prepared answer and traced facts (#38).
// Uploading files does this already; this route serves a prep entered by hand
// and a refresh after the advisor edits the sources. Any failure returns an
// empty list. Owned by the engine track.
import { NextResponse } from "next/server";
import { z } from "zod";
import { anticipateWorries } from "@/lib/engine/anticipate";
import { ClientFile, Meeting } from "@/lib/types";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 256 * 1024;

const Body = z.object({
  meeting: Meeting.optional(),
  clientFile: ClientFile,
  sources: z.array(z.object({ id: z.string().max(100), title: z.string().max(300), text: z.string() })).max(20),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    const text = await req.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Body too large." }, { status: 413 });
    }
    json = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  return NextResponse.json(await anticipateWorries(parsed.data, req.signal));
}

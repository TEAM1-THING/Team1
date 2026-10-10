// POST /api/mandate: plan text in, a Mandate draft out for the advisor to
// confirm. Stage 0 stub returns the demo Mandate. Owned by the engine track.
import { NextResponse } from "next/server";
import { z } from "zod";
import { demoPrep } from "@/data/demo";

const Body = z.object({ sources: z.array(z.object({ text: z.string() })) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  return NextResponse.json({ mandate: demoPrep.mandate });
}

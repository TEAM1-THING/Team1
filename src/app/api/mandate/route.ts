// POST /api/mandate: plan text in, a Mandate draft out for the advisor to
// confirm. Claude drafts it; any failure returns the demo Mandate. The prep
// screen reads the "mandate" key. Owned by the engine track.
import { NextResponse } from "next/server";
import { z } from "zod";
import { MAX_SOURCES, MAX_SOURCE_CHARS, MAX_TITLE_CHARS, capSources, draftMandate } from "@/lib/engine/mandate";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const Body = z.object({
  sources: z
    .array(z.object({ text: z.string(), title: z.string().max(MAX_TITLE_CHARS).optional() }))
    .max(MAX_SOURCES),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sources, truncated, totalChars } = capSources(parsed.data.sources);
  if (truncated) {
    console.warn(
      `[mandate] plan input is ${totalChars} characters with wrappers; cut to ${MAX_SOURCE_CHARS} for drafting`,
    );
  }

  const { mandate, source } = await draftMandate(sources);
  return NextResponse.json({ mandate, source, truncated });
}

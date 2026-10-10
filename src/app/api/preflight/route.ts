// POST /api/preflight: before the meeting, check the plan's market assumptions
// against live public data (Bright Data SERP API), judged by Claude against
// only the fetched results, and return cited findings. Owned by the engine
// track. The prep screen renders the response.
//
// Body: optional { prep }. Missing, oversized (over 256 KB, declared or read)
// or invalid -> the demo prep, so the prep screen may send nothing.
// Response: { checks, source }.
import { NextResponse } from "next/server";
import { demoPrep } from "@/data/demo";
import { runPreflight } from "@/lib/engine/preflight";
import { Prep } from "@/lib/types";

export type { PreflightCheck, PreflightResult } from "@/lib/engine/preflight";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

const MAX_BODY = 256_000; // bytes

// The body as text, or null once it is declared or found to exceed `max`
// bytes. Reading stops at the cap, so an oversized body is never buffered.
async function readCapped(req: Request, max: number): Promise<string | null> {
  if (Number(req.headers.get("content-length") ?? 0) > max) return null;
  if (!req.body) return "";
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

async function prepFrom(req: Request): Promise<Prep> {
  try {
    const raw = await readCapped(req, MAX_BODY);
    if (!raw) return demoPrep;
    const body: unknown = JSON.parse(raw);
    const prep = body && typeof body === "object" ? (body as { prep?: unknown }).prep : undefined;
    const parsed = Prep.safeParse(prep);
    return parsed.success ? parsed.data : demoPrep;
  } catch {
    return demoPrep;
  }
}

export async function POST(req: Request) {
  // The request's signal stops the live calls if the client disconnects.
  const result = await runPreflight(await prepFrom(req), req.signal);
  return NextResponse.json(result);
}

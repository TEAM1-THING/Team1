// POST /api/preflight: before the meeting, check the plan's figures against
// live public data (Bright Data) and return cited findings. Stage 0 stub.
// Owned by the engine track. The prep screen renders the response.
import { NextResponse } from "next/server";

export type PreflightCheck = {
  claim: string; // the figure or assumption from the plan
  status: "ok" | "stale" | "unverified";
  note: string;
  sourceUrl?: string;
};

export async function POST() {
  const checks: PreflightCheck[] = [
    { claim: "5% average annual return", status: "unverified", note: "Stub: the engine track replaces this with a cited Bright Data lookup." },
  ];
  return NextResponse.json({ checks });
}

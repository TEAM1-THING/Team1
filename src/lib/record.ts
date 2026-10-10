// After-meeting record: every card is a record (guardrail 5). Owned by the
// ship track. The meeting screen only ever calls exportRecord.
// Flow: download the record as JSON, then open the Base44 records app
// (NEXT_PUBLIC_BASE44_URL) in a new tab so the advisor can upload it there.
import type { ConversationState, Prep } from "./types";

export type MeetingRecord = {
  client: string;
  endedAt: string;
  concerns: ConversationState["concerns"];
  cards: ConversationState["cards"];
};

export function buildRecord(prep: Prep, state: ConversationState): MeetingRecord {
  return {
    client: prep.clientFile.name,
    endedAt: new Date().toISOString(),
    concerns: state.concerns,
    cards: state.cards,
  };
}

export function recordFileName(record: MeetingRecord): string {
  const who = record.client.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";
  return `second-chair-record-${who}-${record.endedAt.slice(0, 10)}.json`;
}

export function base44Url(): string | null {
  const url = process.env.NEXT_PUBLIC_BASE44_URL?.trim();
  return url && /^https?:\/\//.test(url) ? url : null;
}

// Must not throw: every step is guarded so the meeting screen never breaks.
export async function exportRecord(prep: Prep, state: ConversationState): Promise<void> {
  try {
    const record = buildRecord(prep, state);
    const blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = recordFileName(record);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 10_000);
  } catch (e) {
    console.error("exportRecord: download failed", e);
  }
  try {
    const url = base44Url();
    if (url) window.open(url, "_blank", "noopener");
  } catch (e) {
    console.error("exportRecord: could not open the Base44 app", e);
  }
}

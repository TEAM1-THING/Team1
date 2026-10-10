// After-meeting record: every card is a record (guardrail 5). Owned by the
// ship track. The meeting screen only ever calls exportRecord.
// Flow: download the record as JSON, then open the Base44 records app
// (NEXT_PUBLIC_BASE44_URL) in a new tab with the record already loaded, so
// the advisor only has to sign in and press Save record.
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

// Next.js inlines NEXT_PUBLIC_* at build time: after setting or changing it in
// Vercel, redeploy for the browser bundle to see it.
export function base44Url(): string | null {
  const url = process.env.NEXT_PUBLIC_BASE44_URL?.trim();
  return url && /^https?:\/\//.test(url) ? url : null;
}

// The record rides in the link's fragment (#record=<base64url JSON>), which
// browsers never send to a server. The records app moves it into the tab's
// sessionStorage before its sign-in check. Too big for a link: open the app
// without it, and the advisor uploads the downloaded file instead.
const MAX_LINK = 1_000_000; // Chrome accepts URLs up to about 2 MB

export function encodeRecord(record: MeetingRecord): string {
  let bin = "";
  for (const byte of new TextEncoder().encode(JSON.stringify(record))) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function recordLink(base: string, record: MeetingRecord): string {
  const plain = base.replace(/#.*$/, "");
  const link = `${plain}#record=${encodeRecord(record)}`;
  return link.length <= MAX_LINK ? link : plain;
}

// Must not throw: every step is guarded so the meeting screen never breaks.
export async function exportRecord(prep: Prep, state: ConversationState): Promise<void> {
  let record: MeetingRecord | null = null;
  try {
    record = buildRecord(prep, state);
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
    if (url) {
      let link = url;
      try {
        if (record) link = recordLink(url, record);
      } catch (e) {
        console.error("exportRecord: could not put the record in the link", e);
      }
      window.open(link, "_blank", "noopener");
    }
  } catch (e) {
    console.error("exportRecord: could not open the Base44 app", e);
  }
}

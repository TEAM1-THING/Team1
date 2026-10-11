// After-meeting record: every card is a record (guardrail 5). Owned by the
// ship track. The meeting screen only ever calls exportRecord.
// Flow: download the record as JSON, then open the Base44 records app
// (NEXT_PUBLIC_BASE44_URL) in a new tab with the record already loaded, ready
// to review, save and sign off.
import type { ConversationState, Prep } from "./types";

// The advisor's verdict on each card, so the records database can audit how
// well Second Chair did over many meetings (#42). Agreed with track B.
export type Grade = "helpful" | "not_needed" | "wrong" | "ungraded";
export const GRADES: readonly Grade[] = ["helpful", "not_needed", "wrong", "ungraded"];
export type CardGrade = { cardId: string; grade: Grade; gradedAt?: string };

export type MeetingRecord = {
  client: string;
  endedAt: string;
  concerns: ConversationState["concerns"];
  cards: ConversationState["cards"];
  grades: CardGrade[]; // one per card, in card order; "ungraded" unless the advisor chose
};

// One grade per card: the advisor's where given (and valid), "ungraded" otherwise.
export function completeGrades(cards: ConversationState["cards"], given: CardGrade[] = []): CardGrade[] {
  const byId = new Map(given.filter((g) => GRADES.includes(g.grade)).map((g) => [g.cardId, g]));
  return cards.map((c) => {
    const g = byId.get(c.id);
    if (!g || g.grade === "ungraded") return { cardId: c.id, grade: "ungraded" };
    return { cardId: c.id, grade: g.grade, ...(g.gradedAt ? { gradedAt: g.gradedAt } : {}) };
  });
}

export function buildRecord(prep: Prep, state: ConversationState, grades?: CardGrade[]): MeetingRecord {
  return {
    client: prep.clientFile.name,
    endedAt: new Date().toISOString(),
    concerns: state.concerns,
    cards: state.cards,
    grades: completeGrades(state.cards, grades),
  };
}

export function recordFileName(record: MeetingRecord): string {
  const who = record.client.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "client";
  return `second-chair-record-${who}-${record.endedAt.slice(0, 10)}.json`;
}

// Next.js inlines NEXT_PUBLIC_* at build time: after setting or changing these
// in Vercel, redeploy for the browser bundle to see them.
export function base44Url(): string | null {
  const url = process.env.NEXT_PUBLIC_BASE44_URL?.trim();
  return url && /^https?:\/\//.test(url) ? url : null;
}

// The records database (Supabase). The publishable key is meant for browsers;
// the database only lets it create a hand-off, nothing else.
export function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return url && key && /^https:\/\//.test(url) ? { url, key } : null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Hand-off by id (#45): the record waits in the database under a one-time id
// that expires in an hour, and only the id goes in the link, so client details
// never sit in a URL or browser history. Null on any failure.
export async function createHandoff(
  record: MeetingRecord,
  config: { url: string; key: string },
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  try {
    const res = await fetchImpl(`${config.url}/rest/v1/rpc/create_handoff`, {
      method: "POST",
      headers: { apikey: config.key, "Content-Type": "application/json" },
      body: JSON.stringify({ record }),
    });
    if (!res.ok) return null;
    const id: unknown = await res.json();
    return typeof id === "string" && UUID.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function handoffLink(base: string, id: string): string {
  return `${base.replace(/#.*$/, "")}#handoff=${id}`;
}

/**
 * @deprecated Records no longer travel in links (#45). Kept so existing
 * callers compile; returns the plain records-app link. To open the app with
 * the record loaded, call openRecordsApp(record) from a click handler.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function recordLink(base: string, _record: MeetingRecord): string {
  return base.replace(/#.*$/, "");
}

// Opens the records app in a new tab with the record handed over by id. Call
// it from a click: the tab opens at once, while the click still counts as the
// user's, then moves to the hand-off once the database answers. Never throws.
export async function openRecordsApp(record: MeetingRecord | null): Promise<void> {
  try {
    const url = base44Url();
    if (!url) return;
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    const config = supabaseConfig();
    const id = record && config ? await createHandoff(record, config) : null;
    // No hand-off: open the app plainly; the advisor uploads the downloaded file.
    const link = id ? handoffLink(url, id) : url;
    if (tab) tab.location.href = link;
    else window.open(link, "_blank", "noopener");
  } catch (e) {
    console.error("openRecordsApp: could not open the records app", e);
  }
}

// Must not throw: every step is guarded so the meeting screen never breaks.
export async function exportRecord(prep: Prep, state: ConversationState, grades?: CardGrade[]): Promise<void> {
  let record: MeetingRecord | null = null;
  try {
    record = buildRecord(prep, state, grades);
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
  await openRecordsApp(record);
}

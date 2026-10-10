// After-meeting record: every card is a record (guardrail 5). Owned by the
// ship track, which replaces the body to send the record to the Base44 app.
// The meeting screen only ever calls exportRecord.
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

// Stage 0: download as JSON. Must not throw.
export async function exportRecord(prep: Prep, state: ConversationState): Promise<void> {
  const blob = new Blob([JSON.stringify(buildRecord(prep, state), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "second-chair-record.json";
  a.click();
}

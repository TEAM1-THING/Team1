// Pure helpers for live mic turns, kept apart from React so they can be tested.
import type { TranscriptTurn } from "@/lib/types";

// A short pause after a finished line before analyzing, so a client who keeps
// talking gets one card for the whole thought instead of one per fragment.
export const LIVE_PAUSE_MS = 600;

// The transcript up to and including `id`: the request is about that line even
// if more lines arrived while it waited.
export function windowThrough(turns: TranscriptTurn[], id: string): TranscriptTurn[] {
  const i = turns.findIndex((t) => t.id === id);
  return i < 0 ? turns : turns.slice(0, i + 1);
}

export function relabel(turns: TranscriptTurn[], id: string, speaker: TranscriptTurn["speaker"]): TranscriptTurn[] {
  return turns.map((t) => (t.id === id ? { ...t, speaker } : t));
}

// Live mic lines carry ids "m1", "m2", ...; only those can be relabeled.
export const isLiveTurn = (id: string) => /^m\d+$/.test(id);

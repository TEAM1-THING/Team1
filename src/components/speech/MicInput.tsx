"use client";
// Live mic input. Owned by the ship track (stretch). The meeting screen renders
// <MicInput onTurn={...} /> and must work whether or not this is implemented.
// Contract: call onTurn once per finished client utterance.

export type MicInputProps = { onTurn: (text: string) => void };

export default function MicInput(_props: MicInputProps) {
  return (
    <button type="button" disabled className="rounded border px-3 py-1 text-sm opacity-50">
      Live mic (coming soon)
    </button>
  );
}

"use client";
// Live mic input. Owned by the ship track. The meeting screen renders
// <MicInput onTurn={...} /> and must work whether or not speech is supported.
// Contract: call onTurn once per finished client utterance.
// Uses the browser Web Speech API (Chrome: webkitSpeechRecognition).
import { useEffect, useRef, useState } from "react";

export type MicInputProps = { onTurn: (text: string) => void };

// Minimal typings: the Web Speech API is not in TypeScript's DOM lib.
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionCtor = new () => Recognition;

export function getRecognitionCtor(w: unknown): RecognitionCtor | null {
  const g = w as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor } | undefined;
  return g?.SpeechRecognition ?? g?.webkitSpeechRecognition ?? null;
}

// Pull the finished utterances out of one result event.
export function finalTexts(e: RecognitionEvent): string[] {
  const out: string[] = [];
  for (let i = e.resultIndex; i < e.results.length; i++) {
    const r = e.results[i];
    const text = r[0]?.transcript?.trim();
    if (r.isFinal && text) out.push(text);
  }
  return out;
}

export default function MicInput({ onTurn }: MicInputProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const recRef = useRef<Recognition | null>(null);
  const wantRef = useRef(false); // user wants the mic on; restart after Chrome's auto-stop
  const onTurnRef = useRef(onTurn);
  onTurnRef.current = onTurn;

  useEffect(() => {
    setSupported(getRecognitionCtor(window) !== null);
    return () => {
      wantRef.current = false;
      recRef.current?.stop();
    };
  }, []);

  function start() {
    const Ctor = getRecognitionCtor(window);
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      for (const text of finalTexts(e)) onTurnRef.current(text);
      let pending = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) pending += e.results[i][0]?.transcript ?? "";
      }
      setInterim(pending.trim());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        wantRef.current = false;
        setError("Microphone permission denied.");
      }
    };
    rec.onend = () => {
      setInterim("");
      if (wantRef.current) {
        try {
          rec.start();
          return;
        } catch {
          // fall through to stopped state
        }
      }
      setListening(false);
    };
    recRef.current = rec;
    wantRef.current = true;
    setError("");
    try {
      rec.start();
      setListening(true);
    } catch {
      wantRef.current = false;
      setError("Could not start the microphone.");
    }
  }

  function stop() {
    wantRef.current = false;
    recRef.current?.stop();
    setListening(false);
  }

  if (!supported) {
    return (
      <button type="button" disabled className="rounded border px-3 py-1 text-sm opacity-50" title="Live mic needs Chrome">
        Live mic (use Chrome)
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={listening ? stop : start}
        className="flex items-center gap-2 rounded border px-3 py-1"
        aria-pressed={listening}
      >
        {listening && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" aria-hidden />}
        {listening ? "Stop mic" : "Live mic"}
      </button>
      {interim && <span className="italic opacity-60">{interim}</span>}
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}

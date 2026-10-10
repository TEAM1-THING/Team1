"use client";
// Live mic input. Owned by the ship track. The meeting screen renders
// <MicInput onTurn={...} /> and must work whether or not speech is supported.
// Contract: call onTurn once per finished client utterance.
// Uses the browser Web Speech API (Chrome: webkitSpeechRecognition), which
// sends the audio to the browser's speech service. Recording needs everyone's
// consent (California is all-party), so the mic stays off until it is confirmed.
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

// Errors a restart cannot fix. Any other error ("no-speech", "aborted") ends
// the session and onend starts a new one.
export const FATAL_ERRORS: Record<string, string> = {
  "not-allowed": "Microphone permission denied.",
  "service-not-allowed": "Speech service blocked in this browser.",
  "audio-capture": "No microphone found.",
  network: "Speech service unreachable.",
  "language-not-supported": "Language not supported.",
};

const CONSENT_NOTE =
  "Live transcription records the client. Everyone in the meeting must agree first (California requires all-party consent). Chrome sends the audio to its speech service.";

export default function MicInput({ onTurn }: MicInputProps) {
  const [supported, setSupported] = useState<boolean | null>(null); // null until checked in the browser
  const [consent, setConsent] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  // The live recognizer, or null when the mic is off. Handlers of any other
  // recognizer are ignored, so one that ends late can never restart or emit.
  const recRef = useRef<Recognition | null>(null);
  const onTurnRef = useRef(onTurn);

  useEffect(() => {
    onTurnRef.current = onTurn;
  }, [onTurn]);

  useEffect(() => {
    setSupported(getRecognitionCtor(window) !== null);
    return () => {
      const rec = recRef.current;
      recRef.current = null;
      rec?.stop();
    };
  }, []);

  function off(message = "") {
    const rec = recRef.current;
    recRef.current = null;
    rec?.stop();
    setListening(false);
    setInterim("");
    setError(message);
  }

  function start() {
    const Ctor = getRecognitionCtor(window);
    if (!Ctor || recRef.current) return;
    const rec = new Ctor();
    const live = () => recRef.current === rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      if (!live()) return;
      for (const text of finalTexts(e)) onTurnRef.current(text);
      let pending = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) pending += e.results[i][0]?.transcript ?? "";
      }
      setInterim(pending.trim());
    };
    rec.onerror = (e) => {
      if (live() && FATAL_ERRORS[e.error]) off(FATAL_ERRORS[e.error]);
    };
    // Chrome ends a session after a pause; keep listening until stopped.
    rec.onend = () => {
      if (!live()) return;
      try {
        rec.start();
      } catch {
        off("The microphone stopped.");
      }
    };
    recRef.current = rec;
    setError("");
    try {
      rec.start();
      setListening(true);
    } catch {
      off("Could not start the microphone.");
    }
  }

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        className="rounded border px-3 py-1 text-sm opacity-50"
        title={supported === false ? "Live mic needs Chrome" : undefined}
      >
        {supported === false ? "Live mic (use Chrome)" : "Live mic"}
      </button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm">
      {!listening && (
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs opacity-80" title={CONSENT_NOTE}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          All parties consent
        </label>
      )}
      <button
        type="button"
        onClick={listening ? () => off() : start}
        disabled={!listening && !consent}
        title={listening ? "Stop live transcription" : consent ? "Start live transcription" : CONSENT_NOTE}
        className="inline-flex items-center gap-2 rounded border px-3 py-1 disabled:opacity-50"
        aria-pressed={listening}
      >
        {listening && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" aria-hidden />}
        {listening ? "Stop mic" : "Live mic"}
      </button>
      {interim && <span className="max-w-[16rem] truncate italic opacity-60">{interim}</span>}
      {error && <span className="text-red-500">{error}</span>}
    </span>
  );
}

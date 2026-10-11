"use client";
// Live mic input. Owned by the ship track. The meeting screen renders
// <MicInput onTurn={...} /> and must work whether or not speech is supported.
// Contract: call onTurn once per finished client utterance.
// Uses the browser Web Speech API (Chrome: webkitSpeechRecognition), which
// sends the audio to the browser's speech service. Recording needs everyone's
// consent (California is all-party), so the mic starts only after the advisor
// has read the consent line to the client and ticked Done (#34).
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ui } from "@/components/meeting/ui";

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

// Read aloud to the client before the mic starts (#34). Each clause matches
// the code: Chrome's speech service here, recent lines and the client file to
// Anthropic in engine/moment.ts, cards and concerns kept by record.ts, no audio stored.
export const CONSENT_LINE =
  "I'd like to use an AI assistant called Second Chair today. It transcribes our conversation using Google's speech service, and sends what we say, with the details of your plan, to an AI service (Anthropic) that suggests what I should check or say. We don't save audio, but I keep a written record of its notes and the concerns you raise. Is that all right with you?";

export default function MicInput({ onTurn }: MicInputProps) {
  const [supported, setSupported] = useState<boolean | null>(null); // null until checked in the browser
  const [consented, setConsented] = useState(false); // asked once per meeting
  const [asking, setAsking] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  // The live recognizer, or null when the mic is off. Handlers of any other
  // recognizer are ignored, so one that ends late can never restart or emit.
  const recRef = useRef<Recognition | null>(null);
  const onTurnRef = useRef(onTurn);
  const micButton = useRef<HTMLButtonElement>(null);

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

  function closeConsent(agreed: boolean) {
    setAsking(false);
    if (agreed) {
      setConsented(true);
      start();
    }
    micButton.current?.focus();
  }

  function onMicClick() {
    if (listening) off();
    else if (consented) start();
    else setAsking(true);
  }

  if (!supported) {
    return (
      <button
        type="button"
        disabled
        className={`${ui.btn} ${ui.outline}`}
        title={supported === false ? "Live mic needs Chrome" : undefined}
      >
        {supported === false ? "Live mic (use Chrome)" : "Live mic"}
      </button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm">
      <button
        ref={micButton}
        type="button"
        onClick={onMicClick}
        title={listening ? "Stop live transcription" : "Start live transcription"}
        className={`${ui.btn} ${ui.outline}`}
        aria-pressed={listening}
        aria-haspopup={consented ? undefined : "dialog"}
      >
        {listening && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" aria-hidden />}
        {listening ? "Stop mic" : "Live mic"}
      </button>
      {interim && <span className="max-w-[16rem] truncate italic opacity-60">{interim}</span>}
      {error && <span className="text-red-500">{error}</span>}
      {asking && <ConsentDialog onClose={closeConsent} />}
    </span>
  );
}

// Modal: the advisor reads the line aloud, ticks Done once the client agrees,
// then Start. Cancel or Escape leaves the mic off. Rendered on <body> so the
// header's button styles do not reach it.
function ConsentDialog({ onClose }: { onClose: (agreed: boolean) => void }) {
  const [done, setDone] = useState(false);
  const titleId = useId();
  const box = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  useEffect(() => {
    box.current?.querySelector<HTMLElement>("input, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close.current(false);
      }
      // Keep Tab inside the dialog.
      if (e.key === "Tab" && box.current) {
        const items = [...box.current.querySelectorAll<HTMLElement>("input, button:not([disabled])")];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans" onClick={() => onClose(false)}>
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className={`${ui.raised} w-full max-w-lg space-y-4 p-5 text-[#ecebe8]`}
      >
        <h2 id={titleId} className="text-base font-semibold">
          Ask your client before the mic starts
        </h2>
        <p className={`text-sm ${ui.muted}`}>Read this aloud:</p>
        <blockquote className="border-l-2 border-white/20 pl-3 text-[15px] leading-relaxed">“{CONSENT_LINE}”</blockquote>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={done} onChange={(e) => setDone(e.target.checked)} className="h-4 w-4" />
          Done: the client agreed
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => onClose(false)} className={`${ui.btn} ${ui.ghost}`}>
            Cancel
          </button>
          <button type="button" disabled={!done} onClick={() => onClose(true)} className={`${ui.btn} ${ui.primary}`}>
            Start
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Pipeline utility process: utterances in from the audio window, transcript
// turns out to the overlay. Speech-to-text runs here, a separate Node process,
// so a slow or failing speech service never touches the main process or the
// overlay's rendering. The meeting page then sends each turn to /api/moment as
// it does for the browser mic.
import type { MessagePortMain } from "electron";
import { createSttQueue, type Utterance } from "../core/sttQueue";
import { wav } from "../core/vad";

const STT_URL = process.env.SC_STT_URL ?? "";
const STT_KEY = process.env.SC_STT_KEY ?? "";
const STT_MODEL = process.env.SC_STT_MODEL ?? "whisper-1";

// Whisper-family models invent these on near-silence.
const HALLUCINATION = /^(thank you\.?|thanks for watching!?|you|\.+|\[.*\])$/i;

let audio: MessagePortMain | null = null;
let overlay: MessagePortMain | null = null;
let listening = false;

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
const toOverlay = (m: unknown) => overlay?.postMessage(m);

async function transcribe(u: Utterance, signal: AbortSignal): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([wav(u.pcm)], { type: "audio/wav" }), "utterance.wav");
  form.append("model", STT_MODEL);
  form.append("language", "en");
  form.append("response_format", "json");
  const res = await fetch(STT_URL, {
    method: "POST",
    headers: STT_KEY ? { Authorization: `Bearer ${STT_KEY}` } : {},
    body: form,
    signal,
  });
  if (!res.ok) throw new Error(`speech service answered ${res.status}`);
  const text = String(((await res.json()) as { text?: unknown }).text ?? "").trim();
  return HALLUCINATION.test(text) ? "" : text;
}

const stt = createSttQueue({
  transcribe,
  onText: (text) => toOverlay({ type: "final", text }),
  onError: (e, fatal) => {
    console.warn(`[pipeline] speech-to-text: ${message(e)}`);
    if (fatal) fail("network", `Speech service failed: ${message(e)}`);
  },
});

function setListening(on: boolean) {
  if (listening === on) return;
  listening = on;
  process.parentPort.postMessage({ type: "listening", on });
}

function stop() {
  audio?.postMessage({ type: "stop" });
  stt.clear();
  setListening(false);
}

function fail(code: string, text: string) {
  console.warn(`[pipeline] ${text}`);
  stop();
  toOverlay({ type: "error", code, message: text });
}

function start() {
  if (!STT_URL) return fail("service-not-allowed", "Live transcription needs SC_STT_URL, an OpenAI-compatible transcription endpoint.");
  if (!audio) return fail("audio-capture", "The audio window is not ready yet.");
  audio.postMessage({ type: "start" });
}

function bindOverlay(port: MessagePortMain) {
  // A reloaded meeting page starts with its mic off, so any capture stops too.
  if (overlay) stop();
  overlay?.close();
  overlay = port;
  port.on("message", (e) => {
    const m = e.data as { type?: string; on?: boolean };
    if (m?.type === "mic") (m.on ? start : stop)();
  });
  port.start();
}

function bindAudio(port: MessagePortMain) {
  audio?.close();
  audio = port;
  setListening(false);
  port.on("message", (e) => {
    const m = e.data as { type?: string; pcm?: ArrayBuffer; ms?: number; code?: string; message?: string };
    if (m?.type === "started") setListening(true);
    else if (m?.type === "stopped") setListening(false);
    else if (m?.type === "error") fail(m.code ?? "audio-capture", m.message ?? "Audio capture failed.");
    else if (m?.type === "utterance" && listening && m.pcm) stt.push({ pcm: new Int16Array(m.pcm), ms: m.ms ?? 0 });
  });
  port.start();
}

process.parentPort.on("message", (e) => {
  const [port] = e.ports;
  const type = (e.data as { type?: string })?.type;
  if (!port) return;
  if (type === "overlay-port") bindOverlay(port);
  else if (type === "audio-port") bindAudio(port);
});

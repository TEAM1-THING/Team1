// The hidden audio window's whole job, run from its preload so the pipeline
// port never has to be handed into the page. Captures the call's sound (not
// the advisor's microphone), runs voice detection on the audio thread, and
// sends finished utterances to the pipeline. Starts only when the pipeline
// says so, which happens only after the meeting page's consent checkbox.
import { ipcRenderer } from "electron";

declare const __VAD_WORKLET__: string; // the bundled vad-worklet, inlined at build time

type Session = { stop(): void };
type ErrorCode = "audio-capture" | "not-allowed";

class CaptureError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const q = new URLSearchParams(location.search);
const platform = q.get("platform") ?? "";
const devicePattern = q.get("device") ?? "BlackHole";
const source = q.get("source") ?? "system"; // "system" | "device" | "tone"

// The far end of the call arrives already processed; echo cancellation would
// cancel it outright, and gain control would pump the voice detector.
const RAW = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };

// Dev self-test (SC_AUDIO_SOURCE=tone): 1.2 s of tone, 1 s of silence, repeating.
function toneStream(): MediaStream {
  const ctx = new AudioContext();
  const osc = new OscillatorNode(ctx, { frequency: 220 });
  const gain = new GainNode(ctx, { gain: 0 });
  const out = ctx.createMediaStreamDestination();
  osc.connect(gain).connect(out);
  osc.start();
  for (let t = 0.5; t < 600; t += 2.2) {
    gain.gain.setValueAtTime(0.2, ctx.currentTime + t);
    gain.gain.setValueAtTime(0, ctx.currentTime + t + 1.2);
  }
  out.stream.getAudioTracks()[0].addEventListener("ended", () => void ctx.close());
  return out.stream;
}

async function systemAudio(): Promise<MediaStream> {
  if (source === "tone") return toneStream();
  if (source === "system" && (platform === "win32" || platform === "darwin")) {
    try {
      return await loopback();
    } catch (e) {
      // Windows has no fallback; an older Mac falls through to a virtual device.
      if (platform === "win32") throw e;
      console.warn(`[audio] system audio loopback unavailable (${e instanceof Error ? e.message : e}); trying a virtual device`);
    }
  }
  return virtualDevice();
}

// Main answers this request with { audio: "loopback" }; the video track is dropped at once.
async function loopback(): Promise<MediaStream> {
  const s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: RAW });
  for (const t of s.getVideoTracks()) {
    t.stop();
    s.removeTrack(t);
  }
  if (!s.getAudioTracks().length) throw new CaptureError("audio-capture", "System audio loopback returned no track.");
  return s;
}

// The call's output routed through a virtual audio device (BlackHole) and read as an input.
async function virtualDevice(): Promise<MediaStream> {
  const re = new RegExp(devicePattern, "i");
  const device = (await navigator.mediaDevices.enumerateDevices()).find((d) => d.kind === "audioinput" && re.test(d.label));
  if (!device) {
    throw new CaptureError(
      "audio-capture",
      `No virtual audio device matching /${devicePattern}/. Install BlackHole and send the call's output to a Multi-Output Device that includes it.`,
    );
  }
  return navigator.mediaDevices.getUserMedia({ audio: { ...RAW, deviceId: { exact: device.deviceId } } });
}

async function open(send: (m: unknown) => void, fail: (e: CaptureError) => void): Promise<Session> {
  const stream = await systemAudio();
  const ctx = new AudioContext({ latencyHint: "interactive" });
  const url = URL.createObjectURL(new Blob([__VAD_WORKLET__], { type: "text/javascript" }));
  try {
    await ctx.audioWorklet.addModule(url);
  } finally {
    URL.revokeObjectURL(url);
  }
  const node = new AudioWorkletNode(ctx, "sc-vad", { numberOfOutputs: 1, outputChannelCount: [1] });
  node.port.onmessage = (e: MessageEvent<{ pcm: ArrayBuffer; ms: number }>) => send({ type: "utterance", ...e.data });
  // A muted sink keeps the graph pulling without playing the call back.
  ctx.createMediaStreamSource(stream).connect(node).connect(new GainNode(ctx, { gain: 0 })).connect(ctx.destination);
  stream.getAudioTracks()[0]?.addEventListener("ended", () => fail(new CaptureError("audio-capture", "The call's audio stopped.")));
  await ctx.resume();
  return {
    stop() {
      node.port.onmessage = null;
      for (const t of stream.getTracks()) t.stop();
      void ctx.close();
    },
  };
}

let port: MessagePort | null = null;
let session: Session | null = null;
let wanted = false; // last instruction from the pipeline; a stop can arrive mid-start

const send = (m: unknown) => port?.postMessage(m);

function fail(e: CaptureError) {
  wanted = false;
  session?.stop();
  session = null;
  send({ type: "error", code: e.code, message: e.message });
}

async function start() {
  wanted = true;
  if (session) return;
  try {
    const s = await open(send, fail);
    if (!wanted) return s.stop();
    session = s;
    send({ type: "started" });
  } catch (e) {
    const denied = e instanceof DOMException && e.name === "NotAllowedError";
    fail(
      e instanceof CaptureError
        ? e
        : new CaptureError(denied ? "not-allowed" : "audio-capture", e instanceof Error ? e.message : String(e)),
    );
  }
}

function stop() {
  wanted = false;
  session?.stop();
  session = null;
  send({ type: "stopped" });
}

ipcRenderer.on("sc:port", (e) => {
  stop();
  port = e.ports[0] ?? null;
  if (!port) return;
  port.onmessage = (m: MessageEvent<{ type?: string }>) => {
    if (m.data?.type === "start") void start();
    else if (m.data?.type === "stop") stop();
  };
});
ipcRenderer.send("sc:hello");

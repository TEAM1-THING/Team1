// Everything the desktop shell reads from the environment, in one place.
// No secrets live in the tree: the speech key comes from the user's own env.
import path from "node:path";

const env = process.env;

export const config = {
  // The meeting screen the overlay shows. The deployed app by default; point it
  // at `http://localhost:3000/meeting` while developing the web app.
  url: env.SC_URL ?? "https://second-chair-seven.vercel.app/meeting",
  side: env.SC_SIDE === "left" ? ("left" as const) : ("right" as const),
  width: Number(env.SC_WIDTH) || 460,
  // Which audio input carries the meeting's sound on macOS, where Electron has
  // no system loopback: a virtual driver such as BlackHole.
  audioDevice: env.SC_AUDIO_DEVICE ?? "BlackHole|Loopback Audio|Soundflower|VB-Cable|CABLE Output",
  // Any OpenAI-compatible transcription endpoint: OpenAI, Groq, or a local
  // whisper server so audio never leaves the machine.
  sttUrl: env.SC_STT_URL ?? "",
  sttKey: env.SC_STT_KEY ?? "",
  sttModel: env.SC_STT_MODEL ?? "whisper-1",
  // Content protection is on unless explicitly disabled (useful when demoing on a shared screen).
  protect: env.SC_PROTECT !== "0",
  // Dev self-test: "tone" replaces the call's audio with a pulsed tone, so the
  // whole chain (audio thread, pipeline, speech service, meeting page) runs
  // without a virtual audio driver.
  audioSource: env.SC_AUDIO_SOURCE === "tone" ? "tone" : "system",
  debug: env.SC_DEBUG === "1",
};

export const asset = (name: string) => path.join(__dirname, "..", "assets", name);
export const dist = (name: string) => path.join(__dirname, name);

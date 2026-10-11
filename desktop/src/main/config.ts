// Everything the desktop shell reads from the environment, in one place.
// No secrets live in the tree: the speech key comes from the user's own env.
import path from "node:path";

const env = process.env;

export const config = {
  // The meeting screen the overlay shows. The deployed app by default; point it
  // at `http://localhost:3000/meeting` while developing the web app.
  url: env.SC_URL ?? "https://second-chair-live.vercel.app/meeting",
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
  // "system" (default): the call's sound by OS loopback (Windows; macOS 14.2+
  // through Core Audio taps), falling back to a virtual device on older Macs.
  // "device": always the virtual device. "tone": dev self-test, no capture.
  audioSource: (["device", "tone"].includes(env.SC_AUDIO_SOURCE ?? "") ? env.SC_AUDIO_SOURCE : "system") as "system" | "device" | "tone",
  // Testing the undisclosed-meeting scenario: the meeting page's "everyone has
  // been told" notice is hidden in the overlay unless this is "1" (also a
  // menu-bar toggle). Recording still needs the page's all-parties consent
  // checkbox, which is never hidden.
  disclosureNotice: env.SC_CONSENT_BANNER === "1",
  debug: env.SC_DEBUG === "1",
};

export const asset = (name: string) => path.join(__dirname, "..", "assets", name);
export const dist = (name: string) => path.join(__dirname, name);

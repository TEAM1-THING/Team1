// Speech-to-text queue with backpressure. One request in flight keeps the
// transcript in order. When the speech service falls behind, waiting
// utterances are merged into one request instead of queueing without bound, so
// the advisor's lag stays near one request no matter how long the client talks.
import { joinPcm, STT_RATE } from "./vad";

export type Utterance = { pcm: Int16Array; ms: number };

export type SttQueueOptions = {
  transcribe: (u: Utterance, signal: AbortSignal) => Promise<string>;
  onText: (text: string) => void;
  onError: (error: unknown, fatal: boolean) => void;
  maxPending?: number; // waiting utterances before the oldest are merged
  maxMergedMs?: number; // a merge never grows a request past this
  timeoutMs?: number;
  maxFailures?: number; // consecutive failures that stop the session
};

export function createSttQueue(opts: SttQueueOptions) {
  const maxPending = opts.maxPending ?? 2;
  const maxMergedMs = opts.maxMergedMs ?? 30_000;
  const timeoutMs = opts.timeoutMs ?? 12_000;
  const maxFailures = opts.maxFailures ?? 3;
  let pending: Utterance[] = [];
  let inflight: AbortController | null = null;
  let failures = 0;
  let generation = 0; // bumped by clear(), so a late answer from a stopped session is dropped

  function merge(a: Utterance, b: Utterance): Utterance {
    const pcm = joinPcm([a.pcm, b.pcm]);
    return { pcm, ms: Math.round((pcm.length / STT_RATE) * 1000) };
  }

  function push(u: Utterance) {
    pending.push(u);
    while (pending.length > maxPending) {
      const [a, b] = pending;
      if (a.ms + b.ms <= maxMergedMs) {
        pending.splice(0, 2, merge(a, b));
      } else {
        pending.shift();
        opts.onError(new Error(`Speech service is behind; skipped ${Math.round(a.ms / 1000)} s of audio.`), false);
      }
    }
    void pump();
  }

  async function pump() {
    if (inflight || !pending.length) return;
    const u = pending.shift()!;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(new Error("Speech service timed out.")), timeoutMs);
    const gen = generation;
    inflight = ctrl;
    try {
      const text = (await opts.transcribe(u, ctrl.signal)).trim();
      if (gen !== generation) return;
      failures = 0;
      if (text) opts.onText(text);
    } catch (e) {
      if (gen !== generation) return;
      failures++;
      const fatal = failures >= maxFailures;
      opts.onError(e, fatal);
      if (fatal) clear();
    } finally {
      clearTimeout(timer);
      if (inflight === ctrl) inflight = null;
      void pump();
    }
  }

  function clear() {
    generation++;
    pending = [];
    failures = 0;
    inflight?.abort(new Error("Stopped."));
    inflight = null;
  }

  return {
    push,
    clear,
    get pending() {
      return pending.length;
    },
    get busy() {
      return inflight !== null;
    },
  };
}

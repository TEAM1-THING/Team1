import { describe, expect, it, vi } from "vitest";
import { createSttQueue, type Utterance } from "../desktop/src/core/sttQueue";
import { downmix, joinPcm, Resampler, Segmenter, STT_RATE, toInt16, wav } from "../desktop/src/core/vad";

const tone = (ms: number, amp = 0.2, rate = STT_RATE) =>
  Float32Array.from({ length: Math.round((rate * ms) / 1000) }, (_, i) => amp * Math.sin((2 * Math.PI * 220 * i) / rate));
const silence = (ms: number, rate = STT_RATE) => new Float32Array(Math.round((rate * ms) / 1000));
const utt = (ms: number): Utterance => ({ pcm: new Int16Array((STT_RATE * ms) / 1000), ms });

describe("audio front end", () => {
  it("downmixes stereo by averaging", () => {
    expect([...downmix([Float32Array.of(1, 0), Float32Array.of(0, 1)])]).toEqual([0.5, 0.5]);
  });

  it("resamples 48 kHz to 16 kHz across 128-sample quanta without drift", () => {
    const r = new Resampler(48_000);
    let out = 0;
    for (let i = 0; i < 375; i++) out += r.push(new Float32Array(128)).length; // 1 s of audio
    expect(Math.abs(out - 16_000)).toBeLessThanOrEqual(1);
  });

  it("cuts one utterance per stretch of speech and drops a click", () => {
    const got: number[] = [];
    const seg = new Segmenter((_pcm, ms) => got.push(ms));
    seg.push(silence(500));
    seg.push(tone(40)); // a click: under minSpeechMs
    seg.push(silence(1000));
    seg.push(tone(1200));
    seg.push(silence(1000));
    seg.push(tone(800));
    seg.push(silence(1000));
    expect(got).toHaveLength(2);
    // Speech plus preroll and a short tail, without the full second of silence.
    expect(got[0]).toBeGreaterThan(1200);
    expect(got[0]).toBeLessThan(1800);
  });

  it("caps a monologue so latency stays bounded", () => {
    const got: number[] = [];
    const seg = new Segmenter((_pcm, ms) => got.push(ms), { maxUtteranceMs: 2000 });
    seg.push(tone(5000));
    seg.flush();
    expect(got.length).toBeGreaterThanOrEqual(2);
    expect(Math.max(...got)).toBeLessThanOrEqual(2000);
  });

  it("writes a valid 16 kHz mono WAV header", () => {
    const bytes = wav(toInt16(tone(100)));
    const v = new DataView(bytes.buffer);
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("RIFF");
    expect(String.fromCharCode(...bytes.slice(8, 12))).toBe("WAVE");
    expect(v.getUint16(22, true)).toBe(1);
    expect(v.getUint32(24, true)).toBe(16_000);
    expect(v.getUint32(40, true)).toBe(bytes.length - 44);
  });

  it("joins utterances with a silence gap", () => {
    expect(joinPcm([new Int16Array(10), new Int16Array(10)], 1).length).toBe(20 + 16);
  });
});

describe("speech-to-text queue", () => {
  it("keeps order with one request in flight", async () => {
    const texts: string[] = [];
    let n = 0;
    const q = createSttQueue({
      transcribe: async () => `t${++n}`,
      onText: (t) => texts.push(t),
      onError: () => {},
      maxPending: 5,
    });
    q.push(utt(500));
    q.push(utt(500));
    q.push(utt(500));
    await vi.waitFor(() => expect(texts).toEqual(["t1", "t2", "t3"]));
  });

  it("merges waiting utterances when the service falls behind, instead of queueing", async () => {
    const sizes: number[] = [];
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const q = createSttQueue({
      transcribe: async (u) => {
        sizes.push(u.ms);
        if (sizes.length === 1) await gate;
        return "x";
      },
      onText: () => {},
      onError: () => {},
      maxPending: 1,
    });
    q.push(utt(1000)); // in flight
    q.push(utt(1000));
    q.push(utt(1000)); // merged with the one before
    expect(q.pending).toBe(1);
    release();
    await vi.waitFor(() => expect(sizes).toHaveLength(2));
    expect(sizes[1]).toBe(2200); // two seconds of speech plus the 200 ms gap
  });

  it("stops after repeated failures and reports it as fatal", async () => {
    const errors: boolean[] = [];
    const q = createSttQueue({
      transcribe: async () => {
        throw new Error("503");
      },
      onText: () => {},
      onError: (_e, fatal) => errors.push(fatal),
      maxPending: 5,
      maxFailures: 2,
    });
    q.push(utt(300));
    q.push(utt(300));
    q.push(utt(300));
    await vi.waitFor(() => expect(errors).toEqual([false, true]));
    expect(q.pending).toBe(0);
  });

  it("drops a late answer after clear()", async () => {
    const texts: string[] = [];
    let release!: () => void;
    const q = createSttQueue({
      transcribe: () => new Promise<string>((r) => (release = () => r("late"))),
      onText: (t) => texts.push(t),
      onError: () => {},
    });
    q.push(utt(300));
    await vi.waitFor(() => expect(q.busy).toBe(true));
    q.clear();
    release();
    await new Promise((r) => setTimeout(r, 10));
    expect(texts).toEqual([]);
  });
});

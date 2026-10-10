// Audio front end for the system-audio pipeline. It runs inside an
// AudioWorklet, on the real-time audio thread, so it never touches the DOM and
// keeps per-quantum allocation small: the resampler reuses one buffer and the
// segmenter allocates once per 20 ms frame, not per 128-sample quantum.

export const STT_RATE = 16_000;

// Average all channels into one. Reuses `out` when it is long enough.
export function downmix(channels: Float32Array[], out?: Float32Array): Float32Array {
  const n = channels[0]?.length ?? 0;
  const o = out && out.length >= n ? out.subarray(0, n) : new Float32Array(n);
  if (channels.length === 1) {
    o.set(channels[0]);
    return o;
  }
  o.fill(0);
  for (const ch of channels) for (let i = 0; i < n; i++) o[i] += ch[i];
  for (let i = 0; i < n; i++) o[i] /= channels.length;
  return o;
}

// Streaming linear-interpolation resampler. The returned view is reused by the
// next push, so consume it before pushing again.
export class Resampler {
  private pos = 0; // read position in [last, ...input]
  private last = 0; // final sample of the previous block
  private buf = new Float32Array(0);
  private readonly step: number;

  constructor(inRate: number, outRate = STT_RATE) {
    this.step = inRate / outRate;
  }

  push(input: Float32Array): Float32Array {
    const max = Math.ceil((input.length + 1) / this.step) + 1;
    if (this.buf.length < max) this.buf = new Float32Array(max);
    let n = 0;
    while (this.pos < input.length) {
      const i = Math.floor(this.pos);
      const a = i === 0 ? this.last : input[i - 1];
      const b = input[i];
      this.buf[n++] = a + (b - a) * (this.pos - i);
      this.pos += this.step;
    }
    this.pos -= input.length;
    if (input.length) this.last = input[input.length - 1];
    return this.buf.subarray(0, n);
  }
}

export type VadOptions = {
  rate: number;
  frameMs: number;
  floor: number; // absolute RMS below which nothing counts as speech
  ratio: number; // speech must be this many times the tracked noise floor
  attackFrames: number; // voiced frames in a row before an utterance starts
  hangoverMs: number; // silence that ends an utterance
  tailMs: number; // silence kept after the last voiced frame
  prerollMs: number; // audio kept from before the start was detected
  minSpeechMs: number; // shorter bursts (clicks, a cough) are dropped
  maxUtteranceMs: number; // long monologues are cut so latency stays bounded
};

export const DEFAULT_VAD: VadOptions = {
  rate: STT_RATE,
  frameMs: 20,
  floor: 0.004,
  ratio: 3,
  attackFrames: 3,
  hangoverMs: 700,
  tailMs: 200,
  prerollMs: 240,
  minSpeechMs: 300,
  maxUtteranceMs: 15_000,
};

export type UtteranceSink = (pcm: Int16Array, ms: number) => void;

// Energy-based voice activity segmenter: 16 kHz mono floats in, one Int16
// utterance out per stretch of speech.
export class Segmenter {
  private readonly o: VadOptions;
  private readonly frame: Float32Array;
  private fill = 0;
  private noise: number;
  private speaking = false;
  private voicedRun = 0;
  private silentRun = 0;
  private voicedFrames = 0;
  private preroll: Float32Array[] = [];
  private chunks: Float32Array[] = [];

  constructor(
    private readonly sink: UtteranceSink,
    opts: Partial<VadOptions> = {},
  ) {
    this.o = { ...DEFAULT_VAD, ...opts };
    this.frame = new Float32Array(Math.round((this.o.rate * this.o.frameMs) / 1000));
    this.noise = this.o.floor;
  }

  private frames(ms: number) {
    return Math.max(1, Math.ceil(ms / this.o.frameMs));
  }

  push(samples: Float32Array): void {
    for (let i = 0; i < samples.length; i++) {
      this.frame[this.fill++] = samples[i];
      if (this.fill === this.frame.length) {
        this.fill = 0;
        this.onFrame(this.frame.slice());
      }
    }
  }

  // End any utterance in progress (the capture is stopping).
  flush(): void {
    if (this.speaking) this.end();
  }

  private onFrame(f: Float32Array) {
    let sum = 0;
    for (let i = 0; i < f.length; i++) sum += f[i] * f[i];
    const rms = Math.sqrt(sum / f.length);
    const voiced = rms > Math.max(this.o.floor, this.noise * this.o.ratio);

    if (!this.speaking) {
      this.preroll.push(f);
      if (this.preroll.length > this.frames(this.o.prerollMs)) this.preroll.shift();
      if (!voiced) {
        this.voicedRun = 0;
        this.noise = this.noise * 0.95 + rms * 0.05;
      } else if (++this.voicedRun >= this.o.attackFrames) {
        this.speaking = true;
        this.chunks = this.preroll;
        this.preroll = [];
        this.voicedFrames = this.voicedRun;
        this.silentRun = 0;
      }
      return;
    }

    this.chunks.push(f);
    if (voiced) {
      this.voicedFrames++;
      this.silentRun = 0;
    } else {
      this.silentRun++;
    }
    if (this.silentRun >= this.frames(this.o.hangoverMs) || this.chunks.length >= this.frames(this.o.maxUtteranceMs)) {
      this.end();
    }
  }

  private end() {
    const drop = Math.max(0, this.silentRun - this.frames(this.o.tailMs));
    const kept = this.chunks.slice(0, this.chunks.length - drop);
    if (this.voicedFrames * this.o.frameMs >= this.o.minSpeechMs) {
      const pcm = toInt16(concatFloat(kept));
      this.sink(pcm, Math.round((pcm.length / this.o.rate) * 1000));
    }
    this.speaking = false;
    this.chunks = [];
    this.voicedRun = 0;
    this.silentRun = 0;
    this.voicedFrames = 0;
  }
}

function concatFloat(parts: Float32Array[]): Float32Array {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

export function toInt16(f: Float32Array): Int16Array {
  const out = new Int16Array(f.length);
  for (let i = 0; i < f.length; i++) {
    const s = Math.max(-1, Math.min(1, f[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

// Join utterances with a short silence between them, so a merged request still
// reads as separate sentences to the speech model.
export function joinPcm(parts: Int16Array[], gapMs = 200, rate = STT_RATE): Int16Array {
  const gap = Math.round((gapMs / 1000) * rate);
  const out = new Int16Array(parts.reduce((n, p) => n + p.length, 0) + gap * Math.max(0, parts.length - 1));
  let at = 0;
  parts.forEach((p, i) => {
    out.set(p, at);
    at += p.length + (i < parts.length - 1 ? gap : 0);
  });
  return out;
}

// 16-bit mono PCM WAV, the format every speech-to-text endpoint accepts.
export function wav(pcm: Int16Array, rate = STT_RATE): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(44 + pcm.length * 2));
  const v = new DataView(bytes.buffer);
  const str = (at: number, s: string) => [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + pcm.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) v.setInt16(44 + i * 2, pcm[i], true);
  return bytes;
}

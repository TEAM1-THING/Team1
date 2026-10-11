// Runs on the real-time audio thread. Every 128-sample quantum is downmixed,
// resampled to 16 kHz and fed to the voice segmenter; only finished
// utterances leave the thread, as transferred buffers (no copy).
import { downmix, Resampler, Segmenter } from "../core/vad";

// AudioWorkletGlobalScope globals, which TypeScript's DOM lib does not declare.
declare const sampleRate: number;
declare function registerProcessor(name: string, ctor: unknown): void;
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
}

class VadProcessor extends AudioWorkletProcessor {
  private readonly mono = new Float32Array(128);
  private readonly resampler = new Resampler(sampleRate);
  private readonly segmenter = new Segmenter((pcm, ms) => {
    const buf = pcm.buffer as ArrayBuffer;
    this.port.postMessage({ pcm: buf, ms }, [buf]);
  });

  process(inputs: Float32Array[][]): boolean {
    const channels = inputs[0];
    if (channels?.length) this.segmenter.push(this.resampler.push(downmix(channels, this.mono)));
    return true;
  }
}

registerProcessor("sc-vad", VadProcessor);

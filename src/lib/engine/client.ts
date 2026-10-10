// Shared Claude client for every engine route. Server-side only: the key is
// read from the environment and never reaches the browser.
import Anthropic from "@anthropic-ai/sdk";

// Prep-time calls (Mandate draft, pre-flight): quality over speed.
export const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

// Live cards: the team's budget is 5 s. Benchmark (6 scenes x 2 runs, 18
// blind judgements per model): Sonnet 5.5 scored highest (4.39/5 vs Opus 4.19,
// Haiku 3.80) at median 3.96 s, max 4.59 s. Override per deployment.
export const LIVE_MODEL = process.env.LIVE_MODEL || "claude-sonnet-5-5";

// A live card that arrives late is useless; past this the route falls back.
export const LIVE_TIMEOUT_MS = 5_000;

// Server-side refusal fallback: a declined request is re-run on Anthropic's
// recommended model inside the same call.
export const FALLBACK_BETA = "server-side-fallback-2026-07-01";

// Haiku 5.5 has no server-side fallback; sending the parameter would 400.
export function supportsFallback(model: string): boolean {
  return /^claude-(opus|sonnet|fable)-/.test(model);
}

let client: Anthropic | null = null;
let injected: Anthropic | null | undefined; // undefined = no test override

// null when no credentials are configured, so callers use their canned fallback.
export function getClient(): Anthropic | null {
  if (injected !== undefined) return injected;
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) return null;
  client ??= new Anthropic({ maxRetries: 0, timeout: LIVE_TIMEOUT_MS });
  return client;
}

// Test seam: inject a fake client (or null); pass undefined to clear.
export function setClientForTests(fake: Anthropic | null | undefined): void {
  injected = fake;
}

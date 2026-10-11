// Shared Claude client for every engine route. Server-side only: the key is
// read from the environment and never reaches the browser.
import Anthropic from "@anthropic-ai/sdk";
import https from "node:https";

// Prep-time calls (Mandate draft, pre-flight): quality over speed.
export const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

// Live cards: the target is about 4 s; the hard cutoff is LIVE_TIMEOUT_MS. Benchmark (6 scenes x 2 runs, 18
// blind judgements per model): Sonnet 5.5 scored highest (4.39/5 vs Opus 4.19,
// Haiku 3.80) at median 3.96 s, max 4.59 s. Override per deployment.
export const LIVE_MODEL = process.env.LIVE_MODEL || "claude-sonnet-5-5";

// Past this the route falls back: the canned card for the demo script, no
// card otherwise. Live replies take about 2.5 to 4.7 s with the odd one past
// 5 s; a card at 6 s beats no card, so the cutoff sits well above them.
export const LIVE_TIMEOUT_MS = 8_000;

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

// A second client for work that runs beside the live card (the premise check),
// on its own connections. Measured: through the process's shared fetch, its
// calls queued behind the card's on the same connection and pushed the card
// past its 5 s budget; a separate client object was not enough, a separate
// connection per call is. Costs one TLS handshake per call.
function isolatedFetch(url: string | URL | Request, init: RequestInit = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    const signal = init.signal ?? undefined;
    if (signal?.aborted) return reject(signal.reason ?? new DOMException("aborted", "AbortError"));
    // The SDK sends JSON as a string; anything else would be dropped, so refuse it.
    if (init.body != null && typeof init.body !== "string") return reject(new TypeError("isolatedFetch sends string bodies only"));
    const headers = Object.fromEntries(new Headers(init.headers).entries());
    const req = https.request(String(url instanceof Request ? url.url : url), { method: init.method ?? "GET", headers, agent: false, signal }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("error", reject);
      res.on("end", () => {
        const out = new Headers();
        for (const [k, v] of Object.entries(res.headers)) if (v !== undefined) out.set(k, Array.isArray(v) ? v.join(", ") : v);
        resolve(new Response(Buffer.concat(chunks), { status: res.statusCode ?? 502, headers: out }));
      });
    });
    req.on("error", reject);
    if (typeof init.body === "string") req.write(init.body);
    req.end();
  });
}

let side: Anthropic | null = null;
export function getSideClient(): Anthropic | null {
  if (injected !== undefined) return injected;
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) return null;
  side ??= new Anthropic({ maxRetries: 0, timeout: LIVE_TIMEOUT_MS, fetch: isolatedFetch });
  return side;
}

// Test seam: inject a fake client (or null); pass undefined to clear.
export function setClientForTests(fake: Anthropic | null | undefined): void {
  injected = fake;
}

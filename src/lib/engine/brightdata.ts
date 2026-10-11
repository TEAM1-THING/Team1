// Bright Data SERP API client for the pre-meeting check. Server-side only.
//
// Request shape (docs.brightdata.com, SERP API "send your first request" and
// "Google Search parsed JSON"): POST https://api.brightdata.com/request with
// `Authorization: Bearer <BRIGHTDATA_API_KEY>` and a JSON body
// `{ zone, url: "https://www.google.com/search?q=...&brd_json=1", format: "raw" }`.
// With format "raw" and brd_json set, the response body is the parsed Google
// results JSON, whose `organic` array holds `{ link, title, description }`.
//
// Env: BRIGHTDATA_API_KEY (required; without it every call returns null) and
// BRIGHTDATA_ZONE (the SERP API zone name; defaults to "serp_api1", the name
// Bright Data gives the first SERP zone and uses in its examples).
//
// Safety: the only host ever fetched is api.brightdata.com. The search query
// is URL-encoded into a fixed Google search URL; no caller-supplied URL is
// ever fetched. The key is never logged or returned.

const ENDPOINT = "https://api.brightdata.com/request";
const SEARCH_BASE = "https://www.google.com/search";
export const DEFAULT_ZONE = "serp_api1";

const MAX_QUERY = 200;
const MAX_RESULTS = 5;
const MAX_TITLE = 200;
const MAX_SNIPPET = 400;
const ZONE_NAME = /^[A-Za-z0-9_-]{1,64}$/;

// date: the publish date Google shows for the result, when it shows one.
export type SerpResult = { title: string; url: string; snippet: string; date?: string };

// A key pasted into a dashboard can keep its spaces or quotes; Bright Data
// would then answer 401 and the pre-flight would fall back.
const apiKey = () => (process.env.BRIGHTDATA_API_KEY ?? "").trim().replace(/^(["'])(.*)\1$/, "$2").trim();

export function brightDataConfigured(): boolean {
  return Boolean(apiKey());
}

function zoneName(): string | null {
  const zone = process.env.BRIGHTDATA_ZONE?.trim() || DEFAULT_ZONE;
  return ZONE_NAME.test(zone) ? zone : null;
}

// Only http(s) links survive; anything else (javascript:, data:, junk) is dropped.
function safeLink(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function text(raw: unknown, max: number): string {
  return typeof raw === "string" ? raw.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

// format "raw" returns the SERP JSON itself; tolerate the {"body": "<json>"}
// envelope too, in case a zone is configured for wrapped output.
function organicOf(payload: unknown): unknown[] | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj.organic)) return obj.organic;
  if (typeof obj.body === "string") {
    try {
      return organicOf(JSON.parse(obj.body));
    } catch {
      return null;
    }
  }
  // format "json" (the dashboard's sample) wraps an already-parsed body.
  if (obj.body && typeof obj.body === "object") return organicOf(obj.body);
  return null;
}

export function normalizeOrganic(organic: unknown[]): SerpResult[] {
  const out: SerpResult[] = [];
  const seen = new Set<string>();
  for (const item of organic) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const url = safeLink(r.link);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const date = text(r.date ?? r.display_date, 40);
    out.push({ url, title: text(r.title, MAX_TITLE), snippet: text(r.description, MAX_SNIPPET), ...(date ? { date } : {}) });
    if (out.length >= MAX_RESULTS) break;
  }
  return out;
}

type Attempt = { results: SerpResult[] | null; retry: boolean };

// One request. `retry` says whether another request could do better: yes
// after a timeout, a network error, a 5xx or an empty reply; no after a 4xx (a
// bad key, a bad zone, rate limited), where more requests only add load.
async function searchOnce(query: string, signal?: AbortSignal): Promise<Attempt> {
  const key = apiKey();
  const zone = zoneName();
  const q = query.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY);
  if (!key || !zone || !q) return { results: null, retry: false };

  const target = `${SEARCH_BASE}?q=${encodeURIComponent(q)}&hl=en&gl=us&brd_json=1`;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ zone, url: target, format: "raw" }),
      signal,
    });
    // Status and error names only: never the key or a response body.
    if (!res.ok) {
      console.warn(`[brightdata] search failed (HTTP ${res.status})`);
      return { results: null, retry: res.status >= 500 || res.status === 408 };
    }
    const body = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      // Seen live: a 200 with an empty body. Bright Data's own error header
      // names the cause; it carries no key or client data.
      const why = res.headers.get("x-brd-error")?.slice(0, 120) ?? "no x-brd-error";
      console.warn(`[brightdata] reply was not JSON (${body.length} chars, ${why})`);
      return { results: null, retry: true };
    }
    const organic = organicOf(parsed);
    if (!organic) console.warn("[brightdata] search answered without results");
    return { results: organic ? normalizeOrganic(organic) : null, retry: true };
  } catch (err) {
    if (!signal?.aborted) console.warn(`[brightdata] search failed (${err instanceof Error ? err.name : "unknown"})`);
    return { results: null, retry: true };
  }
}

// Google results for `query`, or null when Bright Data is not configured or
// the call fails for any reason. An empty array means the search ran and
// found nothing.
export async function serpSearch(query: string, signal?: AbortSignal): Promise<SerpResult[] | null> {
  return (await searchOnce(query, signal)).results;
}

// Bright Data's SERP answers in 3 s to over 30 s and now and then sends back
// an empty body, so one slow or failed request used to leave a check
// unverified. Another request starts as soon as one fails in a way another
// could fix, or every `hedgeMs` while none has answered; the first usable
// answer wins and the rest are cancelled. A 4xx stops the hedging. Never more
// than `maxAttempts` requests per query.
export const HEDGE_MS = 4_000;
export const MAX_ATTEMPTS = 3;

export function hedgedSearch(
  query: string,
  signal: AbortSignal,
  hedgeMs = HEDGE_MS,
  maxAttempts = MAX_ATTEMPTS,
): Promise<SerpResult[] | null> {
  if (signal.aborted) return Promise.resolve(null);
  return new Promise((resolve) => {
    const attempts: AbortController[] = [];
    let running = 0;
    let last: SerpResult[] | null = null;
    let settled = false;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = (results: SerpResult[] | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      for (const a of attempts) a.abort();
      resolve(results);
    };
    const onAbort = () => finish(null);
    const launch = () => {
      clearTimeout(timer);
      if (settled || stopped || attempts.length >= maxAttempts) return;
      const attempt = new AbortController();
      attempts.push(attempt);
      running++;
      if (attempts.length < maxAttempts) timer = setTimeout(launch, hedgeMs);
      void searchOnce(query, AbortSignal.any([signal, attempt.signal])).then(({ results, retry }) => {
        running--;
        if (results && results.length > 0) return finish(results);
        last = results ?? last;
        if (!retry) {
          stopped = true;
          clearTimeout(timer);
        }
        if (!stopped && attempts.length < maxAttempts) launch();
        else if (running === 0) finish(last);
      });
    };
    signal.addEventListener("abort", onAbort, { once: true });
    launch();
  });
}

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

export type SerpResult = { title: string; url: string; snippet: string };

export function brightDataConfigured(): boolean {
  return Boolean(process.env.BRIGHTDATA_API_KEY);
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
    out.push({ url, title: text(r.title, MAX_TITLE), snippet: text(r.description, MAX_SNIPPET) });
    if (out.length >= MAX_RESULTS) break;
  }
  return out;
}

// Google results for `query`, or null when Bright Data is not configured or
// the call fails for any reason. An empty array means the search ran and
// found nothing.
export async function serpSearch(query: string, signal?: AbortSignal): Promise<SerpResult[] | null> {
  const key = process.env.BRIGHTDATA_API_KEY;
  const zone = zoneName();
  const q = query.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY);
  if (!key || !zone || !q) return null;

  const target = `${SEARCH_BASE}?q=${encodeURIComponent(q)}&hl=en&gl=us&brd_json=1`;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ zone, url: target, format: "raw" }),
      signal,
    });
    if (!res.ok) return null;
    const organic = organicOf(JSON.parse(await res.text()));
    return organic ? normalizeOrganic(organic) : null;
  } catch {
    return null;
  }
}

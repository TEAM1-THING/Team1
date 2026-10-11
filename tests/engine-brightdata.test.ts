// The hedged Bright Data search: another request covers a slow or empty
// reply, the first usable answer wins, and never more than the cap go out.
import { getEventListeners } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hedgedSearch } from "@/lib/engine/brightdata";

const CPI_URL = "https://www.bls.gov/cpi/";
const ok = () =>
  new Response(JSON.stringify({ organic: [{ link: CPI_URL, title: "CPI", description: "CPI rose 2.9 percent." }] }), { status: 200 });
// Seen live: a 200 with an empty body.
const empty = () => new Response("", { status: 200, headers: { "x-brd-error": "timeout" } });

const okAt = (url: string) => new Response(JSON.stringify({ organic: [{ link: url, title: "t", description: "d" }] }), { status: 200 });
const none = () => new Response(JSON.stringify({ organic: [] }), { status: 200 });

// "hang" answers only by failing on abort; "late" answers after 30 ms even if
// cancelled, like a reply already on the wire.
type Reply = Response | "hang" | { late: Response };

// Each request takes the next reply, and its start time is kept.
function scripted(...replies: Reply[]) {
  const signals: AbortSignal[] = [];
  const starts: number[] = [];
  const spy = vi.fn((_url: string | URL | Request, init?: RequestInit) => {
    const signal = init!.signal!;
    signals.push(signal);
    starts.push(performance.now());
    const next = replies.shift() ?? "hang";
    return new Promise<Response>((resolve, reject) => {
      if (typeof next === "object" && "late" in next) return void setTimeout(() => resolve(next.late), 30);
      signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      if (next !== "hang") resolve(next);
    });
  });
  vi.stubGlobal("fetch", spy);
  return { spy, signals, starts };
}

const tick = (ms: number) => new Promise((r) => setTimeout(r, ms));
const never = () => new AbortController().signal;

beforeEach(() => {
  vi.stubEnv("BRIGHTDATA_API_KEY", "test-key");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("hedgedSearch", () => {
  it("sends one request when the first answers", async () => {
    const { spy } = scripted(ok());
    expect(await hedgedSearch("cpi", never(), 50)).toHaveLength(1);
    await tick(80);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("retries at once when the first reply is an empty body, and logs why", async () => {
    const { spy } = scripted(empty(), ok());
    const results = await hedgedSearch("cpi", never(), 10_000);
    expect(results?.[0].url).toBe(CPI_URL);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenCalledWith("[brightdata] reply was not JSON (0 chars, timeout)");
  });

  it("starts a second request when the first is slow, and cancels the slow one", async () => {
    const { spy, signals } = scripted("hang", ok());
    expect(await hedgedSearch("cpi", never(), 20)).toHaveLength(1);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(signals[0].aborted).toBe(true);
  });

  it("gives up after its last failed request, sending no more", async () => {
    const { spy } = scripted(empty(), new Response("bad gateway", { status: 502 }), empty());
    expect(await hedgedSearch("cpi", never(), 10)).toBeNull();
    await tick(40);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it("keeps hedging while none answers, up to the cap", async () => {
    const { spy } = scripted("hang", "hang", ok());
    expect(await hedgedSearch("cpi", never(), 10)).toHaveLength(1);
    expect(spy).toHaveBeenCalledTimes(3);
    const two = scripted("hang", "hang", ok());
    const pending = hedgedSearch("cpi", AbortSignal.timeout(60), 10, 2);
    expect(await pending).toBeNull();
    expect(two.spy).toHaveBeenCalledTimes(2);
  });

  it("stops every request when the caller gives up", async () => {
    const { signals } = scripted("hang", "hang", "hang");
    const caller = new AbortController();
    const pending = hedgedSearch("cpi", caller.signal, 5);
    await tick(30);
    caller.abort();
    expect(await pending).toBeNull();
    expect(signals).toHaveLength(3);
    expect(signals.every((s) => s.aborted)).toBe(true);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("starts the next request at once when one fails after the timer fired", async () => {
    const { spy, starts } = scripted("hang", empty(), ok());
    expect(await hedgedSearch("cpi", never(), 60)).toHaveLength(1);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(50);
    expect(starts[2] - starts[1]).toBeLessThan(30);
  });

  it("ignores a reply that arrives after another one won", async () => {
    scripted({ late: okAt("https://late.example/") }, okAt("https://first.example/"));
    const results = await hedgedSearch("cpi", never(), 5);
    expect(results?.[0].url).toBe("https://first.example/");
    await tick(50);
  });

  it("returns the empty result when every search ran and found nothing", async () => {
    const { spy } = scripted(none(), none(), none());
    expect(await hedgedSearch("cpi", never(), 10)).toEqual([]);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it("stops hedging after a refusal, since more requests cannot help", async () => {
    for (const status of [401, 400, 429]) {
      const { spy } = scripted(new Response("no", { status }));
      expect(await hedgedSearch("cpi", never(), 5)).toBeNull();
      await tick(20);
      expect(spy).toHaveBeenCalledTimes(1);
    }
  });

  it("waits for a request still running after another is refused", async () => {
    const { spy } = scripted("hang", new Response("no", { status: 429 }));
    const caller = new AbortController();
    const pending = hedgedSearch("cpi", caller.signal, 5);
    await tick(30);
    expect(spy).toHaveBeenCalledTimes(2);
    caller.abort();
    expect(await pending).toBeNull();
  });

  it("leaves no listener on the caller's signal", async () => {
    const caller = new AbortController();
    scripted(ok());
    await hedgedSearch("cpi", caller.signal, 5);
    scripted(empty(), empty(), empty());
    await hedgedSearch("cpi", caller.signal, 5);
    expect(getEventListeners(caller.signal, "abort")).toHaveLength(0);
  });

  it("returns null at once for a caller that already gave up", async () => {
    const { spy } = scripted(ok());
    const caller = new AbortController();
    caller.abort();
    expect(await hedgedSearch("cpi", caller.signal, 5)).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});

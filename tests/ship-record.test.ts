import { afterEach, describe, expect, it } from "vitest";
import { FATAL_ERRORS, finalTexts, getRecognitionCtor } from "@/components/speech/MicInput";
import { demoPrep } from "@/data/demo";
import { mockMoment } from "@/lib/mock";
import { base44Url, buildRecord, createHandoff, handoffLink, recordFileName, recordLink, supabaseConfig } from "@/lib/record";
import { emptyState } from "@/lib/types";

describe("record hand-off by id (#45)", () => {
  const config = { url: "https://example.supabase.co", key: "sb_publishable_test" };
  const id = "fe3f39af-0301-495c-92bc-36ecfacf04fa";
  const record = { client: "Zoë Ångström — 李", endedAt: "2026-10-10T20:00:00.000Z", concerns: [], cards: [] };
  const reply = (status: number, body: unknown) =>
    (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

  it("posts the whole record to create_handoff and returns the id", async () => {
    let sent: { url: string; init?: RequestInit } | null = null;
    const fake = (async (url: string, init?: RequestInit) => {
      sent = { url, init };
      return new Response(JSON.stringify(id), { status: 200 });
    }) as unknown as typeof fetch;
    expect(await createHandoff(record, config, fake)).toBe(id);
    expect(sent!.url).toBe("https://example.supabase.co/rest/v1/rpc/create_handoff");
    expect((sent!.init?.headers as Record<string, string>).apikey).toBe("sb_publishable_test");
    expect(JSON.parse(String(sent!.init?.body))).toEqual({ record });
  });

  it("returns null on an error status, a non-id answer or a network failure", async () => {
    expect(await createHandoff(record, config, reply(401, { message: "no" }))).toBeNull();
    expect(await createHandoff(record, config, reply(200, "not-an-id"))).toBeNull();
    const down = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    expect(await createHandoff(record, config, down)).toBeNull();
  });

  it("puts only the id in the link, never client details", () => {
    const link = handoffLink("https://example.base44.app/#old", id);
    expect(link).toBe(`https://example.base44.app/#handoff=${id}`);
    expect(link).not.toContain("Zo");
    // The old helper no longer puts the record in a link either.
    expect(recordLink("https://example.base44.app/#x", record)).toBe("https://example.base44.app/");
  });
});

describe("supabaseConfig", () => {
  const saved = { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
  afterEach(() => {
    for (const [name, value] of [
      ["NEXT_PUBLIC_SUPABASE_URL", saved.url],
      ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", saved.key],
    ] as const) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  it("needs an https URL and a key", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(supabaseConfig()).toBeNull();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co/";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = " sb_publishable_test ";
    expect(supabaseConfig()).toEqual({ url: "https://example.supabase.co", key: "sb_publishable_test" });
  });
});

describe("buildRecord", () => {
  it("carries the client, concerns and every card", () => {
    const { state } = mockMoment("t2", emptyState());
    const record = buildRecord(demoPrep, state);
    expect(record.client).toBe(demoPrep.clientFile.name);
    expect(record.cards).toEqual(state.cards);
    expect(record.concerns).toEqual(state.concerns);
    expect(Number.isNaN(Date.parse(record.endedAt))).toBe(false);
  });

  it("names the file after the client and date", () => {
    const record = { client: "Maria Lopez", endedAt: "2026-10-10T20:00:00.000Z", concerns: [], cards: [] };
    expect(recordFileName(record)).toBe("second-chair-record-maria-lopez-2026-10-10.json");
    expect(recordFileName({ ...record, client: "!!" })).toBe("second-chair-record-client-2026-10-10.json");
  });
});

describe("base44Url", () => {
  const original = process.env.NEXT_PUBLIC_BASE44_URL;
  afterEach(() => {
    // Assigning undefined to process.env stores the string "undefined".
    if (original === undefined) delete process.env.NEXT_PUBLIC_BASE44_URL;
    else process.env.NEXT_PUBLIC_BASE44_URL = original;
  });

  it("returns null when unset or not http(s)", () => {
    delete process.env.NEXT_PUBLIC_BASE44_URL;
    expect(base44Url()).toBeNull();
    process.env.NEXT_PUBLIC_BASE44_URL = "javascript:alert(1)";
    expect(base44Url()).toBeNull();
  });

  it("returns a configured https URL", () => {
    process.env.NEXT_PUBLIC_BASE44_URL = " https://example.base44.app ";
    expect(base44Url()).toBe("https://example.base44.app");
  });
});

describe("MicInput helpers", () => {
  it("finds the recognition constructor, or null", () => {
    class Fake {}
    expect(getRecognitionCtor({ webkitSpeechRecognition: Fake })).toBe(Fake);
    expect(getRecognitionCtor({})).toBeNull();
    expect(getRecognitionCtor(undefined)).toBeNull();
  });

  it("emits only final, non-empty results from resultIndex on", () => {
    const results = [
      { isFinal: true, 0: { transcript: "already sent" } },
      { isFinal: true, 0: { transcript: "  I want to wait six months. " } },
      { isFinal: true, 0: { transcript: "   " } },
      { isFinal: false, 0: { transcript: "my son is" } },
    ];
    expect(finalTexts({ resultIndex: 1, results })).toEqual(["I want to wait six months."]);
  });

  it("stops on errors a restart cannot fix, restarts on silence", () => {
    expect(FATAL_ERRORS["not-allowed"]).toBeTruthy();
    expect(FATAL_ERRORS.network).toBeTruthy();
    expect(FATAL_ERRORS["no-speech"]).toBeUndefined();
    expect(FATAL_ERRORS.aborted).toBeUndefined();
  });
});

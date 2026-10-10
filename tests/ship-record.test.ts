import { afterEach, describe, expect, it } from "vitest";
import { FATAL_ERRORS, finalTexts, getRecognitionCtor } from "@/components/speech/MicInput";
import { demoPrep } from "@/data/demo";
import { mockMoment } from "@/lib/mock";
import { base44Url, buildRecord, recordFileName, recordLink } from "@/lib/record";
import { emptyState } from "@/lib/types";

// Mirrors how the records app reads the fragment in the browser.
function readFragment(link: string): unknown {
  const b64 = link.split("#record=")[1].replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

describe("recordLink", () => {
  const base = "https://example.base44.app";

  it("carries the whole record in a URL-safe fragment", () => {
    let state = emptyState();
    for (const t of ["t2", "t4", "t6"]) state = mockMoment(t, state).state;
    const record = buildRecord(demoPrep, state);
    const link = recordLink(base, record);
    expect(link.startsWith(`${base}#record=`)).toBe(true);
    expect(link.split("#record=")[1]).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(readFragment(link)).toEqual(record);
  });

  it("keeps non-ASCII text intact and replaces an existing fragment", () => {
    const record = { client: "Zoë Ångström — 李", endedAt: "2026-10-10T20:00:00.000Z", concerns: [], cards: [] };
    const link = recordLink(`${base}/#old`, record);
    expect(link.startsWith(`${base}/#record=`)).toBe(true);
    expect(readFragment(link)).toEqual(record);
  });

  it("falls back to the plain link when the record is too big for a URL", () => {
    const record = { client: "x".repeat(800_000), endedAt: "2026-10-10T20:00:00.000Z", concerns: [], cards: [] };
    expect(recordLink(base, record)).toBe(base);
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

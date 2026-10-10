import { afterEach, describe, expect, it } from "vitest";
import { FATAL_ERRORS, finalTexts, getRecognitionCtor } from "@/components/speech/MicInput";
import { demoPrep } from "@/data/demo";
import { mockMoment } from "@/lib/mock";
import { base44Url, buildRecord, recordFileName } from "@/lib/record";
import { emptyState } from "@/lib/types";

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

// #40: the data note must describe the app as built. If the record starts
// carrying the transcript or audio, this fails: change DataNote.tsx with it.
import { describe, expect, it } from "vitest";
import { DATA_DETAILS, DATA_SUMMARY } from "@/components/prep/DataNote";
import { demoPrep, demoTranscript } from "@/data/demo";
import { buildRecord, RECORDS_APP_ON } from "@/lib/record";
import { mockMoment } from "@/lib/mock";
import { emptyState } from "@/lib/types";

describe("data note", () => {
  it("answers both questions in one sentence", () => {
    expect(DATA_SUMMARY).toMatch(/train AI/);
    expect(DATA_SUMMARY).toMatch(
      RECORDS_APP_ON ? /saves it to your records only when you sign in and save/ : /saves the record only to your computer/,
    );
  });

  it("matches the record: client, cards and concerns, no transcript or audio", () => {
    const state = mockMoment("t2", emptyState()).state;
    const record = buildRecord(demoPrep, state) as Record<string, unknown>;
    const keys = Object.keys(record);
    expect(keys).not.toContain("transcript");
    expect(keys).not.toContain("turns");
    expect(keys).not.toContain("audio");
    // No transcript line leaks in through another field either.
    const json = JSON.stringify(record);
    for (const t of demoTranscript.filter((t) => t.speaker === "advisor")) expect(json).not.toContain(t.text);
    expect(DATA_DETAILS.join(" ")).toMatch(/no transcript or audio/);
  });

  it("names every place meeting data goes", () => {
    const all = DATA_DETAILS.join(" ");
    const records = RECORDS_APP_ON ? ["records database", "compliance"] : ["not sent to any records database"];
    for (const where of ["Anthropic's API", "speech service", "downloads to your computer", ...records]) {
      expect(all).toContain(where);
    }
    // MVP: no line may promise a sign-in that does not exist.
    if (!RECORDS_APP_ON) expect(`${DATA_SUMMARY} ${all}`).not.toMatch(/sign in/i);
  });
});

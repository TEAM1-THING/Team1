import { describe, expect, it } from "vitest";
import {
  addSource,
  confirmPrep,
  fromLines,
  preflightBody,
  readMandate,
  removeSource,
  sourcesBody,
  toLines,
  toNumber,
  updateSource,
} from "@/components/prep/prepModel";
import { demoPrep } from "@/data/demo";
import { Prep } from "@/lib/types";

const draft = (): Prep => ({ ...demoPrep, confirmed: false });

describe("confirmPrep", () => {
  it("carries an edited cash on hand through to a valid, confirmed Prep", () => {
    const p = draft();
    const edited = { ...p, clientFile: { ...p.clientFile, cashOnHand: toNumber("250000") } };
    const out = confirmPrep(edited);
    expect(out.confirmed).toBe(true);
    expect(out.clientFile.cashOnHand).toBe(250000);
    expect(Prep.parse(JSON.parse(JSON.stringify(out)))).toEqual(out);
  });

  it("drops blank lines and empty sources", () => {
    const p = draft();
    const out = confirmPrep({
      ...p,
      clientFile: { ...p.clientFile, statedGoals: fromLines("Retire at 70\n\n  \nCollege ") },
      sources: addSource(p.sources),
      mandate: { ...p.mandate, outOfScope: ["Crypto", ""] },
    });
    expect(out.clientFile.statedGoals).toEqual(["Retire at 70", "College"]);
    expect(out.sources).toHaveLength(p.sources.length);
    expect(out.mandate.outOfScope).toEqual(["Crypto"]);
  });

  it("does not mutate the draft", () => {
    const p = draft();
    confirmPrep(p);
    expect(p.confirmed).toBe(false);
  });
});

describe("sources", () => {
  it("adds a source with a fresh id, then edits and removes it", () => {
    const added = addSource(demoPrep.sources);
    const fresh = added[added.length - 1];
    expect(new Set(added.map((s) => s.id)).size).toBe(added.length);
    const edited = updateSource(added, fresh.id, { text: "Note" });
    expect(edited.find((s) => s.id === fresh.id)?.text).toBe("Note");
    expect(removeSource(edited, fresh.id)).toEqual(demoPrep.sources);
  });

  it("sends pre-flight a Prep the route accepts, with the edited Mandate", () => {
    const p = { ...draft(), mandate: { ...demoPrep.mandate, assumptions: ["7% return", ""] } };
    const body = preflightBody(p);
    expect(Prep.safeParse(body.prep).success).toBe(true);
    expect(body.prep.mandate.assumptions).toEqual(["7% return"]);
  });

  it("sends only non-empty source text to the API", () => {
    expect(sourcesBody(addSource(demoPrep.sources)).sources).toHaveLength(demoPrep.sources.length);
  });
});

describe("field helpers", () => {
  it("round-trips lines, keeping blanks while typing", () => {
    expect(fromLines(toLines(["a", "b"]))).toEqual(["a", "b"]);
    expect(fromLines("a\n")).toEqual(["a", ""]);
  });

  it("treats a cleared number input as 0", () => {
    expect(toNumber("")).toBe(0);
    expect(toNumber("abc")).toBe(0);
    expect(toNumber("58")).toBe(58);
  });

  it("reads a valid Mandate response and rejects a bad one", () => {
    expect(readMandate({ mandate: demoPrep.mandate })).toEqual(demoPrep.mandate);
    expect(readMandate({ mandate: { thesis: 1 } })).toBeNull();
    expect(readMandate(null)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  addSource,
  checkedOn,
  clearDraft,
  confirmPrep,
  DRAFT_KEY,
  emptyPrep,
  fromLines,
  loadDraft,
  preflightBody,
  readMandate,
  removeSource,
  saveDraft,
  sourcesBody,
  toLines,
  toNumber,
  updateSource,
  whyNotReady,
} from "@/components/prep/prepModel";
import { demoPrep } from "@/data/demo";
import { DEFAULT_OUT_OF_SCOPE, NEUTRAL_RISK_STANCE, STANDARD_DISCLAIMERS } from "@/lib/engine/mandate";
import { outOfScopeHit } from "@/lib/engine/scope";
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

describe("enter by hand", () => {
  it("starts with no client and no sources, not the demo client", () => {
    const p = emptyPrep();
    expect(Prep.safeParse(p).success).toBe(true);
    expect(p.clientFile.name).toBe("");
    expect(p.sources).toEqual([]);
    expect(p.anticipated).toEqual([]);
    expect(JSON.stringify(p)).not.toContain(demoPrep.clientFile.name);
  });

  it("blocks Confirm until the client file has a name, then confirms", () => {
    const p = emptyPrep();
    expect(whyNotReady(p)).toMatch(/name/);
    expect(whyNotReady({ ...p, clientFile: { ...p.clientFile, name: "   " } })).toMatch(/name/);
    const named = { ...p, clientFile: { ...p.clientFile, name: " Sam Lee " } };
    expect(whyNotReady(named)).toBeNull();
    expect(confirmPrep(named).clientFile.name).toBe("Sam Lee");
  });

  it("starts from the engine's neutral Mandate, not an empty one", () => {
    expect(emptyPrep().mandate).toEqual({
      thesis: "",
      assumptions: [],
      riskStance: NEUTRAL_RISK_STANCE,
      disclaimers: STANDARD_DISCLAIMERS,
      outOfScope: DEFAULT_OUT_OF_SCOPE,
    });
    // Fresh lists each time, so an edit to one prep never leaks into the next.
    expect(emptyPrep().mandate.outOfScope).not.toBe(emptyPrep().mandate.outOfScope);
  });

  it("hands the meeting an out-of-scope list the forced defer keys on", () => {
    const p = emptyPrep();
    const out = confirmPrep({ ...p, clientFile: { ...p.clientFile, name: "Sam Lee" } });
    expect(outOfScopeHit("Should I put some of this into bitcoin?", out.mandate.outOfScope)).toBe("Crypto");
  });

  it("blocks Confirm while the out-of-scope list is empty", () => {
    const p = emptyPrep();
    const named = { ...p, clientFile: { ...p.clientFile, name: "Sam Lee" } };
    expect(whyNotReady({ ...named, mandate: { ...named.mandate, outOfScope: [] } })).toMatch(/out-of-scope/);
    expect(whyNotReady({ ...named, mandate: { ...named.mandate, outOfScope: ["", "  "] } })).toMatch(/out-of-scope/);
    expect(whyNotReady({ ...named, mandate: { ...named.mandate, outOfScope: ["Crypto"] } })).toBeNull();
  });

  it("sends the Mandate draft and pre-flight an empty prep they accept", () => {
    expect(sourcesBody(emptyPrep().sources)).toEqual({ sources: [] });
    expect(Prep.safeParse(preflightBody(emptyPrep()).prep).success).toBe(true);
  });
});

describe("pre-flight date", () => {
  // 7:12 PM on Oct 10 in California is already Oct 11 in UTC.
  const evening = "2026-10-11T02:12:03.000Z";

  it("shows a full timestamp as the viewer's own date", () => {
    expect(checkedOn(evening, "America/Los_Angeles")).not.toContain("11");
    expect(checkedOn(evening, "America/Los_Angeles")).toContain("2026");
    expect(checkedOn(evening, "UTC")).toContain("11");
  });

  it("shows a date-only or unreadable value as sent", () => {
    expect(checkedOn("2026-10-10")).toBe("2026-10-10");
    expect(checkedOn("not a Time")).toBe("not a Time");
  });
});

describe("prep draft", () => {
  const memory = () => {
    const m = new Map<string, string>();
    return {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
    };
  };
  const blocked = (): Storage => {
    throw new Error("SecurityError");
  };

  it("survives a reload, then is gone once cleared", () => {
    const store = memory();
    const p = draft();
    const saved = { prep: { ...p, clientFile: { ...p.clientFile, cashOnHand: 250000 } }, reviewing: true, missing: ["age"] };
    saveDraft(saved, () => store);
    expect(loadDraft(() => store)).toEqual(saved);
    clearDraft(() => store);
    expect(loadDraft(() => store)).toBeNull();
  });

  it("ignores a corrupt or foreign value", () => {
    const store = memory();
    store.setItem(DRAFT_KEY, "{not json");
    expect(loadDraft(() => store)).toBeNull();
    store.setItem(DRAFT_KEY, JSON.stringify({ prep: { clientFile: {} }, reviewing: "yes" }));
    expect(loadDraft(() => store)).toBeNull();
  });

  it("keeps working when storage is blocked", () => {
    expect(loadDraft(blocked)).toBeNull();
    expect(() => saveDraft({ prep: draft(), reviewing: true, missing: [] }, blocked)).not.toThrow();
    expect(() => clearDraft(blocked)).not.toThrow();
    // No window at all, as in a server render: the default storage throws.
    expect(loadDraft()).toBeNull();
  });
});

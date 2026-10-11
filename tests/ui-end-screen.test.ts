import { describe, expect, it } from "vitest";
import {
  downloadLabel,
  endSummary,
  gradeStatus,
  gradedFor,
  momentLabel,
  recordIsCurrent,
  sameGrades,
  toggleGrade,
} from "@/components/meeting/endSummary";
import { mockMoment } from "@/lib/mock";
import { demoTranscript } from "@/data/demo";
import { emptyState, type Card, type Concern } from "@/lib/types";

const concern = (id: string, raisedAtTurn: string, status: Concern["status"]): Concern => ({
  id,
  topic: id,
  status,
  raisedAtTurn,
  ...(status === "resolved" ? { resolvedAtTurn: "t9" } : {}),
});

describe("endSummary", () => {
  it("counts resolved and open concerns and marks the moments they came from", () => {
    const cards = [
      { id: "c2", turnId: "t2", moment: "emotional_concern", concern: "Access" },
      { id: "c4", turnId: "t4", moment: "hesitation", concern: "Timing" },
    ] as Card[];
    const s = endSummary(cards, [concern("liquidity", "t2", "resolved"), concern("timing", "t4", "open"), concern("house", "t6", "open")]);
    expect(s.resolved).toBe(1);
    expect(s.open).toBe(2);
    expect(s.moments.map((m) => [m.turnId, m.moment, m.resolved])).toEqual([
      ["t2", "Emotional concern", true],
      ["t4", "Hesitation", false],
    ]);
  });

  it("is empty for a meeting with no cards", () => {
    expect(endSummary([], [])).toEqual({ moments: [], resolved: 0, open: 0 });
  });

  it("summarises the canned demo meeting", () => {
    let state = emptyState();
    const cards: Card[] = [];
    for (const turn of demoTranscript) {
      const res = mockMoment(turn.id, state);
      state = res.state;
      if (res.card) cards.push(res.card);
    }
    const s = endSummary(cards, state.concerns);
    expect(s.moments.map((m) => [m.turnId, m.resolved])).toEqual([
      ["t2", true],
      ["t4", false],
      ["t6", false],
      ["t8", false],
    ]);
    expect([s.resolved, s.open]).toEqual([1, 2]);
  });
});

it("labels moment types for people", () => {
  expect(momentLabel("buying_signal")).toBe("Buying signal");
  expect(momentLabel("")).toBe("");
});

it("marks a moment resolved only when every concern raised at its turn is resolved", () => {
  const cards = [{ id: "c2", turnId: "t2", moment: "objection", concern: "Access" }] as Card[];
  const s = endSummary(cards, [concern("liquidity", "t2", "resolved"), concern("request: fee schedule", "t2", "open")]);
  expect(s.moments[0].resolved).toBe(false);
  expect([s.resolved, s.open]).toEqual([1, 1]);
});

describe("grades kept across reopening the end screen", () => {
  const cards = [{ id: "c2" }, { id: "c4" }, { id: "c6" }] as Card[];

  it("sets a grade, replaces it with another, and clears it when pressed again", () => {
    let g = toggleGrade({}, "c4", "helpful", "2026-10-10T20:00:00.000Z");
    expect(g).toEqual({ c4: { cardId: "c4", grade: "helpful", gradedAt: "2026-10-10T20:00:00.000Z" } });
    g = toggleGrade(g, "c4", "wrong", "2026-10-10T20:01:00.000Z");
    expect(g.c4.grade).toBe("wrong");
    expect(toggleGrade(g, "c4", "wrong")).toEqual({});
  });

  it("does not change the grades it was given", () => {
    const before = toggleGrade({}, "c2", "helpful");
    toggleGrade(before, "c2", "helpful");
    expect(before.c2.grade).toBe("helpful");
  });

  it("counts grades in card order, only for cards on screen", () => {
    let g = toggleGrade({}, "c6", "not_needed");
    g = toggleGrade(g, "c2", "helpful");
    g = toggleGrade(g, "gone", "wrong");
    expect(gradedFor(cards, g).map((x) => [x.cardId, x.grade])).toEqual([
      ["c2", "helpful"],
      ["c6", "not_needed"],
    ]);
  });
});

describe("recordIsCurrent", () => {
  const cards = [{ id: "c2", turnId: "t2" }] as Card[];
  const concerns = [concern("liquidity", "t2", "open")];
  const state = { ...emptyState(), cards, concerns };

  it("is current when nothing changed since the download", () => {
    expect(recordIsCurrent(state, { cards, concerns })).toBe(true);
    // A fresh snapshot of the same meeting, as a second End meeting makes.
    expect(recordIsCurrent(state, JSON.parse(JSON.stringify({ cards, concerns })))).toBe(true);
  });

  it("is behind once the meeting went on: a new card or a concern resolved", () => {
    expect(recordIsCurrent(state, { cards: [...cards, { id: "c4", turnId: "t4" } as Card], concerns })).toBe(false);
    expect(recordIsCurrent(state, { cards, concerns: [concern("liquidity", "t2", "resolved")] })).toBe(false);
  });

  it("is not current before anything was downloaded", () => {
    expect(recordIsCurrent(null, { cards: [], concerns: [] })).toBe(false);
  });
});

describe("which grades the last download holds", () => {
  const cards = [{ id: "c2" }, { id: "c4" }, { id: "c6" }] as Card[];
  const action = "Download record";

  it("still counts the grades as saved after Back to meeting and End meeting again", () => {
    // Grade 2 of 3, then download: the page keeps exactly what went into the file.
    let grades = toggleGrade({}, "c2", "helpful");
    grades = toggleGrade(grades, "c6", "wrong");
    const saved = gradedFor(cards, grades);
    // The end screen opens again with the same grades from the page.
    const status = gradeStatus({ total: 3, graded: gradedFor(cards, grades), saved, recordCurrent: true, action });
    expect(status).toBe("Downloaded again with 2 of 3 graded. Save this version in the records app.");
  });

  it("asks for a download once a grade differs from the file", () => {
    const saved = gradedFor(cards, toggleGrade({}, "c2", "helpful"));
    const changed = gradedFor(cards, toggleGrade(toggleGrade({}, "c2", "helpful"), "c4", "not_needed"));
    expect(gradeStatus({ total: 3, graded: changed, saved, recordCurrent: true, action })).toBe(
      "Graded 2 of 3. Download record to save the grades; ungraded cards are marked ungraded.",
    );
    // Clearing a grade that is in the file is a change too.
    expect(gradeStatus({ total: 3, graded: [], saved, recordCurrent: true, action })).toMatch(/^Graded 0 of 3\. Download record/);
  });

  it("compares card and verdict, not when the grade was given", () => {
    const a = toggleGrade({}, "c2", "helpful", "2026-10-10T20:00:00.000Z");
    const b = toggleGrade({}, "c2", "helpful", "2026-10-10T20:05:00.000Z");
    expect(sameGrades(gradedFor(cards, a), gradedFor(cards, b))).toBe(true);
    expect(sameGrades(gradedFor(cards, a), gradedFor(cards, toggleGrade({}, "c2", "wrong")))).toBe(false);
  });

  it("says the grades go with the rest when the record is behind the meeting", () => {
    const graded = gradedFor(cards, toggleGrade({}, "c2", "helpful"));
    expect(gradeStatus({ total: 3, graded, saved: graded, recordCurrent: false, action })).toMatch(/^Graded 1 of 3\. Download record/);
  });

  it("with nothing graded and nothing to save, says ungraded cards are marked so", () => {
    expect(gradeStatus({ total: 3, graded: [], saved: [], recordCurrent: true, action })).toBe(
      "Graded 0 of 3. Ungraded cards are marked ungraded in the record.",
    );
  });
});

it("names the records tab on the download button when a records app is set", () => {
  // exportRecord opens the records app too, so the label has to say so.
  expect(downloadLabel(true)).toBe("Download and open records");
  expect(downloadLabel(false)).toBe("Download record");
});

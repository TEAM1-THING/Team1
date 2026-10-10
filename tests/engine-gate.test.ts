import { describe, expect, it } from "vitest";
import { classifyUtterance, echoesCard } from "@/lib/engine/gate";
import { demoTranscript } from "@/data/demo";

describe("classifyUtterance", () => {
  it("runs on questions, with or without a question mark", () => {
    for (const q of [
      "What happens if the market drops 20%?",
      "how much would I have at seventy",
      "Okay, that helps. But what if rates fall",
      "Can I take money out early",
      "I wonder whether bonds make sense for me.",
    ]) {
      expect(classifyUtterance(q), q).toMatchObject({
        kind: "question",
        run: true,
      });
    }
  });

  it("does not run on filler", () => {
    for (const f of ["Okay.", "yeah", "Got it!", "Mm-hm", "That makes sense.", "thank you", ""]) {
      expect(classifyUtterance(f), f).toMatchObject({ run: false });
    }
  });

  it("does not run on a plain statement", () => {
    for (const s of ["Okay, that helps.", "We just got back from Portugal.", "I read the summary you sent over."]) {
      expect(classifyUtterance(s), s).toEqual({
        kind: "statement",
        concern: false,
        run: false,
      });
    }
  });

  it("still runs on a statement carrying a worry, hesitation or life event", () => {
    for (const s of [
      "I'm worried I won't have enough cash.",
      "Maybe I should just wait six months.",
      "My sister lost a lot in 2008.",
      "I'd like to stop working at 65, not 70.",
      "Let's go ahead with the first tranche.",
    ]) {
      expect(classifyUtterance(s), s).toMatchObject({
        kind: "statement",
        concern: true,
        run: true,
      });
    }
  });

  it("lets every client turn of the demo through", () => {
    for (const t of demoTranscript.filter((t) => t.speaker === "client")) {
      expect(classifyUtterance(t.text).run, t.id).toBe(true);
    }
  });
});

describe("echoesCard", () => {
  const phrasing = "That's a fair worry. The plan keeps a $180,000 liquid reserve, which is 24 months of expenses.";
  it("matches the advisor reading the card, even loosely", () => {
    expect(echoesCard("the plan keeps a $180,000 liquid reserve which is 24 months of expenses", phrasing)).toBe(true);
  });
  it("does not match a client line or a short reply", () => {
    expect(echoesCard("I'm worried I won't have enough cash if something happens", phrasing)).toBe(false);
    expect(echoesCard("a fair worry", phrasing)).toBe(false);
    expect(echoesCard("the plan keeps a reserve", undefined)).toBe(false);
  });
});

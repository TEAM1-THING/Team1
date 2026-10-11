import { describe, expect, it } from "vitest";
import { classifyUtterance, echoesCard, soundsLikeAdvisor } from "@/lib/engine/gate";
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

describe("life events reach the engine", () => {
  it("runs a plain statement that carries a life event", () => {
    for (const line of [
      "We moved to Austin last year.",
      "I just got married.",
      "My mother needs a caregiver now.",
      "I retired in March.",
      "We're expecting a baby.",
      "I sold my business.",
    ]) {
      expect(classifyUtterance(line).run, line).toBe(true);
    }
  });

  it("still skips small talk", () => {
    expect(classifyUtterance("The weather's been nice.").run).toBe(false);
    expect(classifyUtterance("Okay.").run).toBe(false);
  });
});

describe("soundsLikeAdvisor", () => {
  it("recognises the advisor steering, following up, or talking plan to the client", () => {
    for (const line of [
      "Let me walk you through the reserve figure in the report.",
      "I'll send you the fee schedule tomorrow.",
      "Let's go back to the plan.",
      "Your reserve stays outside the portfolio.",
      "I'd suggest we keep the allocation as it is.",
    ]) {
      expect(soundsLikeAdvisor(line), line).toBe(true);
    }
  });

  it("leaves the client's own plain lines alone", () => {
    for (const line of [
      "We moved to Austin last year.",
      "The weather's been nice.",
      "You know, the plan seemed fine to me.",
      "Thank you, the plan is clear.",
      "Okay.",
    ]) {
      expect(soundsLikeAdvisor(line), line).toBe(false);
    }
  });
});

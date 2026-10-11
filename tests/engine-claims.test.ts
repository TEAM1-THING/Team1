import { describe, expect, it } from "vitest";
import { distinctClaims } from "@/lib/engine/claims";

describe("distinctClaims", () => {
  it("drops a claim that repeats another in other words", () => {
    const facts = [{ text: "That the plan already accounts for a down payment for the son.", label: "DO_NOT_CLAIM" as const }];
    expect(distinctClaims(["That the plan already includes help for the son's down payment."], facts)).toEqual([]);
  });

  it("keeps claims that share only filler words", () => {
    expect(distinctClaims(["That the plan is safe.", "That the plan guarantees income."], [])).toEqual([
      "That the plan is safe.",
      "That the plan guarantees income.",
    ]);
  });

  it("drops an exact repeat, ignoring case and the full stop", () => {
    expect(distinctClaims(["That the reserve covers every emergency.", "that the reserve covers every emergency"], [])).toEqual([
      "That the reserve covers every emergency.",
    ]);
  });
});

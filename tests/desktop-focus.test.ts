import { describe, expect, it } from "vitest";
import { previousApp } from "../desktop/src/main/focus";

const LIST = 'ASN:0x0-0x27c87c6-"Second_Chair": ASN:0x0-0x277f77d-"zoom.us": ASN:0x0-0xc00c-"Google_Chrome":';

describe("previousApp", () => {
  it("is the app just behind Second Chair when a click put it in front", () => {
    expect(previousApp(LIST, "Second_Chair")).toBe("ASN:0x0-0x277f77d");
  });
  it("is nothing when Second Chair is not in front", () => {
    expect(previousApp('ASN:0x0-0x277f77d-"zoom.us": ASN:0x0-0x27c87c6-"Second_Chair":', "Second_Chair")).toBeNull();
  });
  it("is nothing for an empty or unexpected list", () => {
    expect(previousApp("", "Second_Chair")).toBeNull();
    expect(previousApp('ASN:0x0-0x27c87c6-"Second_Chair":', "Second_Chair")).toBeNull();
  });
});

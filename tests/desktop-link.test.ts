import { describe, expect, it } from "vitest";
import { parseDeepLink } from "../desktop/src/core/deepLink";
import { demoPrep } from "../src/data/demo";
import { desktopLink, shouldAutoOpen } from "../src/components/desktop/desktopLink";

const chrome = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";
const overlay = `${chrome} Electron/44.7.0`;

describe("website to desktop link", () => {
  it("carries the prep from the browser to the app intact, non-ASCII included", () => {
    const prep = JSON.stringify({ ...demoPrep, clientFile: { ...demoPrep.clientFile, name: "Zoë Ångström" } });
    const link = parseDeepLink(desktopLink(prep));
    expect(link?.path).toBe("/meeting");
    expect(link?.prep).toBe(prep);
  });

  it("opens the meeting without a prep when the browser has none", () => {
    expect(parseDeepLink(desktopLink(null))).toEqual({ path: "/meeting", prep: null });
  });

  it("never opens anything but the meeting page", () => {
    expect(parseDeepLink("secondchair://open?path=https://evil.example/x")?.path).toBe("/meeting");
    expect(parseDeepLink("secondchair://open?path=/api/moment")?.path).toBe("/meeting");
  });

  it("ignores links that are not open links, and preps that are not a Prep", () => {
    expect(parseDeepLink("secondchair://elsewhere?path=/meeting")).toBeNull();
    expect(parseDeepLink("https://second-chair-seven.vercel.app/meeting")).toBeNull();
    expect(parseDeepLink("secondchair://open#prep=bm90IGpzb24")?.prep).toBeNull(); // "not json"
    expect(parseDeepLink(desktopLink(JSON.stringify({ hello: 1 })))?.prep).toBeNull();
  });
});

describe("when the website hands off to the overlay", () => {
  const base = { pathname: "/meeting", userAgent: chrome, paired: true, declined: false };

  it("does so in a paired desktop browser on the landing and meeting pages", () => {
    expect(shouldAutoOpen(base)).toBe(true);
    expect(shouldAutoOpen({ ...base, pathname: "/" })).toBe(true);
  });

  it("stays in the browser everywhere else", () => {
    expect(shouldAutoOpen({ ...base, paired: false })).toBe(false); // no app installed: site as before
    expect(shouldAutoOpen({ ...base, declined: true })).toBe(false);
    expect(shouldAutoOpen({ ...base, pathname: "/prep" })).toBe(false);
    expect(shouldAutoOpen({ ...base, userAgent: overlay })).toBe(false); // inside the overlay itself
    expect(shouldAutoOpen({ ...base, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148" })).toBe(false);
  });
});

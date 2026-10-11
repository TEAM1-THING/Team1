// macOS: hand the keyboard back to the call after a click on the panel.
//
// Electron's "panel" window is not a true NSPanel, so a click on it makes
// Second Chair the front app at the window-server level, without the app ever
// becoming active (no did-become-active). The call then stops receiving keys:
// its mute shortcut, typing in its chat. After each click on the panel, the
// app that was in front before it (the next one in the window server's
// front-to-back order) is brought back. No Apple Events, so no permission prompt.
import { execFile } from "node:child_process";

const run = (cmd: string, args: string[]) =>
  new Promise<string>((resolve) => execFile(cmd, args, { timeout: 2000 }, (_e, out) => resolve(String(out ?? ""))));

// `lsappinfo visibleProcessList` prints ASN:0x0-0x27c87c6-"Second_Chair": ... front to back.
export function previousApp(list: string, self: string): string | null {
  const apps = [...list.matchAll(/(ASN:0x[0-9a-f]+-0x[0-9a-f]+)-"([^"]*)"/gi)].map((m) => ({ asn: m[1], name: m[2] }));
  if (apps[0]?.name !== self) return null; // the click did not put us in front
  return apps.find((a) => a.name !== self)?.asn ?? null;
}

let busy = false;
export async function returnFocus(appName: string): Promise<void> {
  if (busy) return;
  busy = true;
  try {
    const asn = previousApp(await run("lsappinfo", ["visibleProcessList"]), appName.replace(/ /g, "_"));
    if (!asn) return;
    const pid = Number(/"pid"\s*=\s*(\d+)/.exec(await run("lsappinfo", ["info", "-only", "pid", asn]))?.[1]);
    if (!Number.isInteger(pid) || pid <= 0) return;
    await run("osascript", [
      "-l",
      "JavaScript",
      "-e",
      `ObjC.import("AppKit"); $.NSRunningApplication.runningApplicationWithProcessIdentifier(${pid}).activateWithOptions(0)`,
    ]);
  } finally {
    busy = false;
  }
}

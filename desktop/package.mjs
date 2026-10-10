// Packages the desktop app for this machine's platform into out/.
//   node package.mjs            build out/Second Chair-<platform>-<arch>/
//   node package.mjs --install  macOS: also copy it to ~/Applications and
//                               register it, so secondchair:// links open it
// macOS needs a real bundle for three things the dev binary cannot do: own the
// secondchair:// scheme, capture system audio (NSAudioCaptureUsageDescription),
// and ask for permissions under its own name instead of "Electron".
import { packager } from "@electron/packager";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const NAME = "Second Chair";
const mac = process.platform === "darwin";
const install = process.argv.includes("--install");

// macOS wants an .icns; build one from the 1024 px PNG with the system tools.
function icns() {
  const set = path.resolve("out/icon.iconset");
  rmSync(set, { recursive: true, force: true });
  mkdirSync(set, { recursive: true });
  for (const size of [16, 32, 128, 256, 512]) {
    for (const [scale, suffix] of [[1, ""], [2, "@2x"]]) {
      const px = String(size * scale);
      execFileSync("sips", ["-z", px, px, "assets/icon.png", "--out", `${set}/icon_${size}x${size}${suffix}.png`], { stdio: "ignore" });
    }
  }
  execFileSync("iconutil", ["-c", "icns", set, "-o", "out/icon.icns"]);
  return path.resolve("out/icon.icns");
}

mkdirSync("out", { recursive: true });
const [appDir] = await packager({
  dir: ".",
  out: "out",
  overwrite: true,
  name: NAME,
  executableName: NAME,
  appBundleId: "app.secondchair.desktop",
  appCategoryType: "public.app-category.business",
  icon: mac ? icns() : path.resolve("assets/icon.png"),
  asar: true,
  // Only the built bundles, the assets and package.json ship.
  ignore: [/^\/src($|\/)/, /^\/static($|\/)/, /^\/out($|\/)/, /^\/build\.mjs$/, /^\/package\.mjs$/, /^\/tsconfig\.json$/],
  protocols: [{ name: NAME, schemes: ["secondchair"] }],
  extendInfo: {
    LSUIElement: true, // no Dock icon; the menu-bar icon is the app's handle
    NSMicrophoneUsageDescription: "Second Chair transcribes the meeting, with everyone's consent, to suggest your next move.",
    NSAudioCaptureUsageDescription: "Second Chair listens to the call's audio, with everyone's consent, to suggest your next move.",
  },
});
const bundle = path.join(appDir, `${NAME}.app`);
console.log(`packaged ${mac ? bundle : appDir}`);

if (mac) {
  // Ad-hoc signature: the edited Info.plist breaks Electron's, and macOS keys
  // granted permissions to the signature.
  execFileSync("codesign", ["--force", "--deep", "--sign", "-", bundle], { stdio: "inherit" });
  if (install) {
    const target = path.join(homedir(), "Applications", `${NAME}.app`);
    mkdirSync(path.dirname(target), { recursive: true });
    if (existsSync(target)) rmSync(target, { recursive: true });
    cpSync(bundle, target, { recursive: true, verbatimSymlinks: true });
    const lsregister = "/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister";
    execFileSync(lsregister, ["-f", target]);
    console.log(`installed ${target}; secondchair:// links now open it`);
  }
}

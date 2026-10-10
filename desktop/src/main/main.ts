// Second Chair desktop: the meeting screen as a private overlay on the call.
//
// The main process only manages windows, hotkeys and the tray, and never waits
// on audio, speech or the network. The work is split across processes:
//   overlay renderer  the meeting page (hit-testing in its preload)
//   audio renderer    hidden; system audio, voice detection on the audio thread
//   pipeline          utility process; speech-to-text with backpressure
// Main hands each pair a MessagePort once, then stays out of the data path:
// audio goes audio -> pipeline -> overlay without crossing the main process.
//
// Links: the website opens secondchair://open?path=/meeting (with the
// advisor's prep in the fragment) and the meeting appears in the overlay.
import { app, globalShortcut, ipcMain, MessageChannelMain, utilityProcess, type UtilityProcess, type WebContents } from "electron";
import { parseDeepLink, SCHEME } from "../core/deepLink";
import { createAudioWindow } from "./audio";
import { config, dist } from "./config";
import { actions, createTray, registerHotkeys } from "./controls";
import { createOverlay } from "./overlay";

type Role = "overlay" | "audio";

// Links can arrive before the overlay exists (the link launched the app).
const waiting: string[] = process.argv.filter((a) => a.startsWith(`${SCHEME}://`));
let openLink: ((url: string) => void) | null = null;
const receive = (url: string) => (openLink ? openLink(url) : waiting.push(url));

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  // macOS delivers links as open-url, possibly before ready; Windows and Linux
  // start a second instance with the link in its arguments.
  app.on("open-url", (e, url) => {
    e.preventDefault();
    receive(url);
  });
  app.on("second-instance", (_e, argv) => argv.filter((a) => a.startsWith(`${SCHEME}://`)).forEach(receive));
  // Only a packaged build owns the scheme; in development it would point the
  // OS at the bare Electron binary instead of this app.
  if (app.isPackaged && !app.isDefaultProtocolClient(SCHEME)) app.setAsDefaultProtocolClient(SCHEME);
  app.whenReady().then(start);
  app.on("will-quit", () => globalShortcut.unregisterAll());
}

function start() {
  // No Dock icon, and never the active app on its own: the call keeps focus.
  if (process.platform === "darwin") app.setActivationPolicy("accessory");

  let quitting = false;
  let restarts = 0;
  const wired = new Map<Role, WebContents>();

  // The callback first fires after a page load, by which time the tray exists.
  const overlay = createOverlay((view) => tray.render(view));
  const audio = createAudioWindow();
  const list = actions(overlay);
  const tray = createTray(overlay, list);
  overlay.setListening(false); // first render of the tray
  registerHotkeys(list);

  openLink = (url) => {
    const link = parseDeepLink(url);
    if (link) void overlay.openLink(link);
    else console.warn(`[link] ignored ${url.slice(0, 80)}`);
  };
  waiting.splice(0).forEach(openLink);
  // First run of an installed build: tell the advisor's browser that meeting
  // links can open here from now on (the website only tries once it knows).
  if (app.isPackaged && !overlay.paired) overlay.pairBrowser();

  let pipeline = forkPipeline();

  function forkPipeline(): UtilityProcess {
    const p = utilityProcess.fork(dist("pipeline.js"), [], { serviceName: "Second Chair pipeline", stdio: "inherit" });
    p.on("message", (m: { type?: string; on?: boolean }) => {
      if (m?.type === "listening") overlay.setListening(m.on === true);
    });
    p.on("exit", (code) => {
      if (quitting) return;
      overlay.setListening(false);
      if (++restarts > 3) return console.error(`[pipeline] exited (${code}) too often; live transcription is off.`);
      console.error(`[pipeline] exited (${code}); restarting`);
      pipeline = forkPipeline();
      for (const [role, wc] of wired) wire(role, wc);
    });
    return p;
  }

  // A fresh channel per page load: a reload drops the old port, the preload says hello again.
  function wire(role: Role, wc: WebContents) {
    if (wc.isDestroyed()) return;
    wired.set(role, wc);
    const { port1, port2 } = new MessageChannelMain();
    pipeline.postMessage({ type: `${role}-port` }, [port1]);
    wc.postMessage("sc:port", null, [port2]);
  }

  const fromOverlay = (wc: WebContents) => !overlay.win.isDestroyed() && wc === overlay.win.webContents;
  ipcMain.on("sc:hello", (e) => {
    if (fromOverlay(e.sender)) wire("overlay", e.sender);
    else if (!audio.isDestroyed() && e.sender === audio.webContents) wire("audio", e.sender);
  });
  ipcMain.on("sc:hit", (e, hit) => {
    if (fromOverlay(e.sender) && (hit === "bar" || hit === "content" || hit === "none")) overlay.setHit(hit);
  });
  // The title bar's buttons. Only these three names are accepted.
  const barActions: Record<string, () => void> = {
    ghost: () => overlay.toggleGhost(),
    collapse: () => overlay.toggleCollapsed(),
    hide: () => overlay.toggleVisible(),
  };
  ipcMain.on("sc:action", (e, name) => {
    if (fromOverlay(e.sender) && typeof name === "string" && Object.hasOwn(barActions, name)) barActions[name]();
  });
  ipcMain.on("sc:typing", (e, on) => fromOverlay(e.sender) && overlay.setTyping(on === true));

  app.on("before-quit", () => {
    quitting = true;
    pipeline.kill();
  });
  overlay.win.on("closed", () => app.quit());

  console.log(`[second-chair] overlay on ${config.url}; content protection ${config.protect ? "on" : "off"}`);
  if (!config.sttUrl) console.log("[second-chair] SC_STT_URL is not set: replay works, live transcription is off.");
}

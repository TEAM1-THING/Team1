// The overlay window: a compact panel over the video call that the advisor
// sees and the client does not. Three jobs:
//   1. Capture: content protection keeps it out of screen share.
//   2. Input: the panel catches clicks; click-through mode passes them to the call.
//   3. Focus: it never takes focus from the call unless the advisor asks to type.
// The advisor can move it (title bar), resize it (edges), collapse it to the
// bar, and it reopens where they left it.
import { app, BrowserWindow, screen, shell, type Rectangle } from "electron";
import { once } from "node:events";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { BAR_HEIGHT, ignoreMouse, initialMode, onScreen, type Hit, type OverlayMode } from "../core/clickThrough";
import type { DeepLink } from "../core/deepLink";
import { asset, config, dist } from "./config";

// Turns the meeting page into one panel under the title bar, so its text wraps
// instead of running off the edge and scrolls inside the panel. On macOS the
// panel is frosted glass: the window's vibrancy blurs the call behind it and
// the page's surfaces turn translucent over that, while cards stay dark enough
// for text to read over a bright window. Elsewhere there is no OS blur, so the
// panel stays solid. The end screen is always opaque, so the meeting never
// shows through it. Selectors use structure and roles (the root that holds
// header and main, role=dialog, the ui.ts radius and border classes), never
// colours, which the web tracks restyle. No web file changes for the desktop.
const PAGE_ROOT = "body div:has(> header):has(> main)";
const CARDS = "body main .rounded-xl.border";
function overlayCss(glass: boolean): string {
  // .78 over the HUD material keeps the faintest text above 4.5:1 on a white
  // window behind; the blur still shows through as the glass.
  const tint = glass ? ".78" : ".95";
  return `
html { background: transparent !important; }
body { background: rgb(15 16 18 / ${tint}) !important; border: 1px solid rgb(255 255 255 / ${glass ? ".14" : ".1"}); border-radius: 14px;
  box-sizing: border-box; height: 100vh; margin: 0; padding-top: ${BAR_HEIGHT}px; overflow: hidden auto;
  overflow-wrap: anywhere; scrollbar-width: thin; scrollbar-color: rgb(255 255 255 / .2) transparent; }
${PAGE_ROOT} { background: transparent !important; min-height: 0 !important; height: auto !important; }
${PAGE_ROOT} > [aria-hidden="true"].absolute.inset-0 { display: none !important; }
${glass ? `body { box-shadow: inset 0 1px 0 rgb(255 255 255 / .08); }
body header { background: rgb(15 16 18 / .55) !important; border-color: rgb(255 255 255 / .08) !important; }
${CARDS} { background-color: rgb(24 26 30 / .82) !important; border-color: rgb(255 255 255 / .12) !important;
  backdrop-filter: blur(14px) saturate(1.3); box-shadow: inset 0 1px 0 rgb(255 255 255 / .06) !important; }` : ""}
body [role="dialog"][aria-modal="true"] { background: rgb(15 16 18 / .97) !important; }
body [role="dialog"][aria-modal="true"] .rounded-xl.border { background-color: rgb(24 26 30) !important; backdrop-filter: none; }
body .truncate { white-space: normal !important; overflow: visible !important; text-overflow: clip !important; }
body main { padding: 12px !important; gap: 12px !important; }
body header span.font-semibold.tracking-tight { display: none !important; } /* the title bar already names it */
html[data-sc-typing] body { border-color: #8ec5f2; box-shadow: inset 0 0 0 1px #8ec5f2; }
html[data-sc-ghost] body > :not(#sc-bar) { opacity: .45; }
html[data-sc-ghost] body { background: rgb(15 16 18 / .55) !important; }
`;
}

// Hides the "everyone has been told and agreed" notice under the header, for
// testing the undisclosed-meeting case only (config.disclosureNotice).
const NO_BANNER_CSS = `body header > [role="note"] { display: none !important; }`;
const PREP_KEY = "secondchair.prep"; // where the meeting page reads the prep (src/lib/store.ts)

const MARGIN = 16;
const MIN = { width: 340, height: 240 };
const ZOOM = { min: 0.7, max: 1.3, step: 0.1, start: 0.9 };

type Saved = { bounds?: Rectangle; zoom?: number; paired?: boolean; notice?: boolean };
const savedPath = () => path.join(app.getPath("userData"), "overlay.json");
function load(): Saved {
  try {
    return JSON.parse(readFileSync(savedPath(), "utf8")) as Saved;
  } catch {
    return {};
  }
}

// Top-right of the display under the cursor, tall enough for a card, never the whole screen.
function defaultBounds(): Rectangle {
  const { workArea: wa } = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const width = Math.min(config.width, wa.width - 2 * MARGIN);
  const height = Math.min(680, wa.height - 2 * MARGIN);
  const x = config.side === "left" ? wa.x + MARGIN : wa.x + wa.width - width - MARGIN;
  return { x, y: wa.y + MARGIN, width, height };
}

export type Overlay = ReturnType<typeof createOverlay>;
export type OverlayView = { mode: OverlayMode; visible: boolean; collapsed: boolean; listening: boolean };

// `showAtLaunch`: a meeting link launched the app, so the panel appears at
// once. Otherwise it waits, hidden, for the app window to start a meeting.
export function createOverlay(onChange: (v: OverlayView) => void, showAtLaunch: boolean) {
  const mode = initialMode();
  const mac = process.platform === "darwin";
  const saved = load();
  const areas = screen.getAllDisplays().map((d) => d.workArea);
  const start = saved.bounds && onScreen(saved.bounds, areas) ? saved.bounds : defaultBounds();
  let zoom = Math.min(ZOOM.max, Math.max(ZOOM.min, saved.zoom ?? ZOOM.start));
  let collapsed = false;
  let expandedHeight = start.height;
  let listening = false;
  let paired = saved.paired === true;
  let notice = saved.notice ?? config.disclosureNotice;
  let meeting = showAtLaunch; // a meeting has been opened in the panel
  let noticeCss: string | null = null;

  const win = new BrowserWindow({
    ...start,
    minWidth: MIN.width,
    minHeight: MIN.height,
    title: "Second Chair",
    icon: asset("icon.png"),
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: true,
    resizable: true,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    // Focus: never activate on click. A macOS panel is a non-activating
    // NSPanel; a Windows toolbar window stays out of Alt-Tab.
    focusable: false,
    acceptFirstMouse: true,
    hiddenInMissionControl: true,
    // macOS glass: the HUD material blurs and darkens what is behind the
    // panel. "active" keeps it frosted although the panel is never focused.
    ...(mac
      ? { type: "panel", vibrancy: "hud" as const, visualEffectState: "active" as const }
      : process.platform === "win32"
        ? { type: "toolbar" }
        : {}),
    webPreferences: {
      preload: dist("preload-overlay.js"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      // The window is never focused; without this Chromium throttles its timers.
      backgroundThrottling: false,
      spellcheck: false,
    },
  });

  // 1. Capture. Windows: SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE).
  // macOS: NSWindow.sharingType = .none, which ScreenCaptureKit capturers
  // ignore on current macOS, so share a window rather than the whole screen there.
  win.setContentProtection(config.protect);
  // Above full-screen Zoom and Teams, and on every Space.
  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true });
  // 2. Input. The transparent corners pass clicks through from the start; the
  // preload reports what the pointer is over, which `forward` lets it see.
  win.setIgnoreMouseEvents(true, { forward: true });

  const wc = win.webContents;
  // The disclosure notice toggles live, so its rule is inserted on its own.
  const applyNotice = async () => {
    if (noticeCss) await wc.removeInsertedCSS(noticeCss).catch(() => {});
    noticeCss = notice ? null : await wc.insertCSS(NO_BANNER_CSS);
  };
  wc.on("dom-ready", () => {
    noticeCss = null; // a new document starts without it
    void wc.insertCSS(overlayCss(mac));
    void applyNotice();
  });
  wc.on("did-finish-load", () => {
    wc.setZoomFactor(zoom);
    publish();
  });
  wc.on("did-fail-load", (_e, code, desc, url, isMain) => {
    if (!isMain || code === -3) return; // -3: aborted by a newer navigation
    console.error(`[overlay] could not load ${url}: ${desc}. Retrying in 3 s.`);
    setTimeout(() => !win.isDestroyed() && void win.loadURL(config.url), 3000);
  });
  wc.on("render-process-gone", (_e, d) => {
    console.error(`[overlay] renderer gone (${d.reason}); reloading`);
    if (!win.isDestroyed()) win.reload();
  });

  // The overlay only shows the meeting app. Other links (the records app) open
  // in the advisor's browser; the exported record saves to Downloads without a dialog.
  const origin = new URL(config.url).origin;
  const external = (url: string) => /^https?:/.test(url) && void shell.openExternal(url);
  wc.on("will-navigate", (e, url) => {
    if (new URL(url).origin === origin) return;
    e.preventDefault();
    external(url);
  });
  wc.setWindowOpenHandler(({ url }) => {
    external(url);
    return { action: "deny" };
  });
  wc.session.on("will-download", (_e, item) => item.setSavePath(path.join(app.getPath("downloads"), item.getFilename())));

  // Remember where the advisor put it, and at what text size.
  let saveTimer: NodeJS.Timeout | undefined;
  const persist = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (win.isDestroyed()) return;
      const b = win.getBounds();
      const bounds = { ...b, height: collapsed ? expandedHeight : b.height };
      try {
        writeFileSync(savedPath(), JSON.stringify({ bounds, zoom, paired, notice } satisfies Saved));
      } catch (e) {
        console.warn(`[overlay] could not save position: ${e}`);
      }
    }, 400);
  };
  win.on("moved", persist);
  win.on("resized", persist);
  // A drag in progress: where the cursor and the window were when it began.
  let dragFrom: { x: number; y: number; bounds: Rectangle } | null = null;
  // A drag never outlives its page or a hidden window.
  const cancelDrag = () => {
    dragFrom = null;
  };
  wc.on("did-start-navigation", (d) => d.isMainFrame && !d.isSameDocument && cancelDrag());
  wc.on("render-process-gone", cancelDrag);
  win.on("hide", cancelDrag);

  // A monitor unplugged mid-meeting must not strand the overlay off-screen.
  const rescue = () => {
    if (win.isDestroyed() || onScreen(win.getBounds(), screen.getAllDisplays().map((d) => d.workArea))) return;
    self.resetPosition();
  };
  screen.on("display-removed", rescue);
  screen.on("display-metrics-changed", rescue);
  win.on("closed", () => {
    screen.off("display-removed", rescue);
    screen.off("display-metrics-changed", rescue);
  });

  if (showAtLaunch) win.once("ready-to-show", () => win.showInactive()); // 3. Focus: appear without taking it.
  void win.loadURL(config.url);

  // Tell the title bar and the tray what state the overlay is in.
  function publish() {
    if (win.isDestroyed()) return;
    wc.send("sc:status", { listening, ghost: mode.ghost, typing: mode.typing, collapsed, mac, shareHidden: win.isContentProtected() });
    onChange({ mode: { ...mode }, visible: win.isVisible(), collapsed, listening });
  }

  function apply() {
    if (win.isDestroyed()) return;
    if (config.debug) console.log(`[overlay] mode typing=${mode.typing} ghost=${mode.ghost} ignoreMouse=${ignoreMouse(mode)}`);
    win.setIgnoreMouseEvents(ignoreMouse(mode), { forward: true });
    // Click-through dims the panel so the call shows through: drop the blur there.
    if (mac) win.setVibrancy(mode.ghost ? null : "hud");
    publish();
  }

  const barHeight = () => Math.round(BAR_HEIGHT * zoom) + 2;

  const self = {
    win,
    get mode() {
      return { ...mode };
    },
    get protected() {
      return win.isContentProtected();
    },
    // Called on every hit change from the preload; touches only the mouse state.
    setHit(hit: Hit) {
      if (mode.hit === hit || dragFrom) return;
      mode.hit = hit;
      if (config.debug) console.log(`[overlay] pointer over ${hit}: ${ignoreMouse(mode) ? "clicks pass through" : "catching clicks"}`);
      win.setIgnoreMouseEvents(ignoreMouse(mode), { forward: true });
    },
    // Typing is the one time the overlay takes focus. Leaving it gives focus
    // straight back, so the call's own shortcuts work again.
    setTyping(on: boolean) {
      if (mode.typing === on) return;
      mode.typing = on;
      if (on) {
        if (collapsed) self.toggleCollapsed();
        win.setFocusable(true);
        win.showInactive();
        win.focus();
      } else {
        win.blur();
        win.setFocusable(false);
      }
      apply();
    },
    // The title bar drags the window: it follows the cursor's movement since
    // the press, keeping its size, until the button is released.
    drag(phase: "start" | "move" | "end") {
      const c = screen.getCursorScreenPoint();
      if (phase === "start") {
        dragFrom = { x: c.x, y: c.y, bounds: win.getBounds() };
        return;
      }
      if (!dragFrom) return;
      const { x, y, bounds } = dragFrom;
      win.setBounds({ ...bounds, x: bounds.x + c.x - x, y: bounds.y + c.y - y });
      if (phase === "end") {
        dragFrom = null;
        persist();
      }
    },
    toggleGhost() {
      mode.ghost = !mode.ghost;
      apply();
    },
    // Collapsed, the overlay is just its title bar: status stays in view, the call is uncovered.
    toggleCollapsed() {
      const b = win.getBounds();
      collapsed = !collapsed;
      if (collapsed) {
        expandedHeight = b.height;
        win.setMinimumSize(MIN.width, 1);
        win.setBounds({ ...b, height: barHeight() });
        win.setResizable(false);
      } else {
        win.setResizable(true);
        win.setBounds({ ...b, height: expandedHeight });
        win.setMinimumSize(MIN.width, MIN.height);
      }
      publish();
    },
    get meeting() {
      return meeting;
    },
    // The app window started a meeting: load it fresh (the page reads the prep
    // the app window just saved) and appear without taking focus.
    startMeeting() {
      meeting = true;
      if (collapsed) self.toggleCollapsed();
      void win.loadURL(origin + "/meeting");
      win.showInactive();
      publish();
    },
    show() {
      if (!win.isVisible()) win.showInactive();
      publish();
    },
    toggleVisible() {
      if (win.isVisible()) {
        if (mode.typing) self.setTyping(false);
        win.hide();
      } else {
        win.showInactive();
      }
      publish();
    },
    zoomBy(steps: number) {
      zoom = Math.round(Math.min(ZOOM.max, Math.max(ZOOM.min, zoom + steps * ZOOM.step)) * 10) / 10;
      wc.setZoomFactor(zoom);
      if (collapsed) win.setBounds({ ...win.getBounds(), height: barHeight() });
      persist();
    },
    // Just under the camera on the display it is on, so reading a card keeps
    // the advisor's eyes near the lens and on the client.
    placeUnderCamera() {
      const { workArea: wa } = screen.getDisplayMatching(win.getBounds());
      const b = win.getBounds();
      win.setBounds({ ...b, x: Math.round(wa.x + (wa.width - b.width) / 2), y: wa.y + 8 });
      persist();
    },
    get notice() {
      return notice;
    },
    setNotice(on: boolean) {
      notice = on;
      void applyNotice();
      persist();
      publish();
    },
    get paired() {
      return paired;
    },
    // Opens the website once with a marker; from then on that browser sends
    // its meeting links here instead of showing the meeting itself.
    pairBrowser() {
      paired = true;
      persist();
      void shell.openExternal(`${origin}/?sc-desktop=paired`);
    },
    // A link from the website: show the meeting here, with the prep the
    // advisor made in the browser when the link carries one.
    async openLink(link: DeepLink) {
      meeting = true;
      if (collapsed) self.toggleCollapsed();
      if (!win.isVisible()) win.showInactive();
      const target = origin + link.path;
      try {
        if (link.prep) {
          if (wc.isLoading()) await once(wc, "did-stop-loading");
          // localStorage is per origin, so the page must be ours before writing.
          if (new URL(wc.getURL() || "about:blank").origin !== origin) await win.loadURL(target);
          await wc.executeJavaScript(`localStorage.setItem(${JSON.stringify(PREP_KEY)}, ${JSON.stringify(link.prep)})`);
        }
        await win.loadURL(target);
      } catch (e) {
        console.error(`[link] could not open ${target}: ${e}`);
      }
      publish();
    },
    resetPosition() {
      collapsed = false;
      win.setResizable(true);
      win.setMinimumSize(MIN.width, MIN.height);
      win.setBounds(defaultBounds());
      persist();
      publish();
    },
    setProtected(on: boolean) {
      win.setContentProtection(on);
      publish();
    },
    setListening(on: boolean) {
      listening = on;
      publish();
    },
    // Hotkeys reach the meeting page as the keys it already handles.
    sendKey(key: string) {
      wc.send("sc:key", key);
    },
  };
  return self;
}

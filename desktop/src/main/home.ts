// The app's own window: a normal, full-size window for everything before the
// call (the start page and the prep screen). It has a Dock icon and a close
// button like any Mac app. When the advisor starts the meeting, it steps
// aside and the meeting opens in the private panel instead.
//
// Both windows share one browser session, so the prep saved here is the prep
// the panel's meeting page reads: no link or copy is needed between them.
import { BrowserWindow, shell } from "electron";
import { asset, config } from "./config";

export const MEETING_PATH = "/meeting";

export function createHome(onMeeting: () => void) {
  const origin = new URL(config.url).origin;
  let quitting = false;

  const win = new BrowserWindow({
    width: 1120,
    height: 800,
    minWidth: 720,
    minHeight: 560,
    title: "Second Chair",
    icon: asset("icon.png"),
    show: false,
    backgroundColor: "#0d1219",
    autoHideMenuBar: true, // Windows: the menu stays behind Alt
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: true },
  });
  win.setContentProtection(config.protect); // the prep holds client details

  const wc = win.webContents;
  // Starting the meeting (the prep screen's button, or the start page's demo
  // link) hands over to the panel; this window goes back to where it was.
  const watch = (url: string) => {
    const u = new URL(url);
    if (u.origin !== origin || u.pathname !== MEETING_PATH) return;
    win.hide();
    if (wc.navigationHistory.canGoBack()) wc.navigationHistory.goBack();
    else void win.loadURL(`${origin}/prep`);
    onMeeting();
  };
  wc.on("did-navigate", (_e, url) => watch(url));
  wc.on("did-navigate-in-page", (_e, url, isMain) => isMain && watch(url));

  // Only the Second Chair site loads here; any other link opens in the browser.
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
  wc.on("did-fail-load", (_e, code, desc, url, isMain) => {
    if (!isMain || code === -3) return;
    console.error(`[home] could not load ${url}: ${desc}. Retrying in 3 s.`);
    setTimeout(() => !win.isDestroyed() && void win.loadURL(`${origin}/`), 3000);
  });

  // Closing the window keeps the app running (the panel, hotkeys, the Dock
  // icon), as Mac apps do. Quit from the menu, the Dock or Command+Q.
  win.on("close", (e) => {
    if (quitting) return;
    e.preventDefault();
    win.hide();
  });

  void win.loadURL(`${origin}/`);

  return {
    win,
    show() {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    },
    // A fresh prep: the prep screen, in front.
    prepare() {
      void win.loadURL(`${origin}/prep`);
      this.show();
    },
    quitting() {
      quitting = true;
    },
  };
}

export type Home = ReturnType<typeof createHome>;

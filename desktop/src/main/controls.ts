// Global hotkeys and the menu-bar icon, from one table so the two never drift.
// Hotkeys work while the call has focus, which is the point: the advisor never
// clicks away from the client to drive the overlay.
//
// Control+Alt (Control+Option on a Mac) because Command/Ctrl+Shift chords
// belong to the call apps (Zoom mutes on Cmd+Shift+A, Teams on Cmd+Shift+M),
// and the letters avoid the ones AltGr types on common European layouts.
import { app, globalShortcut, Menu, nativeImage, Tray, type MenuItemConstructorOptions } from "electron";
import { asset } from "./config";
import type { Home } from "./home";
import type { Overlay, OverlayView } from "./overlay";

type Action = { id: string; label: string; accelerator: string; run: () => void };

export function actions(overlay: Overlay): Action[] {
  return [
    { id: "visible", label: "Show or hide the panel", accelerator: "Control+Alt+H", run: () => overlay.toggleVisible() },
    { id: "typing", label: "Type in the panel", accelerator: "Control+Alt+Space", run: () => overlay.setTyping(!overlay.mode.typing) },
    { id: "ghost", label: "Pass clicks to the call", accelerator: "Control+Alt+G", run: () => overlay.toggleGhost() },
    { id: "collapse", label: "Shrink to a thin bar", accelerator: "Control+Alt+B", run: () => overlay.toggleCollapsed() },
    { id: "next", label: "Play the next line", accelerator: "Control+Alt+Right", run: () => overlay.sendKey("ArrowRight") },
    { id: "auto", label: "Play or pause", accelerator: "Control+Alt+P", run: () => overlay.sendKey("a") },
    { id: "quit", label: "Quit Second Chair", accelerator: "Control+Alt+Shift+Q", run: () => app.quit() },
  ];
}

export function registerHotkeys(list: Action[]): void {
  const taken = list.filter((a) => !globalShortcut.register(a.accelerator, a.run));
  for (const a of taken) console.warn(`[hotkeys] ${a.accelerator} is taken by another app; use the menu-bar icon for "${a.label}".`);
}

// The app's menus when it is in front (macOS menu bar) and on the Dock icon.
// The Edit menu is what makes copy and paste work in the prep form.
export function setAppMenus(overlay: Overlay, list: Action[], home: Home) {
  const by = Object.fromEntries(list.map((a) => [a.id, a]));
  const item = (id: string): MenuItemConstructorOptions => ({ label: by[id].label, accelerator: by[id].accelerator, registerAccelerator: false, click: by[id].run });
  const prepare: MenuItemConstructorOptions = { label: "Prepare a meeting", accelerator: "CommandOrControl+N", click: () => home.prepare() };
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      ...(process.platform === "darwin"
        ? [{ label: "Second Chair", submenu: [{ role: "about" }, { type: "separator" }, { role: "hide" }, { role: "hideOthers" }, { type: "separator" }, item("quit")] } as MenuItemConstructorOptions]
        : []),
      { label: "Meeting", submenu: [prepare, { type: "separator" }, item("visible"), item("typing"), item("ghost"), item("collapse"), { type: "separator" }, { label: "Sample meeting", submenu: [item("next"), item("auto")] }] },
      { role: "editMenu" },
      {
        label: "Panel",
        submenu: [
          { label: "Larger text", click: () => overlay.zoomBy(1) },
          { label: "Smaller text", click: () => overlay.zoomBy(-1) },
          { label: "Move under the webcam", click: () => overlay.placeUnderCamera() },
          { label: "Move back to the corner", click: () => overlay.resetPosition() },
        ],
      },
      { role: "windowMenu" },
    ]),
  );
  app.dock?.setMenu(Menu.buildFromTemplate([prepare, item("visible")]));
}

export function createTray(overlay: Overlay, list: Action[], home: Home) {
  const mac = process.platform === "darwin";
  // A template image follows the menu bar's light or dark appearance on macOS.
  const icon = mac
    ? nativeImage.createFromPath(asset("trayTemplate.png"))
    : nativeImage.createFromPath(asset("icon.png")).resize({ width: 16, height: 16 });
  const tray = new Tray(icon);
  const by = Object.fromEntries(list.map((a) => [a.id, a]));
  const item = (id: string, extra: Partial<MenuItemConstructorOptions> = {}): MenuItemConstructorOptions => ({
    label: by[id].label,
    accelerator: by[id].accelerator,
    registerAccelerator: false,
    click: by[id].run,
    ...extra,
  });

  function render({ mode, visible, collapsed, listening }: OverlayView) {
    tray.setToolTip(`Second Chair${listening ? " (listening)" : ""}`);
    if (mac) tray.setTitle(listening ? "●" : "");
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: listening ? "Second Chair: listening to the call" : "Second Chair", enabled: false },
        { type: "separator" },
        { label: "Prepare a meeting", click: () => home.prepare() },
        item("visible", { label: visible ? "Hide the panel" : "Show the panel" }),
        item("typing", { type: "checkbox", checked: mode.typing }),
        item("ghost", { type: "checkbox", checked: mode.ghost }),
        item("collapse", { type: "checkbox", checked: collapsed }),
        { type: "separator" },
        { label: "Larger text", click: () => overlay.zoomBy(1) },
        { label: "Smaller text", click: () => overlay.zoomBy(-1) },
        { label: "Move under the webcam", click: () => overlay.placeUnderCamera() },
        { label: "Move back to the corner", click: () => overlay.resetPosition() },
        { label: "Open meeting links here, not in the browser", click: () => overlay.pairBrowser() },
        { type: "separator" },
        // The meeting page's "Next turn" and "Auto-play": they step through the
        // sample conversation, so the menu says so.
        { label: "Sample meeting", submenu: [item("next"), item("auto")] },
        { type: "separator" },
        {
          label: "Show the \u201ceveryone agreed\u201d banner",
          type: "checkbox",
          checked: overlay.notice,
          click: (mi) => overlay.setNotice(mi.checked),
        },
        {
          label: "Hide from the client when you share your screen",
          // Some Mac capture tools still record it; sharing one window is safe.
          toolTip: mac ? "On a Mac, share one window, not your whole screen, to be sure." : undefined,
          type: "checkbox",
          checked: overlay.protected,
          click: (mi) => overlay.setProtected(mi.checked),
        },
        { type: "separator" },
        item("quit"),
      ]),
    );
  }

  return { tray, render };
}

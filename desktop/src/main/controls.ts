// Global hotkeys and the menu-bar icon, from one table so the two never drift.
// Hotkeys work while the call has focus, which is the point: the advisor never
// clicks away from the client to drive the overlay.
//
// Control+Alt (Control+Option on a Mac) because Command/Ctrl+Shift chords
// belong to the call apps (Zoom mutes on Cmd+Shift+A, Teams on Cmd+Shift+M),
// and the letters avoid the ones AltGr types on common European layouts.
import { app, globalShortcut, Menu, nativeImage, Tray, type MenuItemConstructorOptions } from "electron";
import { asset } from "./config";
import type { Overlay, OverlayView } from "./overlay";

type Action = { id: string; label: string; accelerator: string; run: () => void };

export function actions(overlay: Overlay): Action[] {
  return [
    { id: "visible", label: "Show or hide overlay", accelerator: "Control+Alt+H", run: () => overlay.toggleVisible() },
    { id: "typing", label: "Type into overlay", accelerator: "Control+Alt+Space", run: () => overlay.setTyping(!overlay.mode.typing) },
    { id: "ghost", label: "See-through (clicks go to the call)", accelerator: "Control+Alt+G", run: () => overlay.toggleGhost() },
    { id: "collapse", label: "Collapse to title bar", accelerator: "Control+Alt+B", run: () => overlay.toggleCollapsed() },
    { id: "next", label: "Next turn (replay)", accelerator: "Control+Alt+Right", run: () => overlay.sendKey("ArrowRight") },
    { id: "auto", label: "Auto-play (replay)", accelerator: "Control+Alt+P", run: () => overlay.sendKey("a") },
    { id: "quit", label: "Quit Second Chair", accelerator: "Control+Alt+Shift+Q", run: () => app.quit() },
  ];
}

export function registerHotkeys(list: Action[]): void {
  const taken = list.filter((a) => !globalShortcut.register(a.accelerator, a.run));
  for (const a of taken) console.warn(`[hotkeys] ${a.accelerator} is taken by another app; use the menu-bar icon for "${a.label}".`);
}

export function createTray(overlay: Overlay, list: Action[]) {
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
        item("visible", { label: visible ? "Hide overlay" : "Show overlay" }),
        item("typing", { type: "checkbox", checked: mode.typing }),
        item("ghost", { type: "checkbox", checked: mode.ghost }),
        item("collapse", { type: "checkbox", checked: collapsed }),
        { type: "separator" },
        { label: "Larger text", click: () => overlay.zoomBy(1) },
        { label: "Smaller text", click: () => overlay.zoomBy(-1) },
        { label: "Move back to the corner", click: () => overlay.resetPosition() },
        { type: "separator" },
        item("next"),
        item("auto"),
        { type: "separator" },
        {
          label: mac ? "Hide from screen share (not ScreenCaptureKit)" : "Hide from screen share",
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

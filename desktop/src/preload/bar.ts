// The overlay's title bar, added by the preload so no web file changes: the
// logo, what the overlay is doing right now, and four controls. The eye is
// only ever about screen share: slashed = hidden from it, open = visible.
// It is the drag handle for the frameless window, and it stays clickable in
// click-through mode so the advisor can always get back with the mouse.
import { ipcRenderer } from "electron";
import { BAR_HEIGHT } from "../core/clickThrough";

export type BarStatus = {
  listening: boolean;
  ghost: boolean;
  typing: boolean;
  collapsed: boolean;
  mac: boolean;
  shareHidden: boolean; // content protection on
};

const LOGO = `<svg viewBox="80 110 352 292" width="22" height="18" aria-hidden="true"><g fill="none" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"><path d="M106 173L138 291H232M138 291V378M232 291V378" stroke="#8ec5f2"/><path d="M256 134L294 274H406M294 274V378M406 274V378" stroke="#f2ede2"/></g></svg>`;

const ICON = {
  // Screen share: a slashed eye is "they can't see this", an open eye "they can".
  shareHidden: `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2.5 10s2.7-5 7.5-5 7.5 5 7.5 5-2.7 5-7.5 5-7.5-5-7.5-5z"/><circle cx="10" cy="10" r="2.2"/><path d="M4 16L16 4"/></svg>`,
  shareVisible: `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2.5 10s2.7-5 7.5-5 7.5 5 7.5 5-2.7 5-7.5 5-7.5-5-7.5-5z"/><circle cx="10" cy="10" r="2.2"/></svg>`,
  // Click-through: a pointer passing down through the panel.
  ghost: `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5l8.5 6.3-3.9.9 2.2 4.3-1.9.9-2.2-4.3-2.7 2.6z"/><path d="M3 17.5h14" stroke-dasharray="2 2.4"/></svg>`,
  collapse: `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l5-5 5 5"/></svg>`,
  expand: `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7.5l5 5 5-5"/></svg>`,
  hide: `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9"/></svg>`,
};

// Scoped by id so the page's own styles (Tailwind's reset included) lose to it.
const CSS = `
#sc-bar { all: initial; position: fixed; inset: 0 0 auto 0; height: ${BAR_HEIGHT}px; z-index: 2147483647;
  display: flex; align-items: center; gap: 8px; padding: 0 6px 0 12px; box-sizing: border-box;
  background: #0d1219; border-bottom: 1px solid rgb(255 255 255 / .08); border-radius: 14px 14px 0 0;
  font: 500 13px/1 var(--font-geist-sans, system-ui), system-ui, sans-serif; color: #f2ede2;
  -webkit-app-region: drag; user-select: none; cursor: default; }
#sc-bar .sc-name { letter-spacing: -.01em; white-space: nowrap; }
#sc-bar .sc-state { display: inline-flex; align-items: center; gap: 6px; min-width: 0; overflow: hidden;
  color: rgb(242 237 226 / .62); font-weight: 400; font-size: 12px; white-space: nowrap; text-overflow: ellipsis; }
#sc-bar .sc-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; background: rgb(242 237 226 / .3); }
#sc-bar[data-listening] .sc-dot { background: #fb7185; box-shadow: 0 0 0 3px rgb(251 113 133 / .18); }
#sc-bar[data-listening] .sc-state { color: #fecdd3; }
#sc-bar[data-ghost] .sc-state, #sc-bar[data-typing] .sc-state { color: #8ec5f2; }
#sc-bar .sc-gap { flex: 1; }
#sc-bar button { all: unset; -webkit-app-region: no-drag; display: grid; place-items: center; width: 28px; height: 28px;
  border-radius: 8px; color: rgb(242 237 226 / .7); cursor: pointer; }
#sc-bar button:hover { background: rgb(255 255 255 / .08); color: #f2ede2; }
#sc-bar button:focus-visible { outline: 2px solid #8ec5f2; outline-offset: 1px; }
#sc-bar button[aria-pressed="true"] { color: #8ec5f2; background: rgb(142 197 242 / .14); }
#sc-bar button[data-action="share"][data-visible] { color: #fbbf24; background: rgb(251 191 36 / .14); }
#sc-tip { all: initial; position: fixed; top: ${BAR_HEIGHT + 6}px; right: 8px; z-index: 2147483647; display: none;
  max-width: min(280px, calc(100vw - 16px)); padding: 9px 11px; box-sizing: border-box; border-radius: 10px;
  background: #f2ede2; color: #0d1219; box-shadow: 0 10px 30px -8px rgb(0 0 0 / .6);
  font: 400 12.5px/1.4 var(--font-geist-sans, system-ui), system-ui, sans-serif; pointer-events: none; }
#sc-tip b { display: block; font-weight: 600; margin-bottom: 2px; }
#sc-tip[data-show] { display: block; }
`;

// What each button says when the pointer rests on it: a short name (also shown
// in the bar itself when the panel is collapsed and there is no room below)
// and one or two plain sentences about what a click does.
type Tip = { name: string; detail: string };

function stateText(s: BarStatus): string {
  if (s.typing) return "Typing in the panel (Esc to stop)";
  if (s.ghost) return "Clicks pass to the call";
  return s.listening ? "Listening to the call" : "Not listening";
}

function tips(s: BarStatus): Record<string, Tip> {
  const key = (k: string) => (s.mac ? `Control+Option+${k}` : `Ctrl+Alt+${k}`);
  return {
    share: s.shareHidden
      ? {
          name: "Hidden from the client",
          detail: `If you share your screen, the client can't see this panel. Click to let them see it.${
            s.mac ? " On a Mac, share one window, not your whole screen, to be sure." : ""
          }`,
        }
      : { name: "Client can see this", detail: "If you share your screen, the client sees this panel. Click to hide it from them." },
    ghost: s.ghost
      ? { name: "Clicks pass to the call", detail: `Click here (or press ${key("G")}) to use the panel again.` }
      : { name: "Pass clicks to the call", detail: `The panel stays in view, but your clicks reach the call behind it. Shortcut: ${key("G")}.` },
    collapse: s.collapsed
      ? { name: "Show the full panel", detail: "Bring back the cards and the transcript." }
      : { name: "Shrink to a thin bar", detail: "Uncover the call and keep just this bar. Double-clicking the bar does the same." },
    hide: {
      name: "Hide the panel",
      detail: `Bring it back with ${key("H")} or the Second Chair icon in the ${s.mac ? "menu bar" : "taskbar tray"}.`,
    },
  };
}

export function mountBar(): (s: BarStatus) => void {
  let status: BarStatus = { listening: false, ghost: false, typing: false, collapsed: false, mac: true, shareHidden: true };
  const bar = document.createElement("div");
  bar.id = "sc-bar";
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "Second Chair panel");
  bar.innerHTML = `${LOGO}<span class="sc-name">Second Chair</span><span class="sc-state"><span class="sc-dot"></span><span class="sc-text"></span></span><span class="sc-gap"></span>
    <button type="button" data-action="share"></button><button type="button" data-action="ghost"></button><button type="button" data-action="collapse"></button><button type="button" data-action="hide"></button>`;
  const style = document.createElement("style");
  style.textContent = CSS;
  const tip = document.createElement("div");
  tip.id = "sc-tip";
  tip.setAttribute("role", "tooltip");

  // The panel never becomes the active app, and macOS shows native tooltips
  // only for the active app, so the bar draws its own.
  let hovered: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const showTip = () => {
    const t = hovered ? tips(status)[hovered] : null;
    if (!t) {
      tip.removeAttribute("data-show");
      bar.querySelector(".sc-text")!.textContent = stateText(status);
      return;
    }
    if (status.collapsed) {
      bar.querySelector(".sc-text")!.textContent = t.name; // no room below a collapsed panel
    } else {
      tip.replaceChildren(Object.assign(document.createElement("b"), { textContent: t.name }), t.detail);
      tip.setAttribute("data-show", "");
    }
  };
  const point = (action: string | null, delay: number) => {
    if (action === hovered) return; // still on the same button
    clearTimeout(timer);
    hovered = action;
    if (!action) return showTip();
    timer = setTimeout(showTip, delay);
  };
  bar.addEventListener("pointerover", (e) => point((e.target as Element).closest("button")?.dataset.action ?? null, 250));
  bar.addEventListener("pointerleave", () => point(null, 0));
  bar.addEventListener("focusin", (e) => point((e.target as HTMLElement).dataset.action ?? null, 0));
  bar.addEventListener("focusout", () => point(null, 0));

  bar.addEventListener("click", (e) => {
    const action = (e.target as Element).closest("button")?.dataset.action;
    if (action) ipcRenderer.send("sc:action", action);
  });
  bar.addEventListener("dblclick", (e) => {
    if (!(e.target as Element).closest("button")) ipcRenderer.send("sc:action", "collapse");
  });

  const ICONS: Record<string, () => string> = {
    share: () => (status.shareHidden ? ICON.shareHidden : ICON.shareVisible),
    ghost: () => ICON.ghost,
    collapse: () => (status.collapsed ? ICON.expand : ICON.collapse),
    hide: () => ICON.hide,
  };
  function render() {
    bar.toggleAttribute("data-listening", status.listening);
    bar.toggleAttribute("data-ghost", status.ghost);
    bar.toggleAttribute("data-typing", status.typing);
    bar.querySelector(".sc-text")!.textContent = stateText(status);
    const all = tips(status);
    for (const b of bar.querySelectorAll<HTMLButtonElement>("button[data-action]")) {
      const action = b.dataset.action!;
      b.innerHTML = ICONS[action]();
      b.removeAttribute("title"); // the bar's own tooltip replaces the native one
      b.setAttribute("aria-label", `${all[action].name}. ${all[action].detail}`);
    }
    const ghost = bar.querySelector('[data-action="ghost"]')!;
    ghost.setAttribute("aria-pressed", String(status.ghost));
    bar.querySelector('[data-action="share"]')!.toggleAttribute("data-visible", !status.shareHidden);
    if (hovered) showTip(); // a click changed the state under the pointer
  }

  // React owns <body> and may replace its children while it hydrates; put the
  // bar back if that happens. Appended last so hydration skips over it.
  const attach = () => {
    if (!style.isConnected) document.head.append(style);
    if (!bar.isConnected) document.body.append(bar);
    if (!tip.isConnected) document.body.append(tip);
  };
  attach();
  new MutationObserver(attach).observe(document.body, { childList: true });
  render();
  return (s) => {
    status = s;
    render();
  };
}

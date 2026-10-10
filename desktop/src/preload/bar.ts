// The overlay's title bar, added by the preload so no web file changes: the
// logo, what the overlay is doing right now, and the three window controls.
// It is the drag handle for the frameless window, and it stays clickable in
// see-through mode so the advisor can always get back with the mouse.
import { ipcRenderer } from "electron";
import { BAR_HEIGHT } from "../core/clickThrough";

export type BarStatus = { listening: boolean; ghost: boolean; typing: boolean; collapsed: boolean; mac: boolean };

const LOGO = `<svg viewBox="80 110 352 292" width="22" height="18" aria-hidden="true"><g fill="none" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"><path d="M106 173L138 291H232M138 291V378M232 291V378" stroke="#8ec5f2"/><path d="M256 134L294 274H406M294 274V378M406 274V378" stroke="#f2ede2"/></g></svg>`;

const ICON = {
  // An eye with a slash reads as "see through me".
  ghost: `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2.5 10s2.7-5 7.5-5 7.5 5 7.5 5-2.7 5-7.5 5-7.5-5-7.5-5z"/><circle cx="10" cy="10" r="2.2"/><path d="M4 16L16 4"/></svg>`,
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
`;

function stateText(s: BarStatus): string {
  if (s.typing) return "Typing here. Esc returns to the call";
  if (s.ghost) return "See-through: clicks go to the call";
  return s.listening ? "Listening to the call" : "Mic off";
}

export function mountBar(): (s: BarStatus) => void {
  let status: BarStatus = { listening: false, ghost: false, typing: false, collapsed: false, mac: true };
  const bar = document.createElement("div");
  bar.id = "sc-bar";
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "Second Chair overlay");
  bar.innerHTML = `${LOGO}<span class="sc-name">Second Chair</span><span class="sc-state"><span class="sc-dot"></span><span class="sc-text"></span></span><span class="sc-gap"></span>
    <button type="button" data-action="ghost"></button><button type="button" data-action="collapse"></button><button type="button" data-action="hide"></button>`;
  const style = document.createElement("style");
  style.textContent = CSS;
  bar.addEventListener("click", (e) => {
    const action = (e.target as Element).closest("button")?.dataset.action;
    if (action) ipcRenderer.send("sc:action", action);
  });
  bar.addEventListener("dblclick", (e) => {
    if (!(e.target as Element).closest("button")) ipcRenderer.send("sc:action", "collapse");
  });

  const key = (k: string) => (status.mac ? `⌃⌥${k}` : `Ctrl+Alt+${k}`);
  function render() {
    bar.toggleAttribute("data-listening", status.listening);
    bar.toggleAttribute("data-ghost", status.ghost);
    bar.toggleAttribute("data-typing", status.typing);
    bar.querySelector(".sc-text")!.textContent = stateText(status);
    const set = (action: string, icon: string, label: string, pressed?: boolean) => {
      const b = bar.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)!;
      b.innerHTML = icon;
      b.title = label;
      b.setAttribute("aria-label", label);
      if (pressed === undefined) b.removeAttribute("aria-pressed");
      else b.setAttribute("aria-pressed", String(pressed));
    };
    set("ghost", ICON.ghost, `See-through: clicks go to the call (${key("G")})`, status.ghost);
    set("collapse", status.collapsed ? ICON.expand : ICON.collapse, status.collapsed ? "Expand" : "Collapse to this bar");
    set("hide", ICON.hide, `Hide (${key("H")}). Bring it back from the menu-bar icon`);
  }

  // React owns <body> and may replace its children while it hydrates; put the
  // bar back if that happens. Appended last so hydration skips over it.
  const attach = () => {
    if (!style.isConnected) document.head.append(style);
    if (!bar.isConnected) document.body.append(bar);
  };
  attach();
  new MutationObserver(attach).observe(document.body, { childList: true });
  render();
  return (s) => {
    status = s;
    render();
  };
}

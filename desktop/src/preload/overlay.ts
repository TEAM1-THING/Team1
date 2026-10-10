// Overlay preload. Runs beside the meeting page (sandboxed, isolated world) and
// adapts it to the desktop without changing any web file:
//   - a title bar with the logo, live status and window controls
//   - hit-testing, so the title bar and panel catch clicks and the transparent
//     corners (or everything, in click-through mode) pass them to the call
//   - hotkeys arrive as the keys the meeting page already handles
//   - a SpeechRecognition shim, so the page's own mic button (consent checkbox
//     included) drives desktop system-audio capture
import { contextBridge, ipcRenderer } from "electron";
import { isPainted, type Hit } from "../core/clickThrough";
import { mountBar, type BarStatus } from "./bar";

// ---- Title bar ----------------------------------------------------------------

let pendingStatus: BarStatus | null = null;
let updateBar: ((s: BarStatus) => void) | null = null;
ipcRenderer.on("sc:status", (_e, s: BarStatus) => {
  typing = s.typing;
  document.documentElement.toggleAttribute("data-sc-typing", s.typing);
  document.documentElement.toggleAttribute("data-sc-ghost", s.ghost);
  if (updateBar) updateBar(s);
  else pendingStatus = s;
});

// ---- Consent: the recording notice the advisor says aloud -------------------

// The overlay is hidden from the other side of the call, so a notice shown in
// it informs nobody: the notice is spoken aloud. The page's consent checkbox (ship track's MicInput) is
// relabeled here to the words the advisor says before starting the mic; it
// still has to be ticked, and Second Chair is never named to the client.
const NOTICE_LABEL = "I said: \u201cThis meeting is being recorded.\u201d";
const NOTICE_TITLE =
  "Before you turn on the mic, say that the meeting is being recorded. In California every party must know a call is recorded; carrying on after the notice is the usual way they agree. Not legal advice.";
function relabelConsent() {
  for (const label of document.querySelectorAll("label")) {
    const box = label.querySelector('input[type="checkbox"]');
    if (!box || label.dataset.scNotice === "1" || !/All parties consent/i.test(label.textContent ?? "")) continue;
    for (const n of [...label.childNodes]) if (n.nodeType === Node.TEXT_NODE) n.remove();
    label.append(NOTICE_LABEL);
    label.title = NOTICE_TITLE;
    label.dataset.scNotice = "1";
  }
}

// ---- Input: click-through hit-testing --------------------------------------

function hitAt(x: number, y: number): Hit {
  let el = document.elementFromPoint(x, y);
  if (!el) return "none";
  if (el.closest("#sc-bar")) return "bar";
  for (; el && el !== document.documentElement; el = el.parentElement) {
    if (isPainted(getComputedStyle(el))) return "content";
  }
  return "none";
}

// Probe at most once per frame, and tell main only when the answer changes,
// so a moving mouse costs one IPC per edge crossed, not one per pixel.
let hit: Hit = "none";
let px = -1;
let py = -1;
let frame = 0;
const report = (next: Hit) => {
  if (next === hit) return;
  hit = next;
  ipcRenderer.send("sc:hit", next);
};
const probe = () => {
  frame ||= requestAnimationFrame(() => {
    frame = 0;
    if (px >= 0) report(hitAt(px, py));
  });
};
window.addEventListener(
  "mousemove",
  (e) => {
    px = e.clientX;
    py = e.clientY;
    probe();
  },
  { passive: true, capture: true },
);
window.addEventListener("DOMContentLoaded", () => {
  document.documentElement.addEventListener("mouseleave", () => {
    px = -1;
    report("none");
  });
  updateBar = mountBar();
  if (pendingStatus) updateBar(pendingStatus);
  // MicInput re-mounts the checkbox each time the mic stops.
  relabelConsent();
  new MutationObserver(relabelConsent).observe(document.body, { childList: true, subtree: true });
});

// ---- Focus: typing mode -----------------------------------------------------

let typing = false;
// Escape, or clicking back into the call, hands focus back.
window.addEventListener(
  "keydown",
  (e) => {
    if (!typing || e.key !== "Escape") return;
    e.preventDefault();
    ipcRenderer.send("sc:typing", false);
  },
  true,
);
window.addEventListener("blur", () => typing && ipcRenderer.send("sc:typing", false));

// ---- Hotkeys ------------------------------------------------------------------

// Dispatched on body, where the meeting page's window listener sees a normal key.
ipcRenderer.on("sc:key", (_e, key: string) => {
  document.body?.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
});

// ---- Speech: system audio through the page's own mic button ----------------

let port: MessagePort | null = null;
const toPage = (m: unknown) => window.dispatchEvent(new CustomEvent("sc:speech", { detail: JSON.stringify(m) }));

ipcRenderer.on("sc:port", (e) => {
  port = e.ports[0] ?? null;
  if (port) port.onmessage = (m) => toPage(m.data);
});
ipcRenderer.send("sc:hello");

window.addEventListener("sc:mic", (e) => {
  const on = (e as CustomEvent<string>).detail === "start";
  if (port) port.postMessage({ type: "mic", on });
  else if (on) toPage({ type: "error", code: "audio-capture", message: "Desktop audio is not ready yet." });
});

// Runs in the page's own world, so it must not reference anything outside
// itself. Events carry strings only: they cross the world boundary intact.
// Each finished sentence goes straight to the page, which shows it at once and
// keeps only the newest analysis running.
function installSpeechShim() {
  type Self = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((e: unknown) => void) | null;
    onerror: ((e: unknown) => void) | null;
    onend: (() => void) | null;
    listener: ((e: Event) => void) | null;
  };
  const end = (self: Self) => {
    if (!self.listener) return;
    window.removeEventListener("sc:speech", self.listener);
    self.listener = null;
    setTimeout(() => self.onend?.(), 0);
  };
  function DesktopSpeechRecognition(this: Self) {
    Object.assign(this, { continuous: false, interimResults: false, lang: "en-US", onresult: null, onerror: null, onend: null, listener: null });
  }
  DesktopSpeechRecognition.prototype.start = function (this: Self) {
    if (this.listener) throw new DOMException("Recognition has already started.", "InvalidStateError");
    this.listener = (ev) => {
      const m = JSON.parse(String((ev as CustomEvent).detail));
      if (m.type === "final") {
        const result = Object.assign([{ transcript: m.text, confidence: 1 }], { isFinal: true });
        this.onresult?.({ resultIndex: 0, results: [result] });
      } else if (m.type === "error") {
        this.onerror?.({ error: m.code, message: m.message });
        end(this);
      }
    };
    window.addEventListener("sc:speech", this.listener);
    window.dispatchEvent(new CustomEvent("sc:mic", { detail: "start" }));
  };
  DesktopSpeechRecognition.prototype.stop = function (this: Self) {
    if (!this.listener) return;
    window.dispatchEvent(new CustomEvent("sc:mic", { detail: "stop" }));
    end(this);
  };
  DesktopSpeechRecognition.prototype.abort = DesktopSpeechRecognition.prototype.stop;
  for (const name of ["SpeechRecognition", "webkitSpeechRecognition"]) {
    Object.defineProperty(window, name, { value: DesktopSpeechRecognition, configurable: true, writable: true });
  }
}

contextBridge.executeInMainWorld({ func: installSpeechShim });

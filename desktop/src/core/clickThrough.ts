// Pure decisions for the overlay's mouse and focus state. No Electron or DOM
// imports, so the root test suite covers them.

// Height of the title bar the preload adds; main sizes the collapsed window to it.
export const BAR_HEIGHT = 38;

// What the pointer is over: the title bar, the meeting content, or nothing
// (the transparent corners outside the panel).
export type Hit = "bar" | "content" | "none";

export type OverlayMode = {
  typing: boolean; // the advisor asked to type: the overlay owns keys and mouse
  ghost: boolean; // click-through: clicks pass to the call, except on the title bar
  hit: Hit;
};

export const initialMode = (): OverlayMode => ({ typing: false, ghost: false, hit: "none" });

// Whether the window lets mouse events fall through to the app beneath it.
// The title bar always catches them, so click-through mode can be switched off
// (and the window moved) with the mouse.
export function ignoreMouse(m: OverlayMode): boolean {
  if (m.typing || m.hit === "bar") return false;
  if (m.ghost) return true;
  return m.hit === "none";
}

// Alpha of a computed CSS colour. Chromium serialises computed colours as
// "rgb(r, g, b)", "rgba(r, g, b, a)" or "transparent"; the slash form is accepted too.
export function colorAlpha(color: string): number {
  const c = color.trim().toLowerCase();
  if (!c || c === "transparent" || c === "none") return 0;
  const m = c.match(/^rgba?\(([^)]*)\)$/);
  if (!m) return 1;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 4) return 1;
  const a = parts[3];
  const n = a.endsWith("%") ? parseFloat(a) / 100 : parseFloat(a);
  return Number.isFinite(n) ? n : 1;
}

export type PaintStyle = {
  backgroundColor: string;
  backgroundImage: string;
  borderTopWidth: string;
  borderTopColor: string;
  opacity: string;
  visibility: string;
};

// Below this the advisor cannot see it, so a click there belongs to the app beneath.
const VISIBLE_ALPHA = 0.03;

// A computed style is painted when a click on it lands on something visible.
export function isPainted(s: PaintStyle): boolean {
  if (s.visibility === "hidden" || parseFloat(s.opacity) === 0) return false;
  if (colorAlpha(s.backgroundColor) > VISIBLE_ALPHA) return true;
  if (s.backgroundImage && s.backgroundImage !== "none") return true;
  return parseFloat(s.borderTopWidth) > 0 && colorAlpha(s.borderTopColor) > VISIBLE_ALPHA;
}

export type Rect = { x: number; y: number; width: number; height: number };

// A saved window position is reused only if most of it is still on a display
// (a monitor may have been unplugged since).
export function onScreen(r: Rect, areas: Rect[], minVisible = 0.5): boolean {
  const area = r.width * r.height;
  if (area <= 0) return false;
  const seen = areas.reduce((sum, a) => {
    const w = Math.min(r.x + r.width, a.x + a.width) - Math.max(r.x, a.x);
    const h = Math.min(r.y + r.height, a.y + a.height) - Math.max(r.y, a.y);
    return sum + (w > 0 && h > 0 ? w * h : 0);
  }, 0);
  return seen / area >= minVisible;
}

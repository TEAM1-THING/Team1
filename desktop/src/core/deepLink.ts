// Links the website hands to the desktop app, so opening the meeting in the
// browser opens it in the overlay instead:
//   secondchair://open?path=/meeting#prep=<base64url of the Prep JSON>
// The prep rides in the fragment and goes browser -> OS -> app; it never
// crosses the network. The page validates it again (zod) when it loads it.

export const SCHEME = "secondchair";
export const OPENABLE_PATHS = ["/meeting"];
const MAX_PREP_CHARS = 512 * 1024;

export type DeepLink = { path: string; prep: string | null };

export function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(s: string): string {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

// A prep is accepted only if it parses and has the Prep's top-level shape.
function readPrep(encoded: string | null): string | null {
  if (!encoded || encoded.length > MAX_PREP_CHARS) return null;
  try {
    const json = fromBase64Url(encoded);
    const p = JSON.parse(json) as Record<string, unknown> | null;
    const ok = p && typeof p === "object" && typeof p.clientFile === "object" && Array.isArray(p.sources) && typeof p.mandate === "object";
    return ok ? json : null;
  } catch {
    return null;
  }
}

// Anything that is not a well-formed open link is ignored, not guessed at.
export function parseDeepLink(raw: string): DeepLink | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== `${SCHEME}:` || u.hostname !== "open") return null;
  const asked = u.searchParams.get("path") ?? OPENABLE_PATHS[0];
  const path = OPENABLE_PATHS.includes(asked) ? asked : OPENABLE_PATHS[0];
  return { path, prep: readPrep(new URLSearchParams(u.hash.slice(1)).get("prep")) };
}

// Pure helpers for handing the meeting from the website to the Second Chair
// desktop overlay. The link format is shared with desktop/src/core/deepLink.ts:
//   secondchair://open?path=/meeting#prep=<base64url of the Prep JSON>
// The prep rides in the fragment, from the browser to the OS to the app; it is
// never sent to a server.

export const PAIRED_KEY = "secondchair.desktop"; // localStorage: the installed app paired this browser
export const DECLINED_KEY = "secondchair.desktop.declined"; // sessionStorage: "stay in the browser" this visit
export const AUTO_OPEN_PATHS = ["/", "/meeting"];

export function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function desktopLink(prepJson: string | null): string {
  return `secondchair://open?path=/meeting${prepJson ? `#prep=${toBase64Url(prepJson)}` : ""}`;
}

// Only a desktop browser the app has paired with, on the landing or meeting
// page, and never inside the overlay itself (which loads this same site).
export function shouldAutoOpen(o: { pathname: string; userAgent: string; paired: boolean; declined: boolean }): boolean {
  if (/Electron\//.test(o.userAgent) || /Mobi|Android|iPhone|iPad/.test(o.userAgent)) return false;
  return o.paired && !o.declined && AUTO_OPEN_PATHS.includes(o.pathname);
}

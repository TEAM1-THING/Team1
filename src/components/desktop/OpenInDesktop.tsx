"use client";
// Opens the meeting in the Second Chair desktop overlay instead of this tab,
// in a browser the installed app has paired with (it opens the site once with
// ?sc-desktop=paired). Anywhere else it renders nothing, so visitors without
// the app see the website exactly as before. The browser asks once before it
// opens the app; ticking "always allow" there makes it automatic.
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DECLINED_KEY, PAIRED_KEY, desktopLink, shouldAutoOpen } from "./desktopLink";

const PREP_KEY = "secondchair.prep"; // where the prep screen saves (src/lib/store.ts)

const read = (s: () => Storage, k: string) => {
  try {
    return s().getItem(k);
  } catch {
    return null;
  }
};
const write = (s: () => Storage, k: string, v: string | null) => {
  try {
    if (v === null) s().removeItem(k);
    else s().setItem(k, v);
  } catch {
    // storage blocked: the site simply stays in the browser
  }
};
const local = () => window.localStorage;
const session = () => window.sessionStorage;

type State = "idle" | "paired" | "opening";

export default function OpenInDesktop() {
  const pathname = usePathname();
  const [state, setState] = useState<State>("idle");

  const open = () => {
    window.location.href = desktopLink(read(local, PREP_KEY));
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("sc-desktop") === "paired") {
      write(local, PAIRED_KEY, "1");
      url.searchParams.delete("sc-desktop");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
      setState("paired");
      return;
    }
    const auto = shouldAutoOpen({
      pathname,
      userAgent: navigator.userAgent,
      paired: read(local, PAIRED_KEY) === "1",
      declined: read(session, DECLINED_KEY) === "1",
    });
    setState(auto ? "opening" : "idle");
    if (auto) window.location.href = desktopLink(read(local, PREP_KEY));
  }, [pathname]);

  if (state === "idle") return null;
  const btn =
    "rounded-full px-3 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300";
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#0d1219]/95 py-2 pl-4 pr-2 text-sm text-slate-100 shadow-2xl backdrop-blur-xl sm:rounded-full"
    >
      {state === "paired" ? (
        <>
          <span className="mr-auto">Meeting links in this browser now open in the Second Chair desktop overlay.</span>
          <button
            type="button"
            className={`${btn} text-slate-300 hover:bg-white/10`}
            onClick={() => {
              write(local, PAIRED_KEY, null);
              setState("idle");
            }}
          >
            Keep them in the browser
          </button>
          <button type="button" className={`${btn} bg-slate-100 font-medium text-slate-900 hover:bg-sky-100`} onClick={() => setState("idle")}>
            Done
          </button>
        </>
      ) : (
        <>
          <span className="mr-auto">Opening the meeting in the Second Chair overlay.</span>
          <button type="button" className={`${btn} bg-slate-100 font-medium text-slate-900 hover:bg-sky-100`} onClick={open}>
            Open again
          </button>
          <button
            type="button"
            className={`${btn} text-slate-300 hover:bg-white/10`}
            onClick={() => {
              write(session, DECLINED_KEY, "1");
              setState("idle");
            }}
          >
            Stay in the browser
          </button>
        </>
      )}
    </div>
  );
}

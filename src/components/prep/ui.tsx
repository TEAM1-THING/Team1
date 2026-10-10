// Small form pieces shared by the prep components, styled to match the
// meeting screen's glass look (track B). Owned by the prep track.
import type { ReactNode } from "react";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300";

export const inputClass =
  "w-full rounded-xl border border-white/15 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 " +
  "focus:border-indigo-300/60 focus:outline-none";

export const btnPrimary = `rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-indigo-100 disabled:opacity-35 ${focus}`;
export const btnGhost = `rounded-full border border-white/15 px-3 py-1.5 text-sm text-slate-100 transition-colors hover:bg-white/10 disabled:opacity-35 ${focus}`;

// The same dim room behind the glass as the meeting screen.
export function Backdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#141a26] text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#2b3a55_0%,transparent_55%),radial-gradient(ellipse_at_80%_90%,#3a2f4d_0%,transparent_50%)]"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${className}`}>
      <span className="font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}

export function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-5 shadow-xl shadow-black/20 backdrop-blur-md">
      <header>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-indigo-400/20 text-xs text-indigo-200">{n}</span>
          {title}
        </h2>
        {hint && <p className="mt-1 text-sm text-slate-400">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

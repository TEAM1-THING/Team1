// Small form pieces shared by the landing and prep screens, in the meeting
// screen's editorial look (track B): cream paper, near-black ink, one orange,
// a Didone serif for display, hairline rules, outlined pills. Values mirror
// components/meeting/ui.ts; written out in full because Tailwind only
// generates classes it can read in the source. Owned by the prep track.
import type { ReactNode } from "react";
import { display } from "./fonts";

export const tone = {
  display: "font-[family-name:var(--font-display)]",
  ink: "text-[#161412]",
  muted: "text-[#5b5248]",
  faint: "text-[#74695d]",
  // Small orange text; the bright #e8571a is for display sizes and fills only.
  accent: "text-[#b8410c]",
  paper: "rounded-2xl border border-[#161412]/15 bg-[#faf6ef]",
  chip: "inline-block w-fit shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4",
} as const;

// Provenance and status pills, the same colours as the meeting screen's.
export const CHIPS = {
  green: "bg-[#dde9d0] text-[#2f5a1e]",
  amber: "bg-[#f5e2b3] text-[#6e4600]",
  rose: "bg-[#f6d3d8] text-[#8a1f35]",
  grey: "bg-[#e3dcd0] text-[#4a433a]",
} as const;

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#161412]";

export const inputClass =
  "w-full rounded-xl border border-[#161412]/25 bg-[#faf6ef] px-3 py-2 text-sm text-[#161412] placeholder:text-[#74695d] " +
  "focus:border-[#161412] focus:outline-none";

const pill = `inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-[background-color,color,border-color] duration-150 active:translate-y-px disabled:pointer-events-none ${focus}`;
export const btnPrimary = `${pill} bg-[#161412] px-4 py-2 text-[#f2ebdf] hover:bg-[#2c2824] disabled:border disabled:border-[#161412]/20 disabled:bg-transparent disabled:text-[#74695d]`;
export const btnGhost = `${pill} border border-[#161412] px-3 py-1.5 text-[#161412] hover:bg-[#161412]/5 disabled:opacity-40`;
export const btnAccent = `${pill} bg-[#e8571a] px-4 py-2 text-[#161412] hover:bg-[#f06a30]`;

// The cream page every landing and prep screen sits on.
export function Backdrop({ children }: { children: ReactNode }) {
  return <div className={`${display.variable} min-h-screen bg-[#f2ebdf] font-sans text-[#161412] antialiased`}>{children}</div>;
}

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${className}`}>
      <span className="font-medium text-[#161412]">{label}</span>
      {children}
    </label>
  );
}

export function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className={`${tone.paper} flex flex-col gap-4 p-5 md:p-6`}>
      <header className="border-b border-[#161412]/15 pb-3">
        <h2 className="flex items-baseline gap-3 text-base font-semibold">
          <span className={`${tone.display} text-2xl leading-none text-[#e8571a] italic`}>{n}</span>
          {title}
        </h2>
        {hint && <p className={`mt-1 text-sm ${tone.muted}`}>{hint}</p>}
      </header>
      {children}
    </section>
  );
}

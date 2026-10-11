// One look for the meeting and end screens. This exists because page.tsx,
// Card, Concerns, Find and EndScreen all draw the same surfaces and buttons.
// Editorial, record-sleeve look: cream paper, near-black ink, one orange, a
// Didone serif for display (fonts.ts), hairline rules, outlined pills.
// Provenance labels keep their meaning (green prepared fact, amber calculation,
// rose suggestion, grey do-not-claim). Every text colour passes WCAG AA where it
// is used; the bright orange #e8571a is for display sizes and fills only, and
// small orange text uses #b8410c. Colours are written out in full because
// Tailwind only generates classes it can read in the source.
export const ui = {
  // Geist is loaded by the layout, but globals.css sets body to Arial; this wins.
  page: "font-sans antialiased bg-[#f2ebdf] text-[#161412]",
  display: "font-[family-name:var(--font-display)]",
  muted: "text-[#5b5248]",
  faint: "text-[#74695d]",
  accent: "text-[#b8410c]",
  rule: "border-[#161412]/15",
  surface: "rounded-2xl border border-[#161412]/15",
  paper: "rounded-2xl border border-[#161412]/15 bg-[#faf6ef]",
  // The live card: paper on cream, a full ink hairline, nothing heavier.
  raised: "rounded-2xl border border-[#161412] bg-[#faf6ef]",
  btn: "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium transition-[background-color,color,border-color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#161412] active:translate-y-px disabled:pointer-events-none",
  primary: "bg-[#161412] text-[#f2ebdf] hover:bg-[#2c2824] disabled:bg-transparent disabled:text-[#74695d] disabled:border disabled:border-[#161412]/20",
  accentBtn: "bg-[#e8571a] text-[#161412] hover:bg-[#f06a30]",
  outline: "border border-[#161412] text-[#161412] hover:bg-[#161412]/5",
  ghost: "text-[#161412] hover:bg-[#161412]/5 disabled:opacity-40",
  kbd: "rounded border border-[#161412]/25 px-1 font-sans text-[11px] leading-4 text-[#5b5248]",
  // Own token, not an override: Tailwind ranks utilities by stylesheet order.
  kbdOnDark: "rounded border border-[#f2ebdf]/40 px-1 font-sans text-[11px] leading-4 text-[#f2ebdf]",
  chip: "inline-block w-fit shrink-0 justify-self-start rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4",
} as const;

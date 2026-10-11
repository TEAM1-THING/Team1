// One look for the meeting and end screens. This exists because page.tsx,
// Card, Concerns, Find and EndScreen all draw the same surfaces and buttons.
// Colour-blocked: an ink header, tinted panels, a white live card with an ink
// border and a hard shadow. Provenance labels keep their meaning (green
// prepared fact, amber calculation, rose suggestion, grey do-not-claim).
// Every text colour here passes WCAG AA on the backgrounds it sits on.
// Radius: panels 12px, controls 8px, labels 6px. Colours are written out in
// full because Tailwind only generates classes it can read in the source.
export const ui = {
  // Geist is loaded by the layout, but globals.css sets body to Arial; this wins.
  page: "font-sans antialiased bg-[#f8f8fb] text-[#1c1a3a]",
  muted: "text-[#4e4c6e]",
  faint: "text-[#646282]",
  surface: "rounded-xl border border-[#1c1a3a]/10 bg-white",
  sky: "rounded-xl border border-[#1c1a3a]/10 bg-[#e3f0ff]",
  mint: "rounded-xl border border-[#1c1a3a]/10 bg-[#dcf6e8]",
  butter: "rounded-xl border border-[#1c1a3a]/10 bg-[#fff3c4]",
  // The live card is the one thing with an ink border and a hard shadow.
  raised: "rounded-xl border-2 border-[#1c1a3a] bg-white shadow-[5px_5px_0_#1c1a3a]",
  btn: "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-[background-color,color,transform,box-shadow] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f6bff] active:translate-y-px disabled:pointer-events-none",
  // Disabled, the primary goes quiet instead of turning into a grey block.
  primary: "bg-[#ffd43b] text-[#1c1a3a] hover:bg-[#ffdf6b] disabled:bg-white/10 disabled:text-[#b9b7d6]",
  // On light screens a button pops with an ink edge and a small hard shadow.
  pop: "border-2 border-[#1c1a3a] shadow-[2px_2px_0_#1c1a3a] active:shadow-none",
  danger: "bg-[#ff7a6b] text-[#1c1a3a] hover:bg-[#ff9488]",
  // Header buttons sit on ink; end-screen buttons on white.
  ghostOnDark: "text-[#e9e8f5] hover:bg-white/10 disabled:opacity-40",
  ghost: "text-[#1c1a3a] hover:bg-[#1c1a3a]/[0.06]",
  outline: "border-2 border-[#1c1a3a] bg-white text-[#1c1a3a] hover:bg-[#f3f2fb]",
  kbd: "rounded border border-[#1c1a3a]/20 px-1 font-sans text-[11px] leading-4 text-[#4e4c6e]",
  // Own tokens, not overrides: Tailwind ranks utilities by stylesheet order, so
  // appending colours to kbd would not win.
  kbdOnDark: "rounded border border-white/25 px-1 font-sans text-[11px] leading-4 text-[#b9b7d6]",
  kbdOnLight: "rounded border border-[#1c1a3a]/30 px-1 font-sans text-[11px] leading-4 text-[#1c1a3a]",
  chip: "inline-block w-fit shrink-0 justify-self-start rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-4",
} as const;

// A colour per kind of moment, so a glance tells an objection from a disclosure.
// Ink text passes AA on each.
export const MOMENT_TINT: Record<string, string> = {
  objection: "bg-[#ffb4a2]",
  hesitation: "bg-[#ffe07a]",
  disclosure: "bg-[#a8e6cf]",
  emotional_concern: "bg-[#ffc4e1]",
  contradiction: "bg-[#ffc48c]",
  question: "bg-[#b8d8ff]",
  misunderstanding: "bg-[#d7c6ff]",
  buying_signal: "bg-[#c7f27a]",
  priority_change: "bg-[#9fe7f5]",
  commitment: "bg-[#b9f0b8]",
  unresolved_concern: "bg-[#e2e2ea]",
};

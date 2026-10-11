// One look for the meeting and end screens. This exists because page.tsx,
// Card, Concerns, Find and EndScreen all draw the same surfaces and buttons.
// Colour carries meaning only (provenance labels, the live dot); everything
// else is warm neutral. Radius: panels 12px, controls 8px, labels 6px.
export const ui = {
  // Geist is loaded by the layout, but globals.css sets body to Arial; this wins.
  page: "font-sans antialiased bg-[#0f1012] text-[#ecebe8]",
  surface: "rounded-xl border border-white/[0.07] bg-[#16181b]",
  // The live card is the only raised thing on screen.
  raised:
    "rounded-xl border border-white/[0.09] bg-[#1b1d21] shadow-[inset_0_1px_0_rgb(255_255_255/0.04),0_16px_40px_-24px_rgb(0_0_0/0.8)]",
  muted: "text-[#a6a39c]",
  faint: "text-[#8a8781]",
  btn: "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm transition-[background-color,color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ecebe8] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-35",
  primary: "bg-[#ecebe8] font-medium text-[#141518] hover:bg-white",
  ghost: "text-[#cfccc5] hover:bg-white/[0.06]",
  outline: "border border-white/[0.12] text-[#ecebe8] hover:bg-white/[0.05]",
  danger: "bg-rose-600 font-medium text-white hover:bg-rose-700",
  kbd: "rounded border border-white/[0.12] px-1 font-sans text-[11px] leading-4 text-[#8f8c85]",
  // On the light primary button; its own token because Tailwind ranks utilities by
  // stylesheet order, so appending colours to kbd above would not override it.
  kbdOnLight: "rounded border border-black/15 px-1 font-sans text-[11px] leading-4 text-[#5d5b56]",
  chip: "inline-block w-fit shrink-0 justify-self-start rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-4",
} as const;

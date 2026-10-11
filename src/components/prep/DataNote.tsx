// What happens to the meeting data, in one sentence and then the detail (#40).
// Block 2 tester 2: "I am concerned with how an AI tool would capture my
// meeting ... and use that or share that and help the tool grow." Shown on
// the landing, prep and meeting screens. Every line describes the app as
// built (record.ts, docs/base44); change it when the data flow changes.
// Owned by the prep track; the meeting screen imports it.

export const DATA_SUMMARY =
  "Second Chair does not train AI on your meeting, and saves it to your records only when you sign in and save it.";

export const DATA_DETAILS = [
  "Cards: what is said in the meeting, with your prep, is sent to Claude through Anthropic's API to write each card. Anthropic does not train on API data by default.",
  "Live mic: your browser's speech service turns speech into text (Google in Chrome, Apple in Safari), under that company's own privacy terms. Second Chair keeps no audio.",
  "Prep: files you upload are sent to Claude to be read, and the prep stays in this browser. Pre-flight searches the web for public figures only, never client details.",
  "End meeting: the record (client name, cards, concerns and your grades of the cards; no transcript or audio) downloads to your computer, and waits in the records database for up to an hour so the records app can open it once.",
  "Saved records: only when you sign in to the records app and save. You see your own; compliance can read and mark them reviewed. No one can edit or delete a saved record from the apps.",
] as const;

// The sentence is always visible; the detail opens on click. compact: the
// detail floats over the page instead of pushing it down (the meeting screen
// does not scroll).
export function DataNote({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <details className={`group relative ${compact ? "inline-block" : "text-left"} ${className}`}>
      <summary className="cursor-pointer list-none underline decoration-dotted underline-offset-2 [&::-webkit-details-marker]:hidden">
        {DATA_SUMMARY}
      </summary>
      <ul
        className={
          compact
            ? "absolute top-full left-1/2 z-30 mt-2 flex w-[min(36rem,90vw)] -translate-x-1/2 list-disc flex-col gap-1.5 rounded-xl border border-[#161412]/15 bg-[#faf6ef] py-3 pr-4 pl-8 text-left text-xs text-[#161412] shadow-xl backdrop-blur-xl"
            : "mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[#5b5248]"
        }
      >
        {DATA_DETAILS.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </details>
  );
}

// Home. Owned by the prep track.
import Link from "next/link";
import { DataNote } from "@/components/prep/DataNote";
import { Backdrop, btnGhost, btnPrimary, CHIPS, tone } from "@/components/prep/ui";

// Advisory first (#43): it reads the client and suggests the answer; the
// figures back the answer up. Block 2 tester 2: naming the worry lets the
// advisor focus on responding.
const POINTS = [
  ["It reads the client", "As they talk, it names the worry behind a question, what they want to decide, or a life event you should not miss."],
  ["It suggests your answer", "A line you could say, the way good advisors answer: acknowledge the feeling, tie it to their goal, give the plan's figures, ask. You decide what to say."],
  ["Backed by your own figures", "Every figure is labelled: a prepared fact from your files, a calculation with the math shown, or a suggestion."],
] as const;

// The same label pills the advisor sees on a live card.
const LABELS = [
  ["Prepared fact", CHIPS.green],
  ["Calculation", CHIPS.amber],
  ["Suggestion", CHIPS.rose],
] as const;

export default function Home() {
  return (
    <Backdrop>
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-4">
          <p className="flex items-baseline gap-3 border-b border-[#161412]/15 pb-3">
            <span className={`${tone.display} text-[22px] leading-none italic`}>Second Chair</span>
            <span className={`text-sm ${tone.muted}`}>for wealth advisors</span>
          </p>
          <h1 className={`${tone.display} max-w-[16ch] text-[44px] leading-[0.95] text-balance text-[#e8571a] uppercase md:text-[64px]`}>
            It reads your client, so you can focus on the answer
          </h1>
          {/* Block 2 tester 1, on opening the link: "I don't know what I'm looking at." */}
          <p className="text-lg text-[#5b5248]">
            A private screen you keep open while a client talks: it shows what they likely mean, what to say next, and the
            figures from your own plan. New here? <span className="font-medium text-[#161412]">Try the demo meeting</span>, a
            short replay with a fictional client.
          </p>
        </div>
        <ul className="flex flex-col border-b border-[#161412]/15">
          {POINTS.map(([title, body], i) => (
            <li key={title} className="grid grid-cols-[2.5rem_1fr] border-t border-[#161412]/15 py-4">
              <span className={`${tone.display} text-2xl leading-none text-[#e8571a] italic`}>{i + 1}</span>
              <div>
                <p className="font-semibold text-[#161412]">{title}</p>
                <p className="mt-0.5 text-[#5b5248]">{body}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2" aria-label="Labels used on every card">
          {LABELS.map(([text, chip]) => (
            <span key={text} className={`${tone.chip} ${chip}`}>
              {text}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className={btnPrimary} href="/prep">
            Prepare a meeting
          </Link>
          <Link className={`${btnGhost} px-4 py-2`} href="/meeting">
            Try the demo meeting
          </Link>
        </div>
        <DataNote className="text-sm text-[#5b5248]" />
      </main>
    </Backdrop>
  );
}

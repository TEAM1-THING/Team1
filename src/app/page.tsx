// Home. Owned by the prep track.
import Link from "next/link";
import { DataNote } from "@/components/prep/DataNote";
import { Backdrop, btnGhost, btnPrimary } from "@/components/prep/ui";

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
  ["Prepared fact", "bg-emerald-400/15 text-emerald-300"],
  ["Calculation", "bg-amber-400/15 text-amber-300"],
  ["Suggestion", "bg-rose-400/15 text-rose-300"],
] as const;

export default function Home() {
  return (
    <Backdrop>
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-indigo-300">Second Chair · for wealth advisors</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            It reads your client, so you can focus on the answer
          </h1>
          {/* Block 2 tester 1, on opening the link: "I don't know what I'm looking at." */}
          <p className="text-lg text-slate-300">
            A private screen you keep open while a client talks: it shows what they likely mean, what to say next, and the
            figures from your own plan. New here? <span className="font-medium text-white">Try the demo meeting</span>, a
            short replay with a fictional client.
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {POINTS.map(([title, body]) => (
            <li key={title} className="rounded-2xl border border-white/10 bg-slate-900/60 px-5 py-4 backdrop-blur-md">
              <p className="font-semibold text-slate-100">{title}</p>
              <p className="mt-0.5 text-slate-300">{body}</p>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2" aria-label="Labels used on every card">
          {LABELS.map(([text, chip]) => (
            <span key={text} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${chip}`}>
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
        <DataNote className="text-sm text-slate-400" />
      </main>
    </Backdrop>
  );
}

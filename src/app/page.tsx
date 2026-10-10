// Home. Owned by the prep track.
import Link from "next/link";
import { Backdrop, btnGhost, btnPrimary } from "@/components/prep/ui";

const POINTS = [
  ["Live, during the meeting", "As the client talks, it spots the worry behind a question, a contradiction or a buying signal, and privately shows you what to say next."],
  ["Not a note-taker", "It works in the room, while it still matters, not in a summary afterwards."],
  ["You always know what's solid", "Every suggestion is labelled: a prepared fact from your own plan, a quick calculation with the math shown, or just a suggested way to put it."],
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
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">Catch what you&apos;d miss in the moment</h1>
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
      </main>
    </Backdrop>
  );
}

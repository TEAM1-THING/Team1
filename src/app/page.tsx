// Home. Owned by the prep track.
import Link from "next/link";

const POINTS = [
  ["Live, during the meeting", "As the client talks, it spots the worry behind a question, a contradiction or a buying signal, and privately shows you what to say next."],
  ["Not a note-taker", "It works in the room, while it still matters, not in a summary afterwards."],
  ["You always know what's solid", "Every suggestion is labelled: a prepared fact from your own plan, a quick calculation with the math shown, or just a suggested way to put it."],
] as const;

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-neutral-600">Second Chair · for wealth advisors</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">Catch what you&apos;d miss in the moment</h1>
      </div>
      <ul className="flex flex-col gap-4">
        {POINTS.map(([title, body]) => (
          <li key={title}>
            <p className="font-semibold">{title}</p>
            <p className="text-neutral-700">{body}</p>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        <Link className="rounded bg-black px-4 py-2 text-white" href="/prep">
          Prepare a meeting
        </Link>
        <Link className="rounded border px-4 py-2" href="/meeting">
          Try the demo meeting
        </Link>
      </div>
    </main>
  );
}

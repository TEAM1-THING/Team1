// Home. Owned by the prep track.
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold">Second Chair</h1>
      <p>A live copilot for wealth advisors in client meetings.</p>
      <div className="flex gap-3">
        <Link className="rounded bg-black px-4 py-2 text-white" href="/prep">Prepare a meeting</Link>
        <Link className="rounded border px-4 py-2" href="/meeting">Start demo meeting</Link>
      </div>
    </main>
  );
}

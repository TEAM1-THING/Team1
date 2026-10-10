"use client";
// End screen: what the meeting caught, what is still open, and where the
// record went. Shown over the live view once End meeting is pressed.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { base44Url, buildRecord, recordFileName, recordLink } from "@/lib/record";
import type { Card, Concern, Prep } from "@/lib/types";
import Concerns from "./Concerns";
import { endSummary } from "./endSummary";

type Props = { prep: Prep; cards: Card[]; concerns: Concern[]; tasks: string[]; clock: string; onBack: () => void };

const btn =
  "rounded-full px-4 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 active:scale-[0.98]";
const panel = "sc-glass rounded-2xl border border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl";

export default function EndScreen({ prep, cards, concerns, tasks, clock, onBack }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const summary = endSummary(cards, concerns);
  // Once, at the moment the record was exported, not on every re-render.
  const [record] = useState(() => buildRecord(prep, { concerns, cards }));
  const fileName = recordFileName(record);
  // Reopening the records app brings this record with it, as End meeting does.
  const base = base44Url();
  const records = base ? recordLink(base, record) : null;
  const heading = useRef<HTMLHeadingElement>(null);
  const back = useRef(onBack);
  useEffect(() => {
    back.current = onBack;
  }, [onBack]);

  // Focus moves into the dialog once, on open; Escape is Back to meeting.
  useEffect(() => {
    heading.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") back.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const copyTasks = async () => {
    try {
      await navigator.clipboard.writeText(tasks.join("\n"));
      setCopied(`Copied ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}.`);
    } catch {
      setCopied("Copy was blocked by the browser. Select the list and copy it by hand.");
    }
  };

  const stats = [
    [cards.length, cards.length === 1 ? "moment caught" : "moments caught"],
    [summary.resolved, summary.resolved === 1 ? "concern resolved" : "concerns resolved"],
    [summary.open, "still open"],
  ] as const;

  return (
    // A full-screen layer over the live view, so Back to meeting returns to it as it was.
    <div role="dialog" aria-modal="true" aria-labelledby="end-h" className="fixed inset-0 z-30 overflow-y-auto bg-[#0d1219]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_25%_15%,rgb(56_120_168/0.28)_0%,transparent_55%),radial-gradient(ellipse_at_85%_95%,rgb(30_64_90/0.35)_0%,transparent_50%)]"
      />
      <p role="note" className="relative border-b border-white/5 bg-sky-400/10 px-4 py-1.5 text-center text-xs text-sky-100">
        This meeting uses Second Chair. All participants have been told and agreed.
      </p>
      <main className="sc-arrive relative mx-auto flex w-full max-w-4xl flex-col gap-5 p-4 md:p-6">
        <header className="flex flex-col gap-1 pt-2">
          <p className="text-sm text-slate-400">
            Meeting ended · <span className="tabular-nums">{clock}</span> with {prep.clientFile.name}
          </p>
          <h1 id="end-h" ref={heading} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-slate-50 outline-none">
            Here&apos;s what Second Chair caught
          </h1>
        </header>

        <dl className="grid grid-cols-3 gap-3">
          {stats.map(([n, label]) => (
            <div key={label} className={`${panel} p-4`}>
              <dt className="text-xs text-slate-400">{label}</dt>
              <dd className="text-3xl font-semibold tabular-nums text-slate-50">{n}</dd>
            </div>
          ))}
        </dl>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <section aria-labelledby="moments-h" className={panel}>
            <h2 id="moments-h" className="mb-3 text-sm font-semibold text-slate-200">
              Moments
            </h2>
            {summary.moments.length === 0 ? (
              <p className="text-sm text-slate-400">No moments needed a card in this meeting.</p>
            ) : (
              <ol className="space-y-3">
                {summary.moments.map((m) => (
                  <li key={m.id} className="text-sm">
                    <p className="flex items-baseline gap-2">
                      <span className="text-xs tabular-nums text-slate-500">{m.turnId}</span>
                      <span className="font-semibold text-sky-300">{m.moment}</span>
                      {m.resolved && (
                        <span className="ml-auto shrink-0 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] text-emerald-300">
                          resolved
                        </span>
                      )}
                    </p>
                    <p className="text-slate-300">{m.concern}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div className="flex flex-col gap-5">
            {/* #39: the same client picture the meeting screen showed. */}
            <Concerns concerns={concerns} />
            <section aria-labelledby="followups-h" className={`${panel} border-sky-300/30`}>
              <h2 id="followups-h" className="mb-1 text-sm font-semibold text-slate-200">
                Follow-ups from this meeting
              </h2>
              <p className="mb-3 text-sm text-slate-400">
                {tasks.length ? "Concerns the client raised that are still open." : "No open concerns. Nothing to follow up."}
              </p>
              {tasks.length > 0 && (
                <>
                  <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-slate-200">
                    {tasks.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void copyTasks()}
                      className={`${btn} bg-slate-100 font-medium text-slate-900 hover:bg-sky-100`}
                    >
                      Copy as tasks
                    </button>
                    {copied && (
                      <span role="status" className="text-sm text-slate-400">
                        {copied}
                      </span>
                    )}
                  </div>
                </>
              )}
            </section>

            <section aria-labelledby="record-h" className={panel}>
              <h2 id="record-h" className="mb-1 text-sm font-semibold text-slate-200">
                Record
              </h2>
              <p className="mb-3 break-all text-sm text-slate-400">
                <span className="text-emerald-300">✓</span> Downloaded {fileName}
              </p>
              {records && (
                <a
                  href={records}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${btn} inline-block border border-white/15 text-slate-100 hover:bg-white/10`}
                >
                  Open compliance records ↗
                </a>
              )}
            </section>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button type="button" onClick={onBack} className={`${btn} text-slate-300 hover:bg-white/10`}>
            ← Back to meeting
          </button>
          <Link href="/prep" className={`${btn} bg-slate-100 font-medium text-slate-900 hover:bg-sky-100`}>
            Prepare next meeting →
          </Link>
        </footer>
      </main>
    </div>
  );
}

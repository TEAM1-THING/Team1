"use client";
// End screen: what the meeting caught, what is still open, and where the
// record went. Shown over the live view once End meeting is pressed.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { base44Url, buildRecord, openRecordsApp, recordFileName } from "@/lib/record";
import type { Card, Concern, Prep } from "@/lib/types";
import Concerns from "./Concerns";
import { endSummary } from "./endSummary";
import { MOMENT_TINT, ui } from "./ui";

type Props = { prep: Prep; cards: Card[]; concerns: Concern[]; tasks: string[]; clock: string; onBack: () => void };

export default function EndScreen({ prep, cards, concerns, tasks, clock, onBack }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const summary = endSummary(cards, concerns);
  // Once, at the moment the record was exported, not on every re-render.
  const [record] = useState(() => buildRecord(prep, { concerns, cards }));
  const fileName = recordFileName(record);
  // Reopening the records app hands this record over by one-time id, as End
  // meeting does (openRecordsApp opens the tab inside the click).
  const hasRecordsApp = base44Url() !== null;
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

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const tally = `${plural(cards.length, "moment caught", "moments caught")}, ${plural(summary.resolved, "concern resolved", "concerns resolved")}, ${summary.open} still open.`;

  return (
    // A full-screen layer over the live view, so Back to meeting returns to it as it was.
    <div role="dialog" aria-modal="true" aria-labelledby="end-h" className={`${ui.page} fixed inset-0 z-30 overflow-y-auto`}>
      <p role="note" className="bg-[#ffe36e] px-4 py-1.5 text-center text-xs text-[#1c1a3a]">
        This meeting uses Second Chair. All participants have been told and agreed.
      </p>
      <main className="sc-arrive mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-8">
        <header className="flex flex-col gap-1.5">
          <p className={`text-sm ${ui.faint}`}>
            Meeting with {prep.clientFile.name} ended at <span className="tabular-nums">{clock}</span>
          </p>
          <h1 id="end-h" ref={heading} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-balance outline-none md:text-[28px]">
            Here&apos;s what Second Chair caught
          </h1>
          <p className={`text-[15px] ${ui.muted}`}>{tally}</p>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <section aria-labelledby="moments-h" className={`${ui.raised} p-5`}>
            <h2 id="moments-h" className="mb-4 text-sm font-medium">
              Moments
            </h2>
            {summary.moments.length === 0 ? (
              <p className={`text-sm ${ui.muted}`}>No moments needed a card in this meeting.</p>
            ) : (
              <ol className="space-y-4">
                {summary.moments.map((m) => (
                  <li key={m.id} className="grid grid-cols-[2.25rem_1fr] gap-x-2 text-sm">
                    <span className={`pt-px text-xs tabular-nums ${ui.faint}`}>{m.turnId}</span>
                    <div>
                      <p className="flex items-baseline gap-2">
                        <span className={`rounded-md border border-[#1c1a3a]/15 px-2 py-0.5 text-xs font-semibold ${MOMENT_TINT[m.moment.toLowerCase().replace(/\s+/g, "_")] ?? "bg-[#e2e2ea]"}`}>
                          {m.moment}
                        </span>
                        {m.resolved && <span className={`${ui.chip} ml-auto bg-[#cff5dc] text-[#0e5a2c]`}>Resolved</span>}
                      </p>
                      <p className={`mt-0.5 text-pretty ${ui.muted}`}>{m.concern}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div className="flex flex-col gap-6">
            {/* #39: the same client picture the meeting screen showed. */}
            <Concerns concerns={concerns} />
            <section aria-labelledby="followups-h" className={`${ui.sky} p-5`}>
              <h2 id="followups-h" className="mb-1 text-sm font-medium">
                Follow-ups from this meeting
              </h2>
              <p className={`mb-3 text-sm ${ui.faint}`}>
                {tasks.length ? "What the client raised that is still open." : "Nothing is still open. No follow-ups."}
              </p>
              {tasks.length > 0 && (
                <>
                  <ul className="mb-4 space-y-1.5 text-sm">
                    {tasks.map((t) => (
                      <li key={t} className="text-pretty">
                        {t}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => void copyTasks()} className={`${ui.btn} ${ui.primary} ${ui.pop}`}>
                      Copy as tasks
                    </button>
                    {copied && (
                      <span role="status" className={`text-sm ${ui.muted}`}>
                        {copied}
                      </span>
                    )}
                  </div>
                </>
              )}
            </section>

            <section aria-labelledby="record-h" className={`${ui.butter} p-5`}>
              <h2 id="record-h" className="mb-1 text-sm font-medium">
                Record
              </h2>
              <p className={`mb-3 text-sm break-all ${ui.muted}`}>Downloaded {fileName}</p>
              {hasRecordsApp && (
                <button type="button" onClick={() => void openRecordsApp(record)} className={`${ui.btn} ${ui.outline}`}>
                  Open compliance records
                </button>
              )}
            </section>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1c1a3a]/10 pt-5">
          <button type="button" onClick={onBack} className={`${ui.btn} ${ui.ghost}`}>
            Back to meeting
          </button>
          <Link href="/prep" className={`${ui.btn} ${ui.primary} ${ui.pop}`}>
            Prepare next meeting
          </Link>
        </footer>
      </main>
    </div>
  );
}

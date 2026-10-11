"use client";
// End screen: what the meeting caught, what is still open, and where the
// record went. Shown over the live view once End meeting is pressed.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buildRecord, exportRecord, openRecordsApp, recordFileName, recordsAppUrl, type CardGrade, type Grade } from "@/lib/record";
import type { Card, Concern, Prep } from "@/lib/types";
import Concerns from "./Concerns";
import { endSummary } from "./endSummary";
import { ui } from "./ui";

type Props = { prep: Prep; cards: Card[]; concerns: Concern[]; tasks: string[]; clock: string; onBack: () => void };

// #42: the advisor grades each card so the record can be audited over time.
const GRADE_BUTTONS: [Exclude<Grade, "ungraded">, string][] = [
  ["helpful", "Helpful"],
  ["not_needed", "Not needed"],
  ["wrong", "Wrong"],
];

export default function EndScreen({ prep, cards, concerns, tasks, clock, onBack }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const [grades, setGrades] = useState<Record<string, CardGrade>>({});
  const [handed, setHanded] = useState(false);
  const graded = Object.values(grades);
  // Pressing the chosen grade again clears it back to ungraded.
  const grade = (cardId: string, g: Exclude<Grade, "ungraded">) => {
    setHanded(false);
    setGrades((prev) => {
      const next = { ...prev };
      if (next[cardId]?.grade === g) delete next[cardId];
      else next[cardId] = { cardId, grade: g, gradedAt: new Date().toISOString() };
      return next;
    });
  };
  const summary = endSummary(cards, concerns);
  // Once, at the moment the record was exported, not on every re-render.
  const [record] = useState(() => buildRecord(prep, { concerns, cards }));
  const fileName = recordFileName(record);
  // Reopening the records app hands this record over by one-time id, as End
  // meeting does (openRecordsApp opens the tab inside the click). Off for the
  // MVP (RECORDS_APP_ON): the record only downloads, and nothing asks to sign in.
  const hasRecordsApp = recordsAppUrl() !== null;
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
      <p role="note" className={`border-b border-white/[0.05] px-4 py-1.5 text-center text-xs ${ui.faint}`}>
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
          <section aria-labelledby="moments-h" className={`${ui.surface} p-5`}>
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
                        <span className="font-medium">{m.moment}</span>
                        {m.resolved && <span className={`${ui.chip} ml-auto bg-emerald-400/15 text-emerald-300`}>Resolved</span>}
                      </p>
                      <p className={`mt-0.5 text-pretty ${ui.muted}`}>{m.concern}</p>
                      <div role="group" aria-label={`Grade the card at ${m.turnId}`} className="mt-2 flex flex-wrap gap-1.5">
                        {GRADE_BUTTONS.map(([g, label]) => {
                          const on = grades[m.id]?.grade === g;
                          return (
                            <button
                              key={g}
                              type="button"
                              aria-pressed={on}
                              onClick={() => grade(m.id, g)}
                              className={`${ui.chip} border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ecebe8] ${
                                on ? "border-transparent bg-[#ecebe8] text-[#141518]" : `border-white/[0.12] ${ui.muted} hover:bg-white/[0.06]`
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div className="flex flex-col gap-6">
            {/* #39: the same client picture the meeting screen showed. */}
            <Concerns concerns={concerns} />
            <section aria-labelledby="followups-h" className={`${ui.surface} p-5`}>
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
                    <button type="button" onClick={() => void copyTasks()} className={`${ui.btn} ${ui.primary}`}>
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

            <section aria-labelledby="record-h" className={`${ui.surface} p-5`}>
              <h2 id="record-h" className="mb-1 text-sm font-medium">
                Record
              </h2>
              <p className={`mb-3 text-sm break-all ${ui.muted}`}>Downloaded {fileName}</p>
              {cards.length > 0 && (
                <p role="status" className={`mb-3 text-sm ${ui.faint}`}>
                  {handed
                    ? `Downloaded again with ${graded.length} of ${cards.length} graded.${hasRecordsApp ? " Save this version in the records app." : ""}`
                    : `Graded ${graded.length} of ${cards.length}. Ungraded cards are marked ungraded in the record.`}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {cards.length > 0 && (
                  <button
                    type="button"
                    disabled={graded.length === 0}
                    // From the click, so the records app tab (when on) opens with the graded record.
                    onClick={() => {
                      setHanded(true);
                      void exportRecord(prep, { concerns, cards }, graded);
                    }}
                    className={`${ui.btn} ${ui.primary}`}
                  >
                    {hasRecordsApp ? "Hand over with grades" : "Download with grades"}
                  </button>
                )}
                {hasRecordsApp && (
                  <button
                    type="button"
                    onClick={() => void openRecordsApp(graded.length ? buildRecord(prep, { concerns, cards }, graded) : record)}
                    className={`${ui.btn} ${ui.outline}`}
                  >
                    Open compliance records
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5">
          <button type="button" onClick={onBack} className={`${ui.btn} ${ui.ghost}`}>
            Back to meeting
          </button>
          <Link href="/prep" className={`${ui.btn} ${ui.primary}`}>
            Prepare next meeting
          </Link>
        </footer>
      </main>
    </div>
  );
}

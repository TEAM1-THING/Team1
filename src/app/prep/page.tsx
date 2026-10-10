// Prep screen. Owned by the prep track: plan and client file in, Mandate
// confirmed, then savePrep() and go to /meeting.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClientFileForm } from "@/components/prep/ClientFileForm";
import { FileDrop, type IngestResponse } from "@/components/prep/FileDrop";
import { MeetingSummary } from "@/components/prep/MeetingSummary";
import { MandatePanel } from "@/components/prep/MandatePanel";
import { confirmPrep } from "@/components/prep/prepModel";
import { SourcesEditor } from "@/components/prep/SourcesEditor";
import { Backdrop, btnPrimary, Step } from "@/components/prep/ui";
import { demoPrep } from "@/data/demo";
import { traceConflicts } from "@/lib/provenance";
import { savePrep } from "@/lib/store";
import type { Prep } from "@/lib/types";

const FIELD_NAMES: Record<string, string> = {
  name: "client name",
  age: "age",
  horizonYears: "years to goal",
  cashOnHand: "cash on hand",
  investable: "investable assets",
  riskTolerance: "risk tolerance",
  statedGoals: "goals",
  statedConcerns: "concerns",
};


export default function PrepPage() {
  const router = useRouter();
  const [prep, setPrep] = useState<Prep>({ ...demoPrep, confirmed: false });
  const [mandateOk, setMandateOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Files first; the forms below are where the advisor checks what was read.
  const [reviewing, setReviewing] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const set = (patch: Partial<Prep>) => setPrep((p) => ({ ...p, ...patch }));
  // Re-traced on every edit, so fixing a figure in a source clears its warning.
  const conflicts = traceConflicts(prep.conflicts ?? [], prep.sources);
  const titleOf = (id: string) => prep.sources.find((s) => s.id === id)?.title.trim() || "an untitled file";

  function read(r: IngestResponse) {
    setPrep({
      meeting: r.meeting,
      clientFile: r.clientFile,
      sources: r.sources,
      mandate: r.mandate,
      conflicts: r.conflicts ?? [],
      confirmed: false,
    });
    setMissing(r.missing);
    setMandateOk(false);
    setReviewing(true);
  }

  function start() {
    try {
      savePrep(confirmPrep(prep));
      router.push("/meeting");
    } catch {
      setError("Something in the prep is incomplete. Check every field has a value.");
    }
  }

  return (
    <Backdrop>
      <p role="note" className="bg-indigo-500/20 px-4 py-1.5 text-center text-xs text-indigo-100">
        Second Chair listens to the meeting. Tell your client and get their consent before you start; California
        requires every party to agree.
      </p>

      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 pb-32 sm:px-6">
        <header className="flex items-center justify-between pt-6 pb-1">
          <Link href="/" className="font-semibold text-slate-100 hover:text-indigo-200">
            ← Second Chair
          </Link>
          <span className="text-sm text-slate-400">Prepare a meeting</span>
        </header>

        <Step n={1} title="Your materials" hint="Second Chair reads your files and fills in the prep. You check it below.">
          <FileDrop onRead={read} />
          {!reviewing && (
            <button
              type="button"
              className="self-start text-xs text-slate-400 underline hover:text-slate-200"
              onClick={() => setReviewing(true)}
            >
              Enter the prep by hand instead
            </button>
          )}
        </Step>

        {reviewing && prep.meeting && (
          <MeetingSummary value={prep.meeting} onChange={(meeting) => set({ meeting })} />
        )}

        {reviewing && missing.length > 0 && (
          <p role="note" className="rounded-xl bg-amber-500/15 px-4 py-2 text-sm text-amber-100">
            Not found in your files. Fill in if it matters for this meeting:{" "}
            {missing.map((m) => FIELD_NAMES[m] ?? m).join(", ")}.
          </p>
        )}

        {reviewing && conflicts.length > 0 && (
          <div role="note" className="rounded-xl bg-amber-500/15 px-4 py-2 text-sm text-amber-100">
            <p>
              Your files disagree on {conflicts.length === 1 ? "a figure" : `${conflicts.length} figures`}. Check which
              is current before the meeting:
            </p>
            <ul className="mt-1 list-disc pl-5">
              {conflicts.map((c, i) => (
                <li key={i}>
                  {c.quantity.charAt(0).toUpperCase() + c.quantity.slice(1)}:{" "}
                  {c.values.map((v) => `${v.value} in ${titleOf(v.sourceId)}`).join(", ")}.
                </li>
              ))}
            </ul>
          </div>
        )}

        {reviewing && (
        <Step n={2} title="Client file" hint="Read from your files. Check and edit.">
          <ClientFileForm value={prep.clientFile} onChange={(clientFile) => set({ clientFile })} />
        </Step>
        )}

        {reviewing && (
        <Step n={3} title="Plan and materials" hint="What was read from each file. Prepared facts on the cards trace back to these.">
          <SourcesEditor value={prep.sources} onChange={(sources) => set({ sources })} />
        </Step>
        )}

        {reviewing && (
        <Step n={4} title="Mandate" hint="The bounds every improvised answer stays inside. Anything outside gets a defer suggestion.">
          <MandatePanel
            prep={prep}
            value={prep.mandate}
            onChange={(mandate) => {
              set({ mandate });
              setMandateOk(false);
            }}
          />
        </Step>
        )}
      </main>

      {reviewing && (
      <footer className="fixed inset-x-0 bottom-0 z-20 px-4 pb-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl border border-white/15 bg-slate-900/80 p-3 shadow-xl shadow-black/30 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-end sm:gap-4 sm:pl-5">
          {error && (
            <p role="alert" className="text-sm text-rose-300 sm:mr-auto">
              {error}
            </p>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input className="accent-indigo-400" type="checkbox" checked={mandateOk} onChange={(e) => setMandateOk(e.target.checked)} />
            I&apos;ve reviewed and confirm the Mandate
          </label>
          <button type="button" disabled={!mandateOk} onClick={start} className={btnPrimary}>
            Confirm and start meeting →
          </button>
        </div>
      </footer>
      )}
    </Backdrop>
  );
}

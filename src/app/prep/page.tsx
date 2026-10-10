// Prep screen. Owned by the prep track: plan and client file in, Mandate
// confirmed, then savePrep() and go to /meeting.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClientFileForm } from "@/components/prep/ClientFileForm";
import { MandatePanel } from "@/components/prep/MandatePanel";
import { confirmPrep } from "@/components/prep/prepModel";
import { SourcesEditor } from "@/components/prep/SourcesEditor";
import { Step } from "@/components/prep/ui";
import { demoPrep } from "@/data/demo";
import { savePrep } from "@/lib/store";
import type { Prep } from "@/lib/types";

export default function PrepPage() {
  const router = useRouter();
  const [prep, setPrep] = useState<Prep>({ ...demoPrep, confirmed: false });
  const [mandateOk, setMandateOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Prep>) => setPrep((p) => ({ ...p, ...patch }));

  function start() {
    try {
      savePrep(confirmPrep(prep));
      router.push("/meeting");
    } catch {
      setError("Something in the prep is incomplete. Check every field has a value.");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 sm:px-6">
      <header className="flex items-center justify-between py-5">
        <Link href="/" className="font-semibold">
          ← Second Chair
        </Link>
        <span className="text-sm text-neutral-600">Prepare a meeting</span>
      </header>

      <p className="mb-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm">
        <strong>Consent:</strong> Second Chair listens to the meeting. Tell your client and get their consent before
        you start; California requires every party to agree.
      </p>

      <Step n={1} title="Client file">
        <ClientFileForm value={prep.clientFile} onChange={(clientFile) => set({ clientFile })} />
      </Step>

      <Step n={2} title="Plan and materials" hint="What you prepared. Prepared facts on the cards trace back to these.">
        <SourcesEditor value={prep.sources} onChange={(sources) => set({ sources })} />
      </Step>

      <Step n={3} title="Mandate" hint="The bounds every improvised answer stays inside. Anything outside gets a defer suggestion.">
        <MandatePanel
          sources={prep.sources}
          value={prep.mandate}
          onChange={(mandate) => {
            set({ mandate });
            setMandateOk(false);
          }}
        />
      </Step>

      <footer className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4 sm:px-6">
          {error && (
            <p role="alert" className="text-sm text-red-700 sm:mr-auto">
              {error}
            </p>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={mandateOk} onChange={(e) => setMandateOk(e.target.checked)} />
            I&apos;ve reviewed and confirm the Mandate
          </label>
          <button
            type="button"
            disabled={!mandateOk}
            onClick={start}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-40"
          >
            Confirm and start meeting →
          </button>
        </div>
      </footer>
    </main>
  );
}

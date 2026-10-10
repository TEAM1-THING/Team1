// Step 3: draft the Mandate from the plan, let the advisor edit it, then run
// the pre-flight check on the plan's figures. Owned by the prep track.
"use client";

import { useState } from "react";
import type { PreflightCheck } from "@/app/api/preflight/route";
import type { Mandate, PrepSource } from "@/lib/types";
import { fromLines, readMandate, sourcesBody, toLines } from "./prepModel";
import { Field, inputClass } from "./ui";

const CHIP: Record<PreflightCheck["status"], string> = {
  ok: "bg-green-100 text-green-800",
  stale: "bg-amber-100 text-amber-800",
  unverified: "bg-neutral-200 text-neutral-700",
};

const buttonClass = "rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 disabled:opacity-50";

async function post(url: string, sources: PrepSource[]): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sourcesBody(sources)),
  });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.json();
}

type Props = { sources: PrepSource[]; value: Mandate; onChange: (next: Mandate) => void };

export function MandatePanel({ sources, value, onChange }: Props) {
  const [drafting, setDrafting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checks, setChecks] = useState<PreflightCheck[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<Mandate>) => onChange({ ...value, ...patch });

  async function draft() {
    setDrafting(true);
    setError(null);
    try {
      const mandate = readMandate(await post("/api/mandate", sources));
      if (!mandate) throw new Error("The Mandate draft came back in an unexpected shape.");
      onChange(mandate);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Drafting the Mandate failed.");
    } finally {
      setDrafting(false);
    }
  }

  async function preflight() {
    setChecking(true);
    setError(null);
    try {
      const json = (await post("/api/preflight", sources)) as { checks?: PreflightCheck[] };
      setChecks(json.checks ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pre-flight failed.");
    } finally {
      setChecking(false);
    }
  }

  const lines = (key: "assumptions" | "disclaimers" | "outOfScope", label: string) => (
    <Field label={`${label} (one per line)`}>
      <textarea
        rows={3}
        className={inputClass}
        value={toLines(value[key])}
        onChange={(e) => set({ [key]: fromLines(e.target.value) })}
      />
    </Field>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button type="button" className={buttonClass} disabled={drafting} onClick={draft}>
          {drafting ? "Drafting…" : "Draft Mandate from my plan"}
        </button>
        <span className="text-sm text-neutral-600">Review and edit every field before the meeting.</span>
      </div>

      <Field label="Thesis">
        <textarea rows={2} className={inputClass} value={value.thesis} onChange={(e) => set({ thesis: e.target.value })} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {lines("assumptions", "Assumptions")}
        <Field label="Risk stance">
          <textarea rows={3} className={inputClass} value={value.riskStance} onChange={(e) => set({ riskStance: e.target.value })} />
        </Field>
        {lines("disclaimers", "Disclaimers")}
        {lines("outOfScope", "Out of scope")}
      </div>

      <div className="flex flex-col gap-3 rounded border border-neutral-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={buttonClass} disabled={checking} onClick={preflight}>
            {checking ? "Checking…" : "Run pre-flight"}
          </button>
          <span className="text-sm text-neutral-600">Checks the plan&apos;s figures against live public data.</span>
        </div>
        {checks && checks.length === 0 && <p className="text-sm text-neutral-600">No figures to check.</p>}
        {checks && checks.length > 0 && (
          <ul className="flex flex-col gap-3">
            {checks.map((c, i) => (
              <li key={i} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:gap-3">
                <span className={`w-fit shrink-0 rounded px-2 py-0.5 text-xs font-semibold uppercase ${CHIP[c.status] ?? CHIP.unverified}`}>
                  {c.status}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium break-words">“{c.claim}”</p>
                  <p className="break-words text-neutral-600">{c.note}</p>
                </div>
                {c.sourceUrl && (
                  <a className="shrink-0 underline" href={c.sourceUrl} target="_blank" rel="noreferrer">
                    source ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

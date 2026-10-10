// Step 1: the advisor drops in their own files and Second Chair reads them
// into the prep. PDF, Word, Excel, PowerPoint, CSV, text and images.
"use client";

import { useRef, useState } from "react";
import type { ClientFile, FileConflict, Mandate, Meeting, PrepSource } from "@/lib/types";
import { btnGhost, btnPrimary } from "./ui";

export type IngestResponse = {
  meeting?: Meeting;
  clientFile: ClientFile;
  sources: PrepSource[];
  mandate: Mandate;
  mandateSource: "claude" | "fallback";
  files: { name: string; read: boolean; note?: string }[];
  missing: string[];
  conflicts?: FileConflict[]; // figures the files disagree on, traced to each file
  source: "claude" | "text-only";
};

const ACCEPT = ".pdf,.docx,.xlsx,.xlsm,.pptx,.csv,.tsv,.txt,.md,.json,.html,.htm,.png,.jpg,.jpeg,.gif,.webp";
const SAMPLES = ["/samples/dana-whitfield-plan.pdf", "/samples/dana-whitfield-client.csv"];
const MAX_BYTES = 4 * 1024 * 1024;

export function FileDrop({ onRead }: { onRead: (r: IngestResponse) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<IngestResponse["files"]>([]);
  const [over, setOver] = useState(false);

  async function send(files: File[]) {
    if (files.length === 0) return;
    if (files.reduce((n, f) => n + f.size, 0) > MAX_BYTES) {
      setError("Files are too large together. Keep the upload under 4 MB.");
      return;
    }
    setError(null);
    setBusy(`Reading ${files.length} file${files.length > 1 ? "s" : ""}. This takes about 20 seconds…`);
    try {
      const body = new FormData();
      files.forEach((f) => body.append("files", f));
      const res = await fetch("/api/ingest", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(typeof json.error === "string" ? json.error : "Upload failed.");
      setReport(json.files);
      onRead(json as IngestResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  async function useSamples() {
    setBusy("Fetching the sample files…");
    try {
      const files = await Promise.all(
        SAMPLES.map(async (url) => {
          const blob = await (await fetch(url)).blob();
          return new File([blob], url.split("/").pop()!, { type: blob.type });
        }),
      );
      await send(files);
    } catch {
      setError("Could not load the sample files.");
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Add files"
        onClick={() => !busy && input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !busy && input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (!busy) void send([...e.dataTransfer.files]);
        }}
        className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          over ? "border-indigo-300 bg-indigo-500/15" : "border-white/20 bg-slate-950/30 hover:border-white/35"
        }`}
      >
        {busy ? (
          <p className="animate-pulse text-sm text-indigo-100">{busy}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-100">Drop your plan, client file, deck or spreadsheet here</p>
            <p className="text-xs text-slate-400">
              PDF, Word, Excel, PowerPoint, CSV, text or images · up to 8 files, 4 MB · Google Docs: File → Download
              first
            </p>
          </>
        )}
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            void send([...(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={!!busy} className={btnPrimary} onClick={() => input.current?.click()}>
          Choose files
        </button>
        <button type="button" disabled={!!busy} className={btnGhost} onClick={useSamples}>
          Try with sample files
        </button>
        <span className="text-xs text-slate-500">
          Samples:{" "}
          <a className="underline hover:text-slate-300" href={SAMPLES[0]} target="_blank">
            plan (PDF)
          </a>{" "}
          ·{" "}
          <a className="underline hover:text-slate-300" href={SAMPLES[1]} target="_blank">
            client file (CSV)
          </a>
        </span>
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      )}
      {report.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm">
          {report.map((f) => (
            <li key={f.name} className={f.read ? "text-emerald-200" : "text-amber-200"}>
              {f.read ? "✓" : "!"} {f.name}
              {f.note && <span className="text-slate-400"> · {f.note}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

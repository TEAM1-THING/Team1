// Small form pieces shared by the prep components. Owned by the prep track.
import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-black focus:outline-none";

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className}`}>
      <span className="font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  );
}

export function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-neutral-200 py-6">
      <header>
        <h2 className="text-lg font-semibold">
          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black text-xs text-white">{n}</span>
          {title}
        </h2>
        {hint && <p className="mt-1 text-sm text-neutral-600">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

"use client";
// Client picture (#39): what the client worries about, wants to learn or decide,
// life events and requests, each checked off as the meeting goes.
import { useId } from "react";
import type { Concern } from "@/lib/types";
import { clientPicture } from "./picture";

export default function Concerns({ concerns }: { concerns: Concern[] }) {
  const headingId = useId(); // the meeting and end screens both show this panel
  const groups = clientPicture(concerns);
  const open = concerns.filter((c) => c.status === "open").length;
  return (
    <section aria-labelledby={headingId} className="sc-glass rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-xl">
      <h2 id={headingId} className="mb-3 flex items-baseline justify-between text-sm font-semibold text-slate-200">
        Client picture
        <span className="text-xs font-normal text-slate-500">{open} open</span>
      </h2>
      {groups.length === 0 && (
        <p className="text-sm text-slate-500">
          Nothing raised yet. Worries, questions, decisions, life events and requests the client mentions are listed
          here, and checked off once answered.
        </p>
      )}
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.kind}>
            <h3 className="mb-1 text-xs font-medium text-slate-400">{g.label}</h3>
            <ul className="space-y-1.5">
              {g.items.map((c) => (
                <li key={c.id} className="flex items-baseline gap-2 text-sm">
                  <span
                    aria-hidden
                    className={`mt-1 inline-block size-2 shrink-0 rounded-full ${c.status === "open" ? "bg-rose-400" : "bg-slate-600"}`}
                  />
                  <span className={c.status === "open" ? "text-slate-100" : "text-slate-500 line-through"}>{c.text}</span>
                  <span className="ml-auto shrink-0 text-xs text-slate-500">
                    {c.status === "open" ? `since ${c.raisedAtTurn}` : `${c.raisedAtTurn} to ${c.resolvedAtTurn}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

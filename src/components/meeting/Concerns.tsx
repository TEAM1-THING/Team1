"use client";
// Client picture (#39): what the client worries about, wants to learn or decide,
// life events and requests, each checked off as the meeting goes.
import { useId } from "react";
import type { Concern } from "@/lib/types";
import { clientPicture } from "./picture";
import { ui } from "./ui";

export default function Concerns({ concerns }: { concerns: Concern[] }) {
  const headingId = useId(); // the meeting and end screens both show this panel
  const groups = clientPicture(concerns);
  const open = concerns.filter((c) => c.status === "open").length;
  return (
    <section aria-labelledby={headingId} className={`${ui.surface} p-4`}>
      <h2 id={headingId} className="mb-3 flex items-baseline justify-between text-sm font-medium">
        Client picture
        <span className={`text-xs font-normal tabular-nums ${ui.faint}`}>{open} open</span>
      </h2>
      {groups.length === 0 && (
        <p className={`text-sm text-pretty ${ui.faint}`}>
          Nothing raised yet. Worries, questions, decisions, life events and requests the client mentions are listed
          here, and checked off once answered.
        </p>
      )}
      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.kind}>
            <h3 className={`mb-1.5 text-xs ${ui.faint}`}>{g.label}</h3>
            <ul className="space-y-1.5">
              {g.items.map((c) => (
                <li key={c.id} className="flex items-baseline gap-3 text-sm">
                  <span className={c.status === "open" ? "text-[#161412]" : `line-through ${ui.faint}`}>
                    {c.text}
                    {c.status === "resolved" && <span className="sr-only"> (resolved)</span>}
                  </span>
                  <span className={`ml-auto shrink-0 text-xs tabular-nums ${ui.faint}`}>
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

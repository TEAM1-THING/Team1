"use client";
// Meeting screen: replay demoTranscript (or live mic turns), POST /api/moment
// after each client turn, show the card and the concerns, export at the end.
import { useCallback, useEffect, useRef, useState } from "react";
import Concerns from "@/components/meeting/Concerns";
import MomentCard from "@/components/meeting/Card";
import Transcript from "@/components/meeting/Transcript";
import { postMoment, processTurn } from "@/components/meeting/replay";
import MicInput from "@/components/speech/MicInput";
import { demoTranscript } from "@/data/demo";
import { exportRecord } from "@/lib/record";
import { loadPrep } from "@/lib/store";
import { emptyState, type Card, type ConversationState, type Prep, type TranscriptTurn } from "@/lib/types";

const AUTO_PLAY_MS = 4000;

export default function MeetingPage() {
  const [prep, setPrep] = useState<Prep | null>(null);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [convo, setConvo] = useState<ConversationState>(emptyState);
  // Cards as returned by the API, after its number-trace check. state.cards
  // holds the unchecked copies, so the screen never renders those.
  const [cards, setCards] = useState<Card[]>([]);
  const [nextIdx, setNextIdx] = useState(0);
  const [auto, setAuto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mirrors of the state above, read by the auto-play timer and mic callback.
  const live = useRef({ turns, convo, nextIdx, busy: false, startedAt: Date.now(), micCount: 0 });

  useEffect(() => setPrep(loadPrep()), []);

  const step = useCallback(
    async (turn: TranscriptTurn) => {
      if (!prep || live.current.busy) return;
      live.current.busy = true;
      setBusy(true);
      const nextTurns = [...live.current.turns, turn];
      live.current.turns = nextTurns;
      setTurns(nextTurns);
      try {
        const res = await processTurn(prep, nextTurns, live.current.convo, postMoment);
        live.current.convo = res.state;
        setConvo(res.state);
        if (res.card) setCards((cs) => [...cs, res.card!]);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        live.current.busy = false;
        setBusy(false);
      }
    },
    [prep],
  );

  const nextTurn = useCallback(() => {
    const i = live.current.nextIdx;
    if (live.current.busy || i >= demoTranscript.length) return;
    live.current.nextIdx = i + 1;
    setNextIdx(i + 1);
    void step(demoTranscript[i]);
  }, [step]);

  const onMicTurn = useCallback(
    (text: string) => {
      live.current.micCount += 1;
      const t = Math.round((Date.now() - live.current.startedAt) / 1000);
      void step({ id: `m${live.current.micCount}`, speaker: "client", text, t });
    },
    [step],
  );

  const done = nextIdx >= demoTranscript.length;
  useEffect(() => {
    if (!auto) return;
    if (done) {
      setAuto(false);
      return;
    }
    const id = setInterval(nextTurn, AUTO_PLAY_MS);
    return () => clearInterval(id);
  }, [auto, done, nextTurn]);

  const current = cards.at(-1);
  const previous = cards.at(-2);

  return (
    <div className="flex h-screen flex-col bg-neutral-50 text-neutral-900">
      <div role="note" className="bg-indigo-700 px-4 py-2 text-center text-sm font-medium text-white">
        This meeting uses Second Chair. All participants have been told and agreed.
      </div>

      <header className="flex flex-wrap items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
        <h1 className="mr-auto text-lg font-semibold">
          Second Chair <span className="font-normal text-neutral-500">· {prep?.clientFile.name ?? "loading"}</span>
        </h1>
        <button
          type="button"
          onClick={nextTurn}
          disabled={!prep || busy || done}
          className="rounded bg-neutral-900 px-3 py-1 text-sm text-white disabled:opacity-40"
        >
          Next turn
        </button>
        <button
          type="button"
          onClick={() => setAuto((a) => !a)}
          disabled={!prep || done}
          className="rounded border border-neutral-400 px-3 py-1 text-sm disabled:opacity-40"
        >
          {auto ? "Pause" : "Auto-play (4 s)"}
        </button>
        <MicInput onTurn={onMicTurn} />
        <button
          type="button"
          onClick={() => prep && void exportRecord(prep, { ...convo, cards })}
          disabled={!prep}
          className="rounded bg-rose-700 px-3 py-1 text-sm text-white disabled:opacity-40"
        >
          End meeting
        </button>
      </header>

      {error && <div className="bg-rose-100 px-4 py-2 text-sm text-rose-900">Could not reach the engine: {error}</div>}

      <main className="grid min-h-0 flex-1 grid-cols-[1fr_1.6fr_1fr] gap-4 p-4">
        <div className="min-h-0 overflow-y-auto">
          <Transcript turns={turns} />
        </div>
        <div className="min-h-0 space-y-3 overflow-y-auto">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Live card {busy && <span className="normal-case text-neutral-400">· thinking…</span>}
          </h2>
          {current ? (
            <MomentCard key={current.id} card={current} />
          ) : (
            <p className="text-sm text-neutral-500">Cards appear when the client says something decision-relevant.</p>
          )}
          {previous && <MomentCard key={previous.id} card={previous} dimmed />}
        </div>
        <div className="min-h-0 overflow-y-auto">
          <Concerns concerns={convo.concerns} />
        </div>
      </main>
    </div>
  );
}

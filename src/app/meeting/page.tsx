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

  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest("input, textarea, button, summary")) return;
      if (e.key === "ArrowRight") nextTurn();
      else if (e.key === "a") setAuto((v) => !v);
      else if (e.key === "h") setHidden((v) => !v);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextTurn]);

  const current = cards.at(-1);
  const previous = cards.at(-2);
  const clock = turns.at(-1)?.t ?? 0;
  const mmss = `${String(Math.floor(clock / 60)).padStart(2, "0")}:${String(clock % 60).padStart(2, "0")}`;
  const btn =
    "rounded-full px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:opacity-35";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#141a26] text-slate-100">
      {/* The room behind the overlay: a dim call, so the glass reads as glass. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#2b3a55_0%,transparent_55%),radial-gradient(ellipse_at_80%_90%,#3a2f4d_0%,transparent_50%)]"
      />
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes sc-arrive { from { opacity: 0; transform: translateY(8px); box-shadow: 0 0 0 2px rgb(165 180 252 / .9); } 60% { box-shadow: 0 0 0 2px rgb(165 180 252 / .9); } to { opacity: 1; transform: none; } }
          .sc-arrive { animation: sc-arrive 900ms cubic-bezier(.2,.8,.2,1); }
        }
      `}</style>

      <p role="note" className="relative z-10 bg-indigo-500/20 px-4 py-1.5 text-center text-xs text-indigo-100">
        This meeting uses Second Chair. All participants have been told and agreed.
      </p>

      <header className="relative z-10 mx-4 mt-4 flex flex-wrap items-center gap-1 rounded-2xl sm:mx-auto sm:rounded-full border border-white/15 bg-slate-900/70 p-1.5 pl-4 shadow-xl shadow-black/30 backdrop-blur-xl">
        <span className="mr-2 flex items-center gap-2 text-sm">
          <span aria-hidden className={`size-2 rounded-full ${turns.length ? "bg-rose-400 motion-safe:animate-pulse" : "bg-slate-500"}`} />
          <span className="font-semibold">Second Chair</span>
          <span className="tabular-nums text-slate-400">{mmss}</span>
          <span className="hidden text-slate-500 sm:inline">with {prep?.clientFile.name ?? "…"}</span>
        </span>
        <button type="button" onClick={nextTurn} disabled={!prep || busy || done} className={`${btn} bg-white text-slate-900 hover:bg-indigo-100`}>
          Next turn <kbd className="ml-1 text-xs text-slate-500">→</kbd>
        </button>
        <button type="button" onClick={() => setAuto((a) => !a)} disabled={!prep || done} className={`${btn} hover:bg-white/10`}>
          {auto ? "Pause" : "Auto-play (4 s)"}
        </button>
        <MicInput onTurn={onMicTurn} />
        <button type="button" onClick={() => setHidden((h) => !h)} className={`${btn} hover:bg-white/10`} aria-pressed={hidden}>
          {hidden ? "Show" : "Hide"} <kbd className="ml-1 text-xs text-slate-500">H</kbd>
        </button>
        <button
          type="button"
          onClick={() => prep && void exportRecord(prep, { ...convo, cards })}
          disabled={!prep}
          className={`${btn} bg-rose-500/90 text-white hover:bg-rose-500`}
        >
          End meeting
        </button>
      </header>

      {error && (
        <p role="alert" className="relative z-10 mx-auto mt-3 rounded-full bg-rose-500/20 px-4 py-1.5 text-sm text-rose-100">
          The engine did not answer ({error}). Press Next turn to try again.
        </p>
      )}

      <main className="relative z-10 mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 gap-6 p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)_minmax(0,280px)]">
        <div className="order-3 lg:order-1 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto lg:pr-2">
          <Transcript turns={turns} />
        </div>
        <div className={`order-1 space-y-3 lg:order-2 ${hidden ? "invisible" : ""}`} aria-live="polite">
          {busy && <p className="text-xs text-slate-400">Listening for what matters…</p>}
          {current ? (
            <MomentCard key={current.id} card={current} />
          ) : (
            <p className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-slate-400">
              A card appears here when the client says something that needs a careful answer.
            </p>
          )}
          {previous && <MomentCard key={previous.id} card={previous} dimmed />}
        </div>
        <div className={`order-2 lg:order-3 ${hidden ? "invisible" : ""}`}>
          <Concerns concerns={convo.concerns} />
        </div>
      </main>
    </div>
  );
}

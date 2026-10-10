"use client";
// Meeting screen: replay demoTranscript (or live mic turns), POST /api/moment
// after each client turn, show the card and the concerns, export at the end.
import { useCallback, useEffect, useRef, useState } from "react";
import Concerns from "@/components/meeting/Concerns";
import MomentCard from "@/components/meeting/Card";
import EndScreen from "@/components/meeting/EndScreen";
import Transcript from "@/components/meeting/Transcript";
import { LIVE_PAUSE_MS, isLiveTurn, relabel, windowThrough } from "@/components/meeting/live";
import { followUpTasks, postMoment, processTurn } from "@/components/meeting/replay";
import MicInput from "@/components/speech/MicInput";
import { demoTranscript } from "@/data/demo";
import { echoesCard } from "@/lib/engine/gate";
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
  const live = useRef({ turns, convo, nextIdx, busy: false, startedAt: Date.now(), micCount: 0, lastPhrasing: "" });
  // The one live analysis in flight, and the pause timer before the next.
  const pending = useRef<{ ctrl: AbortController | null; timer: ReturnType<typeof setTimeout> | null }>({
    ctrl: null,
    timer: null,
  });

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
        if (res.card) {
          live.current.lastPhrasing = res.card.phrasing;
          setCards((cs) => [...cs, res.card!]);
        }
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

  // Live mic. Every line shows the moment it is heard; nothing is dropped while
  // a card is being made. Analysis is newest-wins: a line that arrives
  // mid-analysis cancels the stale request, and after a short pause one request
  // covers everything said so far. The previous card stays up meanwhile.
  const setLiveTurns = useCallback((next: TranscriptTurn[]) => {
    live.current.turns = next;
    setTurns(next);
  }, []);

  const analyze = useCallback(
    async (turnId: string) => {
      if (!prep) return;
      pending.current.ctrl?.abort();
      const ctrl = new AbortController();
      pending.current.ctrl = ctrl;
      setBusy(true);
      try {
        const req = { prep, turns: windowThrough(live.current.turns, turnId), state: live.current.convo };
        const res = await postMoment(req, ctrl.signal);
        if (ctrl.signal.aborted) return;
        // The engine heard the advisor: relabel the line, no card.
        if (res.speaker === "advisor") setLiveTurns(relabel(live.current.turns, turnId, "advisor"));
        live.current.convo = res.state;
        setConvo(res.state);
        if (res.card) {
          live.current.lastPhrasing = res.card.phrasing;
          setCards((cs) => [...cs, res.card!]);
        }
        setError(null);
      } catch (e) {
        if (!ctrl.signal.aborted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (pending.current.ctrl === ctrl) {
          pending.current.ctrl = null;
          setBusy(false);
        }
      }
    },
    [prep, setLiveTurns],
  );

  const schedule = useCallback(
    (turnId: string) => {
      if (pending.current.timer) clearTimeout(pending.current.timer);
      pending.current.ctrl?.abort();
      pending.current.timer = setTimeout(() => void analyze(turnId), LIVE_PAUSE_MS);
    },
    [analyze],
  );

  const onMicTurn = useCallback(
    (text: string) => {
      live.current.micCount += 1;
      const t = Math.round((Date.now() - live.current.startedAt) / 1000);
      // The advisor reading the card aloud is labeled at once, with no call.
      const speaker = echoesCard(text, live.current.lastPhrasing) ? "advisor" : "client";
      const turn: TranscriptTurn = { id: `m${live.current.micCount}`, speaker, text, t };
      setLiveTurns([...live.current.turns, turn]);
      if (speaker === "client") schedule(turn.id);
    },
    [schedule, setLiveTurns],
  );

  // A click on a live line's label flips its speaker; a line made the client's is analyzed.
  const toggleSpeaker = useCallback(
    (id: string) => {
      const turn = live.current.turns.find((x) => x.id === id);
      if (!turn || !isLiveTurn(id)) return;
      const speaker = turn.speaker === "client" ? "advisor" : "client";
      setLiveTurns(relabel(live.current.turns, id, speaker));
      if (speaker === "client") schedule(id);
    },
    [schedule, setLiveTurns],
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
  const [ended, setEnded] = useState(false);
  const tasks = prep ? followUpTasks(convo.concerns, prep.clientFile.name) : [];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ended) return; // the end screen is on top; shortcuts would drive the hidden meeting
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest("input, textarea, button, summary")) return;
      if (e.key === "ArrowRight") nextTurn();
      else if (e.key === "a") setAuto((v) => !v);
      else if (e.key === "h") setHidden((v) => !v);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nextTurn, ended]);

  const current = cards.at(-1);
  const previous = cards.at(-2);
  const clock = turns.at(-1)?.t ?? 0;
  const mmss = `${String(Math.floor(clock / 60)).padStart(2, "0")}:${String(clock % 60).padStart(2, "0")}`;
  const waiting = busy && turns.at(-1)?.speaker === "client";
  // Shape rule: controls and labels are pills, panels are 16px, nested boxes 12px.
  const btn =
    "rounded-full px-3 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 active:scale-[0.98] disabled:opacity-35 disabled:active:scale-100";

  return (
    // Desktop: the page is exactly one screen and each column scrolls on its own.
    // Phones stack the columns, so the page scrolls there.
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#0d1219] text-slate-100 lg:h-[100dvh]">
      {/* The room behind the overlay: a dim call, so the glass reads as glass. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,rgb(56_120_168/0.28)_0%,transparent_55%),radial-gradient(ellipse_at_85%_95%,rgb(30_64_90/0.35)_0%,transparent_50%)]"
      />
      <style>{`
        .sc-glass { box-shadow: inset 0 1px 0 rgb(255 255 255 / .07), 0 24px 60px -20px rgb(2 6 12 / .7); }
        @media (prefers-reduced-transparency: reduce) {
          .sc-glass { background-color: #131b26 !important; backdrop-filter: none !important; }
        }
        @media (prefers-reduced-motion: no-preference) {
          @keyframes sc-arrive {
            from { opacity: 0; transform: translateY(10px); box-shadow: 0 0 0 2px rgb(125 211 252 / .85); }
            55% { box-shadow: 0 0 0 2px rgb(125 211 252 / .85); }
            to { opacity: 1; transform: none; }
          }
          .sc-arrive { animation: sc-arrive 900ms cubic-bezier(.16,1,.3,1); }
        }
      `}</style>

      <p role="note" className="relative z-10 border-b border-white/5 bg-sky-400/10 px-4 py-1.5 text-center text-xs text-sky-100">
        This meeting uses Second Chair. All participants have been told and agreed.
      </p>

      <header className="sc-glass relative z-10 mx-4 mt-4 flex flex-wrap items-center gap-1 rounded-2xl border border-white/10 bg-slate-900/70 p-1.5 pl-4 backdrop-blur-xl sm:mx-auto sm:rounded-full">
        <span className="mr-2 flex items-center gap-2 text-sm">
          {/* Live state, not decoration: red while the meeting is running. */}
          <span aria-hidden className={`size-2 rounded-full ${turns.length ? "bg-rose-400 motion-safe:animate-pulse" : "bg-slate-600"}`} />
          <span className="font-semibold tracking-tight">Second Chair</span>
          <span className="tabular-nums text-slate-400">{mmss}</span>
          <span className="hidden text-slate-500 sm:inline">with {prep?.clientFile.name ?? "your client"}</span>
        </span>
        <button
          type="button"
          onClick={nextTurn}
          disabled={!prep || busy || done}
          className={`${btn} bg-slate-100 font-medium text-slate-900 hover:bg-sky-100`}
        >
          Next turn <kbd className="ml-1 font-sans text-xs text-slate-500">→</kbd>
        </button>
        <button type="button" onClick={() => setAuto((a) => !a)} disabled={!prep || done} className={`${btn} text-slate-300 hover:bg-white/10`}>
          {auto ? "Pause" : "Auto-play"}
        </button>
        {/* Fit the ship track's mic button to this bar without editing its file. */}
        <span className="[&_button]:rounded-full [&_button]:border-white/15 [&_button]:px-3 [&_button]:py-1.5 [&_button]:text-slate-400">
          <MicInput onTurn={onMicTurn} />
        </span>
        <button type="button" onClick={() => setHidden((h) => !h)} className={`${btn} text-slate-300 hover:bg-white/10`} aria-pressed={hidden}>
          {hidden ? "Show" : "Hide"} <kbd className="ml-1 font-sans text-xs text-slate-500">H</kbd>
        </button>
        <button
          type="button"
          onClick={() => {
            if (!prep) return;
            setEnded(true);
            setAuto(false);
            void exportRecord(prep, { ...convo, cards });
          }}
          disabled={!prep}
          className={`${btn} bg-rose-500/90 font-medium text-rose-50 hover:bg-rose-500`}
        >
          End meeting
        </button>
      </header>

      {error && (
        <p role="alert" className="relative z-10 mx-4 mt-3 rounded-2xl bg-rose-500/15 px-4 py-2 text-sm text-rose-100 sm:mx-auto">
          The engine did not answer ({error}). Press Next turn to try again.
        </p>
      )}

      <main className="relative z-10 mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 gap-6 p-4 md:p-6 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,580px)_minmax(0,280px)] lg:grid-rows-[minmax(0,1fr)]">
        <div className="order-3 lg:order-1 lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          <Transcript turns={turns} onToggle={toggleSpeaker} />
        </div>
        <div className={`order-1 space-y-3 lg:order-2 lg:min-h-0 lg:overflow-y-auto lg:pr-1 ${hidden ? "invisible" : ""}`} aria-live="polite" aria-busy={waiting}>
          {waiting && (
            <div aria-label="Reading the client's last turn" className="sc-glass space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl">
              <div className="h-3 w-24 rounded-full bg-white/10 motion-safe:animate-pulse" />
              <div className="h-5 w-11/12 rounded-full bg-white/10 motion-safe:animate-pulse" />
              <div className="h-5 w-3/4 rounded-full bg-white/10 motion-safe:animate-pulse" />
            </div>
          )}
          {current ? (
            <MomentCard key={current.id} card={current} sources={prep?.sources} />
          ) : (
            !waiting && (
              <p className="rounded-2xl border border-dashed border-white/10 p-5 text-sm text-slate-400">
                A card appears here when the client says something that needs a careful answer.
              </p>
            )
          )}
          {previous && <MomentCard key={previous.id} card={previous} dimmed />}
        </div>
        <div className={`order-2 lg:order-3 lg:min-h-0 lg:overflow-y-auto ${hidden ? "invisible" : ""}`}>
          <Concerns concerns={convo.concerns} />
        </div>
      </main>

      {ended && prep && (
        <EndScreen prep={prep} cards={cards} concerns={convo.concerns} tasks={tasks} clock={mmss} onBack={() => setEnded(false)} />
      )}
    </div>
  );
}

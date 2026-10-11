"use client";
// Meeting screen: replay demoTranscript (or live mic turns), POST /api/moment
// after each client turn, show the card and the concerns, export at the end.
import { useCallback, useEffect, useRef, useState } from "react";
import Concerns from "@/components/meeting/Concerns";
import MomentCard from "@/components/meeting/Card";
import { display } from "@/components/meeting/fonts";
import { ui } from "@/components/meeting/ui";
import EndScreen from "@/components/meeting/EndScreen";
import { recordIsCurrent, toggleGrade, type Grades } from "@/components/meeting/endSummary";
import Find, { FIND_INPUT_ID } from "@/components/meeting/Find";
import Transcript from "@/components/meeting/Transcript";
import { DataNote } from "@/components/prep/DataNote";
import { LIVE_PAUSE_MS, isLiveTurn, relabel, windowThrough } from "@/components/meeting/live";
import { followUpTasks, postMoment, processTurn } from "@/components/meeting/replay";
import MicInput from "@/components/speech/MicInput";
import { demoTranscript } from "@/data/demo";
import { echoesCard } from "@/lib/engine/gate";
import { exportRecord, type CardGrade } from "@/lib/record";
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
  // Live lines the advisor relabelled by hand; the engine never overrides them.
  const manual = useRef(new Set<string>());
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
          setCards((cs) => [...cs.filter((c) => c.id !== res.card!.id), res.card!]);
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
        if (res.speaker === "advisor" && !manual.current.has(turnId)) setLiveTurns(relabel(live.current.turns, turnId, "advisor"));
        live.current.convo = res.state;
        setConvo(res.state);
        if (res.card) {
          live.current.lastPhrasing = res.card.phrasing;
          setCards((cs) => [...cs.filter((c) => c.id !== res.card!.id), res.card!]);
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
      manual.current.add(id);
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
  // What End meeting exported. The end screen shows exactly this, so a result
  // that lands after the click cannot make the summary disagree with the record.
  const [ended, setEnded] = useState<{ state: ConversationState; clock: string } | null>(null);
  // Kept here, not in the end screen, so Back to meeting and a second End
  // meeting keep the advisor's grades for the rest of this meeting.
  const [grades, setGrades] = useState<Grades>({});
  // The state in the record last downloaded. The record downloads by itself
  // once per meeting; after that only from Download record on the end screen.
  const [downloaded, setDownloaded] = useState<ConversationState | null>(null);
  const download = (state: ConversationState, graded?: CardGrade[]) => {
    if (!prep) return;
    setDownloaded(state);
    // Synchronous inside the click, so window.open keeps the user gesture.
    void exportRecord(prep, state, graded);
  };
  // Closing the end screen gives focus back to End meeting, which opened it.
  // An effect, so it runs once the header is no longer inert.
  const endButton = useRef<HTMLButtonElement>(null);
  const wasEnded = useRef(false);
  useEffect(() => {
    if (wasEnded.current && !ended) endButton.current?.focus();
    wasEnded.current = ended !== null;
  }, [ended]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ended) return; // the end screen is on top; shortcuts would drive the hidden meeting
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      // "/" works from a focused button too (just after clicking Next turn), never from a text field.
      if (e.key === "/" && !target.closest("input, textarea, select, [contenteditable]")) {
        e.preventDefault();
        document.getElementById(FIND_INPUT_ID)?.focus();
        return;
      }
      if (target.closest("input, textarea, button, summary")) return;
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
  // A new card is the thing to read: bring the card column back to its top.
  const cardColumn = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!current) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cardColumn.current?.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const clock = turns.at(-1)?.t ?? 0;
  const mmss = `${String(Math.floor(clock / 60)).padStart(2, "0")}:${String(clock % 60).padStart(2, "0")}`;
  const waiting = busy && turns.at(-1)?.speaker === "client";
  return (
    // Desktop: the page is exactly one screen and each column scrolls on its own.
    // Phones stack the columns, so the page scrolls there.
    <div className={`${ui.page} ${display.variable} flex min-h-[100dvh] flex-col lg:h-[100dvh]`}>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes sc-arrive { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
          .sc-arrive { animation: sc-arrive 260ms cubic-bezier(.16,1,.3,1); }
        }
      `}</style>

      <header inert={!!ended} className="border-b border-[#161412]/15">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 md:px-6">
          <div className="mr-auto flex min-w-0 items-baseline gap-3">
            <span className={`${ui.display} text-[22px] leading-none italic`}>Second Chair</span>
            <span className={`truncate text-sm ${ui.muted}`}>with {prep?.clientFile.name ?? "your client"}</span>
            <span className={`flex items-center gap-1.5 text-sm tabular-nums ${ui.faint}`}>
              {/* Live state, not decoration: shown while the meeting is running. */}
              {turns.length > 0 && <span aria-hidden className="size-2 rounded-full bg-[#e8571a] motion-safe:animate-pulse" />}
              {mmss}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button type="button" onClick={nextTurn} disabled={!prep || busy || done} className={`${ui.btn} ${ui.primary}`}>
              Next turn <kbd className={ui.kbdOnDark}>→</kbd>
            </button>
            <button type="button" onClick={() => setAuto((a) => !a)} disabled={!prep || done} className={`${ui.btn} ${ui.ghost}`}>
              {auto ? "Pause" : "Auto-play"}
            </button>
            {/* Fit the ship track's mic control to this bar without editing its file. */}
            {/* Unmounted once the meeting ends: its cleanup stops the recognizer. */}
            <span className="text-[#5b5248] [&_button]:h-9 [&_button]:rounded-full [&_button]:border-[#161412]/30 [&_button]:px-4 [&_button]:text-[#161412]">
              {!ended && <MicInput onTurn={onMicTurn} />}
            </span>
            <button type="button" onClick={() => setHidden((h) => !h)} className={`${ui.btn} ${ui.ghost}`} aria-pressed={hidden}>
              {hidden ? "Show" : "Hide"} <kbd className={ui.kbd}>H</kbd>
            </button>
            <button
              ref={endButton}
              type="button"
              onClick={() => {
                if (!prep) return;
                // Nothing heard or analyzed after this belongs to the record.
                if (pending.current.timer) clearTimeout(pending.current.timer);
                pending.current.timer = null;
                pending.current.ctrl?.abort();
                setAuto(false);
                const state = { ...convo, cards };
                setEnded({ state, clock: mmss });
                // Ending again after Back to meeting only reopens the end screen.
                if (!downloaded) download(state);
              }}
              disabled={!prep}
              className={`${ui.btn} ${ui.accentBtn}`}
            >
              End meeting
            </button>
          </div>
        </div>
        {/* The read-aloud consent script belongs in the live mic's start popup (track D, #34). */}
        <div role="note" className={`border-t border-[#161412]/10 px-4 py-1.5 text-center text-xs ${ui.muted}`}>
          This meeting uses Second Chair. All participants have been told and agreed. <DataNote compact />
        </div>
      </header>

      {error && (
        <p role="alert" inert={!!ended} className="mx-4 mt-3 rounded-lg border border-[#8c1238]/20 bg-[#ffd3de] px-4 py-2 text-sm text-[#8c1238] md:mx-6">
          The engine did not answer ({error}). Press Next turn to try again.
        </p>
      )}

      <main inert={!!ended} className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 gap-6 p-4 md:p-6 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)_minmax(0,280px)] lg:grid-rows-[minmax(0,1fr)]">
        <div className="order-3 lg:order-1 lg:min-h-0 lg:overflow-y-auto lg:border-r lg:border-[#161412]/15 lg:pr-6">
          <Find sources={prep?.sources ?? []} />
          <Transcript turns={turns} onToggle={toggleSpeaker} />
        </div>
        <div ref={cardColumn} className={`order-1 space-y-3 lg:order-2 lg:min-h-0 lg:overflow-y-auto lg:pr-1 ${hidden ? "invisible" : ""}`} aria-live="polite" aria-busy={waiting}>
          {waiting && (
            <div aria-label="Reading the client's last turn" className={`${ui.surface} space-y-3 p-5`}>
              <div className="h-3 w-28 rounded bg-[#161412]/[0.07] motion-safe:animate-pulse" />
              <div className="h-5 w-11/12 rounded bg-[#161412]/[0.07] motion-safe:animate-pulse" />
              <div className="h-5 w-3/4 rounded bg-[#161412]/[0.07] motion-safe:animate-pulse" />
            </div>
          )}
          {current ? (
            <MomentCard key={current.id} card={current} sources={prep?.sources} />
          ) : (
            !waiting &&
            (turns.length === 0 ? (
              // #33: a first-time visitor sees what this is and what to press.
              <div className={`${ui.surface} p-5 text-sm leading-relaxed`}>
                <p className="mb-2 font-medium">A replay of a sample client meeting</p>
                <p className={`mb-2 text-pretty ${ui.muted}`}>
                  Press <kbd className={ui.kbd}>→</kbd> or Next turn to hear each line. When the client says something
                  that needs a careful answer, a card appears here with what to say and the facts from your own
                  materials behind it.
                </p>
                <p className={ui.faint}>
                  Press <kbd className={ui.kbd}>/</kbd> to find any figure in your materials.
                </p>
              </div>
            ) : (
              <p className={`${ui.surface} p-5 text-sm ${ui.muted}`}>
                No card yet. One appears when the client says something that needs a careful answer.
              </p>
            ))
          )}
          {previous && <MomentCard key={previous.id} card={previous} dimmed />}
        </div>
        <div className={`order-2 lg:order-3 lg:min-h-0 lg:overflow-y-auto ${hidden ? "invisible" : ""}`}>
          <Concerns concerns={convo.concerns} />
        </div>
      </main>

      {ended && prep && (
        <EndScreen
          prep={prep}
          cards={ended.state.cards}
          concerns={ended.state.concerns}
          tasks={followUpTasks(ended.state.concerns, prep.clientFile.name)}
          clock={ended.clock}
          grades={grades}
          onGrade={(cardId, g) => setGrades((prev) => toggleGrade(prev, cardId, g))}
          recordCurrent={recordIsCurrent(downloaded, ended.state)}
          onDownload={(graded) => download(ended.state, graded)}
          onBack={() => setEnded(null)}
        />
      )}
    </div>
  );
}

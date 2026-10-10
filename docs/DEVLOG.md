# team1 Devlog

Running log of sessions, decisions and remaining work. Newest entries at top.

---

## 2026-10-10 (14:40) - live model by benchmark; the quote that changed the build

**Merged to `main`:** B #14 (meeting screen), A #15 (live engine, Mandate
draft, Bright Data pre-flight). CI gate green on both. #16 (dated sources,
request logging) is open. C and D PRs not yet open. **Every Vercel deploy fails,
`main` included**, while GitHub CI's clean build passes: a Vercel project
setting on D's account, not code.

**Live model, decided by measurement** (`scripts/bench/`, live API, 6 scenes
× 2 runs, 18 blind judgements per model from an advisor, a compliance officer
and a behavioural coach). The team's budget is 5 s per card.

| model | blind score /5 | judges' best | median | max |
|---|---|---|---|---|
| **Sonnet 5.5 (chosen)** | **4.39** | 9/18 | 3.96 s | 4.59 s |
| Opus 5.5 | 4.19 | 7/18 | 4.91 s | 9.05 s |
| Haiku 5.5 | 3.80 | 1/18 | 2.97 s | 5.39 s |
| Haiku, no reasoning | 3.51 | 1/18 | 2.85 s | 3.24 s |

**Adversarial audit** of the same cards (claim-by-claim against the plan,
plus red-team; damage 0-3): Sonnet 1 critical / 2 major, damage avg 1.00, 0 of 6
scenes ≥2; Opus 0 / 2, 1.00; Haiku 0 / 8, 2.00, 5 of 6 ≥2; Haiku without
reasoning answered the out-of-scope stock question instead of deferring. The
audit's notes on Sonnet (a true statement filed as DO_NOT_CLAIM, the $180,000
not said aloud) are fixed in the prompt; all 3 live t2 runs now say it.

Haiku was the first pick for speed. The judges ranked it last, weakest on
guardrails (2.60 on the out-of-scope stock question). Sonnet beat it on
quality and still stays under 5 s. Also fixed by the benchmark: a too-strict
figure check that dropped good cards when the client said a number ("65",
"2008"), and Haiku never resolving a concern the client accepted.

**The quote that changed the build** (Block 1, Tester 2): "I like it when they
are able to cite their sources and when the sources were made." → pre-flight
checks now carry the source's publish date and the date checked (#16); the meeting card will show
each prepared fact's source (asked of B).

**Other changes from tester feedback:**
- Tester 2's hidden problem, word meaning: the engine now flags a client
  hearing "scrutinize" as an audit, or saying "going to the basement", as a
  `misunderstanding`, and suggests clarifying phrasing (4/4 live runs, under 5 s).
- Tester 1 ("Really just time and effort"; wants a notice "just minutes after
  the meeting"): client requests are logged as open `request: …` items for an
  end-of-meeting still-open list (3/3 live runs). B asked for a "Copy as tasks"
  button.

**Not changed, on purpose:** the frozen contract, the live-card core, demo
turns t1-t6. Google Tasks is not integrated; copying the items as text is enough.

## 2026-10-10 (14:15) - Block 1 sense check: first two tester summaries

13 testers texted, 2 completed, 11 failed (no reply or declined); the check is
still open. SenseAI's verdicts: Tester 1 **contradicted** our assumption,
Tester 2 **unclear**.

**Tester 1** (uses a meeting recorder; reads every transcript afterwards)
- Missed a client's request for help on a call, found it later in the
  transcript; a 24-hour delay, fixed with an apology call. "Oh, he was fine. I
  I mean, just simply made a phone call."
- Cost of misses: "Really just time and effort. Nothing nothing later." Not
  trust, not deals.
- Already has a method: a "rule of three" follow-up questions in every meeting.
- **Wants a notice of missed items minutes after the meeting, added to Google
  Tasks, more than live help.** The miss was a forgotten request, not a hidden
  worry or a contradiction.
- Copilot vs note-taker: could not restate what the tool does (garbled answer).
  Would doubt it "if it was completely off course or did not do a very good job
  of listening and summarizing".

**Tester 2** (takes notes in every meeting, with permission)
- A missed point years ago: "it was a it was a potential loss of the client";
  won back in about half an hour. Has not missed since taking notes.
- Hidden problem: **word meaning.** Watches colloquialisms and slang ("going to
  the basement" means financial trouble up north). Their own word "scrutinize"
  made a client panic, thinking they were being audited; calmed by clarifying.
- Copilot vs note-taker: read it as live clarification and verification ("help
  add some clarification... verify things"). Not a note-taker.
- Trust: an AI tool gave them a **fake source** about a week ago; 15 to 20
  minutes to correct. "It would have to be more consistent than I am." "I like
  it when they are able to cite their sources and when the sources were made."

**Candidate quotes that should change the build** (team to decide):
- Tester 2 on cited, dated sources → show source and as-of date on every
  PREPARED_FACT and pre-flight check; we already refuse untraced numbers and
  invented URLs, so say so on screen.
- Tester 1 on minutes-after notice → an end-of-meeting list of requests and
  concerns still open, exportable as tasks.
- Tester 2 on word meaning → the `misunderstanding` moment: catch a client
  reacting to a word and suggest a clarification.

Disclosure to clients did not come up in either summary. n = 2; treat as
direction, not proof. A workflow is now analysing both for concrete changes.

## 2026-10-10 (13:15) - Stage 0 shipped, four tracks and twelve PBs opened

- **Decided (user):** stack Next.js + Vercel, gate `npm run check`, Stage 0
  scaffolded on `main` by this session. Split 50/20/15/15 with the user (LeavesJ,
  Felix + Max) on track A; the lightest track (D) goes to whoever has the
  fewest tokens. Base44 hosts the separate after-meeting records app (track D),
  so it adds a prize track without touching the main code.
- **Built:** `c7837ca` on `main`. Frozen contract `src/lib/types.ts`;
  number-trace check `src/lib/provenance.ts` (untraced PREPARED_FACT drops to
  CALCULATED with math, otherwise SUGGESTION); canned cards for the three demo
  scenes; stubs for `/api/moment`, `/api/mandate`, `/api/preflight`,
  `loadPrep`/`savePrep`, `<MicInput>`, `exportRecord`; CI runs check + build.
  `npm run check` green (8 tests); `npm run build` green.
- **Zero-friction merge design:** disjoint file ownership per track (table in
  `CLAUDE.md`), every seam stubbed with its final shape, no new npm packages
  except via track A, only A merges to `main` in order C → B → D → A.
- **Opened:** branches `feat/engine`, `feat/ui`, `feat/prep`, `feat/ship`;
  PB issues #1 to #12; pinned tracking issue #13.
- **Felix:** `felix new team1 --no-commission`, gate set to `npm run check`.
  It flagged that `frontend-design` is not installed for UI work; carrying on without it.

## 2026-10-10 (12:55) - first push; docs now pushed on every change

- First commit on `main`: `CLAUDE.md`, `HANDOFF.md`, `docs/`, `.gitignore`.
  Checked for the token, promo codes and the preview link before committing; none present.
- **Decided (user):** any change to the handoff, devlog or `CLAUDE.md` is
  committed and pushed right away. Recorded in `CLAUDE.md` working agreements.
- A session loop polls the Block 1 check and logs tester summaries here.

## 2026-10-10 (12:52) - Block 1 sense check launched (1 of 3 spent)

- **Test** `78e8af97-7ece-4d65-bc1d-e7ba058f67bd`, interview, session 1, theme
  *catch what humans miss*. Launched on the user's explicit "launch". **2 checks left.**
- **Idea field sent:** "Run a check or initial thoughts about this idea: " + who
  it's for and what they do today + the section 02 primary description, word for
  word (verified on the preview page). No stimulus, so the call is all market research.
- Surveys are off for the event, so interviewer questions cannot be set in
  session 1. Questions 2 to 7, condensed, went into `team_question` (documented
  as a session 3 input; the preview did not show it, so it may be ignored).
- SenseAI's own restatement of the hypothesis: advisors regularly miss client
  signals in meetings (an unspoken worry, a contradiction), and those misses cost
  trust, deals or follow-up work.
- **Next:** results about an hour after launch. Log tester quotes, copilot vs
  note-taker reading, and disclosure views here.

## 2026-10-10 (12:35) - end of session 1: handoff written, next session has SenseAI

**Uncommitted. Docs only. No sense-check tool calls were made in this session.**

- `HANDOFF.md` rewritten for the next session: current state, start-here list
  with the time windows, a do-not list, and ideas considered and parked. The
  previous "current state" moved unchanged to
  `docs/handoff/2026-10-10-03-state-at-afternoon-start.md`.
- Section 02 now carries a ready-to-paste SenseAI agent prompt.
- The next session was started after the MCP was registered, so it should have
  the tools. It must verify with `list_tests`.
- **Still needs the team:** guardrails, Block 1 description confirmation, and an
  explicit "launch". Block 1 closes at 1:00 PM PDT.

## 2026-10-10 (afternoon) - positioning revised: next-move coaching, not question answering

**Uncommitted.** Docs only. New section `docs/handoff/2026-10-10-02-positioning-revision.md`.

- **Change:** Second Chair recognises decision-relevant moments (not just
  questions) and privately proposes the next move, with conversation state
  (raised / resolved / open concerns). Provenance labels now cover tactical
  suggestions too, plus a DO NOT CLAIM line.
- **Market check (quick search, 2026-10-10):** Zocks' live product retrieves
  client context and answers client-data questions; its page mentions no
  what-to-say or objection handling. Cluely's homepage is "undetectable AI for
  meetings", with no advisor targeting and no mention of sales calls or
  negotiations (the pasted research said it did). Jiffy.ai advertises in-meeting
  "intelligent prompts" for advisors, so "nobody does this" is overclaiming.
  Balto: not verified.
- **Pushed back on, recorded as a recommendation, not a decision:** the research's
  "client thinks it's one advisor" framing. Undisclosed AI in a regulated client
  meeting is a compliance and consent problem. Keep the image as a demo hook;
  product stays disclosed. Also reworded "maximize success" as serving the
  client's stated goals.
- **Replaced:** the "visible to both" second screen. The coaching screen is now
  private to the advisor.
- **Build order changed:** moment detector and conversation state come before any
  speech; live speech and the in-person / online toggle moved later.
- **Open:** team decision on the five guardrails, the revised Block 1
  description, and audio retention (transcript only vs audio).
- **12:3x, Block 1 wording rewritten** in section 02 to read as a live copilot,
  not a note-taker: leads with "unfair advantage", says "it is not a note-taker"
  in the first two sentences, drops the after-meeting notes, adds a plain-words
  fallback, and a diagnostic interview question ("in your own words, what does
  this do?"). Only one check per block is allowed, so one idea launches in
  12-1 PM.

## 2026-10-10 (midday) - repo mounted, direction chosen, nothing built yet

**Uncommitted; repo has no commits.** Setup and decisions only. No product code.

- **Repo:** `joshcodes42/Team1` (public, was empty) cloned into `~/Documents/team1`.
- **SenseAI:** `sense-check` MCP registered at local scope under the `team1`
  project key; `claude mcp get` reports connected. No tool call made, so no
  sense check spent. A stale entry under the home-folder key was removed.
  Tools only appear in a session started after registration.
- **Direction:** theme *Catch what humans miss*, user *wealth and financial
  advisors*, working name *Second Chair*. An in-room co-pilot bounded by the
  advisor's own prepared materials (the "Mandate"), with provenance-labelled
  answer cards, a deferral rule, and after-meeting follow-ups.
- **Mode toggle added:** in person vs online. Same pipeline, different audio
  source. Online is the cheaper, more reliable path.
- **Corrected:** Shazam-style spectrogram fingerprinting matches known
  recordings, so it does not clean up free speech. Plan is a close mic plus a
  streaming speech model, with a sample-meeting replay mode as the fallback.
- **Open:** stack, speech and LLM provider, Bright Data credit redemption,
  first commit, Felix binding (not done on purpose: it writes into the Felix
  repo and adds a stop-gate here).
- **Next:** new session in this folder, `list_tests` (expect 3 left), launch
  Block 1 only on the team's explicit go.

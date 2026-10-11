# Second Chair: pitch prep

Every function we have built, what it does for the advisor, and which of them a
generic call overlay does not do. Written 2026-10-10 at 17:55 PT for the deck
and the judges' questions (judging 8:30 PM). File paths are evidence if a judge
asks "is that real?". Status notes say what is merged, what is on a branch, and
what needs a key.

## The answer to "isn't this just a Cluely wrapper?"

A Cluely-style overlay listens to a call and answers whatever was just asked.
Second Chair does what a good second chair does in a client meeting: reads the
advisor's own files beforehand, notices the moments that are not questions,
checks every figure against those files in code, checks the client's stated
facts against the live web, keeps answers inside what the advisor confirmed,
and leaves a graded record compliance can sign off. The floating panel is one
way to show the cards; the website shows the same cards.

Landing headline: "It reads your client, so you can focus on the answer."

## Six things a generic overlay does not do

| # | What | Evidence | What to show |
|---|---|---|---|
| 1 | **Figures are checked by code, not by the prompt.** A figure that is not in the advisor's own files loses its green label; a card whose spoken line carries an untraced figure is dropped. | `src/lib/provenance.ts`, `src/lib/engine/moment.ts` | Green, amber and red chips on a card; the source title and date on a green fact |
| 2 | **It catches moments that are not questions.** 11 kinds: objection, hesitation, contradiction, misunderstanding, buying signal, disclosure, emotional concern, priority change, commitment, unresolved concern, question. A misremembered figure is caught by code before the model is called. | `src/lib/types.ts`, `src/lib/engine/gate.ts`, `recall.ts` | The client misquotes the reserve; the card gives the plan's figure gently |
| 3 | **It checks the premise of the question against the live web** (new, PR #68). "Since the Fed cut rates by a full point last week, shouldn't we..." The card leads with a red "Check the premise" fact naming the source, and adds "Do not repeat as fact". | `src/lib/engine/premise.ts`, `brightdata.ts` | A client question built on a false fact |
| 4 | **It prepares before the meeting.** Reads up to 8 files, flags figures the files disagree on, predicts 3 to 5 likely worries with prepared answers, and checks market assumptions against live sources with dates. | `ingest.ts`, `anticipate.ts`, `preflight.ts` | The prep screen: "Your files disagree", likely worries, pre-flight sources |
| 5 | **It stays inside compliance bounds during the meeting.** A Mandate the advisor confirms; a defer forced in code for out-of-scope topics; the same answer when a question is reworded; a running picture of the client. | `mandate.ts`, `scope.ts`, `consistency.ts`, `picture.ts` | Ask an out-of-scope question; ask the same question twice in other words |
| 6 | **It is accountable afterwards.** Every card is stamped with its time and model, the advisor grades it, the record goes to the records app by a one-time id, compliance signs off, nobody can edit or delete. No transcript or audio in the record. | `src/lib/record.ts`, `docs/base44/README.md` | End screen, grades, "End meeting" opening the records app |

## Every function, by stage of the advisor's day

"Overlay?" says whether a generic call overlay does this too. **No** marks a
difference worth saying out loud.

### Before the meeting

| Function | What it does for the advisor | Overlay? | Where |
|---|---|---|---|
| Read my files | Drop up to 8 files (PDF, Word, Excel, PowerPoint, CSV, images; 4 MB). Fills in the client file, the sources, and who the meeting is with and why. A figure not found in the files is left at zero and listed as missing. | No | `engine/ingest.ts`, `office.ts`, `components/prep/FileDrop.tsx` |
| Your files disagree | Flags a figure the files give differently (a $180K vs $200K reserve), naming each file. Kept only if code traces both values. | No | `ingest.ts`, `provenance.ts` |
| Mandate | Drafts the meeting's bounds: thesis, assumptions, risk stance, disclaimers, out-of-scope topics. The advisor edits it; a confirm box gates the start. | No | `engine/mandate.ts`, `prep/MandatePanel.tsx` |
| Likely worries | 3 to 5 worries the client may raise, each with a reason, an editable prepared answer and labelled facts. Warns when an edit adds a figure not in the files. | No | `engine/anticipate.ts`, `prep/AnticipatedPanel.tsx` |
| Pre-flight | Checks up to 3 market assumptions (returns, inflation, withdrawal rate, rates, expenses) against live Google results through Bright Data, with a cited, dated source. Skips client-specific assumptions. | No | `engine/preflight.ts`, `brightdata.ts` |
| Hand entry, sample files, demo client | Type the client file in; or load the fictional demo client, Dana Whitfield. | Yes | `prep/ClientFileForm.tsx`, `src/data/demo.ts` |
| Data note | One plain sentence on what happens to meeting data, detail on click. | Yes | `DataNote.tsx` |

### During the meeting

| Function | What it does for the advisor | Overlay? | Where |
|---|---|---|---|
| Moment card | Names the moment and the concern underneath. Leads with an answer of at most 40 words: acknowledge, connect to the goal, give the plan's figures, ask a question. Then your move, labelled facts with source and date, do-not-claim, and why. | No | `engine/moment.ts`, `moment-prompt.ts`, `meeting/Card.tsx` |
| Premise check (PR #68) | When a client states a public fact (rates, markets, tax rules, retirement accounts, news), checks it live and flags a false one with its source. Never holds the card more than 1.5 s. | No | `engine/premise.ts` |
| Quiet gate | Code decides which lines get a card: questions, plus statements carrying a worry, a life event, a changed goal or a figure. Small talk gets nothing. | No | `engine/gate.ts` |
| Misremembered figure | Checks each figure the client says against the materials, unit included, before the model call. | No | `engine/recall.ts` |
| Prepared answers used live | When a likely worry comes up, the card starts from the prepared answer; a turn touching a file conflict shows both values. | No | `engine/moment.ts` |
| Same question, same answer | A reworded question keeps the earlier card's facts, move and do-not-claims. | No | `engine/consistency.ts` |
| Out-of-scope defer | Forces a polite defer when the client names an out-of-scope topic, even if the model did not defer. | No | `engine/scope.ts` |
| Word-meaning catch | Flags slang, or a word the client took differently ("scrutinize" heard as "audit"). Prompt rule only; no code check. | No | `moment-prompt.ts` |
| Client picture | Worries, things to learn, decisions, life events and requests, each open or resolved, tied to the turn it came up. | No | `meeting/Concerns.tsx`, `picture.ts` |
| Find in materials | Press `/` to search your own files instantly; no model call; figures highlighted. | Yes | `meeting/Find.tsx`, `findMatches.ts` |
| Live mic (website) | Browser speech-to-text (Chrome). Will not start until the all-parties consent box is ticked. | Yes | `speech/MicInput.tsx` |
| Demo replay | Next turn, auto-play, hide (H). | Yes | `src/app/meeting/page.tsx` |

### After the meeting

| Function | What it does for the advisor | Overlay? | Where |
|---|---|---|---|
| End screen | Moments caught, concerns resolved and still open, the client picture. | No | `meeting/EndScreen.tsx`, `endSummary.ts` |
| Copy as tasks | One follow-up task per open concern or client request. | Yes | `replay.ts` |
| Card grades | Grade each card Helpful, Not needed or Wrong; each card carries its time and model ("canned" for fallback cards). | No | `EndScreen.tsx`, `record.ts` |
| Record and compliance app | End meeting downloads a JSON record (no transcript, no audio) and hands it to the records app by a one-time id that expires in an hour. Advisors read their own records, compliance reads all and signs off, nobody edits or deletes. | No | `src/lib/record.ts`, `docs/base44/README.md` |

### The desktop app (merged in #74, live 19:12; guide in `desktop/README.md`)

| Function | What it does for the advisor | Overlay? | Where |
|---|---|---|---|
| Regular Mac app | Dock icon, a normal window for prep; the meeting moves into the floating panel when it starts. | Yes | `desktop/src/main/home.ts` |
| Panel hidden from screen share | Always on top, even over full-screen apps; excluded from screen capture (checked on macOS 26.3). A click on it hands the keyboard straight back to the call and never jumps to another desktop (checked in a practice run, 19:05). | Yes | `desktop/src/main/overlay.ts`, `focus.ts` |
| Move, shrink, pass clicks | Drag by the bar, shrink to a thin bar, pass clicks to the call, move under the webcam. | Yes | `desktop/src/preload/bar.ts` |
| Hotkeys | Control+Option with H, Space, G, B, Right, P. | Yes | `desktop/src/main/controls.ts` |
| Call audio and transcription | Captures system audio (macOS 14.2+), falls back to BlackHole, detects speech, transcribes in its own process. Needs `SC_STT_URL` (a Whisper-compatible endpoint). | Yes | `desktop/src/main/audio.ts`, `pipeline/` |
| Links from the website | "Open in the desktop app" carries the prep in the link fragment, so it never reaches a server. | Yes | `desktop/src/core/deepLink.ts` |
| Consent before the mic | The meeting page's consent popup (read aloud, then "Done: the client agreed") gates the mic in the panel too; the "everyone agreed" notice shows by default. | No | `src/components/speech/MicInput.tsx`, `desktop/src/main/config.ts` |

### Guardrails that run on every answer

| Guardrail | What it means | Where |
|---|---|---|
| Four labels | Every fact is a prepared fact (green, from the advisor's files), a calculation (amber, math shown), a suggestion (red) or a do-not-claim. An unknown label is downgraded, never upgraded. | `provenance.ts` |
| Number tracing | A figure must match its cited source, unit included; numbers written as words are rejected; a figure pinned to the wrong thing is downgraded. The Mandate, likely worries and pre-flight go through the same trace. | `provenance.ts`, `moment.ts` |
| Web facts stay red | Anything from the live web (pre-flight, premise check) is a suggestion, never a prepared fact. The premise check's cited link must be among its own search results, and its figures must trace to the claim or that result. | `preflight.ts`, `premise.ts` |
| No personal data to Google | A search query naming the client, whoever the meeting is with, an email, or an account or phone number is never sent. | `premise.ts` (`safeQuery`) |
| Mandate floors | Standard disclaimers always present; out-of-scope list never empty; lines with invented figures dropped. | `mandate.ts` |
| No pressure | No urgency, scarcity or fear framing; the aim is an informed decision, not a sale. | `moment-prompt.ts` |
| Prompt-injection guards | Uploaded text and search results are fenced as data and cannot act as instructions. | `ingest.ts`, `premise.ts` |
| Never a server error | Failures fall back; only the demo client ever gets canned cards. | `api/**` |

## How the build answers the judging criteria

| Criterion | What we say | Proof |
|---|---|---|
| Creativity | Checks the question itself, not just the answer: false premise, misremembered figure, word heard wrong. Labels every number by where it came from. | Points 1 to 3 |
| Real pain | A tester waited "fifteen or twenty minutes" in an empty room for a number from prepared documents. Another opened the Excel by hand to prove a client misremembered a figure. | Block 2, tester 1 (DEVLOG 16:25) |
| Hidden problem | Spotting the worry and answering it at the same time is what slips. In tester 2's words, it "is more difficult than if someone gives you an idea of what the worry is". | Block 2, tester 2 (DEVLOG 16:45) |
| User feedback | Every Block 2 dislike became a feature: same answer when reworded (#41), grade each card so the record can be audited (#42), a plain data note (#40), anticipate worries (#38), misremembered figure (#30), file conflicts (#31), find in materials (#32). Block 1 asked for cited, dated sources and a tasks list. | `docs/DEVLOG.md` 14:15, 16:25, 16:45 |
| Working live demo | Website with the demo client and replay, plus the desktop panel over a live call. | See risks 1 to 3 first |

## What needs a key, and what happens without it

| Function | Needs | Without it |
|---|---|---|
| Live cards | `ANTHROPIC_API_KEY` | Canned cards, for the demo client's script only (4 cards). Any other client gets no card. |
| Reading files | `ANTHROPIC_API_KEY` | Text files only; no PDFs or images; blank client file. |
| Mandate draft, likely worries | `ANTHROPIC_API_KEY` | The demo Mandate; no likely worries. |
| Pre-flight | `ANTHROPIC_API_KEY`, `BRIGHTDATA_API_KEY` | Every assumption shows "unverified". |
| Premise check | `ANTHROPIC_API_KEY`, `BRIGHTDATA_API_KEY` (zone defaults to `serp_api1`); `PREMISE_CHECK=0` turns it off | Silently off; cards unchanged. |
| Records app | `NEXT_PUBLIC_BASE44_URL` and the Supabase variables | JSON download only. |
| Desktop live transcription | `SC_STT_URL` and its key | Replay only. |

## Risks to settle before judging

1. **Resolved 19:12: the live site is main.** Production
   (second-chair-live.vercel.app) is d9bdf91, with every merged PR, the
   editorial theme and the desktop hand-off. The old second-chair-seven URL is
   frozen; do not demo from it.
2. **Resolved 19:12: the desktop app is on main** and loads the live site.
   Reinstall from main (`git checkout main`, `git pull`, `npm run install-app`)
   if yours was installed from the branch. Live transcription in the panel
   still needs `SC_STT_URL` and a key; demo the panel with the sample meeting.
3. **The premise check is on PR #68, unmerged.** Its real Bright Data path has
   not been run: the key is blank on our laptops, and the live tests used real
   Claude with hand-written search results. Run it once on a deploy before
   showing it, and do not quote the Fed figures from our tests as real.
4. **Screen-share hiding is the most Cluely-like part.** Frame it as hidden from
   the client's view of the screen, never hidden from the client: the advisor
   says "This meeting is being recorded" before the mic starts, and the record
   goes to compliance. The desktop app shows the page's "everyone agreed"
   notice by default (`SC_CONSENT_BANNER=0` hides it, for testing). California
   requires all-party consent; this is a design constraint, not legal advice.
5. **Do not overclaim.** The website mic cannot tell speakers apart (the model
   guesses; a click flips the label). The word-meaning catch is a prompt rule,
   not code-checked. Windows is untested, and real Zoom or Meet screen sharing
   has not been tried with the panel.

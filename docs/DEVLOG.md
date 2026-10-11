# team1 Devlog

Running log of sessions, decisions and remaining work. Newest entries at top.

---

## 2026-10-10 (18:55) - Desktop app merged into main; panel review fixes

- The Mac app (`desktop/`) and the website's hand-off to it
  (`src/components/desktop/`, mounted in `layout.tsx`) are on `main` now, so
  the live site can open meeting links in the app once it is redeployed. A
  browser opens links in the app only after it is paired (the app's first run
  visits `/?sc-desktop=paired`).
- Panel fixes from the 460/340 px review (482d308): the end screen starts below
  the title bar; the body scrolls inside the rounded border; the header is
  compact (19% of the panel at 460 px, was 26%; 27% at 340 px), with no
  sideways overflow and the data list opening inside the panel; click-through
  mode is lighter. The consent notice shows by default.
- README: the main README keeps the short Mac app guide and links the full one,
  now `desktop/README.md` (it was the desktop branch's README). Anyone who
  installed from the desktop branch reinstalls from `main`.

## 2026-10-10 (18:35) - Track D: consent popup (#34), new deployment checked

**Built (#72, for A to merge):** Live mic now opens a consent dialog with the
line the advisor reads aloud (Google's speech service, Anthropic, no audio
saved, written record kept). Start stays disabled until "Done: the client
agreed" is ticked; Cancel or Escape leave the mic off; asked once per meeting.
Replaces the inline checkbox. Uses B's `ui` tokens.

**Checked:** https://second-chair-live.vercel.app (new Vercel account; the old
project hit the Hobby deploy limit). Live cards, hand-off by id and records
app all work with a real meeting; pre-flight falls back until
`BRIGHTDATA_API_KEY` is added there. Fixed earlier: record file named with
the local date (#67), card grades stored and shown (#58).

## 2026-10-10 (18:14) - Live robustness: 8 s limit, quoted demo cards, advisor relabel, life events

The four correcting mechanisms (#30 misremembered figure, #41 reworded
question, the question/statement gate, speaker correction) were probed live on
main and each held when Claude answered in time. The failure was the 5 s limit:
replies take about 2.5 to 4.7 s, and a slow one became a canned card on the
demo script or nothing at all on a live line. Fixed, after an independent
review and a live re-measure:

- **Live limit 5 s to 8 s.** 28 of 28 sequential live calls returned a real
  card (median 3.6 s, max 5.6 s); the old limit would have lost 1 of 28.
- **Canned demo cards quote the plan word for word.** All 5 prepared facts are
  verbatim; two lines that were not quotes are now suggestions.
- **Plain advisor lines are relabelled** without a Claude call ("Let me walk you
  through...", "I'll send you...", "your portfolio..."). On a 132-line sample:
  2 of 94 client lines mislabelled (the first version mislabelled 22; the
  reviewer caught it), 11 of 28 skipped advisor lines caught. A speaker the
  advisor flips by hand now sticks (meeting page, 3 lines, track B's file).
- **Life events reach the engine** as specific phrases (moved, married, a baby,
  a parent passed, sold the business, company acquired...): 30 of 30 on the
  sample it was tuned on; small talk that triggers a call stays at 10 of 30.

Pushed straight to main after `npm run check` (228) and `npm run build`, to
spend one Vercel deployment instead of a preview plus production.

---

## 2026-10-10 (18:10) - Production moved to second-chair-live.vercel.app; the old URL is frozen

**Why.** D's Vercel project hit the Hobby limit of 100 deployments a day
(per owner). Every deploy after 17:03 failed with "retry in 24 hours", so
`second-chair-seven.vercel.app` stayed frozen at `fcee04a` (#52), without
#51 and #53 through #69.

**What.** A new Vercel project, `second-chair-live` (team `elenchus-hacks`,
owner leavesj), deployed with the CLI from a clean clone of `main`, not
connected to GitHub. Branch pushes therefore make no preview builds, and
merges don't deploy by themselves: run `git pull && vercel --prod` in
`~/Documents/team1-deploy` (README). The project was created with framework
preset "Other" and served 404 until the preset was set to Next.js.
Env: `ANTHROPIC_API_KEY`, `BRIGHTDATA_API_KEY` and the three `NEXT_PUBLIC_*`
values from D. `ANTHROPIC_MODEL` and `BRIGHTDATA_ZONE` are left unset because
they equal the code defaults.

**Checked on the live URL** (deploy of `d03b5ae`, main at the time): `/`,
`/prep` and `/meeting` return 200; a demo turn returned a live card from
`claude-sonnet-5-5`; End meeting downloaded the record and posted the hand-off
to D's Supabase with 1 card, 1 concern and 1 grade (the call was stubbed in
the browser, so nothing was written); the records app opened at
`#handoff=<id>`. Pre-flight answered `fallback` on the demo prep, and so does
the old URL, so whether the new Bright Data key works is still to be
confirmed (D is checking pre-flight with real sources).

**Fixes that were never on main, now handled:** D's #67 (record file named
with the local date) merged. B's `0e8ddce` (card fits the screen; numbered
sources) had been pushed to `fix/b-polish` after its PR #61 closed, so it
never reached main; it is now #70. Superseded and left alone:
`fix/next-15.5.27` (main fixed the vulnerable Next.js in `7122cad`),
`feat/end-screen` (#27), `feat/fb-grades` (#60), `fix/mvp-no-signin` (#66,
closed on the user's call).

**Still owed:** the old project's owner disconnects its Git link (Settings →
Git), so PRs stop getting a failing "Vercel" check and pushes stop trying to
deploy there. The repo's website field still points to the old URL and needs
an org admin to change it. Redeploy after #70 and after every merge.

**Update 18:17.** #70 (B's card fit) and #71 merged. #71 adds the full
README with the logo and merges the two-chairs icon (`src/app/icon.svg`,
`favicon.ico`). Production redeployed at `351407e`; every page and
`/icon.svg` return 200. The desktop branch defaulted the Mac app to the old
URL; `34aa64e` on `LeavesJ/electron-gpu-ux-bottlenecks-9cf39f` points it
(plus its README and a test) at second-chair-live (root `npm run check`
passes, 155 tests; `npm --prefix desktop run check` not run). A Mac app
installed before that still opens the old site until it is reinstalled.

## 2026-10-10 (17:45) - Premise check: the client's stated fact is checked live with Bright Data (on by default)

**What it does.** A client question often rides on a stated fact ("Since the
Fed cut rates by a full point last week, shouldn't we..."). When a client turn
mentions markets, rates, tax rules, retirement accounts or news, the engine
extracts up to two public claims (Haiku), searches each through Bright Data
SERP, and judges it against the results only (Haiku). A contradicted claim
leads the live card as a red SUGGESTION fact, "Check the premise: the client
said ... (federalreserve.gov, date)", and adds "Do not repeat as fact: ..." to
do-not-claim. Supported or unclear claims change nothing. `src/lib/engine/premise.ts`.

**Guardrails.** A query carrying the client's name, an email or a long digit
run is never sent. The cited URL must be among that claim's own results, and
every number in the note must trace to the claim or the cited result; else the
finding is "unclear" and stays off the card. Search results are fenced as
untrusted data. The check never throws and never holds the card more than
1.5 s past the card's own answer; a late check is dropped.

**On by default** wherever Bright Data and Claude are configured;
`PREMISE_CHECK=0` turns it off. Tested with real Claude and a local stand-in
for Bright Data (two hand-written Fed results, 1.5 s delay; the key is blank
locally): on the demo Fed question the card led with "Check the premise: ...
(federalreserve.gov)". The figures in that line came from the stand-in, not a
real search. A real Bright Data search runs only on Vercel and is unverified.

**The slowdown and its fix.** Run in the same process as the card, the
premise calls slowed the Sonnet card from 3.0-5.1 s to 5.2-6.4 s and the judge
call stalled; in separate processes neither slowed. A second SDK client did
not help. Giving the premise calls their own connections (`getSideClient()`
in `client.ts`, `node:https` with no keep-alive agent) did: alternating A/B,
card 2.7-4.6 s with the check on vs 4.0-4.3 s off, premise on 4 of 5 cards.

---

## 2026-10-10 (17:20) - Merged: Block 2 fixes on main; macOS build fixed; advisory answer (#37) in the engine

**On main (not yet live while Vercel is rate limited):** #49 macOS build fix,
#50 (#31 file conflicts), #52 (#41 reworded worry, lands #48), #56 (#30
misremembered figure), #51 and #53 (B: card order, client picture), #54 (#38
anticipated worries), #57 (#40 data note, #43 landing), #55 (B: records
button), #58 (D: grades in the record shape), #59 (#37 advisory answer, #39
kind tags), #62 (B's design pass, from #61), #63 (do-not-claim shown once).
`npm run check` on main: 195 passed, on macOS too.

**macOS build.** `meeting/find.ts` and `meeting/Find.tsx` differ only in case,
so on a Mac tsc resolved the component import to the helper and failed. Linux
CI never saw it. The helper is now `findMatches.ts` (#49). The demo laptop
must build from a main at or after #49.

**#37, the core thesis unchanged.** The card still gives the advisor the answer
to say; the answer is now an advisory response (acknowledge the feeling,
connect to the client's goal, answer with the plan's figures, end with a
question; a discovery question when the worry is unclear), at most 40 words.
Live on demo t2/t4/t6: 9 of 9 live after warm-up at 3.7 to 5.2 s route time,
34 to 38 words each. Concern topics carry B's kind tags (`learn: `, `decide: `,
`life event: `, `request: `; a worry is untagged); any other prefix the model
invents is stripped. The system prompt moved verbatim to
`src/lib/engine/moment-prompt.ts` so `moment.ts` stays under 500 lines.

**Review catches.** #30's first build matched client figures without units, so
"6%" matched "6 tranches" and produced a green made-up explanation; fixed
before merge, with regression tests. #31 now drops a conflict whose label has
an untraced number, or whose files share the figure. The landing of #61 kept
the data note in the consent line as a `div`, since `<details>` inside `<p>`
breaks hydration.

**Open.** #60 (#42 grade buttons) is to be reworked onto D's #58 shape and B's
design pass. #64 lands B's review fixes for #61. Vercel: the team's call (see
17:11).

---

## 2026-10-10 (17:11) - Blocker: Vercel rate limit, production stuck at #52; built #40, #43, #42

**Blocker.** Since 17:03 every Vercel deployment, main included, fails with
"Deployment rate limited — retry in 24 hours" (Hobby plan; each PR push makes
a preview deployment). Production is still `fcee04a` (#52). #51, #53 and #56
(#30) are merged but not live. The team decides: the Vercel owner upgrades
(a purchase), main goes to another Vercel project with the same env vars (a
new URL for the next sense check), or, once deploys work again, only main
deploys.

**Built, in review.** PR #57 covers #40 and #43. A data note in one sentence
on the landing, prep and meeting screens ("Second Chair does not train AI on
your meeting, and saves it to your records only when you sign in and save
it"), with the detail as built. End meeting holds the record as a one-time
hand-off for up to an hour, so the note says so. The landing leads with "It
reads your client, so you can focus on the answer". PR #60 covers #42. The
end screen grades each card Helpful, Not needed or Wrong. The record gains
optional grades, one per card, "ungraded" by default, with each card's time
and model. D reviews the record shape.

---

## 2026-10-10 (17:05) - Desktop: the panel drags reliably

The title bar used `-webkit-app-region: drag`, and on macOS that stops
responding on a window that toggles click-through, as the panel does on every
pointer move: the panel could not be moved. The bar now drags it itself: a
press on the bar (not a button) and main moves the window by how far the
cursor has moved, keeping its size, until release; the position is saved. The
hit report is held during the drag so the panel never turns click-through
under the pointer. Grab cursor on the bar. Driven on a throwaway copy: the
panel follows the pointer, stops on release, buttons still click, double-click
still shrinks it. Not yet tried with a physical mouse. After a security
review: only a real press drags (a press made up by page script is ignored,
checked), a move with no button held ends the drag, and a page reload, crash
or hidden window cancels one.

## 2026-10-10 (16:56) - Built: same answer for a reworded worry (#41), anticipated worries at prep (#38)

Both are from Block 2 tester 2. Both are in review: PR #48 and PR #54.

**#41, "Same question, reworded, gets the same answer."** Claude now sees the
cards already shown in the meeting and names the one a client turn rewords.
The engine then keeps that card's facts, move and do-not-claims; only the
concern line and the suggested line are reworded. A new figure from the client,
or Claude judging that something new was added, releases the hold. Live, 2
runs × 2 rewordings of the reserve worry: 3 of 4 gave identical facts and move.
The 4th added a health angle; it kept the facts and asked about health costs.
3.3 to 3.7 s each.

**#38, "Anticipate likely worries at prep."** From the advisor's files, 3 to 5
likely worries, each with why, a prepared answer in the advisory shape
(acknowledge, the client's goal, the plan's figures, a question) and traced,
labelled facts. They show as step 5 of prep for the advisor to edit, and they
travel to the meeting, where a live card starts from the prepared answer.
**Decided:** a separate call that runs beside the Mandate draft, not a field
in the file read. The upload waits no longer, and a hand-entered prep can use
it too. A worry whose answer carries a figure in no file is dropped. Live:
demo prep 10.6 s; the sample files through the whole upload 19.4 s, with 5
sensible worries; the t2 card opens from the prepared answer in 2.9 to 3.8 s.

---

## 2026-10-10 (16:50) - Track D: records database on Supabase; hand-off by id (#45)

**Built: records database** (Supabase project "second chair", us-west-1). The
records app now signs users in (email + password) and saves meeting records.
Postgres row-level security, tested as advisor, compliance and signed out:
advisors save as themselves and read only their own; compliance reads all and
signs off through `sign_off`, which stamps the reviewer's own name, email and
time; saved records cannot be edited or deleted from the apps; signed-out
visitors read nothing. Compliance is granted in SQL only. Supabase's security
check is clean apart from `sign_off` being callable by signed-in users, which
is intended. Confirmed by hand: a record saved from the live app is listed and
signed off.

**#45 (A's review of #25):** End meeting now stores the record as a one-time
hand-off and opens the records app with only its id (`#handoff=<id>`, single
use, expires in an hour), so client details never sit in a URL or history.
Database and records app are live; the meeting-screen change is #47. B: the End
screen's reopen link should switch to `openRecordsApp(record)`.

**For B:** `main` has both `find.ts` and `Find.tsx` in
`src/components/meeting/`, so `npm run check` and `npm run build` fail on
macOS (case-insensitive disk). Linux CI and Vercel are unaffected.

## 2026-10-10 (16:50) - Clarified: the answer stays the core

The team's call on the 16:45 decision: the core thesis does not change.
Second Chair gives the advisor the answer to say. Block 2 changes what kind
of answer: an advisory response, not a fact readout. Naming the worry is the
lead-in, not the product. The suggested response stays the headline of the
card and is built the way good advisors answer: acknowledge the feeling,
connect it to the client's own goal, answer with the plan's figures, end with
a question. Figures keep their provenance labels. Issue #37 rewritten to say
so; tracking issue #44.

---

## 2026-10-10 (16:45) - Block 2 closed; decided: advisory copilot, not a finance data tool

**Tester 2 (session 2, "mixed"):** saw it as reading the client: "you don't
necessarily have a great way of determining what their worry is in a meeting
unless they tell you." And the core of it: "doing that and responding to that
worry is is more difficult than if someone gives you an idea of what the worry
is." One more input, not a replacement for judgment. They prepare for worries
in advance by asking the client for information first. Dislikes: "I am
concerned with how an AI tool would capture my meeting and concerns in that
meeting and use that or share that and help the tool grow"; answers that
change when a question is slightly reworded; AI in finance "has to be audited
over time and has to have some sort of grading for how well it did". Fit: no,
because their current clients do not need financial worries addressed.

**Block 2 result:** 2 of 2 completed, both "mixed" on Catch what humans miss.
Tester 1 valued speed (finding a number); tester 2 valued having the worry
named so they can focus on the answer.

**Decided:** Second Chair is an advisory copilot. It reads the person (the
worry behind the words, what they want to learn or decide, life events) and
suggests the advisor's move, so the advisor can focus on responding; the
advisor's own figures back the move up. Data lookup stays, as the support
layer, not the headline. The hidden problem, in tester 2's words: spotting the
worry and answering it at the same time is what slips.

**Changes the build (issues filed, label `feedback`):** advisory-first card
(the person and the move lead, facts back it up); anticipate likely worries at
prep; a client picture beyond financial worries; a plain statement that
meetings are not stored on a server or used to train AI; the same question
reworded gets the same facts; grade each card at the end so the record can be
audited over time; landing copy in the advisory voice.

---

## 2026-10-10 (16:43) - README: start to finish

`README.md` (new): the website with no install, then the Mac app (download,
install, open, prep, the panel's buttons, shortcuts, screen share, quitting),
live transcription and its settings, updating and removing, Windows status,
running locally, the checks, and a troubleshooting table. The install steps
were followed from a fresh clone of this branch: install and package succeed.

## 2026-10-10 (16:38) - Desktop: a regular Mac app; prep in an app window, the meeting in the panel

Branch `LeavesJ/electron-gpu-ux-bottlenecks-9cf39f`.

- **Why:** with no Dock icon the only handle was a menu-bar glyph; once the
  panel was hidden there was no obvious way back, and its X read as "close".
- **Now:** a Dock icon, Command+Q, Command+Tab. Opening the app shows a normal
  window with the start page and prep. Starting the meeting (prep's button or
  the demo link) hides that window and opens the meeting in the private panel;
  both share one session, so the prep carries over with no link. The panel's X
  hides it; clicking the Dock icon brings it back (or the app window when no
  meeting is hidden). Menus: Meeting (Prepare a meeting, Command+N), Edit (copy
  and paste in the prep form), Panel, Window; the Dock menu has the first two.
- **Checked on macOS 26.3:** the panel still floats over a full-screen app with
  the app no longer an accessory; with protection on, the system screen capture
  leaves the panel out (off: it shows). Real Zoom or Meet share not yet tried.
- The "everyone has been told" line hides again (B's markup changed twice
  today); the rule covers both versions.

## 2026-10-10 (16:23) - Desktop: plain names, a separate screen-share button, hover labels

Branch `LeavesJ/electron-gpu-ux-bottlenecks-9cf39f`.

- **One eye, one meaning.** The title bar's eye now only means screen share
  (slashed: the client can't see the panel; open, in amber: they can). Click
  through has its own pointer button.
- **Every icon says what it does on hover.** The bar draws its own label,
  because macOS shows native tooltips only for the active app, and the panel
  never becomes active.
- **Names say what the user gets.** "Panel" everywhere, never "overlay".
  "Type into overlay" became "Type in the panel", "See-through" became "Pass
  clicks to the call", "Collapse to title bar" became "Shrink to a thin bar",
  and the replay controls sit under "Sample meeting" as "Play the next line"
  and "Play or pause". The status reads "Not listening" (not "Mic off": the
  source may be call audio).
- **Consent checkbox wording:** "I said: 'This meeting is being recorded.'"
  The client is told out loud, so the checkbox records that the advisor said it.
- Open for track B: the meeting page's own "Next turn" and "Auto-play" buttons
  could take the same names; not edited here (track B's file).

## 2026-10-10 (16:25) - Desktop: site links open the overlay; real macOS app; native call audio

Branch `LeavesJ/electron-gpu-ux-bottlenecks-9cf39f` (pushed, not merged).

- **Links open the overlay.** `cd desktop && npm run install-app` builds
  `Second Chair.app`, signs it ad hoc, installs it to `~/Applications` and
  registers `secondchair://`. On first run it opens the site once with
  `?sc-desktop=paired`; from then on that browser hands `/` and `/meeting` to
  the overlay (`src/components/desktop/OpenInDesktop.tsx`, mounted in the root
  layout), with the advisor's prep in the link's fragment (never sent to a
  server). Browsers that were never paired, phones, and the overlay itself
  see the site as before. Chrome asks once before opening the app; "always
  allow" makes it automatic. Live on the production link only after a merge.
- **macOS audio without BlackHole.** Electron 39+ captures system audio on
  macOS 14.2+ through a Core Audio tap. It needs `NSAudioCaptureUsageDescription`
  in the app's Info.plist (a dev run gets a silent stream, no error), so it
  works from the packaged app. The capture's video is the hidden window's own
  frame, so no Screen Recording permission is asked for. BlackHole remains the
  fallback for older macOS.
- **Testing the undisclosed scenario (user's call):** the meeting page's
  "everyone has been told" notice is hidden in the overlay by default, with a
  menu-bar toggle. The all-parties consent checkbox still gates recording:
  California requires every party's consent to record.
- Also: "Move under the camera" keeps the advisor's eyes near the lens.

Verified with the installed app: a `secondchair://` link through macOS opened
the meeting with the handed-off prep (the demo client's name gone); a hostile
`path` stayed on `/meeting`; a malformed link was ignored. 155 tests, next
build green. Not verified: the Chrome prompt (needs a person to click), Core
Audio capture of a real call, capture exclusion on macOS (needs Screen
Recording permission for the test runner).

## 2026-10-10 (16:15) - Track D done: live engine on production, record hand-off live

**Bright Data fixed on production.** Pre-flight was returning `source:
fallback`: the same key and zone answered correctly from a laptop (9 organic
results for a CPI query), so the cause was the values stored in Vercel. The
key was re-entered and `BRIGHTDATA_ZONE` removed (the code defaults to
`serp_api1`). Pre-flight now returns `source: brightdata` with cited, dated
sources. For A: `brightdata.ts` reads the key without `.trim()`, so a pasted
newline would silently break it again.

**Verified on production:** meeting cards come from Claude (not the canned
text); a spoken sentence on Live mic became client turn m1 and a Disclosure
card; End meeting (#25 merged) downloads the record and opens the records app
with it loaded, no sign-in, address bar cleaned. D1 (#4), D2 (#8) and D3 (#12)
are closed; screenshots and URLs are on #13.

**Known limits:** the mic cannot tell speakers apart (B's note at 15:30);
records are raw files until the database lands after the second sense check.

## 2026-10-10 (16:25) - Block 2, tester 1: "mixed" on the theme; speed is the value they see

**Read:** they understood it as a live copilot ("this is listening and going
to be searching through data ... to actually pull up a retort"), not a
note-taker. Likes: pulls plan facts during the meeting with no manual search;
cuts the downtime while the client waits; looks professional; "I have never
seen anything like this." Dislikes: none, on one condition: "as long as the
client was comfortable with it."

**Doubt (the theme):** "it's possible it could catch something that the team
would miss. I think it would just do it much, much faster. That would be the
real benefit of this."

**Their stories, which are catches in disguise:**
- A client remembered a different number than the report showed; they opened
  the Excel and checked the formulas by hand to prove which was right.
- On site at a corporate client they could not find a number in prepared
  documents; neither could an inside rep. "it was probably, I bet, fifteen or
  twenty minutes transpired by the time I got the answer", waiting in an empty
  conference room, "fairly embarrassed".

**Confusion:** on opening the link, "I don't know what I'm looking at." In the
demo meeting the concerns panel said nothing's raised yet, with no hint of
what would appear there.

**What changes the build before 8 PM** (issues filed, labelled `feedback`):
catch a figure the client misremembers and show the plan's figure with its
source; flag figures that disagree across the uploaded files at prep; an
instant "find in your materials" lookup on the meeting screen; explain the
demo and the empty states; a consent line the advisor can say to the client.
Pitch: lead with the 15-to-20-minute hunt (speed), then show the catch.

---


## 2026-10-10 (16:05) - Block 2 sense check launched

Test `53289620-a96e-41c4-8229-9448b1187d8d`, session 2, theme Catch what
humans miss, stimulus https://second-chair-seven.vercel.app (production, so
every merge to `main` reaches testers who load or reload it). SenseAI frames
the calls as: advisors miss the real worry behind client questions or give
answers they can't back with plan numbers, and those misses cost them client
trust. Launched on the team's explicit go; 2 checks remain. Description sent
word for word: prep from the advisor's files, a card with what the client
likely means, facts from the advisor's own plan with the document and date
each came from, a suggested answer, anything untraced marked as a suggestion.
Known rough edge at launch: End meeting downloads a JSON file and opens the
records app empty (#25 and #27 pending review).

---

## 2026-10-10 (15:55) - Desktop overlay (Electron), on its own branch

Branch `LeavesJ/electron-gpu-ux-bottlenecks-9cf39f`, not merged (code freeze).
New package `desktop/` with its own `package.json`, so the root package,
lockfile and every track's files are untouched. Root `tsconfig.json` now
excludes `desktop`. Run: `cd desktop && npm install && npm start`.

**What it is:** the deployed `/meeting` page in a compact always-on-top panel
over the call: title bar with the logo and live status, movable, resizable,
collapsible to the bar, remembers its place and text size, menu-bar icon.
Hotkeys are Control+Option (Ctrl+Alt): H hide, Space type, G see-through,
B collapse, Right next turn, P auto-play, Shift+Q quit.

**Decided:**
- **Content protection is on, but it is not a promise on macOS.** Electron's
  own docs: macOS apps that capture with ScreenCaptureKit (recent Zoom, Teams,
  the macOS screenshot tool) capture the window anyway. Windows
  (`WDA_EXCLUDEFROMCAPTURE`) works. On a Mac, share a window, not the desktop.
  Not verified here: this shell has no Screen Recording permission.
- **Focus:** a non-activating panel that never takes focus from the call; it
  only does when the advisor asks to type, and Esc gives it back.
- **Lag:** the main process never waits on audio, speech or the network.
  System audio is captured in a hidden window, voice detection runs on the
  audio thread, speech-to-text runs in a utility process with backpressure
  (merges waiting sentences instead of queueing). Turns enter through the
  meeting page's own mic button, consent checkbox included (shimmed
  SpeechRecognition). Testing showed the page dropping lines spoken during
  an analysis; main's live-turn change (f2fa17d) fixed that in the page, so
  the shim passes each line straight through.
- **Speech-to-text** is any OpenAI-compatible endpoint in `SC_STT_URL`
  (local whisper keeps audio on the machine). macOS needs a virtual audio
  device (BlackHole) for the call's sound; Electron has loopback on Windows only.
- OCR and screen extraction dropped (finance tool, not code).

**Verified** (CDP-driven, tone source and mock speech service): click-through
zones, collapse, see-through, no sideways overflow, no page errors, tone to
card in 9 s, nothing sent after Stop mic. 125 tests green. Not verified: real
call audio (no BlackHole here), capture exclusion, Windows.
## 2026-10-10 (15:55) - Track A: prep from files, live turns, speaker labels

**Live:** https://second-chair-seven.vercel.app. Merged #19 (C), #20 (D) and
#22. Checked on production: t2, t4 and t6 give live cards in 4.1 to 4.7 s;
filler ("Okay, that helps.") returns no card in 0.8 s with no Claude call;
the sample PDF and CSV are read in 8.5 s; pre-flight runs live Bright Data.

**#22, merged.** Prep starts from files: PDF and images go to Claude;
.docx, .xlsx and .pptx are unzipped server-side (no new packages); CSV and
text are kept verbatim. A client-file figure not found in the files is zeroed
and listed as missing, never guessed. Live gate: questions always run; filler
and plain statements do not; a statement with a worry, life event, changed
goal or figure still runs, because two of the three demo scenes are
statements and "stop working at 65, not 70" is a contradiction. Prepared
facts show their source document and its date (Block 1 tester 2).

**#26, open.** Live mic lines spoken during the 4 s analysis were dropped
(`step()` returned early while busy). Now every line shows at once and
analysis is newest-wins: a new line cancels the stale request and, after a
0.6 s pause, one request covers everything said. Speaker labels: a line that
echoes the card's phrasing is the advisor (no call); otherwise the engine
judges the speaker first and returns `speaker: "advisor"` with no card; a
click on a live line's label flips it. Prep reads who the meeting is with
(client, prospect, supervisor, compliance, committee) and why; money fields
are expected only of a client or prospect. Live check: a Q3 note was read as
"Priya Shah, supervisor"; an advisor question came back `speaker=advisor`.

**Not built here: hiding the overlay from screen capture.** The request was
stopped by a safety check; another session owns the alternative. Research
for the record: on macOS 15.4+ Apple says there is no public API to prevent
capture, and ScreenCaptureKit-based capture records `NSWindowSharingNone`
windows, so per-app behavior varies.

**Sense checks.** Block 1 closed: 13 sends, 2 completed, 11 failed. Block 2
drafted with the link as stimulus; not launched.

**Tooling.** The ecc plugin's pre-commit hook needs `eslint-formatter-compact`;
installed locally with `--no-save`, so `package.json` is untouched.

---

## 2026-10-10 (15:45) - Track D: records app drops sign-in for now; End meeting hands the record over

**Decided (supersedes 15:10):** the records app runs **without sign-in or a
database** for the sense check. Records stay in the browser and leave as raw
JSON files; the compliance sign-off is a typed reviewer name and time written
into the file (not checked against an account). A shared database with
sign-in, possibly Supabase, is queued for after the second sense check. The
sign-in + saved-records version is kept as the Base44 checkpoint "records:
load record handed over by End meeting".

**Built:** End meeting now opens https://second-chair-view.base44.app with the
record in the link's fragment (never sent to a server); the app loads it ready
to review, sign off and download (records app published; our half is #25).
Records app fixes: times in the viewer's zone, phrasing labelled SUGGESTION.
D1 (#4) closed. D2 (#8) waits on the Chrome mic test.

## 2026-10-10 (15:30) - Track B: live mic has no speaker separation (parked)

The live mic labels everything it hears as the client, the advisor's own
speech included. `MicInput.tsx:99` hands the meeting screen text only (Chrome's
speech API has no speaker information), and `src/app/meeting/page.tsx:70`
marks every mic line `speaker: "client"`, so advisor lines go to the engine as
client turns and can raise wrong cards and concerns. The scripted replay is
unaffected. **Parked by B for now:** if the mic is demoed, only the client
should speak. Cheapest fix when wanted: a Client / Me toggle on the meeting
screen that sets the speaker of each mic line (B's files only, no contract
change); advisor lines then stay as context and raise no cards.

## 2026-10-10 (15:10) - Track D: Vercel live, records app published

**Vercel is live:** https://second-chair-seven.vercel.app (project on D's
account, connected to `TEAM1-THING/Team1`). Every push to `main` deploys
production; every branch gets a preview, which sits behind a Vercel login.
The earlier failures were not a project setting: Vercel refuses to publish
Next.js 15.5.4 ("Vulnerable version of Next.js detected"). Fixed on `main` by
#17 (Vercel's bot, 15.5.9). D's `fix/next-15.5.27` branch showed 15.5.27
passes too; not merged.

**Env (Vercel):** Production has `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`,
`BRIGHTDATA_API_KEY`, `BRIGHTDATA_ZONE` and `NEXT_PUBLIC_BASE44_URL`. Preview
has only `ANTHROPIC_MODEL` and `NEXT_PUBLIC_BASE44_URL` so far. Open:
`ANTHROPIC_MODEL` overrides the engine's Opus default for prep-time calls;
A to decide whether to keep it.

**Records app, decided: sign-in and saved records, not a public viewer.**
Guardrail 5 (every card is a record) needs records that outlive the browser
tab; compliance supervision needs a sign-off that stores who and when; stored
client details need access control. Published at
https://second-chair-view.base44.app: save a record, a records list, a
compliance sign-off (admins only, stored with reviewer and time). Advisors see
only their own records; only admins edit or delete. "Demo data only" banner.
Notes and a sample record: `docs/base44/`.

**Mic (`feat/ship`, PR pending):** Chrome speech recognition, one client turn
per finished sentence. It stays off until "All parties consent" is ticked:
the meeting screen had no consent notice (CLAUDE.md invariant). Fixed a
stop/start race that sent every turn twice and a restart loop on network
errors. End meeting downloads the record and opens the records app.

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

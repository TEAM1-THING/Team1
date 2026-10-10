## 2026-10-10 (midday) - brainstorm to build: Second Chair

> **Partly superseded by [section 02](2026-10-10-02-positioning-revision.md):**
> the *Product shape*, *Block 1 package* and *Build order* below are replaced.
> Event facts, the in-person / online / replay toggle, and the noise correction
> still stand. Kept otherwise unchanged as history.

Written at the end of the brainstorm, before any code. Three kinds of statement
below, kept apart on purpose: **Event facts** (from the organizers' Sense Check
Guide PDF), **Decisions** (ours, made in conversation), and **Unverified**
(believed, not checked). The PDF is organizer-shared; ask whoever holds it. Do
not copy its promo codes into this repository.

### Event facts

- Hacking 10:30 AM to 8:00 PM PT, submit at 8:00, judging 8:30, awards 9:30.
  Mentor hours 11-12, 2-3, 5-6.
- **Sense checks:** 3 per team, one per block, 3 tester calls per check.
  Blocks: 12-1 PM *test the idea*, 3-4 PM *show what you built*, 6-7 PM *ask your
  question*. One team token, shared by everyone, shown once at sign-up.
- Testers are finance professionals. They get a text, reply YES, and an AI
  interviewer phones them for 10-15 minutes. A call under 7 minutes does not
  count and they call someone else. Testers never see the team name. Outside the
  US it is a browser call instead.
- **The product description is read to testers word for word.** Describe it;
  do not instruct. Instructions get refused. Hide team names, keys and client
  data in any screenshot. With no product yet, it is just the call.
- Each launch spends 1 of 3 checks. Edits are free until launch. A check closes
  after 3 calls or one hour. Results come back as a summary and quotes per
  tester. Ask open questions ("what would stop you using this?").
- **The theme is one for the whole day:** save time, build trust, or catch
  what humans miss.
- The six finance users: accountants and CPAs; banking, lending and compliance;
  financial analysts and FP&A; finance ops and bookkeeping; investment, markets
  and trading; wealth and financial advisors.
- **Judging:** creativity (a fresh take, not the obvious build); real pain (in
  their own words); hidden problem (something no one sees unless they asked a
  user); user feedback (what changed after testers spoke, and why); works live
  (demo the real product, not slides). Bring the receipts: the tester quote
  that changed the build.
- Sponsor tracks: one prize requires Bright Data, one requires Base44. The
  prize amounts came from a garbled text extraction; **confirm with an
  organizer, and ask whether the tracks stack.** Other sponsors (Cognition,
  Daytona, Clerk, Fish Audio, MongoDB, Stripe) offer credits, none required.

### Decisions

- **Theme: Catch what humans miss.** Save time is expected to be the crowded
  choice. Locks for the day when Block 1 is launched.
- **User: wealth and financial advisors**, meeting clients with a laptop open.
- **Working name: Second Chair** (placeholder, testers never see the team name).

**Product shape (before / during / after):**

1. **Before.** The advisor gives the product their prepared pitch deck and
   documents (or, at minimum, a short typed brief). It shows a 30-second summary
   of what it understood: the thesis, assumptions, risk stance, disclaimers. The
   advisor confirms. That confirmed summary is the **Mandate**.
2. **During.** It listens. When a client asks a question it shows an answer card
   on a second screen, labelled by where it came from:
   - **Green:** straight from the advisor's own materials, with page or cell cited.
   - **Amber:** computed live; the math and assumptions are shown.
   - **Red:** beyond the prepared materials. A best-effort suggestion that stays
     inside the Mandate, states its assumptions, and is not a figure to quote.
   - **Outside the Mandate:** it says *defer*, not an answer.
3. **After.** A compliance-ready record of what was said, shown and flagged, plus
   the follow-ups the advisor promised, with sourced draft replies for the
   questions it could not answer in the room.

**Why this is more than a wrapper.** Transcribe-and-summarize is the commodity
layer (AI note-takers for advisors already exist; from memory, unverified).
The parts that are not: (a) the **number-trace check**: any figure in a card
must trace to a source span or a shown calculation, or it is downgraded;
(b) the **Mandate** that bounds improvised answers and supplies the refusal rule;
(c) unanswered questions become **tracked obligations**, closed after the
meeting; (d) a hash-bound receipt of the record. (a), (c) and (d) come from
earlier verification work (Felix's obligations and qualified checkers, plus a
claim-level support check); the ideas carry over, not the code.

**Mode toggle: in person vs online.** Same pipeline, different audio source:
- *Online:* capture the meeting's audio on the advisor's own machine (the
  Cluely approach). Easier and more reliable, so the safer demo path.
  Unverified: browser tab audio capture should cover web meetings in Chrome;
  the desktop Zoom app on macOS likely needs a loopback audio driver. Check
  before relying on either.
- *In person:* a close microphone in the room. Harder. Needs a streaming speech
  model and tolerates noise badly.
- *Replay:* a "play sample meeting" mode that feeds a prepared transcript through
  the same pipeline. Required for phone testers, who only get a call and a link,
  and as the demo's fallback.
- Online loses the "client can see the second screen" transparency of the
  in-person version, so it needs an explicit consent disclosure on the call.
- **Correction on noise:** Shazam-style spectrogram fingerprinting matches *known
  recordings*; it does not clean up or transcribe free speech. Use a near mic,
  noise suppression and a streaming speech model.

### Block 1 package (ready to send; confirm with the team first)

**Who it's for:** wealth and financial advisors who meet clients in person with a
laptop open.  **Theme:** Catch what humans miss.

**Description (read word for word):**

> Second Chair is an assistant for wealth advisors who meet clients in person with a laptop open. Before the meeting, the advisor gives it the pitch deck and documents they've prepared. During the meeting, it listens, and when a client asks a question, it shows the answer on a second screen, marking whether it came straight from the advisor's own materials, was calculated on the spot, or goes beyond what was prepared. When a question goes beyond the prep, it suggests a best-effort answer that stays within the advisor's own stated approach and says clearly what it's assuming. After the meeting, it hands over the compliance notes and a list of the follow-ups the advisor promised.

**Questions for the interviewer** (testers are "finance professionals", not
necessarily advisors, so open with a role question; question 2 also works for an
analyst presenting to a PM):

1. Walk me through your last in-person client meeting. What did you prepare, and what surprised you?
2. Tell me about the last time someone asked something you couldn't answer on the spot. What did you do, and what happened afterward?
3. What do you promise in meetings that's hard to keep track of afterward?
4. What do you have to document after a meeting, and what slips through or takes the longest?
5. If something listened and suggested answers live, what would worry you?
6. What would a suggested answer need to show before you'd say it out loud?
7. What would stop you from using this?
8. Who else would need to be comfortable with it listening, such as the client or compliance?

What we want to learn: is the "couldn't answer on the spot" pain real and in
what words; what advisors do today; the trust threshold for improvised answers
bounded by the deck; the documentation and follow-up burden.

### Build order (cut from the bottom if time runs out)

1. Document ingestion with cited answers.
2. Question detection, typed or simulated first.
3. The green/amber/red labels, the number-trace check, Mandate bounds and defer.
4. Bright Data: a pre-flight that flags stale numbers in the deck against live
   public sources, and public-fact lookups with citations for niche questions.
5. Live speech with the online / in-person toggle.
6. The after-meeting record and follow-up list.
7. A live checklist ring for required disclosures (the coverage view).

Live speech sits fifth deliberately so a flaky microphone cannot stop the demo.

### Risks and unverified

- Scope is large for one day. Nothing built or tested yet, including speech,
  retrieval and Bright Data.
- "Best-effort answers" is where hallucination risk lives. The labels and the
  defer rule are the mitigation; a made-up number said aloud is worse than
  "I'll follow up".
- Recording and consent rules; client data going to a third-party model. Design
  constraints, not legal advice.
- Sponsor prize amounts and whether tracks stack: unverified.
- Whether SenseAI testers include actual advisors: unknown; the questions are
  written to work for other finance roles.

### Open questions

- Stack, speech provider, LLM provider (none chosen). Base44 is optional; using
  it is what makes that prize track available.
- Who redeems which sponsor credits (Bright Data is per hacker; the redemption
  path was not in the extracted text).
- First commit and push; whether to bind this repo to Felix (`felix new team1
  --no-commission` writes into the Felix repo and adds a stop-gate here, so it
  was left undone).
- Who is on the team and who owns which part: not recorded.

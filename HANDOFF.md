# Handoff

Durable prose between sessions: what was decided, what is true now, and where
the next session starts. Detailed sections live in `docs/handoff/`, one file
each. When a section is replaced, move it there unchanged and add a row to the
index below.

---

## Current state (2026-10-10, 12:35 PDT, end of session 1)

**Session 1 was a brainstorm and repo setup. No product code exists.**

- **Repo:** public `joshcodes42/Team1`. `CLAUDE.md`, `HANDOFF.md`, `docs/` and
  `.gitignore` were first committed and pushed to `main` at about 12:55. From
  now on, any change to the handoff, devlog or `CLAUDE.md` is pushed straight away.
- **Update 12:52: Block 1 sense check launched** (test
  `78e8af97-7ece-4d65-bc1d-e7ba058f67bd`, 2 checks left). Details and results
  go in `docs/DEVLOG.md`. Do not relaunch it.
- **SenseAI:** the `sense-check` MCP is registered at local scope under this
  folder's project key (in `~/.claude.json`, not in the repo). `claude mcp get`
  reported *Connected*. A stale entry under the home-folder key was removed.
  **A session started after that should have the tools; confirm with
  `list_tests` (expect "3 sense checks left").** Session 1 never called any
  SenseAI tool, so no check has been spent and nothing has been launched.
- **The token** is not in the repo. It appeared twice in session 1's chat
  transcript; if that transcript is ever shared, ask an organizer for a new one.
  Teammates register their own copy with `claude mcp add -s local`.
- **Idea:** *Second Chair*, a live copilot for wealth advisors in client meetings:
  it catches the decision-relevant moment (worry behind a question, contradiction,
  buying signal) and privately shows the advisor what's going on and what to say
  next, with every claim labelled prepared fact / calculation / suggested phrasing /
  do-not-claim. Theme *Catch what humans miss*. Full positioning, the verified
  competitor map, demo scenes and build order: **section 02**.
- **Block 1 package** (description written to read as a live copilot, explicitly
  *not* a note-taker, with a fallback wording) is in section 02, including a
  ready-to-paste agent prompt. **Launched at 12:52 with a one-line opening added
  by the user (see the update above and the devlog).**
- **Not decided yet:** the five guardrails in section 02 (especially: is the
  client told?), the stack, speech and LLM providers, who owns what, and whether
  to use Base44 (it unlocks that prize track).
- **Not done on purpose:** Felix binding (`felix new team1 --no-commission`
  writes into the Felix repo and adds a stop-gate here).

## Start here next session

1. Run `list_tests`. If the SenseAI tools are missing, this session started
   before the MCP was registered: restart it from the `team1` folder.
2. **Time matters.** Block 1 runs 12:00 to 1:00 PM PDT. A check closes after 3
   calls or one hour, and results arrive about an hour after launch. Later blocks:
   3-4 PM (show what you built) and 6-7 PM (ask your question). Hacking ends 8:00 PM.
3. Use the ready-to-paste prompt in section 02. Show the user the preview the
   agent produces. **Do not launch until the user says "launch"**; each launch
   spends 1 of 3 checks and edits are free until then.
4. After results arrive: read every tester summary, log quotes and the change each
   one caused in `docs/DEVLOG.md`. The judges score "the tester quote that changed
   your build". Record whether testers described it as a copilot or as a
   note-taker, and what they said about disclosing it to the client.
5. Then write the design spec from section 02's build order, choose the stack,
   and ask the user before the first commit.

## Do not

- Put the token, sponsor promo codes or the organizers' PDF in this public repo.
- Use `claude mcp add --scope project` or a committed `.mcp.json`.
- Launch a sense check without an explicit go from the user.
- Describe the product to testers as a note-taker or meeting summariser.
- Claim "nobody does this". Section 02 records what we actually checked.

## Ideas considered and parked (so they are not re-brainstormed)

- **Stale-review catcher:** binds a review to a content hash so an edit marks it
  stale. Cheap, robust demo, thin on its own.
- **Omission finder:** lists what a deliverable owes that nobody wrote a check for.
  Unproven, hard to make credible in a day.
- **Reality check against public data:** audits assumptions against live public
  sources. Best Bright Data fit.
- **"Google the borrower, with receipts":** lender checks an application's claims
  against the live web. Strongest Bright Data fit and a good fallback if Second
  Chair stalls; same build can be framed as Catch or Save time.
- **"What quietly changed?":** red/green diff of filings, fees and terms.
- **Save-time options:** CPA client document chase; credit memo in 60 seconds;
  PDF to model with click-to-source.

Bright Data is a must-use prize track; Second Chair uses it in build-order step 5
(deck pre-flight and cited public-fact lookups), so protect that step.

## Index

| Section | What it holds |
|---|---|
| [2026-10-10-02 positioning revision](docs/handoff/2026-10-10-02-positioning-revision.md) | **Current.** Next-move coaching positioning, three layers, moment types, verified competitor map, guardrails, demo scenes, Block 1 package with ready-to-paste prompt, build order |
| [2026-10-10-01 brainstorm to build](docs/handoff/2026-10-10-01-brainstorm-to-build.md) | Event facts, in-person / online / replay toggle, noise correction, original answer-the-question shape. Partly superseded by 02 |
| [2026-10-10-03 state at afternoon start](docs/handoff/2026-10-10-03-state-at-afternoon-start.md) | Archived: the previous "Current state" and "Start here", moved unchanged |

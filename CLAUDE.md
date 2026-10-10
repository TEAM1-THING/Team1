# team1

Project constitution: what is true about this repository and nothing else.
Today's state and the next step are in [HANDOFF.md](HANDOFF.md). The running
log is [docs/DEVLOG.md](docs/DEVLOG.md).

## What this is

A one-day hackathon build (event "Talk to Users", 2026-10-10, hacking ends
8:00 PM PT, submit then, judging 8:30 PM). Teams get live feedback from real
finance professionals through the SenseAI "sense check" MCP, and judges score
creativity, real pain, hidden problem, user feedback, and a working live demo.

Working name: **Second Chair** (placeholder).
Theme: **Catch what humans miss.** User: **wealth and financial advisors.**
Current positioning, competitor map, guardrails and build order:
[handoff section 02](docs/handoff/2026-10-10-02-positioning-revision.md).
Event facts and the in-person / online toggle:
[section 01](docs/handoff/2026-10-10-01-brainstorm-to-build.md) (partly superseded).

## Verification

There is no gate yet and no stack chosen. Do not claim anything is done
without running it. When a stack exists, put its one trusted command here.
This repository is not bound to Felix.

## Invariants

These came from decisions already made, not from habit.

- **The repository is public.** Never commit a token, key, promo code, client
  data, or the organizers' files. `.gitignore` guards the usual names but is not
  a substitute for looking at `git status` before every commit.
- **The SenseAI token stays out of the tree.** Each person registers the MCP
  at local scope (`claude mcp add -s local ...`). Never `--scope project`, never
  a committed `.mcp.json`: anyone holding the token can spend the team's 3 checks.
- **Launching a sense check needs an explicit go from the team.** Each launch
  spends 1 of 3. Edits to the description are free until launch.
- **No number reaches the advisor without a provenance label.** Every figure
  in an answer card is green (traced to the advisor's own materials), amber
  (computed here, math and assumptions shown) or red (outside the prepared
  materials, an assumption-bearing suggestion). A number that cannot be traced
  must be downgraded, never shown as green.
- **Improvised answers stay inside the Mandate** (the thesis, assumptions, risk
  stance and disclaimers confirmed from the advisor's deck before the meeting).
  A question outside the Mandate gets a "defer" suggestion, not an answer.
- **Recording needs consent.** Show a consent notice in every mode. California
  requires all-party consent. This is a design constraint, not legal advice.

## Working agreements

- Read a file before editing it. Keep files under 500 lines.
- Append to `docs/DEVLOG.md` (newest first) when something is decided or built.
- End a session by updating `HANDOFF.md`; move the section it replaces into
  `docs/handoff/` unchanged.
- Whenever `HANDOFF.md`, `docs/handoff/`, `docs/DEVLOG.md` or this file
  changes, commit and push it to `main` right away so the team sees it. Stage
  those paths by name and look at `git status` first. Everything else: commit
  and push only when asked.

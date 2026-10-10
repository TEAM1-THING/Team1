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

## Stack

Next.js 15 (App Router, TypeScript, Tailwind) deployed on Vercel. Claude API
for the engine (`@anthropic-ai/sdk`, key in `ANTHROPIC_API_KEY`, never in the
tree). zod for the shared contract. Vitest for tests. Base44 hosts the separate
after-meeting record app. Bright Data powers the pre-meeting check.

## Verification

```bash
npm run check
```

Type check plus Vitest. Run it before calling anything done. CI runs it and
`npm run build` on every pull request and on `main`; a red CI does not merge.
On the machine that bound it, Felix governs this repo (project `team1`) and
`felix gate` runs the same command.

## Team build: four tracks, zero-friction merge

The plan, stages and production blockers (PBs) are GitHub issues labelled
`PB`; the tracking issue is pinned. Each track owns its paths. **Never edit a
file another track owns**; if you need a change there, ask its owner.

| Track | Share | Branch | Owns exactly these paths |
|---|---|---|---|
| A Engine + integration | 50% | `feat/engine` | `src/app/api/**`, `src/lib/types.ts`, `src/lib/provenance.ts`, `src/lib/mock.ts`, `src/lib/engine/**`, `src/app/layout.tsx`, `src/app/globals.css`, `package.json`, `package-lock.json`, `.github/**`, `tests/provenance.test.ts`, `tests/engine-*.test.ts` |
| B Meeting screen | 20% | `feat/ui` | `src/app/meeting/**`, `src/components/meeting/**`, `tests/ui-*.test.ts` |
| C Prep + landing | 15% | `feat/prep` | `src/app/page.tsx`, `src/app/prep/**`, `src/components/prep/**`, `src/data/**`, `tests/prep-*.test.ts` |
| D Ship: deploy, Base44, mic | 15% | `feat/ship` | `src/components/speech/**`, `src/lib/record.ts`, `vercel.json`, `docs/base44/**`, `tests/ship-*.test.ts`, the Vercel and Base44 dashboards |

Seams are already stubbed on `main`, so every track builds against them today:

- `src/lib/types.ts` is the contract. **Frozen.** Only track A changes it, and
  says so in the team chat before pushing.
- `/api/moment`, `/api/mandate`, `/api/preflight` answer from canned data now;
  track A swaps in Claude and Bright Data behind the same shapes.
- `loadPrep()` / `savePrep()` in `src/lib/store.ts` (frozen) carry the Prep
  from the prep screen to the meeting screen.
- `<MicInput onTurn />` and `exportRecord(prep, state)` are stubs the meeting
  screen calls; track D fills them in without touching the meeting screen.

Merge rules:

- Work only on your branch. Commit and push to it as often as you like.
  Only track A pushes or merges to `main`.
- Do not add npm packages. If you truly need one, track A adds it on `main`
  and you merge `main` into your branch.
- Merge `origin/main` into your branch at 2:00 and again before your PR.
- Open your PR to `main` by **2:30** with `npm run check` green locally.
  Code freeze **3:15**; after that, fixes only.

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
  those paths by name and look at `git status` first. Feature work follows the
  merge rules above.

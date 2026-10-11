# Second Chair

A private screen a wealth advisor keeps open while a client talks. It reads the
moment (a worry, an objection, a hesitation), suggests what to say, and backs
every figure with the advisor's own materials. Built in one day at the "Talk to
Users" hackathon, 2026-10-10.

## Live

| | URL |
|---|---|
| **App** | https://second-chair-live.vercel.app |
| Records app (Base44) | https://second-chair-view.base44.app |

**Do not use `second-chair-seven.vercel.app`.** That was the first Vercel
project. It hit Vercel's free daily deploy limit and is frozen at `fcee04a`
(17:02, PR #52): it lacks every fix merged after that, from #51 to #69. Demo,
test and share only the URL above.

The **Vercel** check on pull requests comes from that old project and fails
until its owner disconnects its Git link. Ignore it. The **gate** check (type
check, tests, build) is the one that counts.

## Deploy

The live project (`second-chair-live`, Vercel team `elenchus-hacks`) is not
connected to GitHub, so **a merge to `main` does not deploy by itself**. After
merging, redeploy from a clean clone of `main`:

```bash
cd ~/Documents/team1-deploy && git pull && vercel --prod
```

That folder is a plain clone of `main`, linked to the project, and holds no
local work. Each run is one deployment. Before deploying, check that `main` is
green.

## Environment variables

Set them in the Vercel project (Settings → Environment Variables, Production)
and locally in `.env.local`, which is never committed. Vercel applies a change
only to the next deployment. `NEXT_PUBLIC_*` values are baked into the browser
code at build time.

| Name | Needed for | Default if unset |
|---|---|---|
| `ANTHROPIC_API_KEY` | live cards, prep reading, mandate | canned demo cards |
| `BRIGHTDATA_API_KEY` | pre-flight and the live premise check | sample pre-flight; no premise check |
| `NEXT_PUBLIC_BASE44_URL` | End meeting opens the records app | download only |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | record hand-off to the records app | app opens without the record |
| `ANTHROPIC_MODEL`, `LIVE_MODEL`, `PREMISE_MODEL` | model overrides | Opus 5.5, Sonnet 5.5, Haiku 5.5 |
| `BRIGHTDATA_ZONE` | Bright Data SERP zone | `serp_api1` |
| `PREMISE_CHECK` | `0` turns the premise check off | on |

## Run locally

```bash
npm ci
npm run dev
```

Before calling anything done, run `npm run check` (type check plus Vitest). CI
runs it and `npm run build` on every pull request.

## Working on this repo

Ownership, merge rules and invariants: [CLAUDE.md](CLAUDE.md). Current state:
[HANDOFF.md](HANDOFF.md). Running log: [docs/DEVLOG.md](docs/DEVLOG.md). The
records app: [docs/base44/README.md](docs/base44/README.md).

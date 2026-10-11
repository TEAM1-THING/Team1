<p align="center">
  <img src="src/app/icon.svg" width="112" alt="Second Chair logo: two chairs in profile" />
</p>

<h1 align="center">Second Chair</h1>

<p align="center">
  <b>The colleague in the second chair, for every client meeting.</b><br/>
  It listens, spots the tricky moment, and slides you a calm answer,<br/>
  backed by numbers from your own plan.
</p>

<p align="center">
  <a href="https://second-chair-live.vercel.app"><b>▶ Try it live</b></a> ·
  <a href="#-use-the-website-zero-install">Website guide</a> ·
  <a href="#-install-the-mac-app-beta">Mac app</a> ·
  <a href="#-run-it-on-your-own-computer">Run it locally</a> ·
  <a href="#-put-your-own-copy-online-vercel">Deploy your own</a>
</p>

<p align="center">
  <img alt="Next.js 15" src="https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs" />
  <img alt="Powered by Claude" src="https://img.shields.io/badge/powered%20by-Claude-d97757" />
  <img alt="Hosted on Vercel" src="https://img.shields.io/badge/hosted%20on-Vercel-000000?logo=vercel" />
  <img alt="Built in one day" src="https://img.shields.io/badge/built%20in-1%20day-8ec5f2" />
</p>

---

> [!WARNING]
> **Old link alert.** `second-chair-seven.vercel.app` is a frozen snapshot from
> 5 PM on build day, before more than a dozen fixes landed. Don't demo it, test
> it or share it. The real one is **https://second-chair-live.vercel.app**.

## 🪑 What is this?

Picture a wealth advisor halfway through a client meeting. The client leans in:
*"What if the market drops right after we invest?"* The answer exists...
somewhere on page 31 of the plan.

**Second Chair** is the sharp colleague sitting next to you. It hears the
question, works out what's really underneath (fear of losing cash? bad
timing?), and puts a ready-to-say answer on a private screen, along with the
facts from *your* materials that back it up. You stay in the conversation; it
does the page-flipping.

It's built for **wealth and financial advisors**, around one idea: **catch
what humans miss.** We built it in one day at the *Talk to Users* hackathon
(October 10, 2026), with real finance professionals testing it along the way.

### 🚦 The traffic-light rule

Every number on a card wears a label, so you always know what you can stand
behind:

| Label | Colour | What it means |
|---|---|---|
| **Prepared fact** | 🟢 green | Straight from your materials, with its source |
| **Calculation** | 🟠 amber | Worked out on the spot, with the math shown |
| **Suggestion** | 🔴 red | An idea or framing from outside your materials: say it with care |
| **Do not claim** | ⚪ grey | Tempting, but a promise you can't keep. Don't say it |

A number that can't be traced back to your materials never gets green. If the
client asks something outside the plan you agreed before the meeting (the
**Mandate**), the card says *defer*, not *wing it*.

## ✨ How it works

**1. Prep (before the meeting).** Drop in the client file and your plan or
deck. Second Chair reads them and:
- drafts the **Mandate**: your thesis, assumptions, risk stance and disclaimers;
- flags figures your files disagree on (say, a $180,000 reserve in one and $200,000 in another);
- runs a **pre-flight** check of public figures against the live web;
- guesses the client's **likely worries** and prepares an answer for each.

You check everything and click **Confirm and start meeting →**.

**2. Meet (during the meeting).** Keep it open while the client talks. When a
moment needs a careful answer, a card slides in with what's underneath, what to
say, the facts behind it, and what *not* to claim.
- Press **/** to find any figure in your materials, instantly.
- The **client picture** on the side tracks worries as they open and get resolved.
- **Premise check:** if the client states a "fact" about markets, rates or tax
  rules, Second Chair checks it live and flags it if it's wrong.

**3. Wrap up (after the meeting).** **End meeting** shows what was caught and
what's still open, gives you follow-ups to copy, and lets you grade each card
(Helpful / Not needed / Wrong). The record downloads to your computer and opens
in the compliance **records app**. You only sign in there if you want to save
it.

## 🖥️ Two ways to use it

| | 🌐 Website | 🍎 Mac app (beta) |
|---|---|---|
| Install | Nothing | About 5 minutes, once |
| Where the meeting shows | A browser tab | A small panel floating over your video call |
| Can the client see it when you share your screen? | Yes, if you share that tab | No: the panel hides from screen share |
| What it hears | Your microphone | The call's own audio |

## 🌐 Use the website (zero install)

1. Open **https://second-chair-live.vercel.app** in Chrome.
2. Click **Try the demo meeting** to watch a sample meeting with Dana Whitfield.
   Press **Next turn** (or the **→** key) to play it line by line, or
   **Auto-play** to sit back and watch the cards roll in.
3. Ready for the real thing? Click **Prepare a meeting**, add your materials,
   check what Second Chair drafted, and click **Confirm and start meeting →**.
   No client data handy? Use the sample files in [`public/samples/`](public/samples/).
4. Before using the live mic, tell everyone the meeting is being recorded, then
   tick **All parties consent**. (California needs everyone's OK. That's a
   design rule, not legal advice.)
5. Click **End meeting** when you're done. 🎉

## 🍎 Install the Mac app (beta)

> [!NOTE]
> The Mac app lives on its own branch, `LeavesJ/electron-gpu-ux-bottlenecks-9cf39f`,
> until it's merged into `main`. Its full guide (every button, setting and fix) is
> in [that branch's README](https://github.com/TEAM1-THING/Team1/blob/LeavesJ/electron-gpu-ux-bottlenecks-9cf39f/README.md).

**What you need:**
- A Mac. To hear the call's audio, macOS 14.2 or later.
- **Node.js 22.12 or later.** Check with `node -v`, or get it at [nodejs.org](https://nodejs.org).
- **Git.** If `git --version` offers to install developer tools, say yes.

**Install it** (open Terminal and run these one at a time):

```bash
git clone https://github.com/TEAM1-THING/Team1.git
```

```bash
cd Team1
```

```bash
git checkout LeavesJ/electron-gpu-ux-bottlenecks-9cf39f
```

```bash
npm run install-app
```

When it prints `installed .../Applications/Second Chair.app`, you're set. Open it:

```bash
open -a "$HOME/Applications/Second Chair.app" --env SC_URL=https://second-chair-live.vercel.app/meeting
```

> [!TIP]
> That `SC_URL` part points the app at the live site. The branch still defaults
> to the old frozen link until it's updated, so keep it for now. After that,
> open it like any app: Spotlight (⌘ Space, type "Second Chair") or the Dock.

**Using it:** start a meeting and the panel tucks itself into the top-right
corner, over your call. Drag its top bar to move it, or drag an edge to resize.
It never steals the keyboard from your call.

| Shortcut | What it does |
|---|---|
| ⌃ ⌥ H | Show or hide the panel |
| ⌃ ⌥ Space | Type in the panel (Esc to go back to the call) |
| ⌃ ⌥ G | Let clicks pass through to the call |
| ⌃ ⌥ B | Shrink to a thin bar |
| ⌃ ⌥ → | Demo meeting: play the next line |
| ⌃ ⌥ P | Demo meeting: play or pause |
| ⌃ ⌥ ⇧ Q | Quit Second Chair |

🙈 **Screen-share tip:** the panel hides from screen share, but to be extra
safe share **one window** (your slides) instead of the whole screen. Test it
once with a colleague before a real client call.

## 💻 Run it on your own computer

**You need:** Node.js 20 or newer, and Git.

1. Get the code and the bits it needs:
   ```bash
   git clone https://github.com/TEAM1-THING/Team1.git
   ```
   ```bash
   cd Team1 && npm ci
   ```
2. *(Optional)* Create a file named `.env.local` in the `Team1` folder and add
   your keys (see [Environment variables](#-environment-variables)). Without
   any keys it runs in **demo mode**, with ready-made cards.
3. Start it:
   ```bash
   npm run dev
   ```
4. Open **http://localhost:3000**. That's it! 🎈

Changed something? Run the checks (type check plus tests) before calling it done:

```bash
npm run check
```

> [!CAUTION]
> This repo is **public**. Never commit `.env.local`, keys, tokens or real
> client data. `.gitignore` helps, but look at `git status` before every commit.

## 🚀 Put your own copy online (Vercel)

The simple way, step by step:

1. **Make a free account** at [vercel.com](https://vercel.com/signup) (click **Continue with GitHub**).
2. **Install Vercel's command-line tool:**
   ```bash
   npm i -g vercel
   ```
3. **Log in** (a browser window opens; click to approve):
   ```bash
   vercel login
   ```
4. **Create a project** from inside your `Team1` folder (pick a name when it asks):
   ```bash
   vercel link
   ```
5. **Tell Vercel it's a Next.js app.** In the dashboard, open your project →
   **Settings → Build and Deployment → Framework Preset → Next.js**. A project
   made from the command line can start as "Other" and show a sad **404**. We
   learned this one the fun way. 😅
6. **Add your keys** under **Settings → Environment Variables** (tick
   Production). See [the list below](#-environment-variables).
7. **Ship it!** 🚢
   ```bash
   vercel --prod
   ```
   Vercel prints your new web address. Done.

**Prefer clicking?** In the dashboard, choose **Add New → Project** and import
the GitHub repo. It then redeploys on every push. Heads-up: every branch push
also makes a preview build, and the free plan allows **100 deployments a day**.
Our first project hit that limit and froze, which is why the link above is new.

### 🔁 Redeploying the team's live site

The team site (Vercel project `second-chair-live`) is **not** hooked up to
GitHub, so merging to `main` doesn't put anything live by itself. After a
merge, whoever holds the Vercel login runs:

```bash
cd ~/Documents/team1-deploy && git pull && vercel --prod
```

That folder is a clean copy of `main`, so only merged code goes live.

## 🔑 Environment variables

Put them in `.env.local` on your computer, and in Vercel under **Settings →
Environment Variables**. Vercel only picks up a change on the **next
deployment**. Anything starting with `NEXT_PUBLIC_` is baked into the web page
when it's built, so it's visible to the browser. Only public values go there.

| Name | What it unlocks | If you leave it out |
|---|---|---|
| `ANTHROPIC_API_KEY` | Live cards, reading your files, drafting the Mandate | Demo mode: ready-made cards |
| `BRIGHTDATA_API_KEY` | Pre-flight and the live premise check | Sample pre-flight checks, no premise check |
| `NEXT_PUBLIC_BASE44_URL` | End meeting opens the records app | The record just downloads |
| `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The record arrives in the records app, ready to review | The records app opens empty |
| `ANTHROPIC_MODEL`, `LIVE_MODEL`, `PREMISE_MODEL` | Choose different Claude models | Opus 5.5 for prep, Sonnet 5.5 live, Haiku 5.5 for premise checks |
| `BRIGHTDATA_ZONE` | A different Bright Data search zone | `serp_api1` |
| `PREMISE_CHECK` | Set to `0` to switch the premise check off | On |

## 🗺️ What's where

| Path | What lives there |
|---|---|
| `src/app/` | The pages: start, prep, meeting, plus the API routes in `src/app/api/` |
| `src/lib/engine/` | The brains: Claude calls, Bright Data, the Mandate, the premise check |
| `src/lib/types.ts` | The shared contract every part agrees on |
| `src/lib/provenance.ts` | The traffic-light rule: every number traced, or downgraded |
| `src/components/meeting/` | The meeting screen and the end screen |
| `src/components/prep/` | The prep screen |
| `src/components/speech/` | The live mic |
| `src/lib/record.ts` | The meeting record and the hand-off to the records app |
| `src/data/` | The demo meeting with Dana Whitfield |
| `public/samples/` | Sample client files to try Prep with |
| `tests/` | Vitest tests for all of the above |
| `docs/` | The build diary ([`DEVLOG.md`](docs/DEVLOG.md)), handoff notes, and the [records app](docs/base44/README.md) |

## 🛡️ Ground rules we built in

- **No number without a label.** Untraceable figures get downgraded, never shown as green.
- **Stay inside the Mandate.** Off-plan questions get a polite *defer*.
- **Consent first.** The meeting screen always shows a consent notice, and the live mic waits for the box to be ticked.
- **Your meeting isn't training data.** Cards go through Anthropic's API, which doesn't train on API data by default. Nothing is saved to records unless you sign in and save.
- **Public repo, private keys.** Keys live in `.env.local` and the Vercel dashboard, never in the code.

## 🧰 Troubleshooting

| What you see | What to do |
|---|---|
| A **404** on your own Vercel deploy | Set the Framework Preset to **Next.js**, then `vercel --prod` again |
| Cards look like the demo even in a real meeting | `ANTHROPIC_API_KEY` is missing. Add it, then redeploy |
| Pre-flight shows sample checks | `BRIGHTDATA_API_KEY` is missing or wrong |
| End meeting downloads but the records app is empty | The `NEXT_PUBLIC_SUPABASE_*` values are missing. Add them, then redeploy (they're baked in at build time) |
| "Deployment rate limited — retry in 24 hours" | The free plan's 100-a-day limit. Wait it out, or deploy only with `vercel --prod` |
| A red **Vercel** check on a pull request | That's the old frozen project. Ignore it: the **gate** check is the one that counts |
| Features seem missing | You're probably on `second-chair-seven`. Use **second-chair-live.vercel.app** |
| The Mac app shows an old version | Open it with `--env SC_URL=https://second-chair-live.vercel.app/meeting` (see the Mac app section) |

## 👥 The team

Team 1 at *Talk to Users*, October 10, 2026, building in four tracks: **A**
engine and integration, **B** the meeting screen, **C** prep and the landing
page, **D** shipping (deploy, records app, mic).

Want to contribute? Start with [`CLAUDE.md`](CLAUDE.md) (who owns what, merge
rules, the non-negotiables), then [`HANDOFF.md`](HANDOFF.md) (where things
stand) and [`docs/DEVLOG.md`](docs/DEVLOG.md) (how we got here).

<p align="center"><sub>Made with ☕, Claude, and a lot of "wait, what did the client just say?"</sub></p>

# Second Chair

A meeting copilot for wealth and financial advisors. Before the meeting you
load your own materials; during the meeting, when the client asks something
that needs a careful answer, Second Chair shows what to say and the facts from
your materials behind it. Every number carries a label: green (from your
materials), amber (worked out here, with the math shown) or red (outside your
materials).

There are two ways to use it:

| | Website | Mac app |
|---|---|---|
| Install | Nothing | About 5 minutes, once |
| Where the meeting shows | A browser tab | A small panel floating over your video call |
| Can the client see it if you share your screen? | Yes | No: the panel is hidden from screen share |
| Hears | Your microphone (Chrome) | The call's own audio |

## Use the website (no install)

1. Open **https://second-chair-live.vercel.app** in Chrome.
2. Click **Prepare a meeting**, add your materials, check what Second Chair
   drafted, and click **Confirm and start meeting**.
3. Or click **Try the demo meeting** to watch a sample client meeting: press
   **Next turn** (or the right arrow key) to play it line by line, or
   **Auto-play** to let it run.

## Install the Mac app

### What you need

- A Mac. macOS 14.2 or later to hear the call's audio (tested on macOS 26.3).
- **Node.js 22.12 or later.** Check with `node -v`; get it from
  [nodejs.org](https://nodejs.org) if it is missing or older.
- **Git.** If `git --version` asks you to install developer tools, say yes.

### Download and install

Open Terminal and run these one at a time.

Download the code:

```bash
git clone https://github.com/TEAM1-THING/Team1.git
```

```bash
cd Team1
```

Until the desktop app is merged into `main`, it lives on its own branch:

```bash
git checkout LeavesJ/electron-gpu-ux-bottlenecks-9cf39f
```

Install what the app needs, build it, and put it in your Applications folder
(this takes a minute or two):

```bash
npm run install-app
```

When it finishes it prints `installed .../Applications/Second Chair.app`.

### Open it

```bash
open "$HOME/Applications/Second Chair.app"
```

From then on, open it like any app: Spotlight (Command+Space, type "Second
Chair"), Finder → Applications, or its Dock icon.

The first time it opens, it also opens the website once in your browser and
shows "Meeting links in this browser now open in the Second Chair desktop app."
That lets meeting links you click in that browser open in the app (once the
desktop branch is merged and the site redeployed). Click **Keep them in the
browser** if you would rather they did not.

## Use the Mac app

### Before the meeting

Opening Second Chair shows its window with the start page. Click **Prepare a
meeting** (or press Command+N from anywhere in the app), add your materials,
and click **Confirm and start meeting**.

### During the meeting

When the meeting starts, the window steps aside and the meeting opens in a
small panel in the top-right corner, over your call. It never takes the
keyboard away from the call, so the call's own shortcuts keep working.

- **Move it:** drag the bar at the top. **Resize it:** drag an edge. It
  reopens where you left it.
- **The buttons on the bar** (point at any of them for a plain description):

| Button | What it does |
|---|---|
| Eye with a slash | The client can't see the panel when you share your screen. Click to let them see it (the eye turns open and amber). |
| Pointer | **Pass clicks to the call:** the panel stays in view, but your clicks go to the call behind it. Click again to use the panel. |
| Up arrow | **Shrink to a thin bar** to uncover the call. Double-clicking the bar does the same. |
| X | **Hide the panel.** It keeps running. |

- **Lost the panel?** Click **Second Chair in the Dock**, or press
  Control+Option+H.
- **Recording consent.** California requires everyone on a call to know it is
  being recorded. Say "This meeting is being recorded" out loud, then tick
  **I said: "This meeting is being recorded."** The live mic stays off until
  you do. (A design constraint, not legal advice.)

### Shortcuts

They work while the call is in front. Control+Option on a Mac, Ctrl+Alt on
Windows.

| Keys | Does |
|---|---|
| Control+Option+H | Show or hide the panel |
| Control+Option+Space | Type in the panel (Esc to stop and go back to the call) |
| Control+Option+G | Pass clicks to the call |
| Control+Option+B | Shrink to a thin bar |
| Control+Option+Right arrow | Sample meeting: play the next line |
| Control+Option+P | Sample meeting: play or pause |
| Control+Option+Shift+Q | Quit Second Chair |

The two-chairs icon in the menu bar at the top of the screen has all of these,
plus larger or smaller text, **Move under the webcam** (so reading a card keeps
your eyes near the camera), and **Move back to the corner**.

### Screen sharing

The panel is hidden from screen share. On a Mac, share **one window** (your
slides, say) rather than your whole screen, to be sure. Before your first real
call, check once: share your screen with a colleague and ask whether they can
see the panel.

### Closing and quitting

Closing the app window or hiding the panel keeps Second Chair running, so it
is ready for the next meeting. To quit: Command+Q with the app in front, right-
click the Dock icon → Quit, or the menu-bar icon → **Quit Second Chair**.

## Live transcription (optional)

The sample meeting works without this. To transcribe a real call, the app needs
a speech-to-text service. Any OpenAI-compatible one works (OpenAI, Groq, or a
local Whisper server so audio never leaves your Mac). Quit the app, then start
it from Terminal with your key (if the key is in `OPENAI_API_KEY`, the command
reads it from there); the key stays in your shell and is never saved:

```bash
open -a "$HOME/Applications/Second Chair.app" --env SC_STT_URL=https://api.openai.com/v1/audio/transcriptions --env SC_STT_KEY="$OPENAI_API_KEY"
```

If the app was already open, it only comes to the front and keeps its old
settings, so quit it first.

The first time you turn on the live mic, macOS asks whether Second Chair may
record your computer's audio. Click **Allow**. If you clicked Don't Allow: open
System Settings → Privacy & Security → Screen & System Audio Recording, turn
Second Chair on, then quit and reopen it.

### Settings

Add any of these to the command above the same way, each as another `--env`.

| Setting | Default | What it changes |
|---|---|---|
| `SC_STT_URL`, `SC_STT_KEY` | none | The speech-to-text service and its key |
| `SC_STT_MODEL` | `whisper-1` | The speech-to-text model |
| `SC_URL` | the live site's `/meeting` | Which Second Chair site the app shows |
| `SC_PROTECT` | `1` | `0` lets screen share see the panel (for demos on a shared screen) |
| `SC_SIDE` | `right` | `left` starts the panel in the top-left corner |
| `SC_WIDTH` | `460` | The panel's starting width |
| `SC_AUDIO_SOURCE` | `system` | `device` uses a virtual audio device such as BlackHole (macOS before 14.2); `tone` is a self-test |
| `SC_AUDIO_DEVICE` | BlackHole and similar | Which virtual device to use |
| `SC_CONSENT_BANNER` | off | `1` shows the "everyone agreed" banner at the top of the panel |
| `SC_DEBUG` | off | `1` logs what the panel is doing |

## Update or remove the app

To update, quit the app, then from the `Team1` folder:

```bash
git pull
```

```bash
npm run install-app
```

To remove it, quit the app and delete `Second Chair` from the Applications
folder in your home folder. Its saved settings are in
`~/Library/Application Support/Second Chair`.

## Windows

Not tested yet. `npm run app` runs the app from the code, and
`npm --prefix desktop run package` builds it into `desktop/out`. Shortcuts use
Ctrl+Alt, and the menu icon sits in the taskbar tray.

## For developers

### Run the website locally

```bash
npm install
```

Create `.env.local` in the `Team1` folder (it is ignored by git; never commit
it, the repository is public). Every line is optional:

```bash
ANTHROPIC_API_KEY=...        # live answers; without it the cards come from demo data
BRIGHTDATA_API_KEY=...       # the pre-meeting check
NEXT_PUBLIC_BASE44_URL=...   # the records app that End meeting opens
```

Then start it and open http://localhost:3000:

```bash
npm run dev
```

(`npm start` only works after `npm run build`.)

To point the desktop app at your local site, run it from the code:

```bash
SC_URL=http://localhost:3000/meeting npm run app
```

Running from the code can't hear the call's audio on a Mac (the sound comes
through silent); use the installed app for that.

### Checks

Run both before calling anything done. CI runs the first one and `npm run
build` on every pull request.

```bash
npm run check
```

```bash
npm --prefix desktop run check
```

### Where things are

| Path | What |
|---|---|
| `src/app` | The website: start page, prep, meeting, and the API routes |
| `src/lib/engine` | The engine: Claude calls, Bright Data, the Mandate |
| `src/components` | The meeting screen, prep screen, mic, and the website's desktop hand-off |
| `desktop/` | The Mac app (Electron): app window, panel, audio capture, speech-to-text |
| `tests/` | Vitest tests for all of the above |
| `docs/` | The running log (`DEVLOG.md`) and handoff notes |

The live site deploys from `main` on Vercel.

## Troubleshooting

| What you see | What to do |
|---|---|
| The panel disappeared | Click Second Chair in the Dock, or press Control+Option+H |
| The app window didn't appear | If you were in a full-screen app, it opened on your desktop: swipe left or right with three fingers, or leave full screen |
| A shortcut does nothing | Another app already uses it; use the menu-bar icon instead |
| Two panels on screen | Two copies are running (the installed app and one started from the code); quit one |
| `Missing script: "install-app"` | Run it from the `Team1` folder, on the desktop branch (see Download and install) |
| The menu still shows old names | You are running an old build: quit it and reinstall (see Update) |
| Live transcription is off, or you want to see its errors | Quit the app, then start it this way so its messages print in Terminal: `SC_STT_URL=https://api.openai.com/v1/audio/transcriptions SC_STT_KEY="$OPENAI_API_KEY" "$HOME/Applications/Second Chair.app/Contents/MacOS/Second Chair"`. If its window doesn't come forward, click Second Chair in the Dock |
| The live mic hears nothing | Use the installed app (not `npm run app`), on macOS 14.2 or later, and check the permission under Live transcription |
| `Could not find a production build` | Use `npm run dev`, or run `npm run build` first |
| `Electron failed to install correctly` | Run `node desktop/node_modules/electron/install.js`, then try again |

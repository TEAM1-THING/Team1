# Second Chair for Mac

The full guide to the Mac app: a small panel that floats over your video call,
hidden from screen share, and hears the call's own audio. For what Second Chair
is and the website, start with the [main README](../README.md).

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
That lets meeting links you click in that browser open in the app. Click **Keep them in the
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
| `SC_CONSENT_BANNER` | on | `0` hides the "everyone agreed" notice under the panel's header (testing only) |
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

To point the app at a local copy of the website (see
[Run it on your own computer](../README.md#-run-it-on-your-own-computer)),
run it from the code:

```bash
SC_URL=http://localhost:3000/meeting npm run app
```

Running from the code can't hear the call's audio on a Mac (the sound comes
through silent); use the installed app for that.

Before calling a change done, run the app's checks and the website's:

```bash
npm --prefix desktop run check
```

```bash
npm run check
```

## Troubleshooting

| What you see | What to do |
|---|---|
| The panel disappeared | Click Second Chair in the Dock, or press Control+Option+H |
| The app window didn't appear | If you were in a full-screen app, it opened on your desktop: swipe left or right with three fingers, or leave full screen |
| A shortcut does nothing | Another app already uses it; use the menu-bar icon instead |
| Two panels on screen | Two copies are running (the installed app and one started from the code); quit one |
| `Missing script: "install-app"` | Run it from the `Team1` folder on `main` (`git checkout main`, then `git pull`) |
| The menu still shows old names | You are running an old build: quit it and reinstall (see Update) |
| Live transcription is off, or you want to see its errors | Quit the app, then start it this way so its messages print in Terminal: `SC_STT_URL=https://api.openai.com/v1/audio/transcriptions SC_STT_KEY="$OPENAI_API_KEY" "$HOME/Applications/Second Chair.app/Contents/MacOS/Second Chair"`. If its window doesn't come forward, click Second Chair in the Dock |
| The live mic hears nothing | Use the installed app (not `npm run app`), on macOS 14.2 or later, and check the permission under Live transcription |
| `Electron failed to install correctly` | Run `node desktop/node_modules/electron/install.js`, then try again |

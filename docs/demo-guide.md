# Second Chair demo: operating guide

These are operating steps for recording the demo video by hand and for live judging at 8:30 PM PT. There is no script of lines to say. Everything here was checked against the code on `main` and against the deployed build (28ac583, deployed 19:54 PT on 2026-10-10). Anything not confirmed says so.

- **Live site:** https://second-chair-live.vercel.app
- **Never use** https://second-chair-seven.vercel.app. It is frozen and old.

---

## 0. Settle these before you record

1. **Warm the pre-flight off camera.** Bright Data's live search is slow tonight: one search can take 3 to more than 30 s. The server now retries a slow or empty search (up to three tries) and keeps found results for 6 hours. On the live site a first pre-flight took 13 s; repeats took about 3 s. Run one pre-flight before you record (step 2.6) so the filmed one is fast. The server can still land on a cold instance, so be ready to talk over a 15 to 30 s wait.
2. **Card wording changes on every run.** Claude writes each card live. The moment types and the plan figures stay the same, but the sentences do not. Do not rehearse to exact words.
3. **The prep screen's hand entry now starts empty.** "Enter the prep by hand instead" is for a real advisor's own meeting. The demo client comes from **Try with sample files** (step 2.3) or from **Try the demo meeting** on the landing page.

---

## 1. Before you record

1. **Browser.** Use Chrome. The website's live mic needs it, and the README assumes it. Make a separate Chrome profile just for the demo (Profile icon → Add → Continue without an account). That gives you no extensions, no saved state and no desktop-app pairing.
2. **Do not use a browser paired with the Mac app.** In a paired browser, the landing page and `/meeting` jump to the desktop app with the banner "Opening the meeting in the Second Chair desktop app." If that happens, click **Stay in the browser**.
3. **Window size.** Use full-screen Chrome (Control+Command+F), at 100% zoom.
    - At a 1440×900 or 1920×1080 viewport, the current card and the collapsed earlier card both fit.
    - At 1280×720 the current card fits, but the earlier card is cut off at the bottom.
    - Hide the bookmarks bar (Command+Shift+B).
4. **Fresh state.** Use the clean demo profile, or run this in the DevTools console on the live site before each take:
    `localStorage.removeItem('secondchair.prep'); localStorage.removeItem('secondchair.desktop'); sessionStorage.clear(); location.reload()`
    The keys are: `secondchair.prep` (the confirmed prep the meeting uses), `secondchair.desktop` (desktop pairing), and in session storage `secondchair.prep.draft` (the prep screen's work in progress, so a reload of /prep keeps it) and `secondchair.desktop.declined`.
    With nothing saved, **Try the demo meeting** opens the meeting with the demo client, Dana Whitfield.
5. **Restarting a take.** Reloading `/meeting` (Command+R) restarts the replay at the first line. The prep is kept.
6. **Tabs.** Have one tab open on the live site's landing page. If you want to show the records app signed in, sign in to https://second-chair-view.base44.app in the same profile before recording, off camera.
    - The demo account belongs to track D. Get it from them; this guide does not hold credentials.
    - I have not verified that the hand-off tab arrives already signed in.
7. **Notifications off.** Turn on Do Not Disturb in Control Center → Focus, and quit Slack, Mail and Messages.
8. **Network.** Use stable Wi-Fi and keep a phone hotspot ready. Every card is a round trip to Vercel and Claude.
9. **Mic permission.** If you plan the live-mic segment, allow the microphone for the site in this profile before recording. Use the lock icon in the address bar → Microphone → Allow.
10. **Timings to know:**

| Thing | Time |
|---|---|
| Advisor lines (t1, t3, t5, t7) | Appear instantly, no card |
| Client lines (t2, t4, t6, t8): card | 3.3 to 4.2 s in one run and 6.6 to 7.3 s in another (19:43 to 19:46 PT) |
| Live card limit | 8 s, then the server sends the prepared fallback card |
| Pre-flight | 13 s cold on the live site at 19:55 PT, about 3 s once warm; worst case about 40 s (25 s search plus 12 s judge; the route allows 60 s) |
| Auto-play | One line every 4 s; waits while a card is loading |
| "Try with sample files" | About 25 s to read the two files and prepare the worries |

11. **Keyboard.** → (next line), `a` (auto-play) and `h` (hide cards) work from anywhere on the meeting screen, including right after you click a button. They do nothing while the cursor is in Find or a dialog is open (press Esc first).
    - A key pressed while a card is loading is ignored, not queued. Wait for the card each time.
    - `a` and `h` are lowercase keys, so keep Caps Lock off.

---

## 2. The demo path, step by step

Total time is about 3 to 3.5 minutes plus the pre-flight wait. You can talk over the wait or cut it out in editing.

### Landing (about 10 s)

**2.1** Open https://second-chair-live.vercel.app.
- **You see:** "Second Chair · for wealth advisors", the headline "IT READS YOUR CLIENT, SO YOU CAN FOCUS ON THE ANSWER", three numbered points, and three label pills: **Prepared fact** (green), **Calculation** (amber) and **Suggestion** (rose).
- **Point at:** the three pills.

**2.2** Click **Prepare a meeting**.
- **You see:** the prep screen loads in under a second. Step 1 is "Your materials", with a consent strip at the top: "Second Chair listens to the meeting. Tell your client and get their consent before you start; California requires every party to agree."

### Prep (about 60 to 75 s, including pre-flight)

**2.3** Click **Try with sample files** (under the drop zone; "Samples: plan (PDF) · client file (CSV)").
- **You see:** "Fetching the sample files…", then for about 25 s the files are read. Then ✓ dana-whitfield-plan.pdf and ✓ dana-whitfield-client.csv, and steps 2 to 5 fill in: "This meeting, as read from your files" (With: Dana Whitfield, client), the client file (58, 12-year horizon, $300,000 cash, $1,500,000 investable), the two sources, a Mandate drafted from the plan, and five likely worries.
- **Why this path:** it shows the real product (your files in, a checked prep out) and ends on the same fictional client as the replay, so the four cards line up.
- **Faster alternative:** skip prep entirely with **Try the demo meeting** on the landing page (clean storage). You lose the pre-flight and likely-worries beats.
- **Do not change the Name field.** The prepared fallback cards fire only for "Dana Whitfield" with the scripted replay lines.
- **Do not use "Enter the prep by hand instead"** for the demo: it now starts empty.

**2.4** Scroll to **3 Plan and materials** (about 5 s).
- **Point at:** "Keep a $180,000 liquid reserve…" and "6 equal monthly tranches of $200,000" in the "Retirement plan for Dana Whitfield" source. These two figures set up the catch at the end.

**2.5** Scroll to **4 Mandate** (about 5 s).
- **Point at:** Thesis, Assumptions (drafted from the plan, eight lines such as "Monthly expenses $7,500" and "Projected income at 70: $9,000 a month under a 5% average return assumption") and Out of scope ("Individual stock picks", "Tax filing", "Cryptocurrency", …).
- Do not click **Draft Mandate from my plan** again. It redrafts the fields and can change what pre-flight checks.

**2.6** Click **Run pre-flight**. It sits in the box under the Mandate, next to "Checks the plan's figures against live public data."
- **You see:** the button reads **Checking…** for about 3 s if you warmed it (section 0), or 13 to 30 s cold.
- **Then three rows** (seen at 19:59 PT on this build):
  - `STALE` "Monthly expenses $7,500": inflation at 3.40 percent, so the expense figure may need an inflation adjustment;
  - `STALE` "Liquid reserve $180,000, equal to 24 months of expenses": the same inflation point, applied to the reserve;
  - `OK` "Projected income at 70: $9,000 a month under a 5% average return assumption": a source cites about 9% for a 60/40 portfolio, so 5% looks conservative.
  - Each row ends with "checked Oct 10, 2026" (the viewer's local date) and a **source ↗** link.
- The client-specific lines (age, retirement at 70) are skipped on purpose: public data cannot check them.
- **Point at:** the status pills and **source ↗**.
- If you get `UNVERIFIED` or "Live check unavailable", see section 4. Never describe an unverified row as checked.

**2.7** Scroll to **5 Likely worries** (about 10 s).
- **You see:** five worries. Each has "Likely because…", an editable **Prepared answer**, and fact chips such as **Prepared fact** with "· from Retirement plan…" and **Do not claim**.
- **Point at:** worry 2 (about investing right before a downturn), which shows a **Prepared fact**, a **Calculation** with its math ("6 x 200,000 = 1,200,000") and a **Do not claim**. The wording is written by the model and can differ.
- Do not click **Prepare again from my materials**.

**2.8** In the footer, tick **I've reviewed and confirm the Mandate**, then click **Confirm and start meeting →**.
- The button stays disabled until the box is ticked, the client file has a name, and the Mandate lists at least one out-of-scope topic. Editing any Mandate field unticks it.
- **You see:** the meeting screen loads in about 1 s.

### Meeting replay (about 90 s)

**2.9** Look at the meeting screen layout before pressing anything (about 5 s).
- **Header:** "Second Chair · with Dana Whitfield · 00:00", then **Next turn →**, **Auto-play**, **Live mic**, **Hide H**, and **End meeting** (orange).
- **Notice under the header:** "This meeting uses Second Chair. All participants have been told and agreed."
- **Columns:**
  - Left: "Find in your materials" and the transcript.
  - Middle: the intro box "A replay of a sample client meeting".
  - Right: "Client picture · 0 open".

**2.10** Press **→** for t1 (advisor).
- **You see:** the line "You · So that's the plan…" appears instantly in the transcript, and the middle column says "No card yet…".

**2.11** Press **→** for t2 (client): "I'm worried that locking this much in means I won't have enough access to cash…"
- **You see:** a grey pulsing placeholder for 3 to 7 s, then **card 1**.
- **Card 1 moment:** the live runs labelled it **Emotional concern** both times. The fallback card says **Objection**. The concern is about access to cash.
- **Card layout, top to bottom:** moment and concern; a **Suggestion** chip with the quoted line to say; "Your move."; facts with chips; numbered sources; **Do not claim**; **Why**.
- **Point at:**
  - the **Prepared fact** "Keep a $180,000 liquid reserve, equal to 24 months of expenses at $7,500 a month." with its small superscript **1**;
  - source line **1**, the plan ("Retirement plan for Dana Whitfield" on the sample-files path; "Retirement plan, prepared for Dana Whitfield, September 28, 2026" on the Try the demo meeting path);
  - the **Do not claim** line.
- **Right column:** "liquidity" appears under **Worries**.

**2.12** Press **→** for t3 (advisor, instant), then **→** for t4 (client): "…Maybe I should just wait six months."
- **You see card 2, Hesitation.**
- **Point at:** the **Prepared fact** "Enter the market in 6 equal monthly tranches of $200,000 to reduce timing risk." and the Do not claim line, which says something like "phased entry guarantees against losses" or "the market will not fall".
- **Below:** card 1 collapses to "Earlier, at t2: …".
- **Right column:** "liquidity" is now struck through and reads "t2 to t4", which means resolved. A timing item appears; in my run it was under **Deciding** as "timing of entry".

**2.13** Press **→** for t5 (advisor), then **→** for t6 (client): "My sister lost a lot in 2008. And my son might need help with a house down payment next year."
- **You see card 3, Disclosure.**
- **Point at:** the Do not claim line about a down payment amount, which she has not given.
- **Right column:** **Life events → son's down payment (since t6)**. In my run "sister's 2008 loss" was also added under Worries.
- **Amber is not guaranteed here.** My live run showed the $120,000 as a green **Prepared fact** from "Cash-reserve analysis", not as an amber **Calculation**. The fallback card does show **Calculation** with "$300,000 - $180,000 = $120,000" under it. Point at amber only if it is on screen.

**2.14** Press **→** for t7 (advisor), then **→** for t8 (client): "Wait, I thought the report said the reserve was $200,000?"
- **You see card 4, Contradiction.** The concern reads like "Dana recalls the reserve as $200,000; the plan sets it at $180,000."
- **The suggested line** gives $180,000 gently. In my run it also said that $200,000 is the size of each monthly tranche; the fallback card puts that in **Why**.
- **Point at:** the two Prepared facts (the reserve and the tranche), both with source **1**. Click **Why** to open the reasoning, which ends with "Anything we can't trace is shown as a suggestion, never a fact."
- **This is the "catch what humans miss" beat.** **Next turn** greys out after t8 because the replay is over.

### Find in materials (about 10 s)

**2.15** Press **/**. The cursor jumps into "Find in your materials".
- **Type `tranches`.** You see one line, "Enter the market in 6 equal monthly tranches of $200,000…", with the figure highlighted green and "Prepared fact · From Retirement plan, prepared for Dana Whitfield, September 28, 2026". Results appear as you type, with no model call.
- **Type `reserve`** instead to get two lines, one from each source.
- **Avoid typing `200,000`.** It also matches "$1,200,000".
- **Press Esc** to clear the box and leave it.

### Client picture (about 5 s)

**2.16** Point at the right column. In my run it read "Client picture · 3 open" with three groups: **Worries**, **Deciding** and **Life events**. Resolved items are struck through with "tX to tY", and open items say "since tX". The exact items vary with the live run.

**2.17 (optional)** Press **h**. The cards and the client picture vanish, and the button reads **Show H**. Press **h** again to bring them back.

### End screen (about 20 to 30 s)

Taken from the code and the fix's own checks on this build. End meeting writes a one-time hand-off for the records app, so it was not clicked on the live site for this guide.

**2.18** Click **End meeting**. The first time in a meeting, three things happen at once:
1. A JSON file downloads, and Chrome shows its download bubble.
2. The record is stored as a one-time hand-off. It expires in an hour and can be used once.
3. **A new tab opens on the records app and takes focus.**
- Only the first End meeting downloads by itself. **Do not press End meeting early to preview the screen**: the final one will then show a notice that the record is out of date, and you must press that notice's button.

**2.19** Switch back to the Second Chair tab (Command+Option+Left arrow, or click the tab).
- **You see:**
  - "Meeting with Dana Whitfield ended at 01:15" (the last line's time);
  - the heading "WHAT SECOND CHAIR CAUGHT";
  - a tally such as "4 moments caught, 1 concern resolved, 3 still open.";
  - **Moments:** each card with its turn id, moment name, concern, a "Resolved" chip where it applies, and grade buttons **Helpful**, **Not needed** and **Wrong**;
  - the **Client picture**;
  - **Follow-ups from this meeting**, with lines like "Follow up with Dana Whitfield: … (raised at t4)" and a **Copy as tasks** button;
  - **Record:** "Downloaded second-chair-record-dana-whitfield-2026-10-10.json" and the grading status.

**2.20** Grade a few cards, for example **Helpful** on t8 and t2. Click a grade again to clear it. The status updates to "Graded N of 4". Grades are kept if you go **Back to meeting** and end again.

**2.21** Click **Download and open records** (it reads **Download record** if the records app is not configured). It is always available.
- It downloads the record again, with the grades, and opens **another** records-app tab with the graded record.
- The status reads "Downloaded again with N of 4 graded".
- Chrome may ask to allow multiple downloads. Click Allow.

**2.22** Show the newest records-app tab.
- The team's docs say it opens with the record loaded. Sign in, then **Save to records**. The **Records** list shows grade counts.
- Saving writes a real row in the team's database. It is the fictional client, but decide beforehand whether to do it.
- The records app screens were not checked for this guide.

**2.23** To leave the end screen: **Back to meeting** (or Esc) returns to the meeting as it was, with keyboard focus on **End meeting** (→, a and h work at once; Enter or Space reopens the end screen). **Prepare next meeting** goes to the prep screen, and asks first if the record is out of date.

---

## 3. Optional segments

### 3a. Live mic with the consent dialog (website). Risky to do live.

**Why it is risky:**
- Every word the mic hears becomes a transcript line and may produce a card, including the narrator's voice.
- The mic cannot tell speakers apart. Lines default to "Client" unless they repeat the card's suggested line.
- It depends on Chrome's online speech service and on room noise.

**Steps:**
1. Do this after t8, or in a freshly reloaded meeting. Do not mix it with the replay while cards are loading.
2. Click **Live mic**. The dialog shows:
    - "Ask your client before the mic starts", then "Read this aloud:" with the consent line naming Google's speech service and Anthropic;
    - a checkbox, **Done: the client agreed**;
    - **Cancel** and **Start**. Start stays disabled until the box is ticked; Esc or Cancel leaves the mic off.
3. Tick the box and click **Start**.
    - The button becomes **Stop mic** with a pulsing red dot, and words in progress appear in grey italics beside it.
    - The dialog asks once per meeting; a reload asks again.
4. Speak one client line clearly, then pause for about a second. The line appears labelled **Client**. Click the label to flip it to **You** if it is wrong. The card follows in about 4 to 8 s (a 0.6 s pause plus the card time).
5. **Click Stop mic as soon as the card appears**, before anyone talks over it.

### 3b. The off-script figure question. Risky, and it needs 3a.

The website has no typed input for a client line, so this only works by voice. Say: "What if returns are only 4 percent?"

The team's run at 18:50 got a real card in 6 out of 6 off-script figure questions. The card kept the plan's figure (the "5% average return" assumption behind "$9,000 a month") and marked the new figure as not yet modelled, with an offer to model it. I did not re-run this for the guide. Do not promise a particular moment label.

### 3c. The Mac desktop panel. Medium risk.

Source: `desktop/README.md`, the code, and `docs/pitch/panel-demo-script.md` on main. I did not run it for this guide.

**Why it is risky:**
- **The panel is hidden from screen recording by default.**
- Global hotkeys can be taken by another app.
- An app installed from an old branch shows an old site.
- Live transcription in the panel needs `SC_STT_URL` and a key, so do not start the mic there.

**Steps:**
1. Reinstall from main: `git checkout main`, `git pull`, `npm run install-app`. Then open it with `open "$HOME/Applications/Second Chair.app"`.
2. Put a call window behind it: a Zoom or Meet test call, or a full-screen slide.
3. In the app window, click **Try the demo meeting**. The window steps aside and the panel opens in the top-right corner, about 460 px wide. At that width the columns stack: card first, then the client picture, then Find and the transcript.
4. **Before recording,** click the eye on the panel's bar until its tooltip reads **Client can see this** (open eye, amber). Otherwise QuickTime, Command+Shift+5 or OBS records an empty corner.
5. In a large room, use the menu-bar two-chairs icon → **Larger text**.
6. Advance with **Control+Option+→**, which works while the call window is in front. **Control+Option+P** plays or pauses. The four cards are the same as on the website.
7. For the privacy beat, click the eye so it reads **Hidden from the client**. The panel disappears from the recording. Click it again to bring it back.
8. **End meeting** in the panel saves the record to Downloads without a dialog and opens the records app in the default browser. I took this from the code; it is untested.
9. **If the panel is lost,** press Control+Option+H or click Second Chair in the Dock. To quit, press Control+Option+Shift+Q.
10. **Consent text in the panel:** the panel shows the same consent dialog ("Done: the client agreed"). `desktop/README.md` still mentions an "I said: 'This meeting is being recorded.'" checkbox. The code that relabels that checkbox looks for wording the page no longer uses, so expect the dialog. I did not confirm this live.

---

## 4. If something goes wrong

| Symptom | What to do |
|---|---|
| → does nothing | The cursor is in Find or a dialog is open: press Esc, then →. If a card is loading, wait for it. |
| **Next turn** is grey | A card is loading (wait), or the replay is past t8 (reload with Command+R to restart from t1). |
| Grey placeholder for more than 10 s | The server switches to the fallback card at 8 s. If nothing shows by about 15 s, the network is the problem: reload and replay quickly back to the same line. |
| Red banner "The engine did not answer (…). Press Next turn to try again." | Reload instead. Next turn moves to the next line; it does not retry the failed one. |
| Card wording differs from rehearsal | This is expected. Point at the label chips and figures, not the sentences. |
| Card 1 says "Emotional concern", not "Objection" | Both are valid. Live runs said "Emotional concern"; the fallback says "Objection". |
| No amber "Calculation" chip on card 3 | This is normal for live runs. Do not mention amber. |
| Header says "with" another client's name | A saved prep is stale. Clear storage (section 1, item 4), then use Try with sample files or Try the demo meeting. |
| End screen says the record is out of date | End meeting was pressed earlier in this meeting. Press the button in that notice to download the full record. |
| /prep is empty after a reload in a new tab | The draft lives in the tab's session. Use the same tab, or run Try with sample files again. |
| Page shows "Opening the meeting in the Second Chair desktop app." | The browser is paired. Click **Stay in the browser**, or use the clean demo profile. |
| Pre-flight shows `UNVERIFIED` "Live check unavailable" | Bright Data did not answer in 25 s, even after retries. Click **Run pre-flight** once more (a search that succeeded is kept, so the second run is quicker). If it is still unverified, say it is unverified or cut the step. Never present it as checked. |
| Pre-flight shows `UNVERIFIED` "Source found; not yet compared" | The search worked but the judge did not finish. The source link is real. Rerun, or show it as is. |
| Red text under pre-flight such as "/api/preflight answered 504" | It timed out. Retry once, then skip the step. |
| **Checking…** for more than 40 s | Wait up to 60 s (the route limit), or cut the step. |
| No records tab after End meeting | Allow pop-ups using the blocked-popup icon in the address bar, then click **Open compliance records** on the end screen. |
| Records tab is blank or empty | The one-time hand-off was already used or is more than an hour old. Click **Open compliance records** on the end screen for a new one, or upload the downloaded JSON in the records app. |
| Chrome asks "Download multiple files" | Click Allow. |
| Video shows the records tab, not the end screen | End meeting opens that tab on purpose. Switch back with Command+Option+Left arrow. |
| **Live mic (use Chrome)**, greyed out | You are not in Chrome. Switch browsers. |
| "Microphone permission denied." | Lock icon → Microphone → Allow, then reload. |
| "Speech service unreachable." | Network problem. Skip the mic segment. |
| The mic is transcribing the narrator | Click **Stop mic**. |
| Desktop panel is missing from the recording | The eye is slashed. Click it until it reads "Client can see this". |
| Desktop hotkey does nothing | Another app has it. Use menu-bar icon → Sample meeting → Play the next line. |
| Desktop panel looks old | Reinstall from main (section 3c, step 1). |
| Keys stop working on the end screen | This is by design. Press Esc or click **Back to meeting**. |
| Confirm and start meeting stays grey | Tick the review box; the client file needs a name and the Mandate at least one out-of-scope topic. The reason is shown next to the button. |

---

## 5. Quick reference card

**URLs**
- Live site: https://second-chair-live.vercel.app
- Records app: https://second-chair-view.base44.app
- Never use: second-chair-seven.vercel.app

**Demo path:** warm the pre-flight off camera → Prepare a meeting → **Try with sample files** (about 25 s) → **Run pre-flight** (about 3 s warm, up to 30 s cold) → tick **I've reviewed and confirm the Mandate** → **Confirm and start meeting →**. Fast path: landing → **Try the demo meeting** (clean storage).

**Meeting keys (website).** Lowercase letters; not while typing in Find.

| Key | Does |
|---|---|
| → | Next line |
| a | Auto-play / Pause |
| h | Hide / Show cards |
| / | Find in materials (Esc clears) |
| Esc on the end screen | Back to meeting |
| Command+R | Restart the replay |

**The four cards**

| Line | Moment | Point at |
|---|---|---|
| t2 | Emotional concern or Objection: access to cash | Prepared fact: $180,000 reserve, source 1 |
| t4 | Hesitation: wait six months | Prepared fact: 6 equal monthly tranches of $200,000; Do not claim |
| t6 | Disclosure: son's down payment | Life events in Client picture; Do not claim any down-payment figure |
| t8 | Contradiction: she says $200,000, the plan says $180,000 | The gentle correction; Why; then `/` and type `tranches` |

**Labels on screen:** **Prepared fact** (green), **Calculation** (amber, math shown), **Suggestion** (rose), **Do not claim** (grey).

**Timing:** cards take 3 to 7 s (fallback at 8 s); advisor lines are instant; auto-play moves every 4 s.

**End meeting (press it once, at the end):** the JSON downloads, a records tab opens (switch back), you grade, then **Download and open records** saves the grades and opens a new records tab.

**Desktop panel**

| Keys | Does |
|---|---|
| Control+Option+→ | Next line |
| Control+Option+P | Play or pause |
| Control+Option+H | Show or hide the panel |

Click the eye until it reads **Client can see this** before recording.
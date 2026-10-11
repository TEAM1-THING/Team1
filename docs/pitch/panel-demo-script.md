# Second Chair: the live panel demo (2 minutes)

The floating panel over a call is the demo's core. This is what to set up,
what to press, and what to say. The sample meeting with Dana Whitfield is a
fictional client, so no consent or key is needed. Pair it with B's deck: one
slide, "Live: the panel over a call", then switch to this.

## Set up before judging (5 minutes)

1. Mac app installed from `main` (`git checkout main`, `git pull`,
   `npm run install-app`), then opened. It loads second-chair-live.vercel.app.
2. A call window open behind it: a Zoom or Meet test call, or a full-screen
   slide as a stand-in.
3. **Make the panel visible to the audience.** It is hidden from screen share
   and screen recording by default, so judges watching a shared or recorded
   screen would see nothing. Click the eye on the panel's bar until it is open
   and amber ("Client can see this"). On a projector by cable, check once too.
4. If the room is large: menu-bar icon → **Larger text**.
5. Start the meeting: in the app window, click **Try the demo meeting**. The
   window steps aside and the panel opens in the top-right corner.
6. Fallback if anything misbehaves: the website at second-chair-live.vercel.app
   → **Try the demo meeting** shows the same cards in a browser tab.

## The two minutes

Advance the conversation with **Control+Option+→**, which works while the
call is in front, so you never click away from the client.

| Time | Do | Say |
|---|---|---|
| 0:00 | Call in front, panel in the corner. | "An advisor in a client meeting has to hear the worry, find the number and answer it, all at once. A tester told us they once waited fifteen or twenty minutes in an empty room for one number from prepared documents." |
| 0:15 | Point at the panel. | "Second Chair sits over the call. Before the meeting it read the advisor's own plan and files." |
| 0:25 | **Control+Option+→** twice: the advisor's line, then Dana's "I'm worried that locking this much in means I won't have enough access to cash." | "That isn't a question. It's a worry." |
| 0:35 | The card appears. | "It names the worry, gives a line to say, and every number has a label. Green means code traced it to her own plan, with the source and date. This is not a model making figures up." |
| 0:55 | **Control+Option+→** twice: "Maybe I should just wait six months." | "Hesitation. The answer comes from the plan's own six-month phased entry, and it lists what not to claim: that the market won't fall." |
| 1:15 | **Control+Option+→** twice: her sister lost money in 2008, and her son may need a down payment. | "The real reason. The amber figure is worked out here with the math shown: $120,000 above the reserve. It won't invent a down payment she hasn't given. And it goes into the client picture, so nothing she mentions is lost." |
| 1:30 | **Control+Option+→** twice: "I thought the report said the reserve was $200,000?" | "She misremembered: $200,000 is the monthly tranche. Every figure the client says is checked against the plan, and the card corrects it gently with the real $180,000." |
| 1:45 | Click the eye once (it slashes). | "And when I share my screen, the client never sees this. Now you can't either; I still can." Click it again to bring it back. |
| 1:55 | **End meeting**. | "At the end, every card is graded and the record goes to compliance. It reads your client, so you can focus on the answer." |

## If a judge asks

- **"Isn't this a Cluely wrapper?"** The panel is one way to show the cards.
  The difference is what is behind them: figures traced to the advisor's files
  by code, moments that are not questions, a Mandate the advisor confirmed,
  and a graded record. See `second-chair-pitch-prep.md`.
- **"Does it listen to a real call?"** Yes, it captures the call's own audio
  on macOS 14.2+, but transcription needs a speech-to-text key, which is not
  set on this laptop. Say so; do not start the live mic on stage.
- **"Is hiding it from the client honest?"** It is hidden from the client's
  view of the screen, not from the client. The advisor asks the client's
  agreement aloud before the mic starts (the consent popup), and the record
  goes to compliance. California requires all-party consent; this is a design
  constraint, not legal advice.

## Do not

- Do not click into the call between lines; use the shortcut. (A click on the
  panel is fine: it hands the keyboard straight back to the call.)
- Do not demo from second-chair-seven.vercel.app; it is frozen and old.
- Do not quote figures from the live web as the advisor's facts; they are red
  suggestions.

# Second Chair Records (Base44)

**App:** https://second-chair-view.base44.app (sign-in required)

The after-meeting record app, built on Base44 by the ship track (guardrail 5:
every card is a record). On the meeting screen, **End meeting** downloads the
record as JSON (`exportRecord` in `src/lib/record.ts`, the `MeetingRecord`
shape) and opens this app at `NEXT_PUBLIC_BASE44_URL`, which is set in Vercel
for Production and Preview. Next.js inlines that variable at build time, so
redeploy after changing it. The advisor signs in, uploads or pastes the file
and saves it. The record shows the client, the date, open and resolved
concerns, and every card with its labelled facts (green prepared fact, amber
calculated with the math shown, red suggestion, grey do-not-claim), the
suggested phrasing and the do-not-claim list. A compliance admin signs off
with **Mark reviewed by compliance**, which stores who reviewed it and when.

**Access rules** (Base44 row-level security on `MeetingRecord`): advisors
create and read only their own records. Only admins (the compliance role) can
sign off, edit or delete, so an advisor cannot quietly change or remove a
saved record. The app owner is an admin; invite advisors as users. The server
validates the JSON before saving and stores the cards as exported.

**Demo data only. Never upload real client data.** `sample-record.json` is the
team's demo meeting (fictional client, generated from `src/data/demo.ts` and
`src/lib/mock.ts` through `buildRecord`): 3 cards and 3 concerns, one resolved.
To test: sign in, upload it, **Save record**, open it from **Records**, sign off.

Editor (team members need an invite):
https://app.base44.com/apps/6aca9fa9a8ac7af166a7cd04/editor/preview

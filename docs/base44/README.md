# Second Chair Records (Base44)

**App:** https://second-chair-view.base44.app (no sign-in for now)

The after-meeting record app, built on Base44 by the ship track (guardrail 5:
every card is a record). On the meeting screen, **End meeting** downloads the
record as JSON (`exportRecord` in `src/lib/record.ts`, the `MeetingRecord`
shape) and opens this app at `NEXT_PUBLIC_BASE44_URL`, which is set in Vercel
for Production and Preview. Next.js inlines that variable at build time, so
redeploy after changing it. The link carries the record in its fragment
(`#record=<base64url JSON>`), which browsers never send to a server; the app
moves it into the tab's sessionStorage and cleans the address bar
(`src/lib/incoming-record.js` in the Base44 app), so the record opens ready to
review. Upload or paste still works for older files and for records too big
for a link (over about 1 MB).

The record shows the client, the date (in the viewer's time zone), open and
resolved concerns, and every card with its labelled facts (green prepared
fact, amber calculated with the math shown, red suggestion, grey
do-not-claim), the suggested phrasing (labelled suggestion) and the
do-not-claim list. A compliance reviewer types their name and presses **Mark
reviewed by compliance**; **Download raw file** then saves the record as JSON
with the sign-off (name and time) written into it.

**No sign-in and no database, for now** (team decision for the sense check).
Nothing is stored online: the raw file is the record. The typed reviewer name
is not checked against an account. A shared database with sign-in, possibly
Supabase, is queued for after the second sense check. The earlier Base44
version with sign-in, saved records and admin-only sign-off is kept as the
checkpoint "records: load record handed over by End meeting" in the editor.

**Demo data only. Never use real client data.** The full End meeting link can
stay in the browser's history, like the downloaded file on disk.
`sample-record.json` is the team's demo meeting (fictional client, generated
from `src/data/demo.ts` and `src/lib/mock.ts` through `buildRecord`): 3 cards
and 3 concerns, one resolved. To test: upload it, type a reviewer name, mark
it reviewed, download the raw file.

Editor (team members need an invite):
https://app.base44.com/apps/6aca9fa9a8ac7af166a7cd04/editor/preview

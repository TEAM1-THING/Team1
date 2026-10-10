# Second Chair Records (Base44 + Supabase)

**App:** https://second-chair-view.base44.app · **Database:** Supabase project
"second chair" (`utaoxurejczyedqgvmso`, us-west-1)

The after-meeting record app, built on Base44 by the ship track (guardrail 5:
every card is a record). On the meeting screen, **End meeting** downloads the
record as JSON (`exportRecord` in `src/lib/record.ts`, the `MeetingRecord`
shape) and opens this app with the record loaded.

**Hand-off by id (#45).** End meeting stores the record in the database as a
one-time hand-off (`create_handoff`) and opens the app at
`NEXT_PUBLIC_BASE44_URL#handoff=<id>`. Only the id is in the link, never client
details. The app collects the record once (`claim_handoff`); the id then stops
working, and unused hand-offs expire after an hour. Without the database (or
if it does not answer) the app opens plainly and the advisor uploads the
downloaded file. To reopen the app with a record from a click handler, call
`openRecordsApp(record)`; `recordLink` is deprecated and returns the plain link.

**Saved records.** Sign in with email and password (Supabase Auth), then
**Save to records**. The record shows the client, the date (in the viewer's
time zone), open and resolved concerns, and every card with its labelled facts
(green prepared fact, amber calculated with the math shown, red suggestion,
grey do-not-claim), the suggested phrasing (labelled suggestion) and the
do-not-claim list. **Download raw file** keeps a JSON copy.

**Access rules** (Postgres row-level security, tested as advisor, compliance
and signed out):

| Who | Can |
|---|---|
| Advisor | Save records as themselves (never pre-reviewed); read only their own |
| Compliance | Read every record; **Mark reviewed by compliance** (`sign_off`), which stamps the reviewer's own name, email and time |
| Anyone | Nothing else: no edits or deletes of saved records, no reading without sign-in |

New accounts are advisors. Compliance is set in the database only:
`update public.profiles set role = 'compliance' where email = '...'`.

**Settings.** Vercel (Production and Preview): `NEXT_PUBLIC_BASE44_URL`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Next.js
inlines these at build time, so redeploy after changing them. The publishable
key is meant for browser code; the access rules do the protecting. The
service-role key is never used in either app. Supabase email confirmation is
off for demo accounts.

**Demo data only. Never use real client data.** `sample-record.json` is the
team's demo meeting (fictional client, generated from `src/data/demo.ts` and
`src/lib/mock.ts` through `buildRecord`): 3 cards and 3 concerns, one resolved.
To test without a meeting: upload it, sign in, Save to records.

Editor (team members need an invite):
https://app.base44.com/apps/6aca9fa9a8ac7af166a7cd04/editor/preview

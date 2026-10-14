# Dashboard redesign delivery status

Updated 14 October 2026. This ledger distinguishes implemented source from shared database activation and production verification. It supplements, rather than replaces, the screen coverage matrix and acceptance contract.

| Slice | Implemented and pushed | Remaining acceptance work |
| --- | --- | --- |
| 1 — Shared shell | Approved mobile baseline, live header/sidebar, snug pills, active-tab dot and animated swipe. Existing destinations retained. | Continue checking new feature bodies against the approved tokens; shell completion does not certify untouched bodies. |
| 2 — Reporting and contacts | Unified form, owner-private contacts, church-unit shared meetings, personal attendance and explicit overnight end date/time; additive 0054 rehearsed locally. | Shared target/schema verification, migration/flags and production acceptance remain unverified. A push does not apply a migration. |
| 3 — Learning | Queue rules, additive 0055 persistence, revision/owner guards and canonical listen/Undo coordination; migration rehearsed locally. | **Next checkpoint:** connect path choice and resume to owned learning state; then editable suggested podcast plans, library and explicit episode/player controls. Verify immediate start, interrupted saves, both pace switches and retained traditional assessments/history. Optional question routing/privacy remains unresolved. |
| 4 — Oversight and membership | Existing discipleship membership/privacy features preserved; redesigned live My disciples body connected. My disciples now belongs under Community, keeping its canonical URL. Church peer/senior appointment and every-affected-branch validation fix tested. | Geographic/referral follow-up assignment and reassignment; privacy-safe account invitations and recipient outcomes. Church hierarchy, follow-up ownership and accepted membership remain separate. |
| 5 — Weekly reviews | Existing daily review history retained and labelled distinctly. | Discipler scheduling, session-leader attendance, offered make-ups and certification readiness. No new certificate thresholds, session counts or cross-path equivalence approved. |

## Execution order

1. Finish the user-visible slice 3 learning flow; do not repeatedly repolish finished screens.
2. Complete slice 4 ownership and invitation flows using approved routing defaults.
3. Complete slice 5 review flows using only agreed policy; isolate unresolved rules rather than blocking unrelated learning.
4. Close visual/functional gaps and separately verify shared migrations, activation and deployed behaviour.

Commit and push bounded checkpoints to `codex/dashboard-v3-baseline`. Do not merge or infer production deployment from a successful push. Keep private authenticated screenshots local; publish synthetic evidence only.

## Current navigation checkpoint

`/dashboard/sogp/discipleship` selects Community, including group query strings and nested paths. Its link appears in the Community section, not Oversight or Your workspace. Personal reports still select You despite their community namespace. URL, enrolment gate, group ownership and server actions are unchanged. Verified in the authenticated local mobile drawer and with 13 focused navigation/swipe tests, TypeScript and scoped lint.

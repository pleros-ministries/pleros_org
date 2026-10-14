# Dashboard redesign delivery status

Updated 14 October 2026. This ledger distinguishes implemented source from shared database activation and production verification. It supplements, rather than replaces, the screen coverage matrix and acceptance contract.

| Slice | Implemented and pushed | Remaining acceptance work |
| --- | --- | --- |
| 1 — Shared shell | Approved mobile baseline, live header/sidebar, snug pills, active-tab dot and animated swipe. Existing destinations retained. | Continue checking new feature bodies against the approved tokens; shell completion does not certify untouched bodies. |
| 2 — Reporting and contacts | Unified form, owner-private contacts, church-unit shared meetings, personal attendance and explicit overnight end date/time. 0054 installed on the user-confirmed shared target, followed by 0055; existing-data digests unchanged during rollout. | Hosted reporting activation and production acceptance remain unverified. A push is not deployment evidence. |
| 3 — Learning | Additive 0055 installed on the confirmed shared target; canonical listen/Undo coordination and history retained. Live chooser/resume, full podcast editor/library, player bindings and immediate-start guard. Completed learning now defaults on, with explicit off switch and no fingerprint activation restriction. | Automated checks deferred. Current browser review covers the learner resume, chooser and unsaved two-episode editor; actual saved player writes and future-cohort acceptance not repeated in this demo pass. Optional episode-question routing/privacy is unresolved. |
| 4 — Oversight and membership | Existing discipleship membership/privacy features preserved; redesigned live My disciples body connected. My disciples now belongs under Community, keeping its canonical URL. Church peer/senior appointment and every-affected-branch validation fix tested. | Geographic/referral follow-up assignment and reassignment; privacy-safe account invitations and recipient outcomes. Church hierarchy, follow-up ownership and accepted membership remain separate. |
| 5 — Weekly reviews | Existing daily review history retained and labelled distinctly. | Discipler scheduling, session-leader attendance, offered make-ups and certification readiness. No new certificate thresholds, session counts or cross-path equivalence approved. |

## Execution order

1. Paper Community home is connected and pushed (`f8e2d0d`); old feed remains contextually accessible. Finish demo-visible learning polish; do not repeatedly repolish completed screens.
2. Complete slice 4 ownership and invitation flows using approved routing defaults.
3. Complete slice 5 review flows using only agreed policy; isolate unresolved rules rather than blocking unrelated learning.
4. Close visual/functional gaps and deferred tests; separately verify deployed behaviour. Shared 0054/0055 migration is already complete and must not be rerun.

Commit and push bounded checkpoints to `codex/dashboard-v3-baseline`. Do not merge or infer production deployment from a successful push. Keep private authenticated screenshots local; publish synthetic evidence only.

## Current navigation checkpoint

`/dashboard/sogp/discipleship` selects Community, including group query strings and nested paths. Its link appears in the Community section, not Oversight or Your workspace. Personal reports still select You despite their community namespace. URL, enrolment gate, group ownership and server actions are unchanged. Verified in the authenticated local mobile drawer and with 13 focused navigation/swipe tests, TypeScript and scoped lint.

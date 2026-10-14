# Learning demo checkpoint — 14 October 2026

Completed learning is enabled by default after the approved 0054→0055 shared migration. There is no database-fingerprint activation check. To roll back learning writes/UI, set `DASHBOARD_SOGP_LEARNING_V3=0`; leave schema readiness on after migration to preserve legacy writer coordination. Other database targets need 0055 installed before this code is deployed.

Presentation follows the supplied learning screens: daily-commitment chooser, source hierarchy, compact episode menus, plan search/day navigation, per-day listen totals and inline player status. Existing progress/history, canonical explicit listened/Undo, media controls and traditional assessments remain intact.

Internal browser walkthrough used the signed-in learner, not fixture identity: 5 completed traditional tracks remain visible; an absent saved plan opens the path chooser; choosing two episodes/day opens the library without a database write. Two available episodes were selected into an unsaved draft, reviewed, moved and searched. No path, plan, completion or playback writes were performed. Mobile and desktop draft snapshots were captured. Private screenshots remain untracked under `evidence/demo-learning-live-*`.

Automated tests, lint, builds and diagnostic scans are deferred. This pass does not certify saved player mutations, future-cohort runtime access, populated leadership roles, perfect matched-overlay parity or hosted production delivery. Weekly scheduling/reassignment and episode-specific question delivery remain explicitly unavailable rather than fabricated.

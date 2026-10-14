# Group review scheduling and initial attendance checkpoint

14 October 2026: user clarified that only the discipleship group lead leads review sessions. The session-leader field is therefore read-only, derived from the group, and server-side scheduling/attendance requires that active group's actual lead—not a church appointment, geographic role or admin label.

0057 adds `sogp_group_reviews` and `sogp_group_review_attendance`. It does not backfill sessions, rewrite legacy `sogp_live_classes`/attendance, alter memberships or change certificates. Missing attendance rows mean unconfirmed; no missed mark is derived from a calendar date. Scheduling records no attendance. Stable request keys make retries return the same scheduled record rather than creating duplicates.

Source-aligned live routes: `/dashboard/sogp/reviews`, `/dashboard/sogp/reviews/schedule` and `/dashboard/sogp/reviews/[reviewId]/attendance`. Group access comes from active owned/joined discipleship membership. Own confirmed historical attendance remains readable after leaving. Roster visibility and writes stay with current accepted learners, excluding people who joined after the review and the lead's own identity. Confirmation is after the review's end and applies only explicitly selected people.

This checkpoint records initial confirmations, not attendance-correction policy. Confirmed values are read-only here; changing them, rescheduling/cancelling, explicit make-up offers and certificate readiness still need their respective implementation/policy checks. No numerical certificate rule, cross-path equivalence or arbitrary later-attendance credit is introduced. Existing legacy certificate behaviour has not been replaced or certified as meeting the new weekly requirement.

The reviewed migration is applied separately using the confirmed-target runner with `--group-reviews`, exact 0056 predecessor/hash, transaction/journal atomicity, and existing-record digest comparison (including legacy reviews, attendance, certificates and follow-up requests). This is target safety, not runtime activation restriction.

Automated tests/build/lint/diagnostics remain deferred. Browser snapshots are narrow runtime/presentation evidence, not proof of mutation/permission regression coverage. Do not schedule fake events or confirm real learners merely for QA.

0057 was applied to the confirmed shared target, following its exact 0056 journal/hash. The runner confirmed unchanged existing-record digests and both new tables empty. Read-only sample attendance at `/preview/dashboard-v3/review-attendance` reuses the live presenter with all three sample learners unconfirmed and no save action permitted.

Browser observations: real owned group's empty review list, live schedule form with read-only real group lead and explicit Lagos start/end labels, submit-only empty-field focus/guidance, mobile/desktop captures, and labelled sample attendance with every choice initially unselected. No real review or attendance record was created for QA. Initial scheduling/confirmation mutations and additional roles are not runtime-certified by these snapshots.

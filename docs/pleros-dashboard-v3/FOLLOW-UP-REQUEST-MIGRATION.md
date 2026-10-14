# Follow-up request checkpoint and migration review

The user confirmed existing admins should resolve reassignment requests. The learner may submit a private reason; submission preserves the current follow-up assignment, learning history, church appointments and accepted discipleship membership. Admin-only approval changes the existing `pastor_assignments` row and closes the request atomically. Decline closes the request without changing the assignment. An assignment changed since submission refuses approval rather than overwriting it.

0056 creates `sogp_follow_up_requests` and indexes only. It records enrolment, prior owner, reason, pending/resolved/declined status and reviewer/timestamps. One pending request per enrolment prevents duplicate submission; completed request history is retained. No account or group is created, no existing data is backfilled and no messages/push/Telegram/email are sent.

The explicit migration runner targets only the previously confirmed shared database, requires the exact 0055 journal/hash predecessor and applies 0056 plus its journal entry in one transaction. Existing users, enrolments, assignments, progress/listens and discipleship membership row digests are compared before/after inside that transaction. This endpoint check is migration safety, not database-restricted feature activation. There is no request-flow rollout flag.

Live routes: `/dashboard/sogp/follow-up`, `/dashboard/sogp/follow-up/request`, and admin-only `/admin/follow-up-requests`, linked from My enrollees. Current-owner name is the real assignment; geographical/referral origin is not fabricated when the existing row lacks it.

0056 was applied to the confirmed shared target on 14 October 2026. The runner confirmed the 0055 predecessor, committed the migration/journal together, retained all compared existing-record digests, and left the request table empty.

Automated tests are deferred. Browser snapshots cover the real form and submit-only empty-field validation without submitting a fake request against a real learner. `/preview/dashboard-v3/follow-up` renders the same pending presenter with labelled read-only source sample data; it sends no request and creates no assignment. Pending/resolution persistence acceptance requires an intentionally submitted request or an isolated synthetic identity; it must not be claimed from screenshots alone.

Actual browser observations: signed-in form on mobile/desktop, empty-submit focus and inline guidance, current Super Admin's empty admin queue, and the read-only sample pending layout. Private actual-account snapshots stay untracked. No real request or assignment was created for QA, and no approval/decline mutation was exercised.

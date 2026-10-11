# Dashboard connection rollout

11 October 2026. Implementation is separate from activation. No production migration, appointment, push consent change or reminder delivery is authorized by writing these files.

## Migrations and gates

Apply generated migrations in order to an isolated database first:

1. `0050_daily_reporting_v2`: confirmation/Nil declarations and meeting metadata.
2. `0051_church_organisation_v2`: church branches, units and appointments, separate from geographic community units and auth roles.
3. `0052_daily_report_push_preferences`: dedicated notification kind and explicit report-push consent, default off.

Only after the relevant tables and flows are verified:

- `DASHBOARD_DAILY_REPORTS_V2=1` enables confirmation/Nil and meeting role metadata. It must remain off until the full migration set needed by enabled features is present.
- `DASHBOARD_CHURCH_V2=1` enables assignment reads/writes and church oversight.
- `DASHBOARD_CHURCH_MULTI_BRANCH_V2=1` requires migration 0053 and enables multiple explicitly assigned branches per Branch Pastor. Geographic enrollee auto-assignment regions remain separate.
- `DASHBOARD_REPORT_REMINDERS_V2=1` requires both preceding gates, plus migration 0052. It enables manual sends, automatic 8 pm Lagos dispatch and the explicit push preference in Profile settings. Keep off until notification delivery is authorized.

Disabled services return before reading the new tables. Existing activity recording and established community/privacy rules remain in place. Deployment does not migrate tables automatically.

## Initial appointments

A signed-in super admin opens `/dashboard/church`, searches existing members by name and explicitly chooses the first Pastor. No person is chosen by email, app-role label or a geographic group assignment. One Pastor is enforced by a partial unique index.

The appointed Pastor creates branches/units and appoints Branch Pastors under them. The Pastor and Branch Pastors appoint unit leaders and workers; Branch Pastors act only inside their branch. Unit leaders have no appointment authority. Move a leader's direct reports first before moving that leader to another role/branch/unit. Appointment writes take one transaction lock to avoid concurrent conflicting tree changes.

Super admins retain their existing admin console; church report access separately requires an organisational assignment. The initial Pastor setup is an administrative control, not report access by title.

## Reporting and visibility

The authenticated report landing reads actual activities/devotional facts. Declaration controls are hidden until enabled. Older dates are readable; today and the previous seven Lagos dates can be edited. Existing historical ministry activity kinds remain readable/editable, even if no longer offered for creation.

Pastor: organisational reports across branches. Branch Pastor: their own branch. Unit leader: directly assigned workers only, with matching branch/unit. Worker: own reporting pages. An explicit church assignment grants self-reporting without SOGP enrolment, while community feed/messaging/moderation still require their existing independent guards. Organisational projections exclude activity notes, contacts and interaction records; location-pastor/admin rights remain independent.

Prayer Watch/Bible and Podcast links preserve the selected report date. Bible opens its own tab. Source actions revalidate reporting views without copying canonical facts into declarations.

## Notifications

The existing protected five-minute dispatcher route runs the report dispatcher independently of existing push delivery. A notification bell in the shared dashboard shell exposes the in-app reminder even outside community pages. Only assigned church members enter its roster. Automatic sends start at 8 pm Lagos for that day. Manual reminders require current scoped authority and an editable report date.

The notification checkpoint and in-app notification are committed in one transaction. Automatic/manual requests share recipient/current-Lagos-day keys. A completed report sends nothing. Push also requires the member's dedicated report consent plus existing community push consent; no consent is silently enabled. Once in-app delivery commits, a push failure does not release the claim or create another notification.

## Profile and existing features

`/dashboard/profile` updates Better Auth name/photo through the authenticated user API and synchronizes the app name. Photo upload uses the authenticated UploadThing route. Password changes stay in existing verified recovery. App/reminder setup remains independently linked.

Existing SOGP, Pre-SOGP, course/assessment, discipleship groups/check-ins/prayer requests, community groups/messages/questions and Welcome Pack pages continue using their existing services inside the common shell. Public preview screens use sample data and never establish an authenticated identity or send live messages/reminders.

## Required verification before release

With explicit user approval, the connection pass passed 296 regression tests, 7 real local-database integration checks, scoped lint, TypeScript, a production build, and populated synthetic-session browser checks. The local migration tail 0050–0052 succeeded; historical migration 0018 has a pre-existing invalid `yes` body and was not changed. Before production activation, review the rehearsal and explicitly authorize rollout, initial appointments and real delivery: migration constraints, two concurrent Nil/activity saves, appointment concurrency and cross-branch/indirect-report denial, meeting role edits, profile/session refresh, notification consent and duplicate cap, and public-preview isolation. Production activation remains a separate decision.

## 11 October rollout checkpoint

Production migrations 0050–0053 have been explicitly approved, applied and checked. The selected Pastor is appointed, with six Branch Pastors holding the eight confirmed church branch memberships in CONSOLIDATION.md. Geographic pastor regions and user accounts were verified unchanged. Olamide retains engineering test access without a church assignment. Unit leaders/workers await the user's list.

This pass passed 99 focused regressions, eight isolated PostgreSQL integration checks, scoped lint, TypeScript and a production build. Multi-branch scope, empty assignments and engineering accounts without church appointments are covered. Shared pure Welcome Pack presenters now serve live and public-demo adapters without importing live actions into the demo. Production gates are configured for the next release; test notifications remain on hold. This checkpoint does not claim a production profile-photo UI test or a delivered notification.

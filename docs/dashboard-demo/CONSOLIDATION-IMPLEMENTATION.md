# Consolidation implementation checkpoint

11 October 2026. Branch `codex/authenticated-dashboard-demo`. The connection pass is committed/pushed at `f3b38c3` and its Vercel preview is Ready. No production migration, appointment, flag activation or reminder delivery has been performed.

## Connected implementation

- **Common dashboard:** actual Home, SOGP, Podcast, Pre-SOGP, community and Welcome Pack use the shared capability-derived shell. Existing learning, assessment, messaging, group/privacy and Welcome Pack services remain in place. Home keeps the approved coloured cards, white background and main's church strip/footer.
- **Daily reports:** `/dashboard/community/report` now groups existing activity records and canonical devotional facts into Devotional / Ministry / Meetings. Confirmation/Nil and Undo use session-derived actions; recording activity clears stale Nil under the shared dated transaction lock. The Full report starts collapsed. History adds category submission states and links to older read-only dates. Write window is today plus seven Lagos days.
- **Meeting forms:** category-specific add choices feed the existing owned activity service. Leader/Worker/Member fields and teaching text use the companion metadata table, loading into edits and report cards. Member records only own attendance; Leader teaching text is required and capped at 500 characters. Historic activity kinds remain readable/editable.
- **Devotional navigation:** selected report date carries into Prayer Watch/Bible and Podcast; Bible opens its own tab. Source saves invalidate combined reporting views without copying facts into declarations.
- **Church organisation:** `/dashboard/church` and `/dashboard/church/[userId]` use separate branch/unit/appointment tables. Pastor can see all branches; Branch Pastor their branch; unit leader only directly assigned workers with matching unit/branch. Report projections exclude notes and contacts. Roster status reads use bounded canonical batches. Direct-report drill-down preserves the viewer; separate report controls open individual details.
- **Appointments:** initial Pastor selection is explicit super-admin setup. Pastor and Branch Pastors manage appointments and places; branch scope is rechecked in the transaction. Writes serialize hierarchy changes; leaders with direct reports cannot change role/location until those reports are reassigned. App roles and geographic moderator rights are unchanged.
- **Own reporting access:** an explicit church assignment also enables own reports without SOGP enrolment. This does not grant community feed, messaging or moderation access. Established location-pastor/admin privacy rights remain independently guarded.
- **Reminders:** the existing protected dispatcher route includes the separately gated reporting dispatcher. Manual actions enforce current supervisory scope. Notification checkpoint + in-app write are atomic, with one shared recipient/current-Lagos-day cap across manual/automatic sources. Automatic delivery starts at 8 pm Lagos; push needs dedicated explicit consent and existing community consent. A push failure never duplicates a committed in-app reminder. Notifications are visible in the shared shell.
- **Profile:** `/dashboard/profile` connects name/photo updates to Better Auth and app display name, authenticated UploadThing photo upload, existing verified password recovery, and App/reminder setup. Dedicated report push consent defaults off. No identity/auth-role changes or password handling were added.
- **Public presentation:** formerly unsupported destination pages now have synthetic screens for devotion, training, community, reporting history, Welcome Pack, partnership and church. Actual content/seed/assets are reused where appropriate; interactions stay local and no public preview establishes a real session or sends messages/reminders. Protected downloads and certificate issuance stay protected; sample actions are labeled.

## Activation is separate

See [ROLLOUT.md](ROLLOUT.md). Generated migrations 0050–0052 are not applied. `DASHBOARD_DAILY_REPORTS_V2`, `DASHBOARD_CHURCH_V2` and `DASHBOARD_REPORT_REMINDERS_V2` default off; disabled loaders do not read new tables. The new report landing can read existing records while declarations/meeting metadata remain gated. Production data, assignments and consent are unchanged.

## Verification completed in isolation

The user explicitly authorized verification on 11 October.

- 296 regression tests passed across 38 files; the opt-in integration suite is skipped in ordinary runs.
- 7 additional database-backed tests passed against a temporary PostgreSQL 18 instance on a private Unix socket, with only synthetic data and mocked push delivery. They cover assignment authority/cross-branch denial, database constraints, concurrent Nil/activity writes, meeting ownership/metadata, sanitized report projections, combined reminder caps and explicit push consent.
- Migrations 0050–0052 applied successfully to a generated pre-change schema in that isolated database. A full historical bootstrap first hit the pre-existing migration 0018 containing only `yes`; it was left untouched. The new migration tail was rehearsed independently of that legacy bootstrap defect.
- TypeScript and scoped ESLint passed after restoring locked dependencies. Production build passed, with only the existing filesystem-tracing notices.
- A built app was exercised against the isolated database through a local database bridge, using synthetic Better Auth users on 127.0.0.1 (separate cookie host from the user's localhost session). Unit-leader roster/detail access, cross-branch 404 denial, hidden notes/contacts, profile-name save/session refresh, collapsed report default, category-specific meeting choices, Member attendance 1, and role reset after changing kinds were verified in the browser. Shared drawer has one expanded parent; mobile reporting width is 410px with no overflow.
- All 24 public destination screens rendered at desktop/mobile widths with no missing-page placeholders or horizontal overflow. Root home and footer dashboard links preserve the preview. Sample downloads are labeled; protected originals and live credential changes remain separate.

Screenshots live under `screenshots/connected-*`. Actual remote photo upload, production migrations/assignments, and real notification delivery were intentionally not exercised. SQL integration used a local Postgres driver/bridge, not the hosted Neon transport.

Public connection preview: https://pleros-rg17luykk-plerosdev.vercel.app/preview/pleros?as=d-kemi . Deployment `dpl_CDGYtKZSEvbJP9ZNJtrexd8xrPC7` is Ready at f3b38c3 and anonymously returns HTTP 200; its access override is deployment-scoped. Production activation gates remain off.

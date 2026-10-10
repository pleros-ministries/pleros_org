# Consolidation implementation checkpoint

9 October 2026. Branch `codex/authenticated-dashboard-demo`. Work is local and uncommitted. No production migration, production deploy, real-role change or notification send has been executed.

## Implemented in the branch

- Actual `/dashboard` has the shared shell, compact vertical home cards, role/capability-derived navigation and existing account sign-out/recovery. The same frame covers Podcast, SOGP, Community and focused Welcome Pack join. Static route URLs and feature guards are preserved; no preview identity/store imports enter production.
- Server capabilities are request-cached in `lib/dashboard/viewer.ts`. Community access is checked independently from SOGP enrolment, including on the home card. A location pastor does not need SOGP enrolment to reach their permitted Community features.
- Navigation is one expanded parent, distinct parent icons and text-only child links; mobile/tablet use a drawer. The mobile name/role bar is sticky. Feature headers use its 48px offset. Duplicate legacy navigation was removed; course/media controls and current group/message/privacy actions remain.
- Be Vietnam Pro and the agreed compact typography apply to feature headings and portal menus while the dashboard is mounted; public typography restores on exit. Message-thread height accounts for the new shell. Real profile name/photo settings are not connected yet; current account controls expose only actual reminder settings, password recovery and sign-out.
- Activity selection immediately opens its form, including reselecting the same choice after Back. Add/correct/remove use the same today-plus-seven-Lagos-days cutoff; future and older dates remain locked. Activity kind/day immutability and canonical numeric validation remain.
- Demo Branch Pastors can open each supervised unit leader’s individual activity/devotional details. Unit leaders remain status-only. The individual projection excludes ministry notes, contact IDs and follow-up contact records, and refuses cross-branch reads.

## Reporting persistence prepared, not activated

`0050_daily_reporting_v2.sql` adds only two companion tables:
- Daily declarations keyed by person/date/category, storing confirmation or explicit Nil, not duplicated devotional/activity facts. Actor and subject must match; proxy reporting is unsupported.
- Meeting details keyed by existing activity ID, storing reporting role and what was taught. Existing activity columns/IDs remain compatible before migration.

`DASHBOARD_DAILY_REPORTS_V2` defaults disabled. Reads do not touch new tables while disabled; declaration writes return an expected unavailable error. Do not enable it until the migration, role-aware form bindings and isolated database checks are complete.

When enabled, declarations and activity writes share a transaction-scoped user/day lock. A Nil declaration is refused when category activity exists; recording an activity clears stale Nil. The authenticated action derives the owner and strips forged actor/subject fields. Meeting metadata saves with the existing activity transaction. Member attendance is one person and other numeric fields are cleared; teaching text is retained only for Leaders.

Reminder planning is pure code only: 8 pm Lagos onward for today’s incomplete report, plus manual reminders on editable dates, one shared recipient/current-Lagos-day checkpoint across both sources. Channels are in-app and opted-in push. No sender/cron integration or actual sends have been activated.

## Local comparison route

`http://localhost:3011/preview/pleros/consolidated-home?as=d-kemi` renders the actual home presentation with synthetic props, preview-only links and installation controls disabled. It is not an authenticated session or proof of live data loading. Its import-isolation check passes.

Screenshots:
- `screenshots/consolidated-actual-home-mobile.jpg`
- `screenshots/consolidated-actual-home-desktop.jpg`
- `screenshots/after-branch-pastor-individual-report.jpg`

## Still required

1. Bind the real three-category reporting UI and meeting role fields to the guarded services; verify against an isolated database before migration/activation.
2. Implement church branch/unit assignment storage, server-derived supervisory context, appointment permissions and scoped report queries. No production Church hierarchy exists yet; current location-group permissions remain distinct.
3. Connect reminder dispatch and manual sends only after the roster and shared checkpoint are enforced, with existing notification preferences and explicit rollout authorization.
4. Connect real profile name/photo settings without changing identity, roles or password consent.
5. Run populated authenticated desktop/mobile/keyboard QA with an authorized isolated fixture/session. Production-backed dashboard visits can write analytics/user mappings, so no production-backed session was used for this check.

The current public demo deployment is a separate fixed snapshot, not these in-progress production integrations: https://pleros-m2nr32dty-plerosdev.vercel.app/preview/pleros .

## Checks completed at this checkpoint

- 156 focused tests across 21 files passed (stale `.claude/worktrees` copies excluded). Includes declaration ownership and migration-gate tests, reminder clock/cap rules, reporting window, activity rules, preview isolation/scope projections, home access and existing training-preview regressions.
- Scoped ESLint passed; `git diff --check` passed.
- Full TypeScript check has only the five known local cache/dependency failures: removed staff route in `.next/types/validator.ts`, missing installed recharts and three xlsx references. No new changed-code errors remain.
- Actual home presentation rendered at mobile/desktop widths through the fixture adapter; mobile title is 21px, two card columns, no horizontal overflow and no live URLs. This checks presentation, not authenticated data loading/account actions.
- Migration was generated offline and not executed; real database transaction/constraint behaviour remains unverified until an isolated database run. The live reporting UI/role bindings must be completed before activation.

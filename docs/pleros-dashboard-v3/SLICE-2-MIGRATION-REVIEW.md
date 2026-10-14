# Slice 2: reporting and contacts — release review

Implementation is locally verified. User authorised migrations/deployment; production release is blocked by Vercel team access. No production schema, appointments or notification settings changed.

## Implemented boundary

- Live new/edit/report/People routes use authenticated adapters, not preview identity. Legacy activities, contacts, history, Nil/undo and canonical devotional facts remain intact.
- Unified Evangelism/Discipleship preserves existing metrics and online/offline/both mapping. Named people are included in entered totals, not added to them. Companion metadata retains typed blanks and explicit zeroes without inventing optional-outcome policy.
- Contacts persist independently of report drafts. New name/phone-required contacts support optional email/note and are owner-only. They create no account, invitation or group membership. Legacy contacts remain selectable with original permissions/history.
- Shared meetings belong to church units. The actual leader creates first, including an assigned worker, unit leader, Branch Pastor or Pastor. Server checks derive identity/current assignment; app titles, geography and SOGP groups grant no church-unit access.
- Teaching has one subject. Prayer has venue and explicit start/end instants. Reporting uses the Lagos start day; overnight prayer requires an explicit next-day end, never an inferred date.
- Shared details/creator total are immutable in this slice. Participants record their own attendance, Worker/Disciple participation and private named people brought. Claims never change the meeting total or appointments.
- Writes cover today plus seven previous Lagos days. Older owned records stay readable. Transactional access checks validate current unit/branches; organisational projections also validate the event's branch, not only the subject's appointment.

## Additive migration 0054

Five tables: `private_ministry_contacts`, `ministry_report_entries`, `ministry_report_contacts`, `church_shared_meetings`, `church_meeting_reports`.

Private contacts are physically separate from `outreach_contacts`, so retained staff readers/exports cannot leak them on rollback. No legacy backfill, rewrite, drop or account cleanup. Removing a report preserves contacts. Explicit legacy-contact deletion cascades only its association, not reports/counts. Unique owner/request and meeting/reporter keys enforce idempotency.

Generated SQL was applied successfully to disposable local PostgreSQL. A separate isolated browser database used the full current schema. No shared database migrated. Before production, inspect journal/actual objects and apply only the missing reviewed additive migration transactionally, with bounded lock timeout; do not replay broken unrelated historical migrations.

## Activation and rollback

1. Verify linked production project/database and migration state; retain the previous deployment identity.
2. Apply/verify 0054 before enabling reads/writes.
3. Set `DASHBOARD_REPORTING_V3_SCHEMA=1` after schema verification and retain it thereafter for privacy-aware history and legacy-overwrite guards.
4. Set `DASHBOARD_REPORTING_V3=1` for UI/writes, requiring existing daily-report gate. Shared meetings also require existing church gate.
5. Deploy verified source and check live routes/denial without creating real appointments or changing consent.

Rollback disables writes/UI while retaining schema-installed gate, new tables and privacy-aware source. Never drop private records or reopen legacy overwrite paths. Do not alter reminder settings as part of this release.

## Actual verification

- Final full regression after the mobile layout follow-up: 1,129 passed; 43 opt-in checks skipped in that run. TypeScript and scoped ESLint also passed after the follow-up.
- Real PostgreSQL slice 2 suite: 20/20 passed, covering actual server-action identity, all four church roles, cross-owner/unit denial, all affected branches, concurrency, Nil, legacy history/deletion, overnight reporting and read-only rollback.
- Separate appointment-permission suite: 15/15 passed.
- TypeScript, scoped ESLint, production build and diff whitespace checks passed. Build retains two pre-existing dynamic-filesystem tracing warnings in learning-progress share images.
- React Doctor changed-scope remains 49/100 with six advisory warnings, not a green audit: report-editor complexity, notification modal/complexity, server greeting time, motion import, branch-array lookup. This scan omits untracked new files; lint/type/build cover them.
- Actual Better Auth/live actions were exercised against synthetic users in an isolated loopback app copy, substituting only local PostgreSQL transport and disabling tracking/push. Independent private contact save, ministry save, worker-led meeting creation and another user's Disciple attendance succeeded. Shared total stayed 12; the attendee saw no worker-private contacts and remained appointed Worker.
- Screenshots at 390×844 and 1440×900: `evidence/slice2-live-attendee-mobile.jpg` and `slice2-live-attendee-desktop.jpg`. Final mobile verification corrected long-subject grid overflow and wrapped date labels: report cards end at 373px in a 390px viewport, and date labels stay single-line in their horizontal scroll region. The earlier worker mobile capture precedes this fix. Next.js runtime diagnostics reported no errors.

Earlier timeout runs were interrupted by host suspension/resource contention. Final reruns passed without weakening assertions.

## Release blocker and policy boundaries

Vercel MCP and CLI lack access to linked team `plerosdev` / project `pleros-org` (`prj_RAr0Q7PGWLoJkgjelnGhbrbKNHPV`). Connector returns 403; CLI lists only personal team. Restore intended team access before selecting production DB/deploying; do not relink to another project.

Production migration, activation, deployment and browser checks remain pending. Leader-role browser evidence is still pending; service-level integration coverage exists. Meeting correction/cancellation and independent duplicate resolution remain unapproved/unavailable. Certification, review scheduling, reminder activation and later slices are outside this release.

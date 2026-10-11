# Current code audit — Claude Opus 5.5

I've finished the audit. I made no code edits and no writes, and I didn't run any tests, lint or build. My evidence is the source code, the handoff docs and Codex's baseline screenshots in `docs/dashboard-demo/screenshots/`.

**What I could and couldn't see:**
- **Seen in screenshots:** Overview, SOGP and discipleship, all from the built-in previews.
- **Code only, not seen:** Daily reports, People, History, the leader page, `/admin/ministry` and every staff view, because no session was available and I didn't create one.

## Next docs read (16.3.1, `node_modules/next/dist/docs/01-app`)
- **`route-groups.md`:** routes that use different root layouts trigger a full page reload when you move between them, and two route groups must not resolve to the same path. So any `/preview/pleros` route group must not clash with `app/preview/*`.
- **`layout.md`:** layouts don't re-render on navigation and can't read the pathname. A role or tab switcher therefore has to read `useSearchParams`/`usePathname` in a client component.
- **`page.md`:** `searchParams` is a Promise.
- **`07-mutating-data.md`:** server actions can be called by a direct POST, not just from the UI. Importing a live action into a preview page is a real risk (see the main risk below).
- **`05-server-and-client-components.md`:** props passed to client components must be serialisable.
- **Config:** `next.config.ts` has no `cacheComponents`.
- **Side note:** `node_modules/next` resolves into `.pnpm/`, so the install was done with pnpm even though the rules say `package-lock.json` is canonical.

## Main risk
`ActivityForm` (`components/community/report/activity-form/activity-form.tsx:20,122`) imports and calls `saveMinistryActivity` directly. If the preview reused it as-is and the presenter was signed in, a demo "save" would write a real `ministry_activities` row. Before reuse it needs an injected `onSave` prop, which the demo would wire to local state. The same applies to `LeaderReportView`, which imports `nudgeAtRiskMembers` and `resolveUnitFlag` (`components/community/leader-report.tsx`); in the demo those must be display-only.

The SOGP and discipleship previews already guard this correctly: `useDiscipleshipAction(preview)` short-circuits (`components/sogp/discipleship-check-ins.tsx:39`), and `SogpJourneyPage` does the same at line 82. That's the pattern to copy.

## Keep / improve / replace

| Area | Decision | Evidence |
|---|---|---|
| SOGP journey (`SogpJourneyPage` + `sogpPreviewData`) | **Keep** and embed in the new shell | Strong 3-column layout in the screenshot; preview-safe |
| Discipleship (`DiscipleshipPage` + `discipleshipPreviewData`) | **Keep**, improve fixtures | "Groups you lead / Group you're in" is already separated. But group chips aren't links in preview mode (`discipleship-groups.tsx:79-80`), so switching groups can't be demonstrated. Fixture dates are stuck at 24/09/2026. The chip row clips "New gro…" at 384px |
| Overview (`WelcomeDashboardView`) | **Replace** for the demo | A launcher with a big hero and no state for today, reports or role. The preview shows "Enrolment required" badges on SOGP and Community even though their previews exist |
| Daily report landing (`report-day-view.tsx`) | **Replace** | A mixed list instead of the three required choices. It still has the Pleros-team visibility sentence (lines 44-48) and `PlerosTodayStrip` at the bottom (line 109). Heading reads "Daily report" while nav and handoff say "Daily reports" |
| `PlerosTodayStrip` | **Replace the placement, reuse the data** | `activityLines(DayActivity)` in `lib/community/ministry-report.ts:245` is pure and gives the Devotional rows with their source links |
| Activity form | **Improve** | `chooseKind` only updates the draft (line 73), so a separate Next is required. Choosing a kind should set it and advance, computing the next step from `stepsFor(kind)` rather than stale state. Kinds should be filtered by category (Ministry = `outreach` and `follow_up`; Meetings = `teaching_meeting` and `prayer_meeting`) |
| Pure logic: `lib/community/activity-form.ts`, `ministry-activities.ts`, `ministry-report.ts` | **Keep and reuse as-is** | No DB imports. They can run client-side over fixture state |
| `ReportTabs` (Report/People/History) | **Keep as secondary tabs** | Must not become extra primary report choices |
| `LeaderMinistryDay` type | **Reuse the shape** | Already has `memberCount` and `rows` for members who logged, so "missing" = expected roster minus rows. The roster itself has to be a fixture |

## Schema gaps (all preview-only for the demo)
- **Meeting role:** no column for Leader / Worker / Member.
- **Nil vs not reported:** no daily envelope or category declaration, so the database can't tell an explicit "no meeting" from a missing report.
- **Organisation tree:** none. `user_role` is `super_admin | admin | instructor | student | pastor` (`schema.ts:19`). `units`, `unit_members` (member/leader), `pastor_regions` and `pastor_assignments` are geographic or follow-up structures, not an oversight hierarchy. The "pastorate" tier has no backing and its spoken name is uncertain, so the label should be a fixture string.

## Permission boundaries the demo must show faithfully
- **Ministry numbers and notes:** admins see all. The pastor assigned to a location group sees that group's activities and notes (`leader/page.tsx:41-44`). A discipler sees summed numbers only. A member-appointed unit leader sees nothing.
- **People met in ministry:** only the member who met them, the assigned pastor and admins (`canSeeOutreachContact`).
- **New organisational roll-ups:** must be labelled "Preview: not live permissions", with names and counts only for direct reports and no notes, contacts or prayers.
- **Missing reports:** show "Reminder suggested" status chips only. No sanction, blocking or escalation wording, and no send button wired to anything (at most a disabled "Reminders not yet active").

## Recommended `/preview/pleros` architecture
- **Routes:** `app/preview/pleros/layout.tsx`, in the same route tree as the existing previews, so no full reloads. Then `page.tsx` (Overview), `reports/page.tsx` with a `?day=` param, `reports/[category]/page.tsx` for devotional, ministry and meetings, `people/page.tsx`, `sogp/page.tsx` and `discipleship/page.tsx`. Set `robots: noindex` and no `getAppSession` calls.
- **State:** one client `PreviewProvider`, a `useReducer` saved to `sessionStorage` with a Reset button. Holds:
  - people, organisation edges, discipleship groups and memberships
  - activities as `MinistryActivity`-shaped rows
  - category declarations (`activity | nil | not_reported`)
  - the meeting role
- **Fixtures:** in `lib/preview/pleros-fixtures.ts`. Six to eight synthetic people (Pastor → second tier, label "to confirm" → unit leader → workers → disciples), with each leader also holding a separate discipleship group. Unique headcount is computed by ID, kept separate from role and membership counts.
- **Role switcher:** a persistent "DEMO" bar showing the person, the organisation role and the scope, driven by `?as=<personId>`. It changes navigation and visible data through a single pure `previewCan(viewer, subject, field)` function, mirroring the current rules above.
- **Reuse with injected adapters:** `ActivityForm` (with `onSave`), the step components, `activityLines`, `DayPicker`, `SogpJourneyPage preview` and `DiscipleshipPage preview`. Make the discipleship preview's group chips switch locally and add a second `selectedGroup` fixture. Every live server-action import stays out of `app/preview/pleros/**`.
- **Shell:** one light, mobile-first shell. A left rail on desktop (Overview, Daily reports, People, SOGP, My disciples) and a bottom bar on mobile, mirroring the existing community bottom-bar pattern. Use existing `globals.css` tokens; the organisational scope breadcrumb and the personal group selector stay visibly separate.
- **Build order:** the three-choice reports landing with the full-day report and tracker, then direct entry into activity forms, the meeting role and Nil, then the leader's view of who has submitted, the higher-tier roll-up, the switch to the leader's own discipleship group, and SOGP inside the shell.

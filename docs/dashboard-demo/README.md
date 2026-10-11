# Pleros authenticated-dashboard demo

An isolated, interactive prototype of the redesigned authenticated dashboard: Overview, Daily reports, Church oversight, My disciples and SOGP in one light shell, with a synthetic person and role switcher.

- **Route:** `/preview/pleros` (local: `http://localhost:3011/preview/pleros`). `noindex`, no session, no database.
- **Branch:** `codex/authenticated-dashboard-demo`. Nothing committed, pushed or deployed.
- **Live route behavior is preserved.** The shared People and Numbers form steps keep their existing copy by default; the demo requests compact rendering.

## Boundary: synthetic only

- Every person, group, contact and number is invented in `lib/preview/pleros/fixtures.ts`, built deterministically from the Lagos day of the request. No production data is read or imported.
- State lives in one browser tab (React external store mirrored to `sessionStorage` under `pleros-demo:v2:<today>`). **Reset demo** in the person switcher immediately restores the disposable fixtures.
- No server action, fetch, email, push, Telegram, analytics event or service-worker effect runs from the demo. `components/root-integrations.tsx` (added by Codex) skips analytics, Meta Pixel, the push prompt and service-worker registration under `/preview/pleros`.
- `lib/preview/pleros/isolation.test.ts` walks every runtime import reachable from the demo routes and components. It fails on server actions, `lib/db`, sessions/auth, email, notifications, push, `node:*`, `server-only`, `next/headers`, Drizzle, Neon, Better Auth or Resend. It also fails on `"use server"`, `fetch(`, `sendBeacon`, `navigator.share` or `window.open(` in demo code.
- Organisational tiers (Pastor → Pastorate lead → Unit leader → Worker → Disciple) are presentation labels, not schema roles or permissions. **"Pastorate" is a provisional term recorded in the policy gaps below.**

## Demo script

The switcher (top bar → **Switch** / **Switch person**) lists every synthetic person. `?as=<personId>` and `?day=<YYYY-MM-DD>` deep-link any view.

1. **Tolu, worker, reports today:** `/preview/pleros/reports`
   - Day tracker (last seven Lagos days; older than today − 2 is view only) and exactly three choices: Devotional reports, Ministry reports, Meetings reports. The full report for the selected day is underneath.
   - **Devotional reports:** Prayer Watch and Bible reading are already recorded. "Edit at source" opens a preview stand-in for the canonical source; nothing is entered twice. **Confirm devotional report** (labelled as a preview decision pending live policy).
   - **Ministry reports:** exactly Evangelism and Discipleship. Choosing Evangelism opens the form at once and focuses its heading. Save, for example online · TikTok · reach 25 · saved 2, with no names.
   - **Meetings reports:** choose **No meeting today**. The day shows *Complete*, 3 of 3.
2. **Chioma, unit leader:** `/preview/pleros/people?as=u-chioma`. Direct reports update immediately: Tolu is finished. Open a row for the safe detail sheet: statuses and totals only, never notes or contacts. Queue a reminder for Emeka; it is demo-only and never sent.
3. **Kunle, pastorate lead:** `/preview/pleros/people?as=p-kunle&lens=scope`. Entire-scope lens, a roll-up by branch and a unique-people count.
4. **Pastor Ife:** `/preview/pleros/people?as=p-ife&lens=scope`. Whole scope: 12 people on the roster, each counted once.
5. **Chioma's own discipleship:** `/preview/pleros/disciples?as=u-chioma`.
   - Named groups, the 12-person cap, its own demo invite link and a closed group.
   - Sade appears as both overseen and discipled ("Also in your organisation") but counts once in Overview.
   - Open the **Contacts** tab in My disciples as Tolu. Choose an owned active group, log a follow-up, invite the contact, then explicitly **Enrol and accept** as that named person. Only acceptance adds a member.
6. **SOGP in the same shell:** `/preview/pleros/sogp`.
   - Week calendar with the real curriculum order (Level 3 this week), today's teaching and 5:30 am Prayer Watch, and a lesson sheet with a silent sample player and a two-question quiz built from the curriculum outline.
   - Ticking Prayer Watch here changes the same record Devotional reports reads.

Other states worth showing:
- **Paused group:** `?as=p-ngozi` on My disciples. It also blocks creating another group.
- **Empty second group:** Tolu's *Office lunch group*, or Kunle's *Campus fellowship*.
- **Lazy first group and "Group you're in":** `?as=d-grace`.
- **SOGP not applicable:** `?as=p-ife` or `?as=p-kunle`, who aren't in the cohort.
- **View-only history:** pick a day more than two days back.

## Architecture

| Layer | Files |
| --- | --- |
| Routes (thin, server) | `app/preview/pleros/{layout,page,loading,error,not-found}.tsx`, `reports/page.tsx`, `reports/[category]/page.tsx` (validates the three categories, else `notFound()`), `people/`, `disciples/`, `sogp/` |
| Pure domain (tested) | `lib/preview/pleros/types.ts`, `fixtures.ts`, `daily-report.ts` (categories, activity / nil / missing, overall completeness, write window), `scope.ts` (BFS scope with a visited set, unique headcounts, coverage, branch roll-ups, field-by-field oversight projection), `store.ts` (every mutation as a pure `state → Outcome`, re-checking ownership, scope, window and limits), `sogp.ts` |
| Client | `components/preview/pleros/demo-context.tsx` (external store, `?as` and `?day`), `shell.tsx`, `ui.tsx`, views per destination, `activity-entry.tsx` (direct form), `source-sheet.tsx`, `demo.module.css` (motion; the global reduced-motion rule disables it) |

The layout calls `connection()` so "today" is the request's Lagos day, never the build's. The shell sits inside a `Suspense` boundary because it reads search params.

**Reused live code (pure, audited by the isolation test):**
- Rules and validation: `lib/community/activity-form.ts` (`validateStep`, `toSaveInput`, `draftFromActivity`, `prefillFromFollowUps`), `lib/community/ministry-activities.ts` (`normaliseActivityInput` runs as the "server" check), `lib/community/ministry-report.ts` (`activityLines`, `canReportFor`, sums) and `lib/community/outreach-contacts.ts`.
- Form steps: `StepWhere`, `StepNumbers`, `StepPeople`, `StepFollowUps`, `Field` and `ChoiceGroup`.
- Curriculum: `lib/sogp/curriculum.ts`.

`ActivityForm` itself is **not** reused because it imports the live `saveMinistryActivity` action. The demo composes its step components with a local save adapter instead.

The discipleship limits (5 led groups, 12 people, name 3–60 characters) are mirrored as constants rather than imported, because `lib/sogp/discipleship.ts` imports `node:crypto`. `store.test.ts` pins them to the live values.

**Design:**
- One light shell built on the existing public-theme tokens (`site-font-theme`) with Be Vietnam Pro (the public body face) set as the product face through scoped CSS variables. There is no new token system and no `globals.css` change.
- Brand blue for the primary action and selection, sky for selected surfaces, lime only for completion.
- The recurring "report mark" (three short bars: solid reported, thin nil, dashed not yet) separates reporting status from activity volume.

## Mobbin references used (structure, not copies)

Details in `MOBBIN.md`:
- [HoneyBook home](https://mobbin.com/screens/82fb022a-9a06-4774-9942-f857076567e0): number strip and direct actions, used for Overview.
- [Uxcel Teams](https://mobbin.com/screens/e364eaf2-50f2-4c3f-8a48-a83d31d0ab34): grouped sidebar ("Personal" and "Oversight").
- [Mistral AI members](https://mobbin.com/screens/1315b9af-24c4-4632-8cb9-724014eef45c): hairline roster with lens and filter counts.
- [MacroFactor food log](https://mobbin.com/screens/6f5a08d4-34fd-4da5-8cbb-f58757b10954): seven-day tracker.
- [Google Health add reading](https://mobbin.com/screens/35c1dc80-3ec7-4ecc-a321-39dde5e253a8): direct single-page form.

## Checks actually run (Claude, 9 October 2026)

- `npx vitest run lib/preview/pleros lib/community/activity-form.test.ts`: **6 files, 55 tests passed**. This includes the scope, daily-report, store and isolation suites, Codex's `numeric-rollup.test.ts`, and the existing activity-form tests.
- `npx eslint app/preview/pleros components/preview/pleros lib/preview/pleros components/root-integrations.tsx app/layout.tsx`: **exit 0, no findings**.
- `npx tsc --noEmit`: **exit 2, with no errors in demo files**. All five errors are pre-existing environment or baseline problems:
  - `recharts` is declared in `package.json` but missing from local `node_modules` (`components/ppc/admin-sogp-report.tsx`).
  - `xlsx` is declared but missing (`lib/community/ministry-workbook.ts`, its test, and `lib/sogp/report-workbook.ts`).
  - A stale `.next/types/validator.ts` references a removed `app/admin/(app)/(super-admin-only)/staff/page.js`.
- **Browser QA:** Claude ran none. Codex ran the baseline and comparison browser QA and captured the `screenshots/after-*` images. The mobile demo-bar, day-tracker and People hydration fixes were rechecked by Codex. See [QA and screenshot comparison](QA.md) for the final evidence, limitations and resolved findings.

## Backend and policy gaps (not built, needed before live)

1. **Report envelope.** There is no table for per-category declarations, so the live app can't yet tell an explicit nil from missing. Approved on 9 October: Devotional facts prefill automatically and the person confirms once per day; live persistence is still missing.
2. **Meeting reporting role** (leader / worker / member) and "what was taught" aren't in `ministry_activities`. Other role-specific fields still need agreeing.
3. **Organisation.** There is no roster, supervisor edges, organisational units or approved oversight policy. Location groups (`units`/`pastor_regions`) aren't organisational units. The second tier is Branch Pastor (approved on 9 October). Who may see identifiable activity versus totals needs approval and server-side enforcement.
4. **Reminders.** Expected daily reporting gets reminders only. The channel and cadence are undecided, and nothing is wired; the demo queue is local.
5. **Proxy and on-behalf entry,** roster import and follow-up routing are deferred.
6. **Contact to disciple.** The demo turns an accepted contact into a synthetic enrolled disciple. Live needs real enrolment and the existing invite-page acceptance.

## Known demo limitations

- State is per tab. Another tab or browser starts from the fixtures, and a new Lagos day starts fresh.
- Each person has a single supervisor in the fixtures. The scope walk deduplicates anyway.
- The lesson player is silent and the quiz is built from the curriculum outline. Written responses are left out.
- History is viewable for 20 days. Writes follow the live rule: today and the two Lagos days before it.

## Latest interface cleanup

The authenticated preview uses Be Vietnam Pro, retains only labels/data, validation and concise empty states, and keeps a compact DEMO person/role/scope bar. The sidebar groups My disciples and Church oversight under Oversight. Church oversight has no contacts tab. Contacts, follow-up and invitation acceptance live together inside My disciples. The `/people` URL is retained for existing deep links, with Church oversight as its visible name. Policy and prototype explanations belong in these delivery docs.

## Navigation and home consolidation follow-up

See [Mobbin references, compact vertical card options and consolidation plan](HOME-CARD-SUGGESTIONS.md). The production home is unchanged; `/preview/pleros/home-concept` is a visual proposal. Tablet/mobile now have a sidebar drawer. Church scope links narrow the current viewer's authorized subtree via `scope=`, and entire-scope rows group by unit leader. Circular counts replace parenthesized counts. The gray typography experiment was reverted.

### Complete navigation inventory

The shared desktop/sidebar drawer now groups all stable learner dashboard destinations under Personal, Devotion, Training, Community, Oversight and Welcome Pack. Navigation parents use sentence case and distinct icons; children are text-only. Only one section can expand at a time; the current section opens automatically, with soft 250ms expansion and reduced-motion support. Church oversight remains role-scoped; contacts remain within My disciples. Individual teaching, thread, group and report routes stay contextual rather than becoming menu entries.

Only Overview, Daily reports, My disciples, Church oversight and SOGP have working synthetic views. Remaining destinations open an explicit “Not included in this demo” state inside `/preview/pleros/destinations/<key>`, preserving person/day context. These entries inventory the existing product; they do not assert production entitlement or expose production data/actions. Production routing and permission-aware integration remain pending.

### Profile settings

The desktop profile card and drawer header link to `/preview/pleros/profile`, preserving person/day. Name and photo edits apply only to synthetic tab state; photos are cropped/compressed locally, with no upload service or external request. Header/switcher avatars use the saved local photo. Password reset is explicitly not connected pending real account integration. These optional fixture fields preserve existing session state without a version reset.

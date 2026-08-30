# SOGP Four-Level Curriculum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 20-required-plus-four-optional SOGP model with a fixed four-level, 24-required-track curriculum, date-and-assessment progression, Sunday reviews, aligned public/admin/dashboard surfaces, and safe sign-in-free previews.

**Architecture:** Define one pure canonical curriculum map and derive release dates, level summaries, readiness, and learner access from it. Keep the existing cohort-track, progress, assessment, Prayer Watch, review, and certificate tables; migrate only generic PPC Level 3 titles. Inject deterministic fixtures into the existing TanStack/Suspense learner components for preview routes without calling mutation APIs.

**Tech Stack:** Next.js 16.3 App Router, React 19 with React Compiler, TypeScript, Tailwind CSS v4, TanStack Query 5, Drizzle ORM/PostgreSQL, Better Auth, Vitest.

---

## File map

- `lib/sogp/curriculum.ts`: canonical source coordinates, SOGP levels, titles, and order.
- `lib/sogp/progression.ts`: Monday validation, six-day release dates, level summaries, and unlock rules.
- `lib/sogp/preview-data.ts`: deterministic Pre-SOGP and SOGP fixtures.
- `drizzle/0016_sogp_four_level_curriculum.sql`: guarded PPC Level 3 title mapping.
- Existing SOGP query, admin, learner, public-content, certificate, and preview files consume those shared rules.

### Task 1: Canonical 24-track curriculum

**Files:**
- Create: `lib/sogp/curriculum.ts`
- Create: `lib/sogp/curriculum.test.ts`
- Modify: `lib/sogp/first-cohort.ts`
- Modify: `lib/sogp/first-cohort.test.ts`

- [ ] Write failing tests asserting four levels of six, 24 unique source coordinates, Baptism at order 6, Walk of Faith at order 18, and every track required.

```ts
expect(SOGP_LEVELS.map((level) => level.tracks.length)).toEqual([6, 6, 6, 6]);
expect(SOGP_TRACKS).toHaveLength(24);
expect(SOGP_TRACKS[5]).toMatchObject({ curriculumLevel: 1, curriculumOrder: 6, sourceLevelId: 3, sourceLessonNumber: 1, title: "Baptism of the Holy Ghost" });
expect(SOGP_TRACKS[17]?.title).toBe("The Walk of Faith");
expect(new Set(SOGP_TRACKS.map((track) => `${track.sourceLevelId}.${track.sourceLessonNumber}`)).size).toBe(24);
```

- [ ] Run `npm test -- lib/sogp/curriculum.test.ts lib/sogp/first-cohort.test.ts`; expect RED because the canonical map is absent and the old builder produces optional tracks.
- [ ] Implement `SOGP_LEVELS`, flattened `SOGP_TRACKS`, `getSogpLevel()`, and `validateSogpCurriculum()` with the exact approved mapping.
- [ ] Make `buildFirstCohortTrackSelection()` take no selection input and return 24 required tracks with `dayNumber = curriculumOrder`, `weekNumber = curriculumLevel`, and no live-session association.
- [ ] Run the focused tests; expect PASS.
- [ ] Commit with explicit staging as `feat: define canonical four-level SOGP curriculum`.

### Task 2: Monday–Saturday schedule and level progression

**Files:**
- Modify: `lib/sogp/schedule.ts`
- Modify: `lib/sogp/schedule.test.ts`
- Create: `lib/sogp/progression.ts`
- Create: `lib/sogp/progression.test.ts`
- Modify: `lib/sogp/day-access.ts`
- Modify: `lib/sogp/day-access.test.ts`

- [ ] Write failing tests for 24 Monday–Saturday releases, four Sunday reviews, Monday-start rejection, date gating, six-assessment level gating, early completion, and late catch-up.

```ts
expect(buildSogpTrackReleaseDates(monday)).toHaveLength(24);
expect(buildSogpTrackReleaseDates(monday).slice(0, 6).map((date) => date.getUTCDay())).toEqual([1, 2, 3, 4, 5, 6]);
expect(buildSogpReviewDates(monday).map((date) => date.getUTCDay())).toEqual([0, 0, 0, 0]);
expect(() => assertMondayCohortStart(tuesday)).toThrow("SOGP cohorts must start on Monday");
```

- [ ] Run `npm test -- lib/sogp/schedule.test.ts lib/sogp/progression.test.ts lib/sogp/day-access.test.ts`; expect RED on missing exports.
- [ ] Implement `buildSogpTrackReleaseDates`, `buildSogpReviewDates`, `assertMondayCohortStart`, `summarizeSogpLevels`, and `canAccessSogpTrack`.
- [ ] Update day access to require release date and prior-level assessment completion.
- [ ] Run focused tests; expect PASS.
- [ ] Commit as `feat: gate SOGP levels by date and assessment`.

### Task 3: Guarded PPC Level 3 title migration

**Files:**
- Create: `drizzle/0016_sogp_four_level_curriculum.sql`
- Modify: `drizzle/meta/_journal.json`
- Create: `lib/sogp/four-level-migration.test.ts`

- [ ] Write a failing migration test asserting Level 3 rows 1–9 map to the canonical titles, row 10 is absent from updates, and no `status` update exists.
- [ ] Run `npm test -- lib/sogp/four-level-migration.test.ts`; expect RED because migration `0016` is absent.
- [ ] Add a precondition block requiring source rows 1–9 and an `UPDATE ... FROM (VALUES ...)` keyed by `(level_id = 3, lesson_number)`; never update media, assessments, status, or row 10.
- [ ] Add the journal entry, rerun the migration test, and commit as `feat: map PPC Level 3 lessons for SOGP`.

### Task 4: Fixed admin curriculum and readiness

**Files:**
- Modify: `app/admin/_actions/sogp-actions.ts`
- Modify: `components/ppc/admin-sogp-page.tsx`
- Modify: `lib/sogp/preparation-seed.ts`
- Modify: `lib/sogp/admin-journey.test.ts`
- Modify: `lib/admin-query.ts`

- [ ] Write failing tests requiring 24 ready tracks, a Monday cohort start, no optional count, four reviews, and canonical-map configuration without practical arrays.
- [ ] Run `npm test -- lib/sogp/admin-journey.test.ts lib/admin-query-caching.test.ts`; expect RED on old 20-plus-four behaviour.
- [ ] Resolve all 24 source lessons, verify complete lesson readiness, derive releases from Task 2, and transactionally replace cohort tracks.
- [ ] Replace selection checkboxes with four fixed readiness groups and one `Configure 24-track curriculum` action.
- [ ] Require Monday, 30 Pre-SOGP lessons, 24 ready tracks, and four Sunday reviews for activation.
- [ ] Run focused tests; expect PASS, then commit as `feat: configure fixed SOGP curriculum`.

### Task 5: Level-aware reads, access, progress, and certification

**Files:**
- Modify: `lib/sogp/types.ts`
- Modify: `lib/db/queries/sogp.ts`
- Modify: `lib/db/queries/sogp-journey.ts`
- Modify: `lib/db/queries/sogp-completion.ts`
- Modify: `lib/sogp/server-access.ts`
- Modify: `lib/sogp/formation-dashboard.test.ts`
- Modify: `lib/sogp/assessment.test.ts`

- [ ] Write failing tests asserting 24 required tracks, four level summaries, locked-level days, current-level completion, no Extras, and 24-track certificate eligibility.
- [ ] Run `npm test -- lib/sogp/formation-dashboard.test.ts lib/sogp/assessment.test.ts lib/sogp/day-access.test.ts`; expect RED.
- [ ] Add `curriculumLevel`, `levelPosition`, `levelAccess`, `levelSummaries`, and locked reason to the journey data.
- [ ] Derive previous-level completion from assessment state and enforce it in server day access.
- [ ] Calculate certification from 24 assessments, 28 Prayer Watch dates, and four reviews; remove optional-track branches.
- [ ] Run focused tests and commit as `feat: derive four-level SOGP progression`.

### Task 6: Learner dashboard and public curriculum

**Files:**
- Modify: `components/sogp/sogp-journey-page.tsx`
- Modify: `components/sogp/sogp-dashboard-skeleton.tsx`
- Modify: `lib/sogp/landing-content.ts`
- Modify: `components/sogp/sogp-curriculum-accordion.tsx`
- Modify: `lib/sogp/landing-copy-fidelity.test.ts`
- Modify: `lib/sogp/landing-page.test.ts`

- [ ] Write failing render/content tests for four public levels of six, Baptism ending Level 1, Walk of Faith ending Level 3, four learner level states, and absence of Extras.
- [ ] Run `npm test -- lib/sogp/landing-copy-fidelity.test.ts lib/sogp/landing-page.test.ts lib/sogp/formation-dashboard.test.ts`; expect RED.
- [ ] Render selected track level/position, locked reason, `x of 6` current-level progress, four level summaries, and `x of 24` overall progress while preserving calendar-first mobile order.
- [ ] Build the public curriculum from the canonical map and remove Extras UI.
- [ ] Run focused tests and commit as `feat: present SOGP as four progressive levels`.

### Task 7: Deterministic, non-persistent previews

**Files:**
- Create: `lib/sogp/preview-data.ts`
- Create: `lib/sogp/preview-data.test.ts`
- Modify: `components/sogp/pre-sogp-page.tsx`
- Modify: `components/sogp/sogp-journey-page.tsx`
- Create: `app/preview/dashboard/pre-sogp/page.tsx`
- Create: `app/preview/dashboard/sogp/page.tsx`
- Modify: `app/preview/dashboard/page.tsx`

- [ ] Write failing tests asserting the Pre-SOGP fixture has 30 dates and four calendar states, while the SOGP fixture has 24 tracks, four reviews, four level states, a locked level, and no learner identity.
- [ ] Run `npm test -- lib/sogp/preview-data.test.ts`; expect RED.
- [ ] Allow both learner components to accept `initialData` and `preview`; preview query functions return fixtures, mutations update only local cache, invalidation is disabled, assessment links do not navigate, and push controls are replaced by preview copy.
- [ ] Add both preview routes under the shared AppShell and point the preview dashboard cards to them.
- [ ] Run preview and UI tests; expect PASS, then commit as `feat: add SOGP learner previews`.

### Task 8: Full verification, migration, and release

**Files:**
- Modify only files required by regression tests.

- [ ] Run `npm test -- lib/sogp`, `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `npx react-doctor@latest --verbose --scope changed`.
- [ ] Verify `/sogp`, `/preview/dashboard/pre-sogp`, `/preview/dashboard/sogp`, `/admin/sogp`, and authenticated SOGP access at mobile and desktop widths.
- [ ] Apply migration `0016` through `DATABASE_URL_UNPOOLED`; verify the ledger, titles 1–9, row 10, unchanged statuses, and zero lost cohort-track rows.
- [ ] Verify a clean worktree, push `main`, and confirm local HEAD equals `origin/main`.

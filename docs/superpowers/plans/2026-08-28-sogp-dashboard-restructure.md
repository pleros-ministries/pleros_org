# SOGP-centred Dashboard Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the learner-facing PPC dashboard journey with enrolment-gated Pre-SOGP and calendar-led SOGP experiences, including required Prayer Watch, assessments, review sessions, optional extras, Welcome Pack orientation, administration, and 5:20 am browser push.

**Architecture:** Extend the existing SOGP cohort model rather than create a parallel platform. Keep server-derived Lagos calendar state in focused domain helpers, expose enrolled journey data through SOGP route handlers, and render it through TanStack Query Suspense boundaries. Reuse Prayer Watch attendance, lesson assessments, live-class attendance, push subscriptions, and the existing admin shell.

**Tech Stack:** Next.js 16.3 App Router, React 19 with React Compiler, TypeScript, Tailwind CSS v4, TanStack Query 5, Drizzle ORM/PostgreSQL, Better Auth, Web Push, Vitest.

---

## File map

Create focused domain and UI units:

- `lib/sogp/calendar.ts`: Lagos date arithmetic, 30-day preparation generation, daily requirements, and calendar colour derivation.
- `lib/sogp/journey.ts`: dashboard journey composition and eligibility inputs without database access.
- `lib/db/queries/sogp-journey.ts`: enrolled learner reads and idempotent completion writes.
- `components/sogp/sogp-calendar.tsx`: shared responsive date grid.
- `components/sogp/pre-sogp-page.tsx`: preparation learner experience.
- `components/sogp/sogp-journey-page.tsx`: active four-week learner experience.
- `components/sogp/sogp-daily-requirements.tsx`: optimistic daily completion controls.
- `components/sogp/sogp-push-panel.tsx`: user-initiated reminder subscription.
- `app/(site)/dashboard/pre-sogp/page.tsx`: enrolled preparation route.
- `app/api/sogp/preparation/route.ts`: preparation calendar read.
- `app/api/sogp/preparation/[dayId]/completion/route.ts`: lesson-completion toggle.
- `app/api/sogp/prayer-watch/route.ts`: morning Prayer Watch toggle scoped to enrolled SOGP dates.
- `app/api/sogp/reviews/[liveClassId]/completion/route.ts`: live/recording review completion.
- `drizzle/0015_sogp_dashboard_restructure.sql`: completion and review metadata migration.

Modify existing integration points:

- `lib/db/schema.ts`, `lib/sogp/types.ts`, `lib/sogp/assessment.ts`, `lib/db/queries/sogp.ts`.
- `lib/welcome-dashboard-content.ts`, `components/dashboard/welcome-dashboard-view.tsx`, `components/dashboard/welcome-pack-page.tsx`.
- `components/sogp/sogp-dashboard.tsx`, `components/sogp/sogp-day-view.tsx`.
- `components/ppc/admin-sogp-page.tsx`, `components/ppc/admin-sogp-preparation.tsx`, `app/admin/_actions/sogp-actions.ts`, `app/admin/_actions/read-actions.ts`.
- `lib/sogp/notifications.ts`, `app/api/cron/sogp-reminders/route.ts`, `vercel.json`, `lib/ppc-notifications.ts`.
- Learner-facing files below `app/ppc`, public navigation/footer content, and affected tests.

### Task 1: Lock calendar and eligibility rules

**Files:**
- Create: `lib/sogp/calendar.ts`
- Create: `lib/sogp/calendar.test.ts`
- Create: `lib/sogp/journey.ts`
- Create: `lib/sogp/journey.test.ts`
- Modify: `lib/sogp/types.ts`
- Modify: `lib/sogp/assessment.ts`
- Modify: `lib/sogp/assessment.test.ts`

- [ ] **Step 1: Write failing calendar tests**

Cover exact preparation bounds, Lagos date comparison, and colour rules:

```ts
const preparationDates = buildPreparationDateKeys(
  new Date("2026-10-31T23:00:00.000Z"),
);
expect(preparationDates).toHaveLength(30);
expect(preparationDates[0]).toBe("2026-10-02");
expect(preparationDates.at(-1)).toBe("2026-10-31");

expect(deriveSogpCalendarState({
  dateKey: "2026-10-10",
  todayKey: "2026-10-11",
  requirements: [false, true],
})).toBe("missed");

expect(deriveSogpCalendarState({
  dateKey: "2026-10-10",
  todayKey: "2026-10-11",
  requirements: [true, true],
})).toBe("complete");
```

- [ ] **Step 2: Run the focused tests and confirm the missing-module failure**

Run: `npm test -- lib/sogp/calendar.test.ts lib/sogp/journey.test.ts lib/sogp/assessment.test.ts`

Expected: FAIL because the new calendar and journey exports do not exist and podcast is still part of eligibility.

- [ ] **Step 3: Implement the pure calendar contract**

Export:

```ts
export type SogpCalendarState = "future" | "current" | "missed" | "complete";

export function buildPreparationDateKeys(startsAt: Date): string[];
export function buildCoreWeekdayDateKeys(startsAt: Date, count?: number): string[];
export function deriveSogpCalendarState(input: {
  dateKey: string;
  todayKey: string;
  requirements: boolean[];
}): SogpCalendarState;
export function getSogpCountdown(startsAt: Date, now?: Date): {
  days: number;
  label: string;
  phase: "upcoming" | "active";
};
```

`buildPreparationDateKeys()` returns the 30 Lagos calendar dates ending on the day before `startsAt`. `deriveSogpCalendarState()` returns `future` for future dates, `current` for incomplete today, `missed` for incomplete past dates, and `complete` only when every supplied requirement is true.

- [ ] **Step 4: Remove Podcast from SOGP eligibility and define journey requirement types**

Change `SogpAssessmentPolicy` to:

```ts
export type SogpAssessmentPolicy = {
  requiredTrackCompletionPercent: number;
  requiredPrayerWatchPercent: number;
  requiredLiveClassCount: number;
};

export const DEFAULT_SOGP_ASSESSMENT_POLICY = {
  requiredTrackCompletionPercent: 100,
  requiredPrayerWatchPercent: 80,
  requiredLiveClassCount: 4,
} satisfies SogpAssessmentPolicy;
```

Remove `podcastDaysLogged`, `podcastDaysAvailable`, `podcastPercent`, and `"podcast"` from eligibility inputs/results. Add pure preparation, weekday, weekend, and review-day requirement builders to `lib/sogp/journey.ts`.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- lib/sogp/calendar.test.ts lib/sogp/journey.test.ts lib/sogp/assessment.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the domain rules**

```bash
git add lib/sogp/calendar.ts lib/sogp/calendar.test.ts lib/sogp/journey.ts lib/sogp/journey.test.ts lib/sogp/types.ts lib/sogp/assessment.ts lib/sogp/assessment.test.ts
git commit -m "feat: define SOGP calendar completion rules"
```

### Task 2: Persist preparation and required-review completion

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `drizzle/0015_sogp_dashboard_restructure.sql`
- Modify: `drizzle/meta/_journal.json`
- Create: `lib/sogp/dashboard-schema.test.ts`

- [ ] **Step 1: Write the failing schema contract**

Assert that `sogpPreparationCompletions` exists with enrolment/day identity and that live classes expose `isRequired`:

```ts
expect(sogpPreparationCompletions.enrollmentId).toBeDefined();
expect(sogpPreparationCompletions.preparationDayId).toBeDefined();
expect(sogpLiveClasses.isRequired).toBeDefined();
expect(sogpLiveClassAttendance.completionSource).toBeDefined();
```

- [ ] **Step 2: Run the schema test and confirm failure**

Run: `npm test -- lib/sogp/dashboard-schema.test.ts`

Expected: FAIL because the new table/columns do not exist.

- [ ] **Step 3: Extend the Drizzle schema**

Add:

```ts
export const sogpReviewCompletionSourceEnum = pgEnum(
  "sogp_review_completion_source",
  ["live", "recording"],
);

export const sogpPreparationCompletions = pgTable(
  "sogp_preparation_completions",
  {
    id: serial("id").primaryKey(),
    enrollmentId: integer("enrollment_id").notNull()
      .references(() => sogpEnrollments.id, { onDelete: "cascade" }),
    preparationDayId: integer("preparation_day_id").notNull()
      .references(() => sogpPreparationDays.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("sogp_preparation_completion_enrollment_day_idx")
      .on(t.enrollmentId, t.preparationDayId),
  ],
);
```

Add `isRequired boolean not null default true` to `sogp_live_classes` and `completionSource sogpReviewCompletionSourceEnum not null default 'live'` to `sogp_live_class_attendance`.

- [ ] **Step 4: Generate and inspect the migration**

Run: `npx drizzle-kit generate --name sogp_dashboard_restructure`

Expected: one new enum, one new table with two foreign keys and a unique index, plus two live-class columns. Keep the generated migration number if it differs from `0015` and update this plan reference.

- [ ] **Step 5: Run schema tests**

Run: `npm test -- lib/sogp/dashboard-schema.test.ts lib/sogp/schema-contract.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit the migration**

```bash
git add lib/db/schema.ts lib/sogp/dashboard-schema.test.ts drizzle
git commit -m "feat: persist SOGP journey completion"
```

### Task 3: Add enrolled journey reads and idempotent mutations

**Files:**
- Create: `lib/db/queries/sogp-journey.ts`
- Create: `lib/sogp/journey-access.test.ts`
- Create: `app/api/sogp/preparation/route.ts`
- Create: `app/api/sogp/preparation/[dayId]/completion/route.ts`
- Create: `app/api/sogp/prayer-watch/route.ts`
- Create: `app/api/sogp/reviews/[liveClassId]/completion/route.ts`
- Modify: `lib/db/queries/sogp.ts`
- Modify: `app/api/sogp/dashboard/route.ts`

- [ ] **Step 1: Write failing access and payload tests**

Tests must assert:

- no session returns 401;
- a session without SOGP enrolment returns 403 with `enrolUrl: "/sogp/enrol"`;
- a preparation day outside the learner's cohort cannot be completed;
- completion inserts are idempotent;
- Prayer Watch only accepts real dates on or before today in the learner's preparation/course window;
- review completion requires a required live class from the learner's cohort and accepts `live` or `recording`.

- [ ] **Step 2: Run tests and confirm route/query failures**

Run: `npm test -- lib/sogp/journey-access.test.ts`

Expected: FAIL because the journey query/mutation interface is absent.

- [ ] **Step 3: Implement the query interface**

Export:

```ts
export async function getPreSogpJourney(userId: string, now?: Date): Promise<PreSogpJourneyData | null>;
export async function getActiveSogpJourney(userId: string, now?: Date): Promise<SogpJourneyData | null>;
export async function setPreparationLessonComplete(input: {
  userId: string;
  preparationDayId: number;
  complete: boolean;
}): Promise<{ complete: boolean }>;
export async function setSogpMorningPrayerComplete(input: {
  userId: string;
  dateKey: string;
  complete: boolean;
}): Promise<{ complete: boolean }>;
export async function setSogpReviewComplete(input: {
  userId: string;
  liveClassId: number;
  complete: boolean;
  source: "live" | "recording";
}): Promise<{ complete: boolean; source: "live" | "recording" }>;
```

Reads return all 30 preparation dates, all active-course dates, requirements, completion state, URLs, countdown, 20 core tracks, four required reviews, and four optional tracks. They serialise dates to strings before returning to clients.

- [ ] **Step 4: Implement route handlers**

Every handler calls `getAppSession()`, validates a small JSON body, returns UK-English errors, and delegates authorisation to the scoped query function. GET routes are dynamic and uncached. Mutation responses contain the authoritative returned completion state.

- [ ] **Step 5: Remove podcast reads from the SOGP dashboard query**

Delete the `podcastEpisodeProgress` query and `podcastDaysLogged` payload field from `getSogpDashboardData()`. Count only required live classes when deriving `liveClassesAttended` and normalise the new policy default.

- [ ] **Step 6: Run focused tests**

Run: `npm test -- lib/sogp/journey-access.test.ts lib/sogp/formation-dashboard.test.ts lib/sogp/assessment.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the journey API**

```bash
git add lib/db/queries/sogp-journey.ts lib/db/queries/sogp.ts lib/sogp/journey-access.test.ts app/api/sogp
git commit -m "feat: add enrolled SOGP journey API"
```

### Task 4: Restructure dashboard cards and retire learner-facing PPC routes

**Files:**
- Modify: `lib/welcome-dashboard-content.ts`
- Modify: `lib/welcome-dashboard-content.test.ts`
- Modify: `components/dashboard/welcome-dashboard-view.tsx`
- Modify: `app/(site)/dashboard/page.tsx`
- Modify: `lib/ppc-routing.ts`
- Modify: `lib/ppc-routing.test.ts`
- Modify: learner-facing pages below `app/ppc`
- Modify: `components/site/site-header.tsx`
- Modify: `components/site/site-footer.tsx`
- Modify: `lib/site-homepage-content.ts`

- [ ] **Step 1: Write failing card-order and redirect tests**

Assert the exact eight-card order:

```ts
expect(welcomeDashboardSections.flatMap((section) => section.cards.map((card) => card.title))).toEqual([
  "Welcome Pack",
  "Pre-SOGP Lessons",
  "Podcast",
  "Devotion",
  "SOGP",
  "Advanced SOGP",
  "Community",
  "Partnership",
]);
```

Assert Advanced SOGP and Community are unavailable, enrolment-gated cards use `/sogp/enrol` without enrolment, and learner-facing `/ppc` entry pages call `permanentRedirect("/sogp")`.

- [ ] **Step 2: Run focused tests and confirm old labels fail**

Run: `npm test -- lib/welcome-dashboard-content.test.ts lib/ppc-routing.test.ts lib/ppc-navigation.test.ts`

Expected: FAIL on the old card model and PPC learner routes.

- [ ] **Step 3: Implement the new card model**

Add card states `available | enrolment_required | upcoming | coming_soon`. Resolve states server-side from the current SOGP enrolment/cohort. Render paired sections in the approved order, with non-interactive coming-soon cards and explicit enrolment actions.

- [ ] **Step 4: Add compatible learner redirects**

Use `permanentRedirect("/sogp")` in public/student PPC entry routes while preserving `/admin`, SOGP APIs, and internal lesson/admin infrastructure. Replace public `Enter PPC`, `PPC sign in`, and dashboard card labels with SOGP equivalents and canonical destinations.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- lib/welcome-dashboard-content.test.ts lib/ppc-routing.test.ts lib/ppc-navigation.test.ts lib/site-home-page.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit the dashboard and route migration**

```bash
git add lib/welcome-dashboard-content.ts lib/welcome-dashboard-content.test.ts components/dashboard/welcome-dashboard-view.tsx 'app/(site)/dashboard/page.tsx' app/ppc lib/ppc-routing.ts lib/ppc-routing.test.ts components/site lib/site-homepage-content.ts
git commit -m "feat: centre the learner dashboard on SOGP"
```

### Task 5: Restructure the Welcome Pack page

**Files:**
- Modify: `components/dashboard/welcome-pack-page.tsx`
- Modify: `lib/welcome-pack-page.test.ts`
- Modify: `lib/welcome-pack-gifts.ts`

- [ ] **Step 1: Write failing source-contract tests**

Assert the page includes the welcome video, `Join the orientation group`, `https://t.me/pleros_sogp`, an `Orientation video` thumbnail, and a `Your gifts` thumbnail linking to the gifts section.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm test -- lib/welcome-pack-page.test.ts`

Expected: FAIL because the page currently begins with gift cards.

- [ ] **Step 3: Build the approved hierarchy**

Use `/site/sogp/sogp-welcome-WaXgk9zqi78.mp4` and its poster for the available orientation/welcome media, provide native controls, and avoid autoplay. Place the Telegram CTA immediately after the video. Add two visual navigation cards below: `Orientation video` scrolls to the video and `Your gifts` scrolls to `#welcome-gifts`. Preserve gift lock logic and the shared community/footer transition.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- lib/welcome-pack-page.test.ts lib/welcome-pack-gifts.test.ts lib/welcome-flow.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the Welcome Pack experience**

```bash
git add components/dashboard/welcome-pack-page.tsx lib/welcome-pack-page.test.ts lib/welcome-pack-gifts.ts
git commit -m "feat: add Welcome Pack orientation journey"
```

### Task 6: Build the Pre-SOGP calendar experience

**Files:**
- Create: `components/sogp/sogp-calendar.tsx`
- Create: `components/sogp/sogp-daily-requirements.tsx`
- Create: `components/sogp/pre-sogp-page.tsx`
- Create: `components/sogp/pre-sogp-boundary.tsx`
- Create: `app/(site)/dashboard/pre-sogp/page.tsx`
- Create: `app/(site)/dashboard/pre-sogp/loading.tsx`
- Create: `lib/sogp/pre-sogp-ui.test.tsx`

- [ ] **Step 1: Write failing UI contract tests**

Assert source/render order is countdown, calendar, selected-day content, progress on mobile; the calendar exposes complete/current/missed/future labels; the selected day contains download, Pleros Live, Prayer Watch confirmation, and lesson-completion controls.

- [ ] **Step 2: Run the focused test and confirm missing components**

Run: `npm test -- lib/sogp/pre-sogp-ui.test.tsx`

Expected: FAIL because the Pre-SOGP components and route do not exist.

- [ ] **Step 3: Implement the shared calendar**

Render semantic buttons in a seven-column grid with visible text/shape distinctions in addition to colour. Today receives an outline; selected receives an inset focus treatment; status uses existing brand success, danger, and neutral tokens. Support dates crossing month boundaries and expose month labels without hiding dates from the 30-day range.

- [ ] **Step 4: Implement Pre-SOGP through Suspense**

`PreSogpBoundary` uses `useSuspenseQuery` for `/api/sogp/preparation`. `PreSogpPage` owns selected-date state and renders the approved mobile order. Completion mutations optimistically update the exact requirement, recompute the calendar cell, invalidate the preparation query, and restore the previous cache on error.

- [ ] **Step 5: Add enrolled route protection**

The Server Component checks `getAppSession()` and `getSogpEnrollmentByUserId()`. Missing authentication follows the dashboard auth entry; missing enrolment redirects to `/sogp/enrol`. Wrap the client boundary in the existing SOGP query provider, Suspense skeleton, and error boundary.

- [ ] **Step 6: Run focused tests**

Run: `npm test -- lib/sogp/pre-sogp-ui.test.tsx lib/sogp/calendar.test.ts lib/sogp/journey-access.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit Pre-SOGP**

```bash
git add components/sogp/sogp-calendar.tsx components/sogp/sogp-daily-requirements.tsx components/sogp/pre-sogp-page.tsx components/sogp/pre-sogp-boundary.tsx 'app/(site)/dashboard/pre-sogp' lib/sogp/pre-sogp-ui.test.tsx
git commit -m "feat: add Pre-SOGP calendar journey"
```

### Task 7: Rebuild the active SOGP learner dashboard around the calendar

**Files:**
- Create: `components/sogp/sogp-journey-page.tsx`
- Modify: `components/sogp/sogp-dashboard.tsx`
- Modify: `components/sogp/sogp-day-view.tsx`
- Modify: `components/sogp/sogp-dashboard-skeleton.tsx`
- Modify: `app/(site)/dashboard/sogp/page.tsx`
- Modify: `lib/sogp/formation-dashboard.test.ts`
- Modify: `lib/sogp/formation-progress.test.ts`

- [ ] **Step 1: Write failing active-journey tests**

Assert:

- mobile calendar markup precedes daily content;
- weekdays require Prayer Watch plus assessment;
- unscheduled weekend dates require Prayer Watch only;
- scheduled weekend dates require Prayer Watch plus review;
- review recording completion is accepted;
- exactly 20 required teachings and four optional Extras are distinguished;
- Podcast copy/progress is absent.

- [ ] **Step 2: Run the focused tests and confirm old dashboard failures**

Run: `npm test -- lib/sogp/formation-dashboard.test.ts lib/sogp/formation-progress.test.ts`

Expected: FAIL because the current page is track-card-led and includes Podcast eligibility.

- [ ] **Step 3: Compose the active journey payload**

Use `getActiveSogpJourney()` to build one daily row for every cohort calendar date. Attach a core track to weekdays, attach a required review to its scheduled date, and attach morning Prayer Watch to every date. Derive server-authoritative states with `deriveSogpCalendarState()`.

- [ ] **Step 4: Render Today-first content with the calendar above it on mobile**

Reuse `SogpCalendar` and `SogpDailyRequirements`. Teaching cards expose audio download and assessment actions; no audio-playback completion toggle remains. Review cards use the live URL until the class ends and the recording URL when present, followed by live/recording completion confirmation.

- [ ] **Step 5: Render progress and Extras**

Progress shows `core teachings`, `Prayer Watch`, and `review sessions`; it does not show Podcast. Extras list four optional tracks separately and label them as excluded from completion.

- [ ] **Step 6: Run focused tests**

Run: `npm test -- lib/sogp/formation-dashboard.test.ts lib/sogp/formation-progress.test.ts lib/sogp/assessment.test.ts lib/sogp/day-access.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the active SOGP journey**

```bash
git add components/sogp/sogp-journey-page.tsx components/sogp/sogp-dashboard.tsx components/sogp/sogp-day-view.tsx components/sogp/sogp-dashboard-skeleton.tsx 'app/(site)/dashboard/sogp/page.tsx' lib/sogp/formation-dashboard.test.ts lib/sogp/formation-progress.test.ts
git commit -m "feat: make SOGP calendar led"
```

### Task 8: Expand SOGP administration and validation

**Files:**
- Modify: `components/ppc/admin-sogp-page.tsx`
- Modify: `components/ppc/admin-sogp-preparation.tsx`
- Modify: `app/admin/_actions/sogp-actions.ts`
- Modify: `app/admin/_actions/read-actions.ts`
- Modify: `lib/admin-query.ts`
- Modify: `lib/sogp/preparation-admin.ts`
- Modify: `lib/sogp/preparation-admin.test.ts`
- Create: `lib/sogp/admin-journey.test.ts`

- [ ] **Step 1: Write failing admin-validation tests**

Assert activation rejects any cohort without 30 preparation lessons with unique URLs, 20 ready required tracks, four optional tracks, and four required scheduled reviews. Assert admins can correct preparation, Prayer Watch, and review completion only for learners in the selected cohort.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npm test -- lib/sogp/preparation-admin.test.ts lib/sogp/admin-journey.test.ts`

Expected: FAIL because exact launch validation and correction actions are absent.

- [ ] **Step 3: Add admin actions and read models**

Extend current actions with required review scheduling/update, review recording URL, validation summary, learner daily progress, and scoped completion correction. Keep all writes behind `requireAdmin()` and call `revalidatePath("/admin/sogp")` after mutations.

- [ ] **Step 4: Update the existing SOGP admin tabs**

Show readiness counts for `30 preparation`, `20 core`, `4 extras`, and `4 reviews`. Keep compact admin styling. Add learner progress inspection and correction controls without creating another admin route.

- [ ] **Step 5: Run focused admin tests**

Run: `npm test -- lib/sogp/preparation-admin.test.ts lib/sogp/admin-journey.test.ts lib/admin-query-caching.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit administration**

```bash
git add components/ppc/admin-sogp-page.tsx components/ppc/admin-sogp-preparation.tsx app/admin/_actions/sogp-actions.ts app/admin/_actions/read-actions.ts lib/admin-query.ts lib/sogp/preparation-admin.ts lib/sogp/preparation-admin.test.ts lib/sogp/admin-journey.test.ts
git commit -m "feat: manage the complete SOGP journey"
```

### Task 9: Send the 5:20 am enrolled browser-push reminder

**Files:**
- Create: `components/sogp/sogp-push-panel.tsx`
- Modify: `lib/ppc-notifications.ts`
- Modify: `lib/ppc-notifications.test.ts`
- Modify: `lib/sogp/notifications.ts`
- Modify: `lib/sogp/notifications.test.ts`
- Modify: `app/api/cron/sogp-reminders/route.ts`
- Modify: `vercel.json`
- Modify: `public/sw.js`

- [ ] **Step 1: Write failing reminder-candidate tests**

At `2026-10-10T04:20:00.000Z`, expect a Prayer Watch push candidate for each enrolled subscribed user in a preparing/active cohort. Assert the key includes cohort, learner, and Lagos date, and the deep link selects the same date. Assert no candidate outside the 5:20 am Lagos dispatch window.

- [ ] **Step 2: Run focused tests and confirm the old Telegram-only model fails**

Run: `npm test -- lib/sogp/notifications.test.ts lib/ppc-notifications.test.ts lib/sogp/vercel-cron.test.ts`

Expected: FAIL because the current SOGP cron sends Telegram channel reminders at 5:00 UTC and student copy says PPC.

- [ ] **Step 3: Implement enrolled push candidate generation**

Add a `prayer_watch` candidate with title `Prayer Watch begins in 10 minutes`, body `Join the 5:30 am Prayer Watch on Pleros Live.`, and a URL to `/dashboard/pre-sogp?date=YYYY-MM-DD` or `/dashboard/sogp?date=YYYY-MM-DD` according to cohort phase.

- [ ] **Step 4: Send idempotently and update the cron**

The cron loads preparing/active cohorts, enrolled users, and their `pushSubscriptions`, skips an existing checkpoint key, calls `sendPushToUser()`, and writes the checkpoint only when at least one subscription delivery is attempted. Change `vercel.json` to `20 4 * * *`, which is 5:20 am in Africa/Lagos year-round.

- [ ] **Step 5: Add the learner subscription panel**

Reuse `usePushSubscription()` with SOGP copy. Render a single user-initiated `Enable Prayer Watch reminders` button and quiet unsupported/configuration/denied states. Do not automatically call `Notification.requestPermission()`.

- [ ] **Step 6: Run focused tests**

Run: `npm test -- lib/sogp/notifications.test.ts lib/ppc-notifications.test.ts lib/sogp/vercel-cron.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit reminders**

```bash
git add components/sogp/sogp-push-panel.tsx lib/ppc-notifications.ts lib/ppc-notifications.test.ts lib/sogp/notifications.ts lib/sogp/notifications.test.ts app/api/cron/sogp-reminders/route.ts vercel.json public/sw.js
git commit -m "feat: remind SOGP learners before Prayer Watch"
```

### Task 10: Verify the complete restructure

**Files:**
- Modify only files required by failures found during verification.
- Modify: `docs/ai_scratchpad.md` only if the work produced a new durable mistake, correction, preference, or superior strategy; consolidate rather than append redundant guidance.

- [ ] **Step 1: Run all focused SOGP and dashboard tests**

Run:

```bash
npm test -- lib/sogp lib/welcome-dashboard-content.test.ts lib/welcome-pack-page.test.ts lib/ppc-routing.test.ts lib/ppc-navigation.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run lint and React diagnostics**

Run: `npm run lint`

Expected: exit 0 with no ESLint errors.

Run the repository's React diagnostic workflow after loading its skill; resolve introduced high-confidence findings.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`

Expected: all tests pass. If an unrelated baseline failure remains, prove it predates this branch before reporting it separately.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: exit 0 and all dashboard, SOGP, admin, API, and redirect routes compile.

- [ ] **Step 5: Verify the live browser flow**

Run `npm run dev`, then verify mobile and desktop widths for:

- `/dashboard`: exact card order, states, and no PPC learner copy;
- `/dashboard/welcomepack`: video, Telegram CTA, orientation and gifts navigation;
- `/dashboard/pre-sogp`: countdown, calendar above content on mobile, selection, completion, error recovery;
- `/dashboard/sogp`: weekday, ordinary weekend, required-review date, Extras, and progress;
- `/admin/sogp`: readiness, ordering, review scheduling, learner inspection, and corrections;
- `/ppc`: permanent redirect to `/sogp`;
- `/sogp/enrol`: canonical enrolment remains functional.

Check console errors, keyboard navigation, focus visibility, loading skeletons, error boundaries, and network responses.

- [ ] **Step 6: Audit the specification requirement by requirement**

Open `docs/superpowers/specs/2026-08-28-sogp-dashboard-restructure-design.md` and map every bullet to code, an automated test, or an observed browser result. Continue implementation for every missing or indirect item.

- [ ] **Step 7: Commit verification fixes at their owning task**

If verification exposes a defect, return to the task that owns the affected
file, add a regression test, make the smallest correction, rerun that task's
checks, and use that task's explicit staging list. Do not create an empty final
commit and do not broadly stage unrelated working-tree changes.

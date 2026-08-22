# SOGP Launch Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Launch School of God's Purpose as a public enrolment funnel, four-week cohort learning platform, Telegram-supported community, operational admin area, assessment system, and digital certificate/reward experience.

**Architecture:** Keep PPC as an independent self-paced product and reuse its lesson, quiz, written-response, and progress records inside SOGP. Add SOGP-specific cohorts, enrolments, ordered 20-track curriculum, live classes, Telegram identity links, assessment policy, and certificate/reward grants. Public and learner UI use existing Pleros public tokens and typography with MOOC information architecture; `/ppc` visual components remain isolated.

**Tech Stack:** Next.js 16 App Router, React 19/React Compiler, Tailwind CSS v4, existing shadcn primitives, Better Auth, TanStack Query 5 with Suspense/ErrorBoundary, Drizzle ORM, Neon Postgres, Telegram Bot API, Resend, web push, `@react-pdf/renderer`, Vitest.

---

## Locked product decisions

- Canonical public route: `/sogp`.
- Canonical enrolment route: `/sogp/enroll`.
- Canonical learner route: `/dashboard/sogp`.
- Remove old `school-of-purpose` route files and references; do not preserve redirects or parallel route aliases.
- PPC remains available at `/ppc`; SOGP reuses PPC lesson records without adopting PPC UI styling.
- Curriculum contains all Level 1 tracks (5), all Level 2 tracks (11), and four admin-selected Level 3 tracks (4): 20 weekday tracks across four weeks.
- Existing `student_progress`, `quiz_attempts`, and `written_submissions` remain source of truth for lesson learning state. Prior PPC work counts inside SOGP.
- Course structure is guided and date-based; completion can carry over after cohort end.
- Telegram linked discussion group handles launch community, text, and voice notes. Platform links identities and surfaces group access; native forum/voice storage is out of launch scope.
- Telegram bot posts scheduled preparation/course/live-class announcements and admin-triggered one-off broadcasts to cohort channel. Channel messages contain no learner PII.
- YouTube handles live classes and recordings.
- SOGP certificate eligibility derives from configurable cohort policy. Default: 100% tracks complete, all required quizzes/written responses approved, 80% Prayer Watch participation, and zero mandatory live classes until admin sets a number.
- Formation requirements: Morning Prayer Watch on at least 80% of cohort mornings, plus one distinct Pleros Podcast episode logged on every cohort day. Multiple podcast episodes on one Lagos date count once. Both existing tracker links and progress counts appear on learner/admin SOGP dashboards.
- Public and learner UI use existing `app/globals.css` tokens. No token redesign.
- Admin stays under existing `/admin` shell. SOGP route: `/admin/sogp`.
- Client reads/mutations use TanStack Query. Route segments use Suspense and ErrorBoundary; no `isPending`/`isError` page-state branches.
- Do not publish the supplied “stay private through the entire process” claim until Telegram group visibility and phone-number privacy are documented accurately.

**Known launch blocker:** current project release map says Level 2.3-2.11 and all Level 3 lessons remain draft. First cohort seed must fail until nine remaining Level 2 tracks and four selected Level 3 tracks pass full content readiness.

## Delivery slices

1. **Publicity slice:** Tasks 1-6. Landing page, enrolment, identity/session, preparatory dashboard, Telegram handoff.
2. **Cohort slice:** Tasks 7-12. Branded MOOC shell, 20-track course, lesson experience, live classes, admin operations.
3. **Completion slice:** Tasks 13-16. Assessment correctness, eligibility, certificate, rewards, notifications, release verification.

## UI contract

### Public landing

- Full Pleros site shell.
- Hero: promise, free one-month signal, primary enrol CTA, facilitator/media slot.
- Sections: five outcomes, what SOGP is, audience, curriculum, four-week structure, tools/platforms, facilitator, social proof, benefits, FAQ, closing CTA.
- Missing facilitator/social-proof/FAQ data renders no empty heading.
- Provisional copy stored in typed code config, sourced from supplied Google Doc.

### Learner dashboard

- Public-site visual system: Sen headings, Be Vietnam Pro body, brand blue/sky/lime, warm white surfaces, restrained radii.
- MOOC density: one dominant “Continue learning” action, week progress, next live class, course outline, Telegram community, assessment readiness.
- Desktop: compact left course rail, main content, narrow contextual right rail.
- Mobile: single column, sticky bottom course navigation, curriculum in Sheet.
- Status variants: `preparing`, `active`, `carryover`, `completed`.

### Course lesson

- Header: day, week, title, track status.
- Main: audio, notes, quiz/written-response actions.
- Right rail: completion checklist, Telegram question CTA, previous/next day.
- No PPC zinc theme, `PageHeader`, `StatusBadge`, or `PpcAppFrame` imports.

### Admin

- Existing compact admin shell retained.
- SOGP landing route has tabs: Overview, Cohorts, Curriculum, Enrolments, Live classes, Completion.
- Suspense-backed TanStack reads; mutations invalidate `ADMIN_QUERY_KEYS.sogp`.

---

### Task 1: Add SOGP domain model and migration

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `drizzle/0009_sogp_platform.sql`
- Create: `lib/sogp/types.ts`
- Test: `lib/sogp/schema-contract.test.ts`

- [ ] **Step 1: Write schema contract test**

```ts
import { describe, expect, test } from "vitest";
import {
  sogpCertificates,
  sogpCohorts,
  sogpCohortTracks,
  sogpEnrollments,
  sogpLiveClassAttendance,
  sogpLiveClasses,
  sogpRewardGrants,
} from "@/lib/db/schema";

describe("SOGP schema", () => {
  test("exports complete cohort lifecycle tables", () => {
    expect(sogpCohorts).toBeDefined();
    expect(sogpEnrollments).toBeDefined();
    expect(sogpCohortTracks).toBeDefined();
    expect(sogpLiveClasses).toBeDefined();
    expect(sogpLiveClassAttendance).toBeDefined();
    expect(sogpCertificates).toBeDefined();
    expect(sogpRewardGrants).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test; verify missing exports**

Run: `npm test -- lib/sogp/schema-contract.test.ts`

Expected: FAIL because SOGP schema exports do not exist.

- [ ] **Step 3: Add enums and typed policy**

```ts
export type SogpAssessmentPolicy = {
  requiredTrackCompletionPercent: number;
  requiredPrayerWatchPercent: number;
  requiredLiveClassCount: number;
};

export const DEFAULT_SOGP_ASSESSMENT_POLICY: SogpAssessmentPolicy = {
  requiredTrackCompletionPercent: 100,
  requiredPrayerWatchPercent: 80,
  requiredLiveClassCount: 0,
};
```

Add Drizzle enums:

```ts
export const sogpCohortStatusEnum = pgEnum("sogp_cohort_status", [
  "draft",
  "enrollment_open",
  "preparing",
  "active",
  "completed",
  "archived",
]);

export const sogpEnrollmentStatusEnum = pgEnum("sogp_enrollment_status", [
  "enrolled",
  "preparing",
  "active",
  "carryover",
  "completed",
  "withdrawn",
]);

export const sogpLiveClassStatusEnum = pgEnum("sogp_live_class_status", [
  "scheduled",
  "live",
  "completed",
  "cancelled",
]);
```

- [ ] **Step 4: Add tables**

Implement exact columns and constraints:

```ts
export const sogpCohorts = pgTable("sogp_cohorts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  status: sogpCohortStatusEnum("status").notNull().default("draft"),
  enrollmentOpensAt: timestamp("enrollment_opens_at", { withTimezone: true }),
  enrollmentClosesAt: timestamp("enrollment_closes_at", { withTimezone: true }),
  preparationStartsAt: timestamp("preparation_starts_at", { withTimezone: true }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  telegramChannelUrl: text("telegram_channel_url"),
  telegramDiscussionUrl: text("telegram_discussion_url"),
  telegramBotUsername: text("telegram_bot_username"),
  assessmentPolicy: jsonb("assessment_policy")
    .notNull()
    .$type<SogpAssessmentPolicy>()
    .default(sql`'{"requiredTrackCompletionPercent":100,"requiredPrayerWatchPercent":80,"requiredLiveClassCount":0}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("sogp_cohorts_slug_idx").on(t.slug),
  index("sogp_cohorts_status_idx").on(t.status),
]);
```

Add:

- `sogp_enrollments`: cohort/user identity, editable name/email/phone/country, reason, status, UTM fields, Telegram link token hash/user/chat IDs, timestamps; unique `(cohort_id,user_id)` and `(cohort_id,email)`.
- `sogp_cohort_tracks`: cohort ID, existing lesson ID, day 1-20, week 1-4, release timestamp; unique `(cohort_id,day_number)` and `(cohort_id,lesson_id)`.
- `sogp_live_classes`: cohort ID, title, start/end, YouTube live/recording URLs, status.
- `sogp_live_class_attendance`: class ID, user ID, attended timestamp; unique `(live_class_id,user_id)`.
- `sogp_certificates`: enrollment ID, verification code, issued/revoked timestamps, issuer; unique enrollment and verification code.
- `sogp_reward_grants`: enrollment ID, stable reward key, label, granted timestamp, issuer; unique `(enrollment_id,reward_key)`.

- [ ] **Step 5: Generate and inspect migration**

Run: `npx drizzle-kit generate --name sogp_platform`

Expected: migration contains seven SOGP tables, three enums, foreign keys, and listed indexes. If generated number differs from `0009`, keep generated number and update this plan path during execution.

- [ ] **Step 6: Run tests**

Run: `npm test -- lib/sogp/schema-contract.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/db/schema.ts lib/sogp/types.ts lib/sogp/schema-contract.test.ts drizzle/0009_sogp_platform.sql drizzle/meta
git commit -m "feat: add SOGP cohort data model"
```

### Task 2: Add pure SOGP lifecycle and assessment rules

**Files:**
- Create: `lib/sogp/status.ts`
- Create: `lib/sogp/status.test.ts`
- Create: `lib/sogp/assessment.ts`
- Create: `lib/sogp/assessment.test.ts`

- [ ] **Step 1: Write lifecycle tests**

```ts
import { describe, expect, test } from "vitest";
import { deriveSogpLearnerState } from "./status";

describe("deriveSogpLearnerState", () => {
  test.each([
    ["preparing", "preparing"],
    ["active", "active"],
    ["completed", "carryover"],
  ] as const)("maps %s cohort state to %s learner state", (cohortStatus, expected) => {
    expect(deriveSogpLearnerState({ cohortStatus, enrollmentStatus: "enrolled" })).toBe(expected);
  });

  test("preserves completed and withdrawn enrollment states", () => {
    expect(deriveSogpLearnerState({ cohortStatus: "active", enrollmentStatus: "completed" })).toBe("completed");
    expect(deriveSogpLearnerState({ cohortStatus: "active", enrollmentStatus: "withdrawn" })).toBe("withdrawn");
  });
});
```

- [ ] **Step 2: Write eligibility tests**

```ts
import { describe, expect, test } from "vitest";
import { calculateSogpEligibility } from "./assessment";

describe("calculateSogpEligibility", () => {
  test("requires tracks, prayer attendance, and live classes", () => {
    expect(calculateSogpEligibility({
      completedTracks: 20,
      totalTracks: 20,
      prayerDaysAttended: 23,
      prayerDaysAvailable: 28,
      liveClassesAttended: 3,
      policy: {
        requiredTrackCompletionPercent: 100,
        requiredPrayerWatchPercent: 80,
        requiredLiveClassCount: 3,
      },
    })).toEqual({
      eligible: true,
      trackPercent: 100,
      prayerPercent: 82,
      unmet: [],
    });
  });

  test("reports each unmet requirement", () => {
    const result = calculateSogpEligibility({
      completedTracks: 19,
      totalTracks: 20,
      prayerDaysAttended: 10,
      prayerDaysAvailable: 28,
      liveClassesAttended: 1,
      policy: {
        requiredTrackCompletionPercent: 100,
        requiredPrayerWatchPercent: 80,
        requiredLiveClassCount: 3,
      },
    });
    expect(result.eligible).toBe(false);
    expect(result.unmet).toEqual(["tracks", "prayer_watch", "live_classes"]);
  });
});
```

- [ ] **Step 3: Implement pure functions**

```ts
export function deriveSogpLearnerState(input: {
  cohortStatus: "preparing" | "active" | "completed";
  enrollmentStatus: "enrolled" | "preparing" | "active" | "carryover" | "completed" | "withdrawn";
}) {
  if (input.enrollmentStatus === "completed" || input.enrollmentStatus === "withdrawn") {
    return input.enrollmentStatus;
  }
  if (input.cohortStatus === "completed") return "carryover";
  return input.cohortStatus;
}
```

`calculateSogpEligibility` must round percentages to whole numbers, treat zero available prayer days as `0`, and return `unmet` in stable order: tracks, prayer_watch, live_classes.

- [ ] **Step 4: Verify**

Run: `npm test -- lib/sogp/status.test.ts lib/sogp/assessment.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/sogp/status.ts lib/sogp/status.test.ts lib/sogp/assessment.ts lib/sogp/assessment.test.ts
git commit -m "feat: define SOGP lifecycle and eligibility rules"
```

### Task 3: Add SOGP queries and seed first cohort

**Files:**
- Create: `lib/db/queries/sogp.ts`
- Create: `lib/sogp/first-cohort.ts`
- Create: `lib/sogp/first-cohort.test.ts`
- Create: `scripts/seed-sogp-cohort.ts`
- Modify: `package.json`

- [ ] **Step 1: Define curriculum selection contract**

```ts
export const SOGP_FIRST_COHORT_TRACKS = [
  { levelId: 1, lessonNumber: 1 },
  { levelId: 1, lessonNumber: 2 },
  { levelId: 1, lessonNumber: 3 },
  { levelId: 1, lessonNumber: 4 },
  { levelId: 1, lessonNumber: 5 },
  ...Array.from({ length: 11 }, (_, index) => ({ levelId: 2, lessonNumber: index + 1 })),
] as const;

export const SOGP_LEVEL_THREE_SELECTION_COUNT = 4;
```

Do not guess four Level 3 selections. Seed script accepts them as `--level3=1,2,3,4`, validates exactly four unique published lessons, and appends them as days 17-20.

- [ ] **Step 2: Test 20-track assembly**

```ts
test("builds 20 days from all Level 1, all Level 2, and four Level 3 tracks", () => {
  const tracks = buildFirstCohortTrackSelection([4, 8, 10, 18]);
  expect(tracks).toHaveLength(20);
  expect(tracks.map((track) => track.dayNumber)).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
  expect(tracks.slice(-4).map((track) => track.levelId)).toEqual([3, 3, 3, 3]);
});
```

- [ ] **Step 3: Implement query API**

`lib/db/queries/sogp.ts` exports:

```ts
export async function getOpenSogpCohort(): Promise<SogpCohort | null>;
export async function getSogpCohortBySlug(slug: string): Promise<SogpCohort | null>;
export async function getSogpEnrollmentByUserId(userId: string): Promise<SogpEnrollment | null>;
export async function upsertSogpEnrollment(input: SogpEnrollmentInput): Promise<SogpEnrollment>;
export async function getSogpDashboardData(userId: string): Promise<SogpDashboardData | null>;
export async function getSogpDayData(userId: string, dayNumber: number): Promise<SogpDayData | null>;
export async function getAdminSogpData(): Promise<AdminSogpData>;
export async function storeSogpTelegramLinkTokenHash(enrollmentId: number, tokenHash: string): Promise<void>;
```

Use batched queries. Never run one query per learner or track.

- [ ] **Step 4: Add seed script and command**

```json
{
  "scripts": {
    "seed:sogp": "tsx scripts/seed-sogp-cohort.ts"
  }
}
```

Command:

```bash
npm run seed:sogp -- --slug=september-2026 --starts=2026-09-07 --level3=4,8,10,18
```

Seed must abort unless all 20 matched lessons exist and are `published` with audio, notes, quiz, written prompt, and marking guide.

With `--import-waitlist`, seed script matches legacy `school_of_purpose_waitlist` emails to existing `users`, inserts idempotent enrolments, and prints unmatched emails for manual follow-up. Never delete legacy rows during launch migration.

- [ ] **Step 5: Verify**

Run: `npm test -- lib/sogp/first-cohort.test.ts`

Expected: PASS.

Run with DB: `npm run seed:sogp -- --slug=september-2026 --starts=2026-09-07 --level3=4,8,10,18`

Expected: either inserts one cohort + 20 tracks, or exits non-zero listing exact missing content. Do not bypass readiness.

- [ ] **Step 6: Commit**

```bash
git add lib/db/queries/sogp.ts lib/sogp/first-cohort.ts lib/sogp/first-cohort.test.ts scripts/seed-sogp-cohort.ts package.json
git commit -m "feat: add SOGP cohort queries and seed workflow"
```

### Task 4: Build public SOGP landing page

**Files:**
- Create: `app/(site)/sogp/page.tsx`
- Create: `components/sogp/sogp-landing-page.tsx`
- Create: `lib/sogp/landing-content.ts`
- Create: `lib/sogp/landing-page.test.ts`

- [ ] **Step 1: Add content contract test**

```ts
import { describe, expect, test } from "vitest";
import { sogpLandingContent } from "./landing-content";

describe("SOGP landing content", () => {
  test("covers supplied landing copy without empty launch sections", () => {
    expect(sogpLandingContent.hero.title).toContain("Find truth");
    expect(sogpLandingContent.outcomes).toHaveLength(5);
    expect(sogpLandingContent.audiences.length).toBeGreaterThanOrEqual(7);
    expect(sogpLandingContent.structure.durationDays).toBe(28);
    expect(sogpLandingContent.structure.trackCount).toBe(20);
    expect(sogpLandingContent.tools.map((tool) => tool.name)).toEqual(["Telegram", "Pleros Dashboard"]);
  });
});
```

- [ ] **Step 2: Create typed content**

Normalize supplied copy while preserving doctrine and promise:

```ts
export const sogpLandingContent = {
  hero: {
    eyebrow: "School of God's Purpose",
    title: "Find truth. Discover God's purpose. Grow to fulfil it.",
    description: "Get answers to difficult questions about God, gain clarity about His purpose for your life, and receive the transformation and strength to fulfil it.",
    ctaLabel: "Enrol for free",
    ctaHref: "/sogp/enroll",
  },
  structure: { durationDays: 28, trackCount: 20, liveClassCount: 4 },
  tools: [
    { name: "Telegram", description: "Community, questions, voice notes, prayer, and fellowship." },
    { name: "Pleros Dashboard", description: "Teachings, notes, assessments, progress, and certificates." },
  ],
} as const;
```

Add supplied outcomes, audience list, benefits, and optional facilitator/social-proof/FAQ arrays. Empty optional arrays are omitted in UI.

- [ ] **Step 3: Build branded page**

Use `PublicSitePageShell`, `HomepageNav`, `HomepageFooter`, `site-font-theme`, public typography primitives, and current tokens. Layout:

```tsx
export function SogpLandingPage() {
  return (
    <PublicSitePageShell>
      <HomepageNav />
      <main>
        <SogpHero />
        <SogpOutcomeStrip />
        <SogpDefinition />
        <SogpAudience />
        <SogpCurriculum />
        <SogpStructure />
        <SogpTools />
        <SogpBenefits />
        <SogpOptionalProof />
        <SogpFaq />
        <SogpClosingCta />
      </main>
      <HomepageFooter />
    </PublicSitePageShell>
  );
}
```

No gradients not already present in public-site system. No stock shadcn card grid. Alternate full-width brand/white/tinted sections.

- [ ] **Step 4: Add metadata**

```ts
export const metadata: Metadata = {
  title: "School of God's Purpose",
  description: "A free four-week school for truth, spiritual growth, and the fulfilment of God's purpose.",
};
```

- [ ] **Step 5: Verify**

Run: `npm test -- lib/sogp/landing-page.test.ts`

Expected: PASS.

Run: `npm run lint`

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add 'app/(site)/sogp/page.tsx' components/sogp/sogp-landing-page.tsx lib/sogp/landing-content.ts lib/sogp/landing-page.test.ts
git commit -m "feat: add SOGP public landing page"
```

### Task 5: Build enrolment and session handoff

**Files:**
- Create: `app/(site)/sogp/enroll/page.tsx`
- Create: `components/sogp/sogp-enrollment-form.tsx`
- Create: `app/api/sogp/enroll/route.ts`
- Create: `lib/sogp/enrollment.ts`
- Create: `lib/sogp/enrollment.test.ts`
- Create: `lib/telegram/sogp.ts`
- Create: `lib/telegram/sogp.test.ts`
- Modify: `lib/email/send.ts`
- Create: `lib/email/sogp-enrollment.test.ts`

- [ ] **Step 1: Test normalization and validation**

```ts
test("normalizes valid enrolment", () => {
  expect(normalizeSogpEnrollment({
    name: "  Ada Grace ",
    email: " ADA@EXAMPLE.COM ",
    phone: " +234 803 000 0000 ",
    country: " Nigeria ",
    reason: " I want clarity. ",
  })).toEqual({
    name: "Ada Grace",
    email: "ada@example.com",
    phone: "+234 803 000 0000",
    country: "Nigeria",
    reason: "I want clarity.",
  });
});
```

Require name, valid email, WhatsApp number, country. Reason optional, max 1,000 characters.

- [ ] **Step 2: Implement REST enrolment route**

Flow:

```ts
export async function POST(request: Request) {
  const payload = normalizeSogpEnrollment(await request.json());
  const errors = validateSogpEnrollment(payload);
  if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });

  const cohort = await getOpenSogpCohort();
  if (!cohort) return NextResponse.json({ error: "Enrolment is not open." }, { status: 409 });

  const authUser = await provisionWelcomeSession({
    email: payload.email,
    name: payload.name,
    requestHeaders: request.headers,
  });
  const userId = (await resolveDbUserId(authUser.email)) ?? authUser.id;
  const enrollment = await upsertSogpEnrollment({ ...payload, cohortId: cohort.id, userId });
  const telegramLink = cohort.telegramBotUsername
    ? createSogpTelegramLink({
        enrollmentId: enrollment.id,
        botUsername: cohort.telegramBotUsername,
        secret: getSogpTelegramLinkSecret(process.env),
      })
    : null;
  if (telegramLink) {
    await storeSogpTelegramLinkTokenHash(enrollment.id, telegramLink.tokenHash);
  }
  const telegramUrl = telegramLink?.url ?? cohort.telegramDiscussionUrl;
  void sendSogpEnrollmentEmail({ enrollment, cohort, telegramUrl });
  return NextResponse.json({ redirectTo: "/dashboard/sogp", telegramUrl });
}
```

Do not create `welcome_pack_leads`. Existing Better Auth/session provisioning is reused only for identity/session.

`lib/telegram/sogp.ts` defines `getSogpTelegramLinkSecret`, creates a random URL-safe start parameter within Telegram's 64-character limit, hashes it with HMAC-SHA256, and returns `{ url, startParameter, tokenHash }`. Secret resolves from `TELEGRAM_SOGP_LINK_SECRET`, then `BETTER_AUTH_SECRET`; production has no demo fallback.

- [ ] **Step 3: Build TanStack mutation form**

Use `useMutation`; fields stay editable when prefilled. Submit success uses `window.location.assign("/dashboard/sogp")`. Show field errors inline, one form error summary, and disabled submit while mutation runs.

Read `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term` from enrolment-page URL and send them with payload. Persist only bounded strings; never trust client source labels.

- [ ] **Step 4: Add transactional email**

Email contains cohort dates, dashboard URL, Telegram bot deep link, and support contact. Escape all user-provided values before HTML interpolation.

- [ ] **Step 5: Verify**

Run: `npm test -- lib/sogp/enrollment.test.ts lib/email/sogp-enrollment.test.ts`

Expected: PASS.

Manual: submit new and existing email; both land on `/dashboard/sogp` with one enrolment row.

- [ ] **Step 6: Commit**

```bash
git add 'app/(site)/sogp/enroll/page.tsx' components/sogp/sogp-enrollment-form.tsx app/api/sogp/enroll/route.ts lib/sogp/enrollment.ts lib/sogp/enrollment.test.ts lib/telegram/sogp.ts lib/telegram/sogp.test.ts lib/email/send.ts lib/email/sogp-enrollment.test.ts
git commit -m "feat: add SOGP enrolment funnel"
```

### Task 6: Add SOGP learner query provider and status-aware dashboard

**Files:**
- Modify: `components/query-provider.tsx`
- Modify: `app/(site)/dashboard/layout.tsx`
- Create: `app/(site)/dashboard/sogp/layout.tsx`
- Create: `app/(site)/dashboard/sogp/page.tsx`
- Delete: `app/(site)/dashboard/school-of-purpose/page.tsx`
- Create: `app/api/sogp/dashboard/route.ts`
- Create: `components/sogp/sogp-dashboard-boundary.tsx`
- Create: `components/sogp/sogp-dashboard.tsx`
- Create: `components/sogp/sogp-dashboard-skeleton.tsx`
- Create: `components/sogp/sogp-error-boundary.tsx`
- Create: `lib/sogp/preparation-content.ts`
- Create: `lib/sogp/preparation-content.test.ts`
- Modify: `lib/welcome-dashboard-content.ts`
- Modify: `lib/welcome-dashboard-content.test.ts`

- [ ] **Step 1: Add learner query defaults**

Refactor `QueryProvider` to accept optional defaults while preserving admin cache isolation:

```ts
export function QueryProvider({ children, userId, scope = "admin" }: {
  children: React.ReactNode;
  userId: string;
  scope?: "admin" | "sogp";
}) { /* cache key becomes `${scope}:${userId}` */ }
```

SOGP queries use 30-second stale time and no window-focus refetch.

- [ ] **Step 2: Add authenticated dashboard API**

`GET /api/sogp/dashboard` calls `getAppSession`, returns 401 without session, 404 without enrollment, and serialized ISO dates otherwise.

- [ ] **Step 3: Build Suspense boundary**

```tsx
export function SogpDashboardBoundary() {
  return (
    <SogpErrorBoundary>
      <Suspense fallback={<SogpDashboardSkeleton />}>
        <SogpDashboard />
      </Suspense>
    </SogpErrorBoundary>
  );
}
```

`SogpDashboard` uses `useSuspenseQuery`. No `isLoading`, `isPending`, or `isError` rendering branches.

- [ ] **Step 4: Render status states**

- Preparing: countdown, Telegram setup CTA, preparation videos, 20-track preview.
- Active: Continue learning, week progress, next track, live class, Telegram CTA, assessment snapshot.
- Carryover: resume first incomplete track, explain completion window.
- Completed: certificate/reward CTA, retained curriculum access.

Preparation content uses existing Pleros destinations, not duplicated media:

```ts
export const SOGP_PREPARATION_CONTENT = [
  { id: "questions", title: "Begin with your questions", href: "/questions" },
  { id: "purpose", title: "Introduction to God's purpose", href: "/purpose" },
  { id: "discipleship", title: "Prepare for a life of growth", href: "/dashboard/discipleship-journey" },
] as const;
```

Test unique IDs, internal routes, and stable order.

- [ ] **Step 5: Remove old route and reorder generic dashboard card**

Delete `app/(site)/dashboard/school-of-purpose/page.tsx`. Update every internal link and source-contract test to `/dashboard/sogp`. Move SOGP before PPC in `welcomeDashboardSections`.

- [ ] **Step 6: Verify**

Run: `npm test -- lib/welcome-dashboard-content.test.ts lib/welcome-dashboard-access.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/query-provider.tsx 'app/(site)/dashboard/layout.tsx' 'app/(site)/dashboard/sogp' 'app/(site)/dashboard/school-of-purpose/page.tsx' app/api/sogp/dashboard components/sogp lib/sogp/preparation-content.ts lib/sogp/preparation-content.test.ts lib/welcome-dashboard-content.ts lib/welcome-dashboard-content.test.ts
git commit -m "feat: add status-aware SOGP dashboard"
```

### Task 7: Build branded MOOC shell

**Files:**
- Create: `components/sogp/sogp-course-shell.tsx`
- Create: `components/sogp/sogp-course-rail.tsx`
- Create: `components/sogp/sogp-mobile-nav.tsx`
- Create: `components/sogp/sogp-progress.tsx`
- Create: `components/sogp/sogp-course-shell.test.ts`

- [ ] **Step 1: Test shell accessibility and route contract**

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

test("keeps curriculum navigation labelled and current day explicit", () => {
  const shell = readFileSync(join(process.cwd(), "components/sogp/sogp-course-shell.tsx"), "utf8");
  const rail = readFileSync(join(process.cwd(), "components/sogp/sogp-course-rail.tsx"), "utf8");
  expect(shell).toContain("SogpCourseRail");
  expect(rail).toContain('aria-label="Course curriculum"');
  expect(rail).toContain('aria-current={day.isCurrent ? "page" : undefined}');
  expect(rail).toContain("Week {week.number} of 4");
});
```

- [ ] **Step 2: Implement shell layout**

Desktop grid: `15rem minmax(0,1fr) 18rem`; collapse right rail below 1180px; mobile single column. Use existing Sheet for curriculum. Course rail groups days under Week 1-4, shows complete/current/locked states, and keeps links at least 44px high on touch screens.

- [ ] **Step 3: Implement visual rules**

- Background: `var(--color-surface)`.
- Primary: `var(--color-brand-blue)`.
- Supporting: sky and lime tokens.
- Heading: `var(--font-sen)`.
- Body/UI: `var(--font-be-vietnam-pro)`.
- Radius: token `--radius-md` for panels; pills only for status.
- Motion: 150-200ms opacity/translate only; respect reduced motion.

- [ ] **Step 4: Verify**

Run: `npm test -- components/sogp/sogp-course-shell.test.ts`

Expected: PASS.

Run: `npm run lint`

Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add components/sogp/sogp-course-shell.tsx components/sogp/sogp-course-rail.tsx components/sogp/sogp-mobile-nav.tsx components/sogp/sogp-progress.tsx components/sogp/sogp-course-shell.test.ts
git commit -m "feat: add branded SOGP course shell"
```

### Task 8: Build SOGP day/lesson experience

**Files:**
- Create: `app/(site)/dashboard/sogp/course/day/[dayNumber]/page.tsx`
- Create: `app/api/sogp/course/day/[dayNumber]/route.ts`
- Create: `components/sogp/sogp-day-view.tsx`
- Create: `components/sogp/sogp-audio-player.tsx`
- Create: `components/sogp/sogp-completion-checklist.tsx`
- Create: `components/sogp/sogp-day-actions.tsx`
- Create: `lib/sogp/day-access.ts`
- Create: `lib/sogp/day-access.test.ts`
- Create: `lib/db/queries/lesson-progress.ts`
- Modify: `app/ppc/_actions/lesson-actions.ts`

- [ ] **Step 1: Test release/access rules**

```ts
test("allows released days and blocks future days", () => {
  expect(canAccessSogpDay({ now: new Date("2026-09-08T12:00:00Z"), releaseAt: new Date("2026-09-08T00:00:00Z") })).toBe(true);
  expect(canAccessSogpDay({ now: new Date("2026-09-08T12:00:00Z"), releaseAt: new Date("2026-09-09T00:00:00Z") })).toBe(false);
});

test("keeps released days available during carryover", () => {
  expect(canAccessSogpDay({ learnerState: "carryover", now: new Date(), releaseAt: new Date("2026-09-01") })).toBe(true);
});
```

- [ ] **Step 2: Add read API and branded view**

Page uses shell from Task 7. API returns lesson, progress, best quiz score, written status, previous/next day, and Telegram question URL. Sanitize trusted notes on import; do not add a second unsafe HTML path.

- [ ] **Step 3: Add SOGP action adapters**

Extract shared lesson progress mutations from PPC-specific actions into `lib/db/queries/lesson-progress.ts`. PPC and SOGP server actions call same query functions and invalidate their own routes.

- [ ] **Step 4: Build audio and completion UI**

Audio marks listened only after 90%. Notes action is explicit “Mark notes read.” Quiz and response links point to SOGP-branded routes added in Task 9. Telegram CTA opens bot/group in new tab.

- [ ] **Step 5: Verify**

Run: `npm test -- lib/sogp/day-access.test.ts`

Expected: PASS.

Manual mobile test: open curriculum Sheet, switch day, play audio, mark notes, return to dashboard; progress updates without PPC shell appearing.

- [ ] **Step 6: Commit**

```bash
git add 'app/(site)/dashboard/sogp/course/day/[dayNumber]' 'app/api/sogp/course/day/[dayNumber]' components/sogp lib/sogp/day-access.ts lib/sogp/day-access.test.ts lib/db/queries/lesson-progress.ts app/ppc/_actions/lesson-actions.ts
git commit -m "feat: add SOGP daily learning experience"
```

### Task 9: Reuse quizzes and written responses with SOGP styling

**Files:**
- Create: `app/(site)/dashboard/sogp/course/day/[dayNumber]/quiz/page.tsx`
- Create: `app/(site)/dashboard/sogp/course/day/[dayNumber]/response/page.tsx`
- Create: `components/sogp/sogp-quiz.tsx`
- Create: `components/sogp/sogp-written-response.tsx`
- Create: `app/api/sogp/course/day/[dayNumber]/quiz/route.ts`
- Create: `app/api/sogp/course/day/[dayNumber]/response/route.ts`
- Modify: `lib/db/queries/quizzes.ts`
- Modify: `lib/db/queries/submissions.ts`
- Test: `lib/sogp/assessment-routes.test.ts`

- [ ] **Step 1: Test SOGP assessment access**

Assert routes resolve cohort day to existing lesson, reject unreleased/future days, reject non-enrolled users, and never return `correctAnswer` or `responseMarkingGuide` in learner payload.

- [ ] **Step 2: Extract shared mutation functions**

PPC and SOGP route handlers call shared query functions. SOGP client uses TanStack mutation and invalidates `['sogp','day',dayNumber]` plus `['sogp','dashboard']`.

- [ ] **Step 3: Build branded assessment UI**

Reuse question data and scoring rules, not PPC visual components. Quiz shows one question per step, persistent step count, result summary, retry. Written response supports draft save, submit, revision note, approved state.

- [ ] **Step 4: Verify**

Run: `npm test -- lib/sogp/assessment-routes.test.ts lib/ppc-content-import.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add 'app/(site)/dashboard/sogp/course/day/[dayNumber]/quiz' 'app/(site)/dashboard/sogp/course/day/[dayNumber]/response' app/api/sogp components/sogp lib/db/queries/quizzes.ts lib/db/queries/submissions.ts lib/sogp/assessment-routes.test.ts
git commit -m "feat: add SOGP assessments"
```

### Task 10: Integrate Telegram bot identity and group handoff

**Files:**
- Modify: `lib/telegram/sogp.ts`
- Modify: `lib/telegram/sogp.test.ts`
- Create: `lib/telegram/sogp-broadcast.ts`
- Create: `lib/telegram/sogp-broadcast.test.ts`
- Create: `app/api/telegram/sogp/webhook/route.ts`
- Create: `app/admin/_actions/sogp-telegram-actions.ts`
- Modify: `.env.example`
- Modify: `components/sogp/sogp-dashboard.tsx`

- [ ] **Step 1: Test deep-link tokens and webhook parsing**

```ts
test("creates URL-safe one-use start token", () => {
  const result = createSogpTelegramLink({ enrollmentId: 42, botUsername: "PlerosSogpBot", secret: "test-secret" });
  expect(result.url).toMatch(/^https:\/\/t\.me\/PlerosSogpBot\?start=/);
  expect(result.startParameter.length).toBeLessThanOrEqual(64);
});

test("accepts only /start token updates", () => {
  expect(parseSogpTelegramStart(telegramUpdateFixture)).toEqual({ token: "abc", telegramUserId: "123", chatId: "123" });
});
```

- [ ] **Step 2: Implement webhook security**

Require `X-Telegram-Bot-Api-Secret-Token === TELEGRAM_SOGP_WEBHOOK_SECRET`. Reject wrong/missing value with 401. Hash start token in DB; never store raw token. One successful link clears hash.

- [ ] **Step 3: Link identity and reply**

On `/start <token>`: link Telegram IDs to enrolment, send dashboard URL and cohort discussion URL through `sendMessage`. Support `/dashboard` and `/help`. Ignore group voice/text content; Telegram remains system of record for launch community.

- [ ] **Step 4: Add channel broadcasts**

`sendSogpChannelMessage` reads `TELEGRAM_SOGP_CHANNEL_ID`, posts through Telegram `sendMessage`, escapes selected parse mode, rejects empty/overlong messages, and returns Telegram message ID. Support typed message kinds: `preparation`, `track_release`, `live_class`, `general`. Admin one-off send requires preview/confirm; scheduled sends originate from Task 15. Never include learner names, email, phone, progress, written responses, or Telegram IDs in channel messages.

- [ ] **Step 5: Add admin webhook setup action**

Admin action calls Telegram `setWebhook` with public HTTPS route and secret token. Token stays server-only.

- [ ] **Step 6: Add env contract**

```dotenv
TELEGRAM_SOGP_BOT_TOKEN=
TELEGRAM_SOGP_CHANNEL_ID=
TELEGRAM_SOGP_WEBHOOK_SECRET=
TELEGRAM_SOGP_LINK_SECRET=
NEXT_PUBLIC_SOGP_SUPPORT_URL=
```

- [ ] **Step 7: Verify**

Run: `npm test -- lib/telegram/sogp.test.ts lib/telegram/sogp-broadcast.test.ts`

Expected: PASS.

Use Telegram `getMe`, `getChat`, and `getChatAdministrators`; verify bot identity, channel identity, administrator status, and `can_post_messages`. Then use `getWebhookInfo`; verify HTTPS URL, no last error, and pending update count drains.

- [ ] **Step 8: Commit**

```bash
git add lib/telegram/sogp.ts lib/telegram/sogp.test.ts lib/telegram/sogp-broadcast.ts lib/telegram/sogp-broadcast.test.ts app/api/telegram/sogp app/admin/_actions/sogp-telegram-actions.ts .env.example components/sogp/sogp-dashboard.tsx
git commit -m "feat: connect SOGP enrolments to Telegram"
```

### Task 11: Add live classes and YouTube recordings

**Files:**
- Create: `lib/db/queries/sogp-live-classes.ts`
- Create: `app/api/sogp/live-classes/route.ts`
- Create: `components/sogp/sogp-live-class-card.tsx`
- Create: `components/sogp/sogp-live-class-list.tsx`
- Create: `lib/sogp/live-class-status.ts`
- Create: `lib/sogp/live-class-status.test.ts`
- Create: `app/admin/_actions/sogp-live-class-actions.ts`

- [ ] **Step 1: Test class states**

```ts
test.each([
  ["2026-09-12T08:00:00Z", "upcoming"],
  ["2026-09-12T10:30:00Z", "live"],
  ["2026-09-12T13:00:00Z", "ended"],
] as const)("derives %s as %s", (now, expected) => {
  expect(deriveLiveClassState({ now: new Date(now), startsAt: new Date("2026-09-12T10:00:00Z"), endsAt: new Date("2026-09-12T12:00:00Z"), recordingUrl: null })).toBe(expected);
});
```

- [ ] **Step 2: Implement read model**

Dashboard shows next class. Live state exposes YouTube link. Completed state exposes recording when present. Cancelled class never shows join CTA.

- [ ] **Step 3: Add attendance action**

Admin marks attendance in bulk. Learners cannot self-mark live-class attendance.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- lib/sogp/live-class-status.test.ts`

Expected: PASS.

```bash
git add lib/db/queries/sogp-live-classes.ts app/api/sogp/live-classes components/sogp/sogp-live-class-card.tsx components/sogp/sogp-live-class-list.tsx lib/sogp/live-class-status.ts lib/sogp/live-class-status.test.ts app/admin/_actions/sogp-live-class-actions.ts
git commit -m "feat: add SOGP live classes"
```

### Task 12: Replace waitlist admin with SOGP operations center

**Files:**
- Create: `app/admin/(app)/(admin-only)/sogp/page.tsx`
- Delete: `app/admin/(app)/(admin-only)/school-of-purpose/page.tsx`
- Create: `components/ppc/admin-sogp-page.tsx`
- Create: `components/ppc/admin-sogp-tabs.tsx`
- Create: `components/ppc/admin-sogp-overview.tsx`
- Create: `components/ppc/admin-sogp-cohorts.tsx`
- Create: `components/ppc/admin-sogp-curriculum.tsx`
- Create: `components/ppc/admin-sogp-enrolments.tsx`
- Create: `components/ppc/admin-sogp-live-classes.tsx`
- Create: `components/ppc/admin-sogp-completion.tsx`
- Create: `components/ppc/admin-sogp-skeleton.tsx`
- Create: `components/ppc/admin-sogp-error-boundary.tsx`
- Modify: `app/admin/_actions/read-actions.ts`
- Create: `app/admin/_actions/sogp-actions.ts`
- Modify: `lib/admin-query.ts`
- Modify: `lib/ppc-shell.ts`
- Modify: `components/ppc/ppc-shell.tsx`
- Modify: `lib/ppc-shell.test.ts`
- Modify: `lib/admin-query-caching.test.ts`

- [ ] **Step 1: Update nav and query keys**

```ts
export const ADMIN_QUERY_KEYS = {
  // existing keys
  sogp: ["admin", "sogp"] as const,
};
```

Rename nav label from `School of Purpose` to `SOGP`; route `/sogp`. Delete old admin route and update all internal references/tests.

- [ ] **Step 2: Add Suspense page**

```tsx
export default function AdminSogpPage() {
  return (
    <AdminSogpErrorBoundary>
      <Suspense fallback={<AdminSogpSkeleton />}>
        <AdminSogpPageContent />
      </Suspense>
    </AdminSogpErrorBoundary>
  );
}
```

Content uses `useSuspenseQuery({ queryKey: ADMIN_QUERY_KEYS.sogp, queryFn: getAdminSogpData })`.

- [ ] **Step 3: Implement admin tabs**

- Overview: counts, cohort dates/state, content readiness, Telegram status.
- Cohorts: create/edit dates, state transitions, assessment policy, Telegram URLs.
- Curriculum: ordered day rows with select/up/down controls, readiness indicator, activation blocked unless valid.
- Enrolments: search/filter, status, Telegram link, carryover, CSV export.
- Live classes: CRUD YouTube live/recording links, bulk attendance.
- Completion: eligibility filters, issue/revoke certificate, grant reward.

Mutations use TanStack mutation and invalidate `ADMIN_QUERY_KEYS.sogp`. Use optimistic local updates where safe.

- [ ] **Step 4: Add role checks**

All reads/actions call `requireAdmin()`. Instructors may view learner completion through existing student/review surfaces but cannot configure SOGP cohort policy.

- [ ] **Step 5: Verify**

Run: `npm test -- lib/ppc-shell.test.ts lib/admin-query-caching.test.ts`

Expected: PASS with `/sogp` nav and Suspense query assertions.

- [ ] **Step 6: Commit**

```bash
git add app/admin components/ppc/admin-sogp* lib/admin-query.ts lib/ppc-shell.ts lib/ppc-shell.test.ts lib/admin-query-caching.test.ts
git commit -m "feat: add SOGP admin operations center"
```

### Task 13: Fix written approval correctness before certification

**Files:**
- Modify: `lib/db/queries/submissions.ts`
- Modify: `lib/db/queries/graduations.ts`
- Create: `lib/submission-status.ts`
- Create: `lib/submission-status.test.ts`
- Modify: `app/ppc/_actions/submission-actions.ts`

- [ ] **Step 1: Write regression test**

```ts
test("only approved submissions satisfy written completion", () => {
  expect(isWrittenSubmissionApproved("draft")).toBe(false);
  expect(isWrittenSubmissionApproved("submitted")).toBe(false);
  expect(isWrittenSubmissionApproved("needs_revision")).toBe(false);
  expect(isWrittenSubmissionApproved("approved")).toBe(true);
});
```

- [ ] **Step 2: Remove premature approval**

Implement `isWrittenSubmissionApproved`. Delete `studentProgress.writtenApproved = true` update from `submitForReview`. Only `approveSubmission` sets true. `requestRevision` must set `writtenApproved = false`. Query readiness uses helper instead of trusting stale progress alone.

- [ ] **Step 3: Verify**

Run: `npm test -- lib/submission-status.test.ts lib/sogp/assessment.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/db/queries/submissions.ts lib/db/queries/graduations.ts lib/submission-status.ts lib/submission-status.test.ts app/ppc/_actions/submission-actions.ts
git commit -m "fix: require review before written approval"
```

### Task 14: Add SOGP completion, certificate, and rewards

**Files:**
- Create: `lib/db/queries/sogp-completion.ts`
- Create: `app/admin/_actions/sogp-completion-actions.ts`
- Create: `app/api/sogp/certificate/[verificationCode]/route.ts`
- Create: `app/(site)/dashboard/sogp/certificate/page.tsx`
- Create: `components/sogp/sogp-completion-page.tsx`
- Create: `lib/certificate/sogp-generate.tsx`
- Create: `lib/certificate/sogp-generate.test.ts`
- Create: `lib/sogp/rewards.ts`
- Create: `lib/sogp/rewards.test.ts`

- [ ] **Step 1: Test readiness read model**

Read model combines:

- Completed SOGP cohort tracks from shared lesson progress.
- Prayer attendance during cohort date range.
- Live-class attendance.
- Cohort policy.
- Existing certificate and reward grants.

Test eligible and ineligible learners; test zero-division and carryover.

- [ ] **Step 2: Issue certificate idempotently**

Admin action recalculates eligibility inside transaction, refuses ineligible learner, inserts one certificate per enrollment, sets enrollment `completed`, and sends email. Override requires explicit reason stored in reward/certificate audit metadata; never accept client-computed eligibility.

Certificate download route requires authenticated user whose enrolment owns verification code. Public verification page is outside September scope.

- [ ] **Step 3: Generate branded PDF**

Certificate text:

```tsx
<Text>School of God's Purpose</Text>
<Text>Certificate of Completion</Text>
<Text>{studentName}</Text>
<Text>Completed the four-week SOGP curriculum</Text>
<Text>Verification: {verificationCode}</Text>
```

Use Pleros name, brand colors, issue date, cohort, and verification code. Do not label it PPC certificate.

- [ ] **Step 4: Add rewards v1**

Typed reward keys:

```ts
export const SOGP_REWARDS = {
  completion_certificate: "Digital SOGP certificate",
  purpose_library: "Purpose learning library",
  community_alumni: "SOGP alumni community access",
} as const;
```

Admin grants rewards; learner sees granted rewards only. No physical fulfilment workflow in v1.

- [ ] **Step 5: Verify**

Run: `npm test -- lib/certificate/sogp-generate.test.ts lib/sogp/rewards.test.ts lib/sogp/assessment.test.ts`

Expected: PASS.

Render sample PDF and inspect visually before handoff.

- [ ] **Step 6: Commit**

```bash
git add lib/db/queries/sogp-completion.ts app/admin/_actions/sogp-completion-actions.ts app/api/sogp/certificate 'app/(site)/dashboard/sogp/certificate' components/sogp/sogp-completion-page.tsx lib/certificate/sogp-generate.tsx lib/certificate/sogp-generate.test.ts lib/sogp/rewards.ts lib/sogp/rewards.test.ts
git commit -m "feat: add SOGP completion and certificates"
```

### Task 15: Add notifications and launch analytics

**Files:**
- Create: `lib/sogp/notifications.ts`
- Create: `lib/sogp/notifications.test.ts`
- Modify: `lib/email/send.ts`
- Modify: `lib/push/send.ts`
- Create: `app/api/cron/sogp-reminders/route.ts`
- Modify: `vercel.json`
- Create: `components/sogp/sogp-analytics-events.tsx`
- Modify: `components/google-analytics.tsx`
- Modify: `components/meta-pixel.tsx`

- [ ] **Step 1: Define notification schedule**

- Enrolment confirmation immediately.
- Preparation reminder daily only when content exists.
- Track reminder at cohort-local 06:00.
- Daily live-class reminder when a class falls within the next 24 hours. One-hour automatic reminders require Vercel Pro or an external scheduler.
- Carryover notice after cohort end.
- Certificate email on issue.

Preparation, track-release, and live-class events also publish cohort-wide Telegram channel messages. Dedup event key prevents repeat broadcasts. Individual carryover/certificate messages stay private through email/push, never channel.

Deduplicate every send with stable event key; do not rely on cron execution uniqueness.

- [ ] **Step 2: Define funnel events**

```ts
export type SogpAnalyticsEvent =
  | "sogp_landing_view"
  | "sogp_enrolment_started"
  | "sogp_enrolment_completed"
  | "sogp_telegram_connected"
  | "sogp_track_started"
  | "sogp_track_completed"
  | "sogp_live_class_opened"
  | "sogp_certificate_issued";
```

Send no name, email, phone, Telegram ID, written response, or spiritual-response content to analytics.

- [ ] **Step 3: Verify**

Run: `npm test -- lib/sogp/notifications.test.ts`

Expected: PASS with timezone and dedup tests.

- [ ] **Step 4: Commit**

```bash
git add lib/sogp/notifications.ts lib/sogp/notifications.test.ts lib/email/send.ts lib/push/send.ts app/api/cron/sogp-reminders vercel.json components/sogp/sogp-analytics-events.tsx components/google-analytics.tsx components/meta-pixel.tsx
git commit -m "feat: add SOGP reminders and funnel analytics"
```

### Task 16: Full verification and launch runbook

**Files:**
- Create: `docs/sogp-launch-runbook.md`
- Create: `lib/sogp/launch-readiness.test.ts`
- Modify: `docs/ai_scratchpad.md`

- [ ] **Step 1: Add readiness checks**

Test/report must verify:

- One enrollment-open/preparing/active cohort.
- Exactly 20 ordered tracks.
- All tracks published and content-ready.
- Curriculum composition is exactly 5 Level 1 + 11 Level 2 + 4 Level 3 selections.
- Telegram channel, discussion, and bot username configured.
- Bot env and webhook configured.
- Four live-class rows exist or policy explicitly allows fewer.
- Certificate policy valid.
- Resend/push prerequisites reported.

- [ ] **Step 2: Run complete automated verification**

Run:

```bash
npm run lint
npm test
npm run build
git diff --check
```

Expected: all commands pass; build compiles all SOGP routes.

- [ ] **Step 3: Run browser journeys**

Desktop and mobile:

1. Cold visitor opens `/sogp`.
2. Visitor enrols and lands on `/dashboard/sogp`.
3. Preparing learner connects Telegram and sees preparation state.
4. Active learner opens released day; future day stays locked.
5. Learner completes audio/notes/quiz/response.
6. Admin reviews response and progress updates.
7. Admin schedules live class and records attendance.
8. Admin sees eligibility, issues certificate/reward.
9. Learner downloads certificate.
10. Existing `/ppc` learner journey still works.

Check console errors, keyboard navigation, focus order, 320px layout, tablet, desktop, reduced motion.

- [ ] **Step 4: Rehearse DB migration**

Use preview/staging database. Apply migration, seed cohort, verify row counts and constraints. Do not run production schema push until preview passes.

- [ ] **Step 5: Write launch runbook**

Include exact env keys, migration command, seed command, Telegram webhook setup, cohort activation, content readiness check, rollback steps, support owner, and analytics verification.

- [ ] **Step 6: Commit**

```bash
git add docs/sogp-launch-runbook.md lib/sogp/launch-readiness.test.ts docs/ai_scratchpad.md
git commit -m "docs: add SOGP launch runbook"
```

---

## Dependencies and sequencing

- Tasks 1-3 block all persisted SOGP work.
- Task 4 can run after Task 1 content contract; it does not need full dashboard.
- Task 5 blocks publicity conversion.
- Tasks 6-10 block cohort start.
- Task 12 admin must ship before accepting significant enrolment volume.
- Task 13 must ship before any completion calculation.
- Tasks 14-15 can finish during cohort month, before first learner becomes eligible.
- Task 16 blocks production launch.

## Explicit non-goals for September

- Native SOGP discussion forum.
- Platform-hosted voice-note uploads.
- Telegram Mini App.
- Payment/billing; SOGP is free.
- Multiple simultaneous SOGP programs.
- Physical reward fulfilment.
- Rebuilding PPC or migrating PPC URLs.
- New design tokens or new font families.

## Primary design evidence

- [edX course help](https://support.edx.org/hc/en-us/categories/115002269607-Courses) separates course content, discussions, and progress; progress exposes grade/pass state.
- [edX online learning guidance](https://proxy.edx.org/resources/tips-for-successful-online-learning) supports distinct social groups alongside course platform.
- [Telegram bot features](https://core.telegram.org/bots/features) support deep-link account parameters, while [Bot API](https://core.telegram.org/bots/api) supports webhook secret verification and `sendMessage`.

Implementation must re-check official Telegram Bot API before webhook work and preserve current Pleros visual/token system.

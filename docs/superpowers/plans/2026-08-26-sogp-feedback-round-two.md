# SOGP Feedback Round Two Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the approved SOGP landing, enrolment, email, preparation-dashboard, and 24-track curriculum-capacity improvements while deferring only the five final Level 3 teaching selections.

**Architecture:** Keep `/sogp` as the public conversion funnel and `/dashboard/sogp` as the authenticated date-driven preparation/learning surface. Extend the existing Drizzle/Postgres SOGP model with structured enrolment fields, required/optional curriculum metadata, and cohort preparation tables; expose them through existing role-checked server actions and TanStack Query admin patterns.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript, Tailwind v4, Drizzle/Postgres, TanStack Query, Base UI, Vitest, `react-phone-number-input`/`libphonenumber-js`.

---

### Task 1: Landing-page conversion revision

**Files:**
- Modify: `lib/sogp/landing-content.ts`
- Modify: `components/sogp/sogp-landing-page.tsx`
- Create: `components/sogp/sogp-hero-phone.tsx`
- Modify: `lib/sogp/landing-copy-fidelity.test.ts`
- Modify: `lib/sogp/landing-page.test.ts`

- [ ] **Step 1: Write failing assertions** for the approved “What is SOGP?” copy, audience item 5, contextual CTA labels, CTA placement after outcomes, and phone visual.
- [ ] **Step 2: Run** `npm test -- lib/sogp/landing-copy-fidelity.test.ts lib/sogp/landing-page.test.ts` and confirm failures describe the missing copy/layout.
- [ ] **Step 3: Add `SogpHeroPhone`** as a responsive, decorative dashboard phone with Telegram and formation cards. Use existing public tokens; hide redundant internal text from assistive technology with `aria-hidden="true"` while the hero copy remains semantic.
- [ ] **Step 4: Replace the shared one-label CTA** with a component accepting a label and map labels by funnel position:

```tsx
<SectionCta label="Enrol to get started" />
<SectionCta label="Begin your enrolment" />
<SectionCta label="Start your journey" />
<SectionCta label="Enrol to start learning" />
<SectionCta label="Enrol for free" />
```

- [ ] **Step 5: Move the definition CTA** after the highlighted outcomes and apply the supplied copy with `answers to`, `well-structured`, `recognise`, and `fulfils` corrections.
- [ ] **Step 6: Run focused tests** and expect all landing tests to pass.
- [ ] **Step 7: Commit** with `git commit -m "feat: strengthen SOGP landing conversion"`.

### Task 2: Structured international enrolment domain

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `lib/sogp/enrollment.ts`
- Modify: `lib/sogp/enrollment.test.ts`
- Create: `lib/sogp/countries.ts`
- Create: `components/sogp/country-combobox.tsx`
- Modify: `components/sogp/sogp-enrollment-form.tsx`
- Modify: `components/sogp/sogp-enrollment-page.tsx`
- Modify: `app/(site)/sogp/enrol/page.tsx`

- [ ] **Step 1: Install** the current compatible `react-phone-number-input` package with npm; use its `libphonenumber-js` dependency for E.164 parsing.
- [ ] **Step 2: Write failing enrolment tests** for required `firstName`, `lastName`, `countryCode`, `country`, and `region`, plus E.164 phone normalisation.
- [ ] **Step 3: Change the input contract** to:

```ts
type SogpEnrollmentValues = {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  countryCode: string;
  country: string;
  region: string;
  reason: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
};
```

- [ ] **Step 4: Implement `normalizeSogpEnrollment`** so `name` is `${firstName} ${lastName}` and `phone` is E.164; return field-level errors for each required field and invalid phone.
- [ ] **Step 5: Build country data** from ISO codes and English labels, sorted by label, with Nigeria (`NG`) fallback.
- [ ] **Step 6: Read `x-vercel-ip-country`** in the server page using `await headers()`, validate it against supported ISO codes, and pass it as `defaultCountryCode`.
- [ ] **Step 7: Replace the form fields** with required first/last name, `Phone number`, approved WhatsApp helper, searchable country, required region, and approved privacy assurance.
- [ ] **Step 8: Run** `npm test -- lib/sogp/enrollment.test.ts` and expect pass.
- [ ] **Step 9: Commit** with `git commit -m "feat: structure SOGP enrolment details"`.

### Task 3: Persist structured enrolment and SOGP extensions

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `drizzle/0011_sogp_feedback_round_two.sql`
- Modify: `drizzle/meta/_journal.json`
- Create: `drizzle/meta/0011_snapshot.json`
- Modify: `lib/sogp/schema-contract.test.ts`
- Modify: `lib/sogp/types.ts`
- Modify: `lib/db/queries/sogp.ts`
- Modify: `app/api/sogp/enrol/route.ts`
- Modify: `app/admin/_actions/read-actions.ts`
- Modify: `components/ppc/admin-sogp-page.tsx`

- [ ] **Step 1: Write failing schema-contract tests** for structured enrolment fields, curriculum metadata, and preparation tables.
- [ ] **Step 2: Extend `sogp_enrollments`** with `firstName`, `lastName`, `countryCode`, and `region`; retain `name` and `country` compatibility columns.
- [ ] **Step 3: Extend cohort tracks** with `curriculumLevel`, `curriculumOrder`, `isRequired`, and nullable `liveSessionNumber`; make `dayNumber` nullable for optional tracks and add a cohort/order unique index.
- [ ] **Step 4: Add preparation tables** with this shape:

```ts
sogpPreparationDays: { cohortId, publishDate, countdownLabel, introduction, status, createdAt, updatedAt }
sogpPreparationResources: { preparationDayId, type, title, description, url, sortOrder, createdAt, updatedAt }
```

- [ ] **Step 5: Generate the Drizzle migration**, then add a best-effort backfill that splits existing `name`, sets `country_code` to `NG` only for existing Nigeria rows, and uses the existing country text as the temporary region fallback where no region exists.
- [ ] **Step 6: Update enrolment writes and reads** to persist structured fields and return region to admin and learner payloads.
- [ ] **Step 7: Update `/admin/sogp` enrolment columns** to show first/last name, E.164 phone, country, and region.
- [ ] **Step 8: Run schema and enrolment tests**, then run `npm run build`.
- [ ] **Step 9: Commit** with `git commit -m "feat: extend SOGP enrolment and curriculum schema"`.

### Task 4: Telegram-first enrolment email

**Files:**
- Modify: `lib/email/templates.ts`
- Modify: `lib/email/send.ts`
- Modify: `lib/email/sogp-enrollment.test.ts`
- Modify: `app/api/sogp/enrol/route.ts`

- [ ] **Step 1: Write a failing email test** asserting the urgent subject/copy, primary Telegram CTA, and absence of the dashboard URL/button.
- [ ] **Step 2: Change the subject** to `Your SOGP enrolment is confirmed — join Telegram now`.
- [ ] **Step 3: Render only the Telegram CTA** and state that information, gifts, reminders, updates, and the dashboard link are supplied through the Telegram channel.
- [ ] **Step 4: Remove `dashboardUrl`** from the email template and sender contract while leaving the successful browser redirect to Telegram unchanged.
- [ ] **Step 5: Run** `npm test -- lib/email/sogp-enrollment.test.ts` and expect pass.
- [ ] **Step 6: Commit** with `git commit -m "feat: prioritise Telegram in SOGP email"`.

### Task 5: Preparation visibility and queries

**Files:**
- Create: `lib/sogp/preparation.ts`
- Create: `lib/sogp/preparation.test.ts`
- Modify: `lib/sogp/types.ts`
- Modify: `lib/db/queries/sogp.ts`
- Modify: `app/admin/_actions/read-actions.ts`

- [ ] **Step 1: Write failing pure tests** using fixed Lagos dates for today, previous, future, draft, and no-today states.
- [ ] **Step 2: Implement `partitionSogpPreparationDays`** to return `{ today, previous }`, comparing `YYYY-MM-DD` Lagos keys and excluding draft/future rows.
- [ ] **Step 3: Add learner query joins** for preparation days/resources scoped to the enrolment cohort.
- [ ] **Step 4: Add admin read payloads** returning all preparation days and ordered resources for the selected/current cohort.
- [ ] **Step 5: Run** `npm test -- lib/sogp/preparation.test.ts` and expect pass.
- [ ] **Step 6: Commit** with `git commit -m "feat: query SOGP preparation schedule"`.

### Task 6: Admin preparation management

**Files:**
- Modify: `app/admin/_actions/sogp-actions.ts`
- Create: `components/ppc/admin-sogp-preparation.tsx`
- Modify: `components/ppc/admin-sogp-page.tsx`
- Modify: `lib/ppc-staff-workflows.test.ts`

- [ ] **Step 1: Write failing workflow assertions** for admin-only create, update, publish/unpublish, and delete actions.
- [ ] **Step 2: Add role-checked actions** validating cohort ID, ISO publish date, non-empty introduction, allowed resource types, HTTPS/internal URLs, and stable resource ordering.
- [ ] **Step 3: Add a `Preparation` tab** under `/admin/sogp` with day editor, ordered resource rows, draft/published badge, and explicit publish/unpublish/delete controls.
- [ ] **Step 4: Invalidate `ADMIN_QUERY_KEYS.sogp`** after every mutation; do not use `router.refresh()`.
- [ ] **Step 5: Run focused staff workflow tests** and expect pass.
- [ ] **Step 6: Commit** with `git commit -m "feat: manage SOGP preparation content"`.

### Task 7: Learner preparation dashboard

**Files:**
- Modify: `components/sogp/sogp-dashboard.tsx`
- Modify: `lib/sogp/preparation-content.test.ts`
- Modify: `lib/sogp/formation-dashboard.test.ts`

- [ ] **Step 1: Write failing dashboard assertions** for today-first content, previous-day archive, hidden future entries, and pending state.
- [ ] **Step 2: Replace static preparation cards** with the cohort preparation payload.
- [ ] **Step 3: Render the countdown headline**, today’s introduction and typed resource links, then a compact descending archive of prior days.
- [ ] **Step 4: Render the pending state** only when today is absent; keep the archive visible.
- [ ] **Step 5: Run focused dashboard tests** and expect pass.
- [ ] **Step 6: Commit** with `git commit -m "feat: show daily SOGP preparation"`.

### Task 8: Required and optional curriculum capacity

**Files:**
- Modify: `lib/sogp/first-cohort.ts`
- Modify: `lib/sogp/first-cohort.test.ts`
- Modify: `lib/sogp/assessment.ts`
- Modify: `lib/sogp/assessment.test.ts`
- Modify: `app/admin/_actions/sogp-actions.ts`
- Modify: `app/admin/_actions/read-actions.ts`
- Modify: `components/ppc/admin-sogp-page.tsx`
- Modify: `components/sogp/sogp-dashboard.tsx`

- [ ] **Step 1: Write failing tests** for 20 required selections, zero-to-four optional selections, independent SOGP curriculum levels, and certificate percentages excluding optional tracks.
- [ ] **Step 2: Change the selection builder** to accept fixed Level 1/2 placements plus `requiredPracticalLessonNumbers` and `optionalPracticalLessonNumbers`, rejecting counts other than four required or more than four optional.
- [ ] **Step 3: Persist required/optional metadata** and release optional tracks for their associated Saturday session.
- [ ] **Step 4: Update activation/readiness UI** to report `requiredReady / 20` and `optionalSelected / 4`; only required readiness blocks activation.
- [ ] **Step 5: Update learner progress and eligibility** to use required tracks for certificate completion and show optional listening separately.
- [ ] **Step 6: Run first-cohort and assessment tests**, then all SOGP tests.
- [ ] **Step 7: Commit** with `git commit -m "feat: support optional SOGP practical tracks"`.

### Task 9: Final current-scope verification and Level 3 gate

**Files:**
- Modify after selection: `lib/sogp/landing-content.ts`
- Modify after selection: cohort curriculum records through the existing configuration action/seed path

- [ ] **Step 1: Run** `npm run lint`, `npm test`, `npm run build`, and React diagnostics.
- [ ] **Step 2: Browser-verify** `/sogp` and `/sogp/enrol` at mobile/desktop widths, plus authenticated `/dashboard/sogp` and `/admin/sogp` when local session data permits.
- [ ] **Step 3: Verify** successful enrolment persists structured fields and redirects directly to Telegram.
- [ ] **Step 4: Ask the user** for one required and four optional Level 3 teaching selections from the available content-ready PPC Level 3 lessons.
- [ ] **Step 5: Apply the selected five titles/lesson IDs**, update the public curriculum list, rerun SOGP tests/build, commit, push, and confirm Vercel production deployment.

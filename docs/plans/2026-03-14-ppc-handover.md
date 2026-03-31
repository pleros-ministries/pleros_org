# PPC Platform Handover - 2026-03-14

Updated 2026-03-26 to match the current repo state.

## Product overview

**Pleros Perfecting Courses (PPC)** is a structured Christian learning management system at `ppc.pleros.org`. Students progress through 5 fixed levels of audio-first lessons. Each lesson requires 4 completion steps:

1. **Listen** to audio teaching
2. **Read** written notes
3. **Pass** a quiz (>=70% on MC questions; short text graded manually)
4. **Submit** a written response, reviewed and approved by staff

Students must complete all lessons in a level and receive staff graduation approval before unlocking the next level. See `docs/plans/2026-03-12-ppc-platform-prd-v3.md` for the fuller product spec.

### Roles

| Role | Access | Default path |
|------|--------|--------------|
| **Student** | Own learning dashboard, lesson pages, quiz, written response, Q&A | `/ppc/student` |
| **Instructor** | Staff dashboard, student list, review queue, Q&A inbox, notifications | `/admin` |
| **Admin** | Everything instructor has plus platform controls and content CMS | `/admin` |

### Seeded PPC users

`lib/db/seed.ts` seeds PPC-domain user rows such as `admin@pleros.test`, `instructor@pleros.test`, `ada@pleros.test`, and `ben@pleros.test`, plus additional students.

Important: these are **seeded PPC data rows**, not demo-auth shortcuts. Better Auth credentials are not seeded by `lib/db/seed.ts`. To sign in, a matching Better Auth user must exist first.

---

## Historical note

The original 2026-03-14 handover was written before later auth hardening landed.

Current repo truth:
- Demo auth has been removed.
- PPC now uses Better Auth only.
- `/ppc` is the student entrypoint and `/admin` is the staff entrypoint.
- Role assignment is derived from env-list email mapping.
- Action-level role guards and session-derived actor ownership are implemented across the main PPC mutation flows.

This matches the later agent conversation more closely than the original handover did.

---

## Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router, RSC, Turbopack) | 16.1.6 |
| Language | TypeScript | 5.x |
| React | React + React DOM | 19.2.3 |
| Styling | Tailwind CSS v4, PostCSS | 4.x |
| UI | shadcn/ui, Base UI, Lucide React, CVA, clsx, tailwind-merge | current repo |
| Database | Drizzle ORM -> Neon serverless Postgres | 0.45.x |
| Auth | Better Auth (email/password, Google OAuth, TOTP plugin present) | 1.5.4 |
| Email | Resend | 6.9.x |
| Push | web-push (VAPID) | 3.6.x |
| PDF | @react-pdf/renderer | 4.3.x |
| File upload | UploadThing | 7.7.x |
| Testing | Vitest | 4.x |
| Lint | ESLint 9 + eslint-config-next | 9.x |

---

## Branch and repo state

- **Branch**: `main`
- **Lockfile**: `package-lock.json` is canonical; do not recreate `pnpm-lock.yaml`
- **Build**: `npm run build` passes; current build output shows 44 app routes, including `/admin/*`, `/ppc/*`, and `/style-demo`
- **Lint**: `npm run lint` returns 0 errors and 11 warnings, mostly unused variables in PPC/API files
- **Tests**:
  - focused PPC suites are green
  - `npm test` currently has 36 files / 163 tests with 1 failing non-PPC public-site expectation in `lib/public-site-pages.test.ts`
- **Deploy**: Vercel at `https://pleros-org.vercel.app`

---

## Architecture

### Route protection chain

```text
app/ppc/(app)/(student)/layout.tsx
  -> getAppSession()
  -> redirect to /ppc if null
  -> canAccessArea(role, "student")
  -> blocks staff

app/admin/(app)/layout.tsx
  -> getAppSession()
  -> redirect to /admin if null
  -> blocks students
  -> wraps authenticated staff pages with PpcAppFrame

app/admin/(app)/(admin-only)/layout.tsx
  -> canAccessArea(role, "admin")
  -> blocks instructors with /admin/forbidden
```

Primary public auth entrypoints are:
- `/ppc` for students
- `/admin` for instructors/admins
- `/ppc/sign-up` for student account creation

Legacy PPC staff routes still exist under `app/ppc/(app)/(staff)`, but they now redirect into the `/admin/*` namespace.

### Auth model

PPC is now **Better Auth only**.

- Students enter through `/ppc`
- Staff enter through `/admin`
- New self-serve account creation happens through `/ppc/sign-up`
- Email/password is always enabled
- Google sign-in is available when Google env vars are configured
- `app/api/auth/[...all]/route.ts` is the live Better Auth handler

Runtime session resolution happens in `lib/app-session.ts`:

1. Read the Better Auth session from request headers
2. Resolve the runtime role from `PPC_ADMIN_EMAILS` and `PPC_INSTRUCTOR_EMAILS`
3. Ensure a matching PPC `users` row exists via `ensureAppUserRecord()`
4. Return `{ id, name, email, role }` to the app shell and layouts

Important nuance: the runtime role comes from env-list email mapping, not from the seeded role stored in the PPC `users` table.

### Auth UX model

- Student auth components live in `app/ppc/sign-in/sign-in-form.tsx` and `app/ppc/sign-up/sign-up-form.tsx`
- Staff auth UI lives in `components/ppc/staff-login-panel.tsx`
- Auth-entry helpers in `lib/auth-entry.ts` now normalize error copy, resolve post-auth redirects, and preview whether an email is configured for student or staff access
- If a staff-listed email is used in the student portal, the UI warns that the account will land in `/admin`
- If a non-staff email is used in the staff portal, the UI warns that the account will land in `/ppc`

### Authorization layers

PPC now enforces scoping in 3 places:

1. **Layout guards**
   - Staff-only and student-only route groups are blocked server-side
   - Admin-only routes are additionally fenced inside `(admin-only)`

2. **Role-filtered navigation**
   - `components/ppc/ppc-shell.tsx` only shows nav items the current role is allowed to see

3. **Server action role guards**
   - `lib/auth/require-role.ts` exposes `requireAuth()`, `requireStaff()`, `requireAdmin()`, and `requireStudent()`
   - PPC action files call these guards before mutating data

#### Ownership hardening status

The earlier "actions trust layout access only" gap is closed, and the most important ownership work has now landed:

- student-authenticated actions derive the acting user from session via `lib/auth/action-actor.ts`
- staff review and graduation actions derive reviewer identity from session
- Q&A thread reads/replies are fenced by `lib/auth/qa-access.ts`

This removes the prior high-priority trust gap around student self-service mutations.

### Sidebar navigation

`components/ppc/ppc-shell.tsx` filters nav items by role:

| Item | Path | Roles |
|------|------|-------|
| Dashboard | `/admin` | admin, instructor |
| Platform | `/admin/platform` | admin |
| Content | `/admin/content` | admin |
| Students | `/admin/students` | admin, instructor |
| Review Queue | `/admin/review` | admin, instructor |
| Q&A Inbox | `/admin/qa` | admin, instructor |
| Notifications | `/admin/notifications` | admin, instructor |
| My Learning | `/ppc/student` | student |

Sidebar collapse state is stored in localStorage under `ppc.sidebar.collapsed`. Mobile navigation uses the shared `Sheet` primitive.

Student navigation is now data-driven:
- the student sidebar includes level links beneath `My learning`
- locked levels stay visible with padlock styling
- current/completed/locked state is derived from live level and graduation data

### Student learning flow

```text
1. /ppc/student
   -> student dashboard with progress summary and continue CTA

2. /ppc/student/level/[levelId]
   -> level detail page with lesson timeline and completion state

3. /ppc/student/level/[levelId]/lesson/[lessonId]
   -> lesson detail page with audio, notes, LessonHubClient, and sidebar links

4. /ppc/student/level/[levelId]/lesson/[lessonId]/quiz
   -> QuizFlow submits answers through submitQuiz()

5. /ppc/student/level/[levelId]/lesson/[lessonId]/response
   -> WrittenResponseEditor autosaves and submits written work

6. /admin/review
   -> staff review queue with search, level filters, and inline approval / revision

7. Graduation
   -> markGraduation() checks readiness, records graduation, and sends email
```

### Staff flow

```text
1. /admin
   -> dashboard stats, quick actions, content watchlist, and platform snapshot

2. /admin/review
   -> review queue with inline approval / revision workflow, search, and level filters

3. /admin/qa
   -> Q&A inbox with thread list/detail pane, search, level filters, closed bucket, and reopen flow

4. /admin/students/[studentId]
   -> student detail, level tabs, submissions, Q&A, admin actions

5. /admin/content
   -> level/lesson authoring, managed audio upload, quiz authoring, publish gating, and lifecycle controls
```

---

## Directory structure

```text
app/
├── (site)/
│   ├── layout.tsx
│   ├── page.tsx                    # public website homepage
│   └── (shell)/style-demo/page.tsx # temporary site design reference
├── admin/
│   ├── page.tsx                    # staff entrypoint / login shell or dashboard
│   ├── forbidden/page.tsx
│   └── (app)/
│       ├── layout.tsx
│       ├── review/page.tsx
│       ├── qa/page.tsx
│       ├── notifications/page.tsx
│       ├── students/page.tsx
│       ├── students/[studentId]/page.tsx
│       └── (admin-only)/
│           ├── layout.tsx
│           ├── content/page.tsx
│           └── platform/page.tsx
├── api/
│   ├── auth/[...all]/route.ts      # Better Auth Next.js handler
│   ├── ppc/
│   │   ├── cron/inactivity-reminders/route.ts
│   │   ├── push/subscribe/route.ts
│   │   └── certificate/[levelId]/route.ts
│   └── uploadthing/route.ts
└── ppc/
    ├── page.tsx                    # student entrypoint / login shell
    ├── layout.tsx
    ├── sign-in/
    │   ├── page.tsx                # legacy direct sign-in page
    │   └── sign-in-form.tsx
    ├── sign-up/
    │   ├── page.tsx                # student account creation
    │   └── sign-up-form.tsx
    ├── forbidden/page.tsx
    ├── _actions/
    │   ├── auth-entry-actions.ts
    │   ├── content-actions.ts
    │   ├── graduation-actions.ts
    │   ├── lesson-actions.ts
    │   ├── qa-actions.ts
    │   ├── quiz-actions.ts
    │   ├── student-actions.ts
    │   └── submission-actions.ts
    └── (app)/
        ├── (staff)/                # legacy redirects into /admin/*
        └── (student)/
            ├── layout.tsx
            └── student/
                ├── page.tsx
                └── level/[levelId]/
                    ├── page.tsx
                    └── lesson/[lessonId]/
                        ├── page.tsx
                        ├── quiz/page.tsx
                        ├── response/page.tsx
                        └── qa/page.tsx

lib/
├── app-access.ts
├── app-role.ts
├── app-session.ts
├── auth-entry.ts
├── auth/
│   ├── action-actor.ts
│   ├── auth-client.ts
│   ├── better-auth.ts
│   ├── qa-access.ts
│   └── require-role.ts
├── db/
│   ├── auth-schema.ts
│   ├── index.ts
│   ├── schema.ts
│   ├── seed.ts
│   └── queries/
├── email/
├── push/
├── certificate/
├── upload/
├── ppc-access.ts
├── ppc-navigation.ts
├── ppc-routing.ts
├── ppc-staff-workflows.ts
├── ppc-shell-state.ts
└── utils.ts
```

---

## Database schema

PPC currently uses 12 core domain tables:

| Table | Purpose |
|-------|---------|
| `users` | PPC user profile and role metadata |
| `levels` | Course levels |
| `lessons` | Lessons within a level |
| `quiz_questions` | Quiz questions per lesson |
| `student_progress` | Completion state per user and lesson |
| `quiz_attempts` | Saved quiz attempts and scores |
| `written_submissions` | Written response drafts and review outcomes |
| `level_graduations` | Graduation records per level |
| `qa_threads` | Q&A thread headers |
| `qa_messages` | Q&A thread messages |
| `reviewer_assignments` | Instructor-to-level assignment mapping |
| `push_subscriptions` | Web push endpoints |

Better Auth uses separate auth tables through `lib/db/auth-schema.ts`.

### Current authoring state

The admin CMS at `/admin/content` is significantly more capable than the original handover described.

Implemented now:
- level editing for title, description, and sort order
- level creation plus guarded deletion for empty levels
- lesson creation and lesson-number renumbering inside a level
- managed lesson audio upload via UploadThing with stored metadata and cleanup
- quiz question CRUD plus question reordering
- hard publish gating enforced in both UI and server actions
- lesson lifecycle controls including guarded delete flow for draft lessons

Still not implemented:
- moving lessons between levels
- archive-style lifecycle beyond hard delete / draft / published
- richer media library management beyond lesson audio

---

## Server actions

There are 8 PPC action modules under `app/ppc/_actions/`.

| File | Key actions | Guard |
|------|-------------|-------|
| `auth-entry-actions.ts` | `previewPortalAccess` | none; read-only helper for auth UX |
| `lesson-actions.ts` | `markAudioListened`, `markNotesRead` | `requireAuth()` |
| `quiz-actions.ts` | `submitQuiz` | `requireAuth()` |
| `submission-actions.ts` | `saveDraft`, `submitWrittenResponse`, `approveWrittenSubmission`, `requestSubmissionRevision` | `requireAuth()` / `requireStaff()` |
| `graduation-actions.ts` | `markGraduation`, `overrideGraduation` | `requireStaff()` |
| `qa-actions.ts` | `createQaThread`, `replyToThread`, `closeQaThread`, `reopenQaThread`, `fetchThreadMessages` | `requireAuth()` / `requireStaff()` |
| `content-actions.ts` | level CRUD-lite, lesson CRUD, publish/unpublish, quiz question CRUD/reorder | `requireAdmin()` |
| `student-actions.ts` | `overrideStudentLevel`, `resetStudentProgress`, `assignReviewer`, `removeReviewerAssignment`, `getReviewerAssignments` | `requireAdmin()` |

Most mutating actions now revalidate both `"/ppc"` and `"/admin"` at layout scope so student and staff surfaces stay in sync after changes.

---

## Environment variables

### Runtime required

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon pooled Postgres connection for app runtime |

### Strongly required for production auth

| Variable | Purpose |
|----------|---------|
| `BETTER_AUTH_SECRET` | Better Auth signing/encryption secret |
| `BETTER_AUTH_URL` | Canonical Better Auth base URL |

Note: `lib/auth/better-auth.ts` contains a fallback demo-style secret for local safety, but production should never rely on it.

### Operational or feature-specific

| Variable | Purpose | Notes |
|----------|---------|-------|
| `DATABASE_URL_UNPOOLED` | Direct DB connection for schema push and seed | Not required for app runtime |
| `PPC_ADMIN_EMAILS` | Comma-separated admin emails | Missing list means no admin role assignment |
| `PPC_INSTRUCTOR_EMAILS` | Comma-separated instructor emails | Missing list means users default to student |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Enables social provider when paired with secret |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Same |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | Shows Google button in UI | UI toggle only; should match actual provider config |
| `RESEND_API_KEY` | Email delivery | Emails silently no-op if missing |
| `EMAIL_FROM` | Sender address | Defaults in code |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push public key | Push disabled if missing |
| `VAPID_PRIVATE_KEY` | Web push private key | Same |
| `CRON_SECRET` | Bearer token for inactivity reminder endpoint | Endpoint is otherwise unprotected |
| `UPLOADTHING_TOKEN` | UploadThing API token | Uploads disabled if missing |
| `NEXT_PUBLIC_APP_URL` | Absolute URL for email links | Falls back to relative links where possible |

---

## Design system and UI guidance

### PPC visual language

PPC intentionally uses a compact operational UI, distinct from the marketing site shell:

- zinc grayscale and white surfaces
- dense spacing and small controls (`h-7`, `h-8`, `text-xs`, `text-[11px]`)
- `rounded-sm` cards, inputs, and buttons
- restrained icons and motion
- Inter in `app/ppc/layout.tsx`

Do **not** import the public site visual language into PPC unless the platform is being intentionally restyled. The current PPC style is closer to an admin/product console than a branded landing page.

Recent shell changes now in repo:
- desktop shell uses a more modern floating-rail pattern
- desktop collapse control lives inside the sidebar, not beside the page title
- sidebar footer carries account actions
- staff and student route context is shown in a lighter top bar
- student sidebar includes level links with locked/current/completed state

### Tailwind v4 gotcha

Custom CSS in `app/globals.css` should stay inside `@layer base` or `@layer components`; otherwise it can unexpectedly outrank Tailwind utilities under the CSS Layers model.

---

## Deployment and operations

### Vercel

- URL: `https://pleros-org.vercel.app`
- Package manager: npm
- Build command: `next build`
- `BETTER_AUTH_URL` should match the deployed canonical URL
- `trustedOrigins` in `lib/auth/better-auth.ts` includes `BETTER_AUTH_URL`, `https://ppc.pleros.org`, and `https://pleros-org.vercel.app`

### Database

```bash
# Push schema changes
DATABASE_URL_UNPOOLED=... npx drizzle-kit push --force

# Seed PPC domain data
DATABASE_URL_UNPOOLED=... npx tsx lib/db/seed.ts
```

Better Auth manages its own auth tables through the configured Drizzle adapter and auth schema.

---

## Current queue

### Strong next candidates

1. **Notifications v1**
   - make `/admin/notifications` a real settings/status surface
   - show actual push state, browser subscription state, and reminder policy clearly

2. **Student journey cleanup**
   - reduce duplication now that student levels live in the sidebar
   - tighten dashboard vs lesson-path responsibilities

3. **Admin dashboard depth**
   - surface stale content, publish blockers, review pressure, and Q&A pressure more directly

4. **Repo hygiene**
   - clear the remaining lint warnings
   - fix the current non-PPC failing public-site test

### Recently completed

- route split between `/ppc` and `/admin`
- shell/sidebar modernization
- ownership hardening for main student/staff mutations
- admin dashboard first pass
- CMS authoring expansion
- review queue and Q&A workflow polish
- auth UX polish for the split entry model

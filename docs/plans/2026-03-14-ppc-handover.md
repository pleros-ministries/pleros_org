# PPC Platform Handover - 2026-03-14

Updated 2026-03-16 to match the current repo state.

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
| **Instructor** | Dashboard, student list, review queue, Q&A inbox, notifications | `/ppc` |
| **Admin** | Everything instructor has plus admin controls and content CMS | `/ppc` |

### Seeded PPC users

`lib/db/seed.ts` seeds PPC-domain user rows such as `admin@pleros.test`, `instructor@pleros.test`, `ada@pleros.test`, and `ben@pleros.test`, plus additional students.

Important: these are **seeded PPC data rows**, not demo-auth shortcuts. Better Auth credentials are not seeded by `lib/db/seed.ts`. To sign in, a matching Better Auth user must exist first.

---

## Historical note

The original 2026-03-14 handover was written before later auth hardening landed.

Current repo truth:
- Demo auth has been removed.
- PPC now uses Better Auth only.
- Role assignment is derived from env-list email mapping.
- Action-level role guards are implemented across PPC server actions.

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
- **Build**: `npm run build` passes; current build output shows 25 app routes total, including `/style-demo`
- **Lint**: `npm run lint` returns 0 errors and 17 warnings, mostly unused variables in PPC/API files
- **Tests**: `npm test` passes with 7 files / 30 tests
- **Deploy**: Vercel at `https://pleros-org.vercel.app`

---

## Architecture

### Route protection chain

```text
app/ppc/layout.tsx
  -> Inter font + PPC metadata

app/ppc/(app)/layout.tsx
  -> getAppSession()
  -> redirect to /ppc/sign-in if null
  -> wraps authenticated pages with PpcShell

app/ppc/(app)/(staff)/layout.tsx
  -> canAccessArea(role, "staff")
  -> blocks students

app/ppc/(app)/(student)/layout.tsx
  -> canAccessArea(role, "student")
  -> blocks staff

app/ppc/(app)/(staff)/(admin-only)/layout.tsx
  -> canAccessArea(role, "admin")
  -> blocks instructors with /ppc/forbidden
```

Every page inside `app/ppc/(app)` is session-gated. Public PPC pages are `/ppc/sign-in`, `/ppc/sign-up`, and `/ppc/forbidden`.

### Auth model

PPC is now **Better Auth only**.

- Everyone signs in through `/ppc/sign-in`
- New accounts are created through `/ppc/sign-up`
- Email/password is always enabled
- Google sign-in is available when Google env vars are configured
- `app/api/auth/[...all]/route.ts` is the live Better Auth handler

Runtime session resolution happens in `lib/app-session.ts`:

1. Read the Better Auth session from request headers
2. Resolve the runtime role from `PPC_ADMIN_EMAILS` and `PPC_INSTRUCTOR_EMAILS`
3. Ensure a matching PPC `users` row exists via `ensurePpcUser()`
4. Return `{ id, name, email, role }` to the app shell and layouts

Important nuance: the runtime role comes from env-list email mapping, not from the seeded role stored in the PPC `users` table.

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

#### Current caveat

The earlier "no action guards" gap is closed, but there is still a narrower ownership caveat: several authenticated actions still accept caller-supplied `userId` or `authorId` parameters instead of deriving identity from session. That means caller role is checked, but resource ownership is not fully proven in every action yet. This is most relevant in student-authenticated actions such as lesson progress, quiz submission, and some Q&A or submission flows.

### Sidebar navigation

`components/ppc/ppc-shell.tsx` filters nav items by role:

| Item | Path | Roles |
|------|------|-------|
| Dashboard | `/` | admin, instructor |
| Admin | `/admin` | admin |
| Content | `/admin/content` | admin |
| Students | `/students` | admin, instructor |
| Review Queue | `/review` | admin, instructor |
| Q&A Inbox | `/qa` | admin, instructor |
| Notifications | `/notifications` | admin, instructor |
| My Learning | `/student` | student |

Sidebar collapse state is stored in localStorage under `ppc.sidebar.collapsed`. Mobile navigation uses the shared `Sheet` primitive.

### Student learning flow

```text
1. /ppc/student
   -> student dashboard with levels, graduations, progress, and continue CTA

2. /ppc/student/level/[levelId]
   -> level detail page with lesson timeline and completion state

3. /ppc/student/level/[levelId]/lesson/[lessonId]
   -> lesson detail page with audio, notes, LessonHubClient, and sidebar links

4. /ppc/student/level/[levelId]/lesson/[lessonId]/quiz
   -> QuizFlow submits answers through submitQuiz()

5. /ppc/student/level/[levelId]/lesson/[lessonId]/response
   -> WrittenResponseEditor autosaves and submits written work

6. /ppc/review
   -> staff review queue approves or requests revision

7. Graduation
   -> markGraduation() checks readiness, records graduation, and sends email
```

### Staff flow

```text
1. /ppc
   -> dashboard stats, review preview, and open Q&A

2. /ppc/review
   -> review queue with inline approval / revision workflow

3. /ppc/qa
   -> Q&A inbox with thread list and detail pane

4. /ppc/students/[studentId]
   -> student detail, level tabs, submissions, Q&A, admin actions

5. /ppc/admin/content
   -> lesson editor and quiz question CRUD
```

---

## Directory structure

```text
app/
├── (site)/
│   ├── layout.tsx
│   ├── page.tsx                    # redirects to /ppc/sign-in
│   └── (shell)/style-demo/page.tsx # temporary site design reference
├── api/
│   ├── auth/[...all]/route.ts      # Better Auth Next.js handler
│   ├── ppc/
│   │   ├── cron/inactivity-reminders/route.ts
│   │   ├── push/subscribe/route.ts
│   │   └── certificate/[levelId]/route.ts
│   └── uploadthing/route.ts
└── ppc/
    ├── layout.tsx
    ├── sign-in/
    │   ├── page.tsx                # Better Auth sign-in page
    │   └── sign-in-form.tsx        # email/password + optional Google
    ├── sign-up/
    │   ├── page.tsx                # account creation page
    │   └── sign-up-form.tsx
    ├── forbidden/page.tsx
    ├── _actions/
    │   ├── content-actions.ts
    │   ├── graduation-actions.ts
    │   ├── lesson-actions.ts
    │   ├── qa-actions.ts
    │   ├── quiz-actions.ts
    │   ├── student-actions.ts
    │   └── submission-actions.ts
    └── (app)/
        ├── layout.tsx
        ├── (staff)/
        │   ├── layout.tsx
        │   ├── page.tsx
        │   ├── students/page.tsx
        │   ├── students/[studentId]/page.tsx
        │   ├── review/page.tsx
        │   ├── qa/page.tsx
        │   ├── notifications/page.tsx
        │   └── (admin-only)/admin/
        │       ├── page.tsx
        │       └── content/page.tsx
        └── (student)/
            ├── layout.tsx
            └── student/
                ├── page.tsx
                └── level/[levelId]/lesson/[lessonId]/
                    ├── page.tsx
                    ├── quiz/page.tsx
                    ├── response/page.tsx
                    └── qa/page.tsx

lib/
├── app-access.ts
├── app-role.ts
├── app-session.ts
├── auth/
│   ├── auth-client.ts
│   ├── better-auth.ts
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

---

## Server actions

There are 7 PPC action modules under `app/ppc/_actions/`.

| File | Key actions | Guard |
|------|-------------|-------|
| `lesson-actions.ts` | `markAudioListened`, `markNotesRead` | `requireAuth()` |
| `quiz-actions.ts` | `submitQuiz` | `requireAuth()` |
| `submission-actions.ts` | `saveDraft`, `submitWrittenResponse`, `approveWrittenSubmission`, `requestSubmissionRevision` | `requireAuth()` / `requireStaff()` |
| `graduation-actions.ts` | `markGraduation`, `overrideGraduation` | `requireStaff()` |
| `qa-actions.ts` | `createQaThread`, `replyToThread`, `closeQaThread`, `fetchThreadMessages` | `requireAuth()` / `requireStaff()` |
| `content-actions.ts` | lesson CRUD, publish/unpublish, quiz question CRUD | `requireAdmin()` |
| `student-actions.ts` | `overrideStudentLevel`, `resetStudentProgress`, `assignReviewer`, `removeReviewerAssignment`, `getReviewerAssignments` | `requireAdmin()` |

All mutating actions revalidate `"/ppc"` at layout scope with `revalidatePath("/ppc", "layout")`.

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

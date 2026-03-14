# PPC Platform Handover — 2026-03-14

## Product overview

**Pleros Perfecting Courses (PPC)** is a structured Christian learning management system at `ppc.pleros.org`. Students progress through 5 fixed levels of audio-first lessons. Each lesson requires 4 completion steps:

1. **Listen** to audio teaching
2. **Read** written notes
3. **Pass** a quiz (≥70% on MC questions; short text graded manually)
4. **Submit** a written response, reviewed and approved by staff

Students must complete ALL lessons in a level and receive staff graduation approval before unlocking the next level. See `docs/plans/2026-03-12-ppc-platform-prd-v3.md` for the full PRD.

### Roles

| Role | Access | Default path |
|------|--------|-------------|
| **Student** | Own learning dashboard, lesson pages, quiz, written response, Q&A | `/ppc/student` |
| **Instructor** | Dashboard, student list, review queue, Q&A inbox, notifications | `/ppc` |
| **Admin** | Everything instructor has + admin controls, content CMS | `/ppc` |

### Seeded test accounts (demo auth mode)

| Label | Email | Role | Notes |
|-------|-------|------|-------|
| Admin | `admin@pleros.test` | admin | Full access |
| Instructor | `instructor@pleros.test` | instructor | Reviewer for L1+L2 |
| Ada | `ada@pleros.test` | student | Graduated L1, on L2 lesson 6 (5/11 complete) |
| Ben | `ben@pleros.test` | student | On L1 lesson 3 (2/5 complete) |

Plus 8 more students: chi, david, elena, fatima, george, hana, ivan, julia (all `@pleros.test`).

---

## Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router, RSC, Turbopack) | 16.1.6 |
| Language | TypeScript | 5.x |
| React | React + React DOM | 19.2.3 |
| Styling | Tailwind CSS v4, PostCSS | 4.x |
| UI | shadcn/ui, Lucide React, CVA, clsx, tailwind-merge | v4 |
| Database | Drizzle ORM → Neon serverless Postgres | 0.45.x |
| Auth | Better Auth (email/password, Google OAuth, TOTP 2FA) + demo auth | 1.5.4 |
| Email | Resend | 6.9.x |
| Push | web-push (VAPID) | 3.6.x |
| PDF | @react-pdf/renderer | 4.3.x |
| File upload | UploadThing | 7.7.x |
| Testing | Vitest | 4.x |
| Lint | ESLint 9 + eslint-config-next | 9.x |

---

## Branch & repo state

- **Branch**: `cursor/development-environment-setup-078a` (all work is here)
- **Base**: `main`
- **Lockfile**: `package-lock.json` only (npm). `pnpm-lock.yaml` was deleted — do NOT recreate.
- **Build**: `npm run build` passes — 24 routes
- **Lint**: `npm run lint` — 0 errors, ~17 warnings (unused vars)
- **Tests**: `npm test` — 7 files, 30/30 pass (pure logic, no DB needed)
- **Deploy**: Vercel at `https://pleros-org.vercel.app`

---

## Architecture

### Route protection (layout chain)

```
app/ppc/layout.tsx              → Inter font + PPC metadata
  app/ppc/(app)/layout.tsx      → getAppSession() → redirect to sign-in if null → PpcShell
    app/ppc/(app)/(staff)/layout.tsx    → canAccessArea(role, "staff") → redirect if student
    app/ppc/(app)/(student)/layout.tsx  → canAccessArea(role, "student") → redirect if staff
      app/ppc/(app)/(staff)/(admin-only)/layout.tsx → canAccessArea(role, "admin") → 403 if instructor
```

Every page inside `(app)` is session-gated. Public pages: `/ppc/sign-in`, `/ppc/sign-up`, `/ppc/forbidden`.

### Sidebar navigation (PpcShell)

The shell is a client component (`components/ppc/ppc-shell.tsx`). It filters nav items by role:

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

Sidebar collapses via localStorage (`ppc.sidebar.collapsed`). Mobile uses Sheet component.

### Dual auth system

Controlled by `DEMO_AUTH` env var:

**Demo mode** (default, `DEMO_AUTH` unset or `"true"`):
- Sign-in page shows 4 quick-login buttons + custom login form
- `POST /api/ppc/demo-auth/login` sets a base64url cookie with `{user: {name, email, role}}`
- `getAppSession()` decodes cookie → calls `resolveDbUserId(email)` to get PPC user ID
- No real passwords, no sessions table, no encryption

**Better Auth mode** (`DEMO_AUTH=false`):
- Sign-in page shows email/password form + optional Google OAuth button
- `POST /api/auth/sign-up/email` creates Better Auth user + auto-provisions PPC user
- `getAppSession()` calls Better Auth's `getSession()` → resolves PPC user ID
- `ensurePpcUser()` creates a row in the PPC `users` table on first login
- Role resolved from `PPC_ADMIN_EMAILS` / `PPC_INSTRUCTOR_EMAILS` env vars; defaults to student
- Better Auth creates its own tables (`user`, `session`, `account`, `verification`) automatically
- TOTP 2FA available via `authClient.twoFactor` (no UI built yet)

**Switching**: set `DEMO_AUTH=false` and ensure `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL` are set. The sign-in page auto-detects the mode.

### Student learning flow (code path)

```
1. Student visits /ppc/student
   → student/page.tsx loads levels, graduations, progress
   → Shows level rail (graduated/current/locked) + progress bar + "Continue learning" CTA

2. Clicks level card → /ppc/student/level/[levelId]
   → level/[levelId]/page.tsx loads level + lesson progress via getStudentLevelProgress()
   → Shows lesson timeline with CompletionSignals per lesson

3. Clicks lesson → /ppc/student/level/[levelId]/lesson/[lessonId]
   → lesson/[lessonId]/page.tsx loads lesson + progress via getLessonWithProgress()
   → Shows audio player, notes, LessonHubClient (mark listened/read toggles)
   → Sidebar cards link to quiz, response, Q&A sub-pages

4. Takes quiz → .../lesson/[lessonId]/quiz
   → quiz/page.tsx loads questions + best score
   → QuizFlow client component: stepped nav, MC + short text, submit → submitQuiz action
   → Auto-scores MC (≥70% = pass), updates studentProgress.quizPassed

5. Writes response → .../lesson/[lessonId]/response
   → response/page.tsx loads existing submission
   → WrittenResponseEditor: textarea, 2s debounce auto-save, submit for review
   → Status flow: draft → submitted → approved/needs_revision

6. Staff reviews → /ppc/review
   → ReviewQueueClient: expandable panels, approve/request-revision
   → approveWrittenSubmission() sets writtenApproved=true + sends email

7. All 4 signals complete for all lessons → readiness check passes
   → Staff clicks graduate → markGraduation() → levelGraduations row + email
```

### Staff review flow (code path)

```
1. Staff visits /ppc (dashboard)
   → getDashboardStats() returns activeStudents, avgProgress, pendingReviews, openQa
   → getReviewQueue() returns top 5 submissions
   → getAllThreads("open") returns open Q&A

2. Review queue → /ppc/review
   → ReviewQueueClient: tabs (All/Pending/Approved/Needs revision)
   → Expandable inline review panels with approve/revision note

3. Q&A inbox → /ppc/qa
   → QaInboxClient: split-pane (thread list + detail)
   → fetchThreadMessages() loads messages, replyToThread() sends reply

4. Student detail → /ppc/students/[studentId]
   → StudentDetailClient: L1-5 tabs, completion matrix, submissions, Q&A, admin actions

5. Content CMS → /ppc/admin/content
   → ContentCmsClient: level tabs, lesson editor, quiz question CRUD
```

---

## Directory structure

```
app/
├── (site)/
│   ├── layout.tsx               # Bare wrapper (no app shell)
│   └── page.tsx                 # Redirects to /ppc/sign-in
├── api/
│   ├── auth/[...all]/route.ts   # Better Auth catch-all (503 in demo mode)
│   ├── ppc/
│   │   ├── demo-auth/
│   │   │   ├── login/route.ts   # Demo login (sets cookie)
│   │   │   └── logout/route.ts  # Demo logout (clears cookie)
│   │   ├── cron/
│   │   │   └── inactivity-reminders/route.ts  # POST, cron-callable
│   │   ├── push/
│   │   │   └── subscribe/route.ts  # POST, registers push subscription
│   │   └── certificate/
│   │       └── [levelId]/route.ts  # GET, downloads graduation PDF
│   └── uploadthing/route.ts     # UploadThing file upload handler
└── ppc/
    ├── layout.tsx                # Inter font + PPC metadata
    ├── sign-in/
    │   ├── page.tsx              # Dual mode sign-in (demo + Better Auth)
    │   └── sign-in-form.tsx      # Client: email/password + Google OAuth
    ├── sign-up/
    │   ├── page.tsx              # Better Auth only (redirects in demo mode)
    │   └── sign-up-form.tsx      # Client: name/email/password
    ├── forbidden/page.tsx        # 403 page
    ├── _actions/                 # 7 server action modules (see table below)
    └── (app)/
        ├── layout.tsx            # Session gate + PpcShell wrapper
        ├── (staff)/
        │   ├── layout.tsx        # Staff role gate
        │   ├── page.tsx          # Dashboard (stats, review preview, Q&A preview)
        │   ├── students/
        │   │   ├── page.tsx      # Student list → StudentListClient
        │   │   └── [studentId]/page.tsx  # Student detail → StudentDetailClient
        │   ├── review/page.tsx   # Review queue → ReviewQueueClient
        │   ├── qa/page.tsx       # Q&A inbox → QaInboxClient
        │   ├── notifications/page.tsx  # Static notification settings
        │   └── (admin-only)/
        │       └── admin/
        │           ├── page.tsx          # Admin controls → AdminControlsClient
        │           └── content/page.tsx  # Content CMS → ContentCmsClient
        └── (student)/
            ├── layout.tsx        # Student role gate
            └── student/
                ├── page.tsx      # Student dashboard (level rail, progress, CTA)
                └── level/[levelId]/
                    ├── page.tsx  # Level detail (lesson timeline)
                    └── lesson/[lessonId]/
                        ├── page.tsx      # Lesson detail (audio, notes, sidebar)
                        ├── quiz/page.tsx     # Quiz → QuizFlow
                        ├── response/page.tsx # Written response → WrittenResponseEditor
                        └── qa/page.tsx       # Q&A threads → QaThreadList

lib/
├── auth/
│   ├── better-auth.ts     # Server: betterAuth() config with Drizzle adapter, Google OAuth, TOTP
│   └── auth-client.ts     # Client: createAuthClient() with twoFactorClient plugin
├── db/
│   ├── index.ts           # Neon HTTP connection → exports `db`
│   ├── schema.ts          # 12 tables (see schema section)
│   ├── seed.ts            # Seeds 12 users, 5 levels, 46 lessons, quizzes, progress, etc.
│   └── queries/
│       ├── students.ts    # getStudentList, getStudentById, getDashboardStats
│       ├── lessons.ts     # getLevels, getLessonsByLevel, getLessonWithProgress, CRUD
│       ├── quizzes.ts     # getQuizQuestions, submitQuizAttempt, CRUD
│       ├── submissions.ts # getSubmission, upsertDraft, approveSubmission, getReviewQueue
│       ├── graduations.ts # checkGraduationReadiness, graduateStudent
│       ├── qa.ts          # getAllThreads, getThreadMessages, createThread, addMessage
│       ├── content.ts     # getContentOverview, getLessonForEdit, publish/unpublish
│       └── dashboard.ts   # getDashboardStats (alternate, used by some staff pages)
├── email/
│   ├── resend.ts          # Resend client (graceful null when no API key)
│   ├── templates.ts       # 3 HTML templates: inactivity, submission reviewed, graduation
│   └── send.ts            # sendInactivityReminder, sendSubmissionReviewed, sendGraduationCongratulations
├── push/
│   ├── web-push.ts        # Server: VAPID config + sendPushNotification()
│   └── use-push.ts        # Client hook: usePushSubscription()
├── certificate/
│   └── generate.tsx       # @react-pdf/renderer: generateCertificatePdf()
├── upload/
│   └── uploadthing.ts     # UploadThing router (audioUploader, admin/instructor only)
├── app-session.ts         # getAppSession(): resolves demo or Better Auth session → PPC user ID
├── app-role.ts            # AppRole type, resolveRoleFromEmail()
├── app-access.ts          # canAccessArea(role, area), getRoleDefaultPath()
├── ppc-access.ts          # canAccessPpcPath(), toExternalPpcPath(), getLogicalPpcPath()
├── ppc-routing.ts         # isPpcHost(), getPpcRewritePath() (for ppc.pleros.org domain)
├── ppc-navigation.ts      # resolvePpcHref() (handles /ppc prefix)
├── ppc-shell-state.ts     # Sidebar collapsed state persistence
├── demo-auth-session.ts   # Demo auth cookie encode/decode
└── utils.ts               # cn() (clsx + tailwind-merge)

components/
├── ppc/
│   ├── ppc-shell.tsx              # Main layout shell (sidebar + topbar + mobile sheet)
│   ├── page-header.tsx            # Title + description + action slot
│   ├── stat-card.tsx              # Dashboard metric card
│   ├── progress-bar.tsx           # sm/md progress bars with ARIA
│   ├── level-badge.tsx            # L1-L5 badge (dark/light variant)
│   ├── status-badge.tsx           # Status pills (default/success/warning/danger)
│   ├── completion-signals.tsx     # 4 icons (audio/notes/quiz/written) with done/not-done states
│   ├── audio-player.tsx           # Client: native audio, custom controls, onListened at 90%
│   ├── quiz-question.tsx          # Client: MCQuestion + ShortTextQuestion
│   ├── rich-editor.tsx            # Client: textarea with character count
│   ├── thread-view.tsx            # Chat message list (student/staff tinting)
│   ├── breadcrumb.tsx             # ChevronRight nav breadcrumbs
│   ├── data-table.tsx             # Client: generic sortable table
│   ├── empty-state.tsx            # Centered icon + message + optional action
│   ├── lesson-hub-client.tsx      # Client: mark audio/notes toggle buttons
│   ├── quiz-flow.tsx              # Client: stepped quiz with nav pills, scoring, retry
│   ├── written-response-editor.tsx # Client: debounced auto-save, submit, revision feedback
│   ├── qa-thread-list.tsx         # Client: thread list, create, reply
│   ├── student-list-client.tsx    # Client: search, filter, DataTable
│   ├── student-detail-client.tsx  # Client: level tabs, completion matrix, admin actions
│   ├── review-queue-client.tsx    # Client: tabs, expandable review panels
│   ├── qa-inbox-client.tsx        # Client: split-pane thread viewer
│   ├── admin-controls-client.tsx  # Client: student overrides, reviewer assignments
│   └── content-cms-client.tsx     # Client: lesson editor, quiz question CRUD
└── ui/                            # 7 shadcn primitives
    ├── button.tsx
    ├── input.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── badge.tsx
    ├── sheet.tsx
    └── accordion.tsx

public/
└── sw.js                          # Push notification service worker
```

---

## Database schema (12 tables)

| Table | PK | Key columns | Indexes |
|-------|----|-------------|---------|
| `users` | text `id` | name, email (unique), role enum, startingLevel, location | email unique |
| `levels` | serial `id` | title, description, lessonCount, sortOrder | — |
| `lessons` | serial `id` | levelId FK, lessonNumber, title, audioUrl, notesContent, status enum | (levelId), (levelId+lessonNumber unique) |
| `quiz_questions` | serial `id` | lessonId FK (cascade), questionType enum, questionText, options jsonb, correctAnswer, sortOrder | (lessonId) |
| `student_progress` | serial `id` | userId FK (cascade), lessonId FK (cascade), audioListened, notesRead, quizPassed, highestQuizScore, writtenApproved, completedAt | (userId+lessonId unique), (userId) |
| `quiz_attempts` | serial `id` | userId FK, lessonId FK, answers jsonb, score, attemptNumber | (userId+lessonId) |
| `written_submissions` | serial `id` | userId FK, lessonId FK, content, status enum, reviewerNote, reviewedBy FK, submittedAt, reviewedAt | (userId+lessonId), (status) |
| `level_graduations` | serial `id` | userId FK (cascade), levelId FK, graduatedAt, graduatedBy FK, isOverride | (userId+levelId unique) |
| `qa_threads` | serial `id` | userId FK (cascade), lessonId FK (cascade), subject, status enum | (userId), (lessonId), (status) |
| `qa_messages` | serial `id` | threadId FK (cascade), authorId FK, authorRole enum, content | (threadId) |
| `reviewer_assignments` | serial `id` | userId FK (cascade), levelId FK | (userId+levelId unique) |
| `push_subscriptions` | serial `id` | userId FK (cascade), endpoint (unique), p256dh, auth | (userId), (endpoint unique) |

Enums: `user_role` (admin/instructor/student), `lesson_status` (draft/published), `question_type` (multiple_choice/short_text), `submission_status` (draft/submitted/approved/needs_revision), `qa_status` (open/answered/closed), `qa_author_role` (student/instructor/admin).

---

## Server actions (7 modules in `app/ppc/_actions/`)

| File | Actions | Side effects |
|------|---------|-------------|
| `lesson-actions.ts` | `markAudioListened(userId, lessonId)`, `markNotesRead(userId, lessonId)` | upsert studentProgress |
| `quiz-actions.ts` | `submitQuiz(userId, lessonId, answers)` → `{score, passed, attemptNumber}` | Creates quiz_attempt, updates studentProgress.quizPassed if ≥70% |
| `submission-actions.ts` | `saveDraft`, `submitWrittenResponse`, `approveWrittenSubmission`, `requestSubmissionRevision` | Updates submission status, sends review email |
| `graduation-actions.ts` | `markGraduation(userId, levelId, graduatedBy)`, `overrideGraduation(...)` | Creates level_graduation, sends congratulations email |
| `qa-actions.ts` | `createQaThread`, `replyToThread`, `closeQaThread`, `fetchThreadMessages` | Creates thread/message, updates thread status |
| `content-actions.ts` | Lesson CRUD, publish/unpublish, quiz question CRUD | Modifies lessons/quiz_questions |
| `student-actions.ts` | `overrideStudentLevel`, `resetStudentProgress`, `assignReviewer`, `removeReviewerAssignment` | Modifies graduations/progress/assignments |

All actions call `revalidatePath("/ppc", "layout")` after mutations.

---

## Environment variables

### Required (app won't start without these)

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | Neon pooled Postgres connection | `postgresql://...@...neon.tech/neondb?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | Neon direct connection (for drizzle-kit push + seed only) | `postgresql://...@...neon.tech/neondb?sslmode=require` |
| `BETTER_AUTH_SECRET` | Better Auth session encryption key | Any 32+ char random string |
| `BETTER_AUTH_URL` | Better Auth base URL (MUST match your deploy URL) | `https://pleros-org.vercel.app` |

### Optional (features degrade gracefully)

| Variable | Purpose | Default |
|----------|---------|---------|
| `DEMO_AUTH` | Set `false` for real auth; unset/`true` for demo | `true` (demo mode) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | — (Google auth disabled) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | — |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | Shows Google button on sign-in | — (hidden) |
| `RESEND_API_KEY` | Resend API key for emails | — (emails silently skip) |
| `EMAIL_FROM` | Email sender address | `PPC <noreply@pleros.org>` |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key for web push | — (push disabled) |
| `VAPID_PRIVATE_KEY` | VAPID private key | — |
| `CRON_SECRET` | Bearer token for cron endpoint | — (endpoint unprotected) |
| `UPLOADTHING_TOKEN` | UploadThing API token | — (uploads disabled) |
| `NEXT_PUBLIC_APP_URL` | Public URL for email links | — (links relative) |
| `PPC_ADMIN_EMAILS` | Comma-separated admin emails (Better Auth mode) | — |
| `PPC_INSTRUCTOR_EMAILS` | Comma-separated instructor emails | — |

---

## Design system

### Palette & density
- **Zinc grayscale** throughout PPC (not Pleros brand blue — that's the public site only)
- **Density**: h-7/h-8 buttons, text-xs/text-[11px] labels, py-2 cell padding (Vercel dashboard style)
- **Colors**: zinc-900 primary, emerald for success/approved, amber for pending, red for destructive
- **Sentence case** everywhere (no Title Case headings)

### Tailwind v4 critical gotcha
All custom CSS in `globals.css` MUST be inside `@layer base` or `@layer components`. Un-layered CSS has higher priority than Tailwind utilities in CSS Layers spec. This caused a black-on-black text bug where `body { color: var(--color-text) }` beat `text-white`. Fixed by wrapping in `@layer base { ... }`.

### Border radius
Reduced from stock Tailwind: cards use `rounded-sm`, buttons/inputs use `rounded-sm`, pills keep `rounded-full`.

### Fonts
- **PPC platform**: Inter (via `next/font/google` in `app/ppc/layout.tsx`)
- **Public site**: Suisse Int'l (via `next/font/local` in `app/layout.tsx`, files in `app/fonts/suisse-intl/`)

---

## Deployment

### Vercel
- URL: `https://pleros-org.vercel.app`
- Package manager: **npm** (not pnpm — lockfile was deleted)
- Build: `next build` (auto-detected)
- `BETTER_AUTH_URL` MUST be set to the Vercel URL on the Vercel dashboard
- `trustedOrigins` in `lib/auth/better-auth.ts` includes `BETTER_AUTH_URL` dynamically + hardcoded `pleros-org.vercel.app` and `ppc.pleros.org`

### Database migrations
```bash
# Push schema changes (creates/alters tables)
DATABASE_URL_UNPOOLED=... npx drizzle-kit push --force

# Seed demo data (idempotent, uses onConflictDoNothing)
DATABASE_URL_UNPOOLED=... npx tsx lib/db/seed.ts
```

Better Auth creates its own tables (`user`, `session`, `account`, `verification`) automatically on first request when `DEMO_AUTH=false`.

---

## What was built (chronological)

### Phase 1: Core platform
- Deleted 18 old codex placeholder files
- Created DB schema (12 tables), seed script (12 users, 5 levels, 46 lessons, 48 quiz questions, student progress, submissions, Q&A, reviewer assignments)
- Created 8 query modules in `lib/db/queries/`
- Updated `app-session.ts`: added `user.id`, `resolveDbUserId()`, `ensurePpcUser()`
- Created 7 server action modules
- Created 24 PPC components (13 shared + 4 student client + 6 staff client + shell)
- Created/rewrote 14 server pages (6 student + 8 staff)
- Homepage redirects to `/ppc/sign-in`

### Phase 2: Styling
- Fixed Tailwind v4 CSS layer specificity (`@layer base` / `@layer components`)
- Added `variant="light"` to LevelBadge for dark contexts
- Reduced border-radius across all PPC for crisper look
- Updated L1/L2 lesson titles to match Pleros curriculum

### Phase 3: Deferred features
1. **Better Auth**: Drizzle adapter, email/password sign-in/sign-up, Google OAuth ready, auto-provision PPC users on first login
2. **Email (Resend)**: 3 templates (inactivity reminder, submission reviewed, graduation congratulations), cron endpoint, wired into submission-actions and graduation-actions
3. **Web push**: Service worker, push subscription API, VAPID, `usePushSubscription` hook
4. **Certificate PDF**: @react-pdf/renderer, landscape A4 with Pleros branding, download API at `/api/ppc/certificate/[levelId]`
5. **Audio upload**: UploadThing router (admin/instructor, 64MB max), API at `/api/uploadthing`
6. **Admin 2FA**: Better Auth two-factor plugin (TOTP)

### Phase 4: Production fixes
- Added Vercel deploy URL to Better Auth `trustedOrigins` (fixed 403 on sign-up)
- Removed stale `pnpm-lock.yaml` (fixed deploy lockfile mismatch)

---

## E2E test results (2026-03-14)

Tested as Ada (student) — full flow:
- ✅ Sign-in with quick-login buttons
- ✅ Student dashboard: level rail (L1 graduated/green, L2 current/dark, L3-5 locked), progress 45%, "Continue learning — L2.6" CTA
- ✅ Level 2 detail: 11 lessons with correct titles, completion signals, progress bar 5/11
- ✅ Lesson detail: audio player, notes (markdown as plain text), sidebar cards (Quiz/Written/Q&A), "Mark audio listened" / "Mark notes read" toggles, prev/next navigation
- ✅ Quiz: 3 questions (2 MC + 1 short text), stepped nav pills, submit → "Quiz passed! Score: 100%"
- ✅ Written response: shows previously submitted content with "Submitted" badge
- ✅ Admin dashboard: 4 stat cards, review queue (5 items), open Q&A (3 threads)
- ✅ Breadcrumb navigation throughout

---

## What's left to do

### High priority (functional gaps)

1. **Quiz questions for levels 3-5**: Only L1-L2 have quiz data (3 questions per lesson). L3-L5 lessons have zero questions. The quiz page loads but shows nothing. Either seed questions or add a "No quiz for this lesson" empty state.

2. **Wire audio uploader into Content CMS**: `lib/upload/uploadthing.ts` backend is ready. `content-cms-client.tsx` needs an UploadThing `<UploadButton>` replacing the audio URL text input in the lesson edit panel.

3. **Certificate download button**: `GET /api/ppc/certificate/[levelId]` generates PDFs. Add a "Download certificate" link/button to `student/level/[levelId]/page.tsx` when `graduated === true`.

4. **Push notification opt-in UI**: `lib/push/use-push.ts` hook exists. `/ppc/notifications` page is static text. Add an "Enable push notifications" button using `usePushSubscription().subscribe()`.

5. **Markdown rendering for notes**: Lesson notes stored as markdown but rendered as plain text (markdown headers/bullets visible raw). Install `react-markdown` and render properly on lesson detail page.

### Medium priority (polish)

6. **Real lesson content**: All 46 lessons have identical placeholder notes. Replace when curriculum content is available.

7. **Level descriptions**: L2 says "Deepening understanding of scripture" but content is doctrinal summaries. L3-5 have generic descriptions. Update to match actual curriculum.

8. **Admin 2FA setup UI**: TOTP plugin is server-side only. Build a settings page for admins to enable/disable 2FA with QR code scanning via `authClient.twoFactor.enable()`.

9. **Push notification triggers**: Infrastructure done but no actions send push. Wire `sendPushNotification()` into submission review, graduation, and Q&A reply (mirror how email was wired).

10. **Inactivity cron scheduling**: `POST /api/ppc/cron/inactivity-reminders` exists. Set up Vercel Cron (add to `vercel.json`) to call it every 2 days with `CRON_SECRET` bearer token.

### Low priority (nice-to-have)

11. **Google OAuth**: Code is ready. User needs Google Cloud Console credentials + set 3 env vars.

12. **Email verification**: Better Auth supports it. Enable `emailAndPassword.requireEmailVerification` and wire verification email via Resend.

13. **Responsive testing**: Mobile-first Tailwind but untested on actual mobile viewports.

14. **Seed data cleanup**: Demo submissions/progress may confuse production. Add a `lib/db/clean.ts` script or admin action.

15. **`dashboard.ts` vs `students.ts` overlap**: `lib/db/queries/dashboard.ts` and `lib/db/queries/students.ts` both have `getDashboardStats()`. Deduplicate — pick one source of truth.

16. **Written response editing**: Once submitted, response is read-only. Consider allowing re-edit when status is `needs_revision` (the component supports it but the flow may need verification).

17. **Q&A thread page**: The Q&A sub-page on lessons works but thread loading/reply UX could be smoother (currently fetches messages on thread click).

---

## Key commands

```bash
npm install                        # Install deps
npm run dev                        # Dev server (Turbopack, port 3000)
npm run build                      # Production build (24 routes)
npm run lint                       # ESLint (0 errors expected)
npm test                           # Vitest (7 files, 30 tests, no DB needed)
npx drizzle-kit push --force       # Push schema to DB (needs DATABASE_URL_UNPOOLED)
npx tsx lib/db/seed.ts             # Seed DB (needs DATABASE_URL_UNPOOLED, idempotent)
npx drizzle-kit studio             # Drizzle Studio (DB browser)
```

---

## Critical gotchas for the next agent

1. **Tailwind v4 layers**: globals.css styles MUST be inside `@layer base` or `@layer components`. Un-layered CSS beats all Tailwind utilities. This WILL cause invisible-text bugs if violated.

2. **npm only**: `package-lock.json` is canonical. Do NOT create `pnpm-lock.yaml` or `yarn.lock`. Vercel deploy will break.

3. **Demo auth default**: Without `DEMO_AUTH=false`, Better Auth endpoints return 503. Sign-in page shows quick-login. This is intentional for development.

4. **`BETTER_AUTH_URL` must match deploy URL**: Mismatches cause 403 on auth endpoints. If deploying to a new URL, update both the env var AND `trustedOrigins` in `lib/auth/better-auth.ts`.

5. **`ensurePpcUser()`**: Better Auth has its OWN user table. PPC has a SEPARATE `users` table. `ensurePpcUser()` bridges them by auto-creating a PPC user on first Better Auth login. If you modify the users schema, check this function.

6. **`revalidatePath("/ppc", "layout")`**: Every server action calls this. Forgetting it means stale UI after mutations.

7. **Email/push are best-effort**: All external service calls wrapped in try/catch. Missing API keys = silent no-op. Check server logs if emails/push seem broken.

8. **Quiz scoring**: Only MC questions are auto-scored. Short text questions are recorded but NOT scored — they're for instructor manual review. The 70% pass threshold applies to MC questions only.

9. **Font files committed**: Suisse Int'l `.woff2` files are in `app/fonts/suisse-intl/`. They're ~240KB total. Don't delete them.

10. **The `(site)` route group**: Currently just redirects to `/ppc/sign-in`. The Pleros public marketing site is NOT active — the old homepage, style-demo, and layout components were deleted.

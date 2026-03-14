# PPC Platform Handover — 2026-03-14

## Product overview

**Pleros Perfecting Courses (PPC)** is a structured Christian learning management system at `ppc.pleros.org`. Students progress through 5 levels of audio-first lessons. Each lesson has: audio teaching, written notes, a quiz (MC + short text), and a written response reviewed by staff. Students must complete all components and receive reviewer approval before graduating to the next level.

Three roles: **Student**, **Instructor/Reviewer**, **Admin** — each with scoped access.

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.6 (App Router, RSC, Turbopack) |
| Language | TypeScript 5 |
| React | 19.2.3 |
| Styling | Tailwind CSS v4, PostCSS |
| UI | shadcn/ui v4, Lucide React, CVA, clsx, tailwind-merge |
| Database | Drizzle ORM → Neon serverless Postgres |
| Auth | Better Auth 1.5 (email/password, Google OAuth ready, TOTP 2FA) + demo auth fallback |
| Email | Resend |
| Push | web-push (VAPID) |
| PDF | @react-pdf/renderer |
| File upload | UploadThing |
| Testing | Vitest (7 files, 30 tests) |
| Lint | ESLint 9 + eslint-config-next |

---

## Branch & repo state

- **Branch**: `cursor/development-environment-setup-078a` (all work is here)
- **Base**: `main`
- **Lockfile**: `package-lock.json` only (npm). `pnpm-lock.yaml` was removed.
- **Build**: `npm run build` passes — 24 routes compile clean
- **Lint**: `npm run lint` — 0 errors, ~17 warnings (unused vars)
- **Tests**: `npm test` — 7 files, 30/30 pass (pure logic, no DB needed)

---

## Architecture overview

### Directory structure

```
app/
├── (site)/              # Public site (redirects to /ppc/sign-in)
├── api/
│   ├── auth/[...all]/   # Better Auth endpoints
│   ├── ppc/
│   │   ├── demo-auth/   # Demo login/logout
│   │   ├── cron/        # Inactivity reminder endpoint
│   │   ├── push/        # Push subscription
│   │   └── certificate/ # PDF certificate download
│   └── uploadthing/     # Audio file upload
└── ppc/
    ├── sign-in/          # Sign-in (dual mode: demo + Better Auth)
    ├── sign-up/          # Sign-up (Better Auth only)
    ├── forbidden/        # 403 page
    ├── _actions/         # 7 server action modules
    └── (app)/
        ├── (staff)/      # Staff pages (admin + instructor)
        │   ├── (admin-only)/  # Admin-gated pages
        │   ├── students/      # Student list + detail
        │   ├── review/        # Review queue
        │   ├── qa/            # Q&A inbox
        │   └── notifications/ # Notification settings
        └── (student)/    # Student pages
            └── student/
                └── level/[levelId]/
                    └── lesson/[lessonId]/
                        ├── quiz/
                        ├── response/
                        └── qa/

lib/
├── auth/                # Better Auth server + client
├── db/
│   ├── index.ts         # Neon connection
│   ├── schema.ts        # 12 tables (Drizzle)
│   ├── seed.ts          # Seed script
│   └── queries/         # 8 query modules
├── email/               # Resend client + templates + send functions
├── push/                # Web push server + client hook
├── certificate/         # PDF generator
├── upload/              # UploadThing router
├── app-session.ts       # Session resolution (demo + Better Auth)
├── app-role.ts          # Role types + resolution
├── app-access.ts        # Area access control
├── ppc-access.ts        # PPC path access control
├── ppc-routing.ts       # Host-based routing
├── ppc-navigation.ts    # Path resolution
├── ppc-shell-state.ts   # Sidebar state persistence
├── demo-auth-session.ts # Demo auth cookie encode/decode
└── utils.ts             # cn() helper

components/ppc/          # 24 PPC components (13 shared + 4 student client + 6 staff client + shell)
components/ui/           # 7 shadcn primitives (button, input, card, dialog, badge, sheet, accordion)
```

### Database schema (12 tables)

| Table | Purpose |
|-------|---------|
| `users` | PPC users (id, name, email, role, startingLevel, location) |
| `levels` | 5 course levels |
| `lessons` | Lessons per level (title, audioUrl, notesContent, status) |
| `quiz_questions` | MC + short text questions per lesson |
| `student_progress` | Per-lesson progress (audio, notes, quiz, written) |
| `quiz_attempts` | Quiz attempt history with scores |
| `written_submissions` | Written responses (draft/submitted/approved/needs_revision) |
| `level_graduations` | Graduation records per student per level |
| `qa_threads` | Student Q&A threads per lesson |
| `qa_messages` | Messages within Q&A threads |
| `reviewer_assignments` | Instructor → level review assignments |
| `push_subscriptions` | Web push subscription endpoints |

### Auth system

Two modes controlled by `DEMO_AUTH` env var:

- **Demo mode** (`DEMO_AUTH` unset or `true`): Base64url cookie with name/email/role. Quick-login buttons on sign-in page for 4 seeded accounts. No real authentication.
- **Better Auth mode** (`DEMO_AUTH=false`): Real email/password auth with Drizzle DB adapter. Google OAuth when `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` configured. TOTP 2FA available via Better Auth plugin.

Both modes resolve a PPC `users` table ID via `resolveDbUserId()`. Better Auth mode auto-provisions a PPC user row on first login via `ensurePpcUser()`.

### Server actions (7 modules)

| File | Actions |
|------|---------|
| `lesson-actions.ts` | markAudioListened, markNotesRead |
| `quiz-actions.ts` | submitQuiz (auto-scores MC, returns score/passed) |
| `submission-actions.ts` | saveDraft, submitWrittenResponse, approveWrittenSubmission, requestSubmissionRevision |
| `graduation-actions.ts` | markGraduation (checks readiness), overrideGraduation |
| `qa-actions.ts` | createQaThread, replyToThread, closeQaThread, fetchThreadMessages |
| `content-actions.ts` | createNewLesson, updateLessonContent, removeLessonAction, publish/unpublish, quiz question CRUD |
| `student-actions.ts` | overrideStudentLevel, resetStudentProgress, assignReviewer, removeReviewerAssignment |

All actions use `revalidatePath("/ppc", "layout")` after mutations. Submission review and graduation actions also send emails (best-effort).

---

## Environment variables

### Required

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon pooled Postgres connection |
| `DATABASE_URL_UNPOOLED` | Neon direct connection (migrations/seed) |
| `BETTER_AUTH_SECRET` | Better Auth session encryption key |
| `BETTER_AUTH_URL` | Better Auth base URL (e.g. your app origin) |

### Optional (features degrade gracefully without them)

| Variable | Purpose |
|----------|---------|
| `DEMO_AUTH` | Set to `false` to use Better Auth instead of demo auth |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | Set to `true` to show Google sign-in button |
| `RESEND_API_KEY` | Resend API key for email notifications |
| `EMAIL_FROM` | Sender address (defaults to `PPC <noreply@pleros.org>`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key for web push |
| `VAPID_PRIVATE_KEY` | VAPID private key for web push |
| `CRON_SECRET` | Bearer token for cron endpoint auth |
| `UPLOADTHING_TOKEN` | UploadThing API token for audio uploads |
| `NEXT_PUBLIC_APP_URL` | Public app URL for email links |

---

## What was done

### Core platform (commits 727dd75 → f82b1d5)
- Deleted 18 old codex placeholder files (demo data, homepage, style-demo)
- Created DB schema (12 tables), seed script (12 users, 5 levels, 46 lessons, 48 quiz questions, progress, submissions, Q&A, reviewer assignments)
- Created 8 query modules in `lib/db/queries/`
- Updated `app-session.ts` with `user.id` field and `resolveDbUserId()`
- Created 7 server action modules
- Created 10 client components (4 student + 6 staff)
- Created/rewrote 14 server pages (6 student + 8 staff)
- Updated homepage to redirect to `/ppc/sign-in`

### Styling fixes (commits 9f50d43, 47e0b6b)
- Fixed Tailwind v4 CSS layer specificity issue — wrapped globals.css base/component styles in `@layer base` and `@layer components` so Tailwind utilities (`text-white`, etc.) properly override inherited colors
- Added `variant="light"` to LevelBadge for dark card contexts
- Reduced border-radius across all PPC components for crisper look

### Deferred features (commits 2388d34 → f29e578)
1. **Better Auth**: Drizzle adapter, email/password sign-in, sign-up page, Google OAuth ready, auto-provision PPC users
2. **Email notifications**: Resend SDK, 3 templates (inactivity, submission review, graduation), cron endpoint, wired into actions
3. **Web push**: Service worker, push subscription API, VAPID, `usePushSubscription` hook
4. **Certificate PDF**: @react-pdf/renderer, landscape A4 certificate, download API route
5. **Audio upload**: UploadThing router (admin/instructor only, 64MB max), API route
6. **Admin 2FA**: Better Auth two-factor plugin (TOTP)

### Seed data
- Level 1: Gospel: The Word of Truth, God's Purpose: Why We Exist, The New Creation: Who You are in Christ, Faith Stand: How to Grow in Christ, Commitment: How to Fulfil Purpose
- Level 2: Introduction to Doctrinal Summaries, Bibliology, God and His Eternal Purpose, Biblical Origin and Ontology, Sin and its Implication, God's Wisdom Towards Redemption, Christology, Redemption, Church and its Mission, Eschatology, The New Creation
- Levels 3-5: 10 placeholder lessons each

---

## E2E test results (2026-03-14)

Tested as Ada (student) — full flow working:
- ✅ Sign-in with quick-login buttons
- ✅ Student dashboard: level cards, progress bar, continue learning CTA
- ✅ Level detail: lesson timeline with completion signals
- ✅ Lesson detail: audio player, notes, sidebar cards (quiz/response/Q&A)
- ✅ Quiz: 3 questions, answer + submit, score 100%, "Quiz passed!" display
- ✅ Written response: view submitted content, status badge
- ✅ Breadcrumb navigation, prev/next lesson links
- ✅ Admin dashboard: stat cards, review queue, Q&A threads

---

## What's left to do

### High priority

1. **Add quiz questions for levels 3-5** — currently only L1-L2 have 3 questions per lesson. L3-L5 lessons have no quiz data. Either seed them or make the quiz page gracefully handle zero questions.

2. **Wire audio uploader into Content CMS** — `lib/upload/uploadthing.ts` backend is ready. The `content-cms-client.tsx` needs an UploadThing file picker in the audio URL field of the lesson edit panel.

3. **Add certificate download button** — `GET /api/ppc/certificate/[levelId]` works. Need a "Download certificate" button on the student level page when `graduated === true`.

4. **Add push notification opt-in UI** — `lib/push/use-push.ts` hook is ready. The `/ppc/notifications` page is currently static. Wire in the `usePushSubscription` hook with an "Enable push notifications" button.

5. **Markdown rendering for notes** — lesson notes are stored as markdown but currently rendered as plain text. Add a markdown renderer (e.g. `react-markdown`) for the notes section on the lesson detail page.

### Medium priority

6. **Add real lesson content** — notes for all 46 lessons are placeholder text. Replace with actual course content when available.

7. **Level 2 description update** — currently says "Deepening understanding of scripture" but this is a Level 2 about doctrinal summaries. Update via DB or seed.

8. **Level titles** — consider updating Level 3-5 titles/descriptions to match the Pleros curriculum when available.

9. **Student "in progress" status on lesson 4** — Ada's seed data has lesson 4 (L2) with audioListened=true, notesRead=true but quiz/written=false. The lesson shows in the level timeline but the "In Progress" badge may need refinement to show what step the student is on.

10. **Admin 2FA setup UI** — Better Auth TOTP plugin is configured server-side but there's no UI for admins to scan QR codes and enable 2FA. Build a settings page with `authClient.twoFactor.enable()` and QR code display.

### Low priority

11. **Inactivity reminder cron scheduling** — the `POST /api/ppc/cron/inactivity-reminders` endpoint exists but needs a cron service (e.g. Vercel Cron, external scheduler) to call it every 2 days.

12. **Google OAuth completion** — code is ready. User needs to create Google Cloud OAuth credentials and set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`.

13. **Push notification triggers** — the subscription/display infrastructure is done but no server actions currently send push notifications. Wire `sendPushNotification()` into submission review, graduation, and Q&A reply actions (similar to how email was wired in).

14. **Email verification** — Better Auth supports email verification but it's not enforced. Consider enabling `emailAndPassword.requireEmailVerification` and wiring a verification email via Resend.

15. **Better Auth DB migration** — Better Auth creates its own tables (`user`, `session`, `account`, `verification`) automatically. On first run with `DEMO_AUTH=false`, these tables will be auto-created. Verify this works cleanly in production.

16. **Delete/archive old test submissions** — seed data includes old submissions that may confuse real users. Consider a cleanup script for production.

17. **Responsive testing** — all pages are mobile-first in Tailwind but haven't been tested on actual mobile viewports. The sidebar Sheet component handles mobile nav.

---

## Key commands

```bash
npm install          # Install deps
npm run dev          # Dev server (Turbopack, port 3000)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest (30 tests)
npx drizzle-kit push --force   # Push schema to DB (needs DATABASE_URL_UNPOOLED)
npx tsx lib/db/seed.ts         # Seed DB (needs DATABASE_URL_UNPOOLED)
```

---

## Gotchas for the next agent

- **Tailwind v4 layer specificity**: globals.css styles MUST be inside `@layer base` or `@layer components`. Un-layered CSS beats Tailwind utilities. This was the root cause of black-on-black text bugs.
- **npm not pnpm**: `package-lock.json` is canonical. `pnpm-lock.yaml` was removed.
- **Demo auth is default**: Without `DEMO_AUTH=false`, Better Auth endpoints return 503. The sign-in page shows quick-login buttons in demo mode.
- **`resolveDbUserId()`**: Maps email → PPC user ID. Better Auth mode auto-creates PPC user rows. Demo mode looks up by email.
- **`revalidatePath("/ppc", "layout")`**: All server actions call this after mutations. If you add new actions, include it.
- **Email/push are best-effort**: All sends are wrapped in try/catch. Missing API keys = silent skip.
- **Font files**: Suisse Int'l woff2 files are in `app/fonts/suisse-intl/`, committed to repo.
- **The `(site)` route group**: Homepage redirects to `/ppc/sign-in`. No public marketing site is active.

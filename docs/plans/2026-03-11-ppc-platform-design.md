# PPC Platform Design Blueprint

Date: 2026-03-11
Product: Perfecting Courses platform for Pleros
Domain: ppc.pleros.org

## 1) Product Scope (locked)

- Five fixed levels (Level 1 to Level 5), immutable.
- Each level is the course unit.
- Each level contains lessons.
- Lesson counts at launch:
  - Level 1: 5
  - Level 2: 11
  - Level 3: 30
  - Level 4: 60
  - Level 5: 300
- Lesson payload:
  - Audio-first media (external URL)
  - Teaching notes (Markdown)
  - Multiple quizzes
  - Multiple written-response prompts
- All lesson items are required for lesson completion.

## 2) Roles and Access Control

### Student
- Self-signup.
- Must verify email before starting Level 1.
- Default starts at Level 1.
- Can consume unlocked lessons.
- Can mark audio listened and notes read (trusted self-attestation).
- Can take quizzes with unlimited attempts.
- Can save written drafts, submit, edit, resubmit.
- Can use private Q&A with staff.
- Can view full personal activity timeline.
- Read-only access to graduated past levels.

### Instructor/Reviewer (merged role)
- Assigned by level only (can have multiple levels).
- Sees only students active in assigned levels.
- Can review/grade short-text quiz responses and written responses.
- Can answer private Q&A.
- Can mark level graduation.
- Can use manual graduation override (requires reason, audited).
- Can suspend/reactivate students in assigned levels.
- Cannot create/edit/publish course content.

### Admin
- Full system access.
- Creates/manages Instructor/Reviewer accounts.
- Can override student starting level.
- Can create/edit/publish level and lesson content.
- Can suspend/reactivate any student.
- Can reset student progress fully or to a chosen checkpoint.

## 3) Progression and Graduation Rules

### Level unlocking
- Strict level prerequisite: Level N+1 unlocks only after Level N graduation.

### Lesson order
- Level 1 and 2: strict sequential lesson order.
- Level 3 to 5: lessons open within level, but recommended order displayed.

### Lesson completion
A lesson is complete only if all required items are complete:
- audio marked listened,
- notes marked read,
- quizzes passed (>= 70%),
- written responses approved.

### Quiz policy
- Unlimited attempts.
- Highest score counts.
- Question types: multiple-choice and short-text.
- Short-text is manually graded.

### Revision policy
- "Needs Revision" does not block continuing lessons within the same level.
- Level graduation blocked until all required submissions in that level are approved.
- Admin/Instructor can still use manual graduation override.

### Override policy
- Manual graduation override requires mandatory reason.
- Every override writes immutable audit log entry (actor, timestamp, reason).

## 4) Content Authoring Workflow

- Admin-only content management in dashboard.
- Draft/Publish workflow per level/lesson/content block.
- Publishing replaces content for all students immediately (no version branching).
- Audio URLs are pasted from external host (likely UploadThing).
- No media binary upload in app at launch.

## 5) Notifications and Reminder Engine

### Channels at launch
- Email (Resend)
- Browser web push

### Reminder cadence
- First inactivity reminder at 2 days.
- Repeat every 2 days.
- Continue until student resumes activity.

### Immediate event notifications
- Submission received
- Needs revision
- Approved
- Q&A reply
- Graduation marked
- Certificate sent

No digest mode at launch.

## 6) Certificates

- Certificate generated and emailed automatically when staff marks graduation.
- Types:
  - per-level certificate,
  - final completion certificate.
- Delivery format: PDF via email.
- No public verification page at launch.

## 7) Admin Dashboard Information Architecture

### Primary navigation
- Overview
- Students
- Review Queue
- Q&A Inbox
- Levels & Lessons (content)
- Notifications
- Certificates
- Settings
- Audit Log

### Students table (default columns)
- Name
- Email
- Level
- Progress %
- Current lesson
- Last activity
- Q&A pending count
- Written responses pending review
- Location (city/state/country)
- Enrollment date
- Graduation status

### Students table capabilities
- Full-text search by name/email.
- Sort and filter by location, progress, level, and date fields.
- Personal saved views (for example: "Level 2 pending review").

### Student detail view
- Profile and location
- Enrollment and status (active/suspended)
- Current level and lesson path
- Completion map by lesson
- Quiz attempts and top scores
- Written responses + grading history
- Private Q&A thread
- Audit timeline of key actions
- Admin actions: suspend/reactivate, reset progress, override graduation

## 8) Data Model (core entities)

- User
  - id, email, passwordHash (nullable for social-only), role, status, emailVerifiedAt
- UserProfile
  - userId, fullName, address, city, state, country
- StaffLevelAssignment
  - staffUserId, levelNumber
- Level
  - id, number (1-5), title, orderPolicy (strict/open)
- Lesson
  - id, levelId, title, orderIndex, recommendedOrderIndex, isPublished
- LessonMedia
  - id, lessonId, type(audio), sourceUrl, downloadable
- LessonNotes
  - id, lessonId, markdownContent, status(draft/published)
- Quiz
  - id, lessonId, title, passingScore=70, status
- QuizQuestion
  - id, quizId, type(mcq|short_text), prompt, optionsJson(nullable), answerKeyJson(nullable)
- QuizAttempt
  - id, userId, quizId, score, submittedAt
- QuizResponse
  - id, attemptId, questionId, responseText/json, manualGradeStatus
- WrittenPrompt
  - id, lessonId, promptText, status
- WrittenSubmission
  - id, promptId, userId, status(draft/submitted/in_review/needs_revision/approved), content, reviewedBy, reviewedAt, feedback
- LessonProgress
  - id, userId, lessonId, audioCheckedAt, notesCheckedAt, completedAt
- LevelProgress
  - id, userId, levelId, graduationStatus, graduatedAt, graduatedBy, overrideUsed, overrideReason
- QAThread
  - id, userId, levelId, lessonId(nullable), status(open/answered/closed)
- QAMessage
  - id, threadId, senderUserId, body, createdAt
- NotificationPreference
  - id, userId, emailEnabled, webPushEnabled
- NotificationEvent
  - id, userId, type, channel, status, payloadJson, sentAt
- PushSubscription
  - id, userId, endpoint, keys, userAgent
- Certificate
  - id, userId, type(level|final), levelId(nullable), fileUrl, issuedAt, issuedBy
- AuditLog
  - id, actorUserId, targetType, targetId, action, metadataJson, createdAt
- SavedStudentView
  - id, ownerUserId, name, filtersJson, sortJson, columnsJson

## 9) API and Data Fetching Strategy

### Core principles
- Minimize per-click network waterfalls.
- Render initial route with server data.
- Use client cache for instant back/forward navigation.
- Optimistically update small state changes where safe.

### Recommended pattern
- Next.js App Router.
- Read-heavy screens via server components + route-level data loaders.
- Mutations via server actions or route handlers.
- TanStack Query for client cache and fast re-entry.
- Zustand (or equivalent) for ephemeral UI state (sidebar, filters, selection, modals).

### Performance guardrails
- Paginated tables by default.
- Indexed query paths for `level`, `status`, `lastActivity`, `city/state/country`, `enrollmentDate`.
- Batch summary counters in a single query for dashboard cards.
- Preload likely next routes from sidebar hover/focus.

## 10) Security and Compliance Baseline

- Role-based access checks server-side on every privileged action.
- Level-scope enforcement for Instructor/Reviewer queries.
- Soft-delete model for users/content (recoverable).
- Immediate access revocation on suspension.
- Audit logs for sensitive actions (override, reset, status changes, grading decisions).
- Baseline privacy controls only at launch.

## 11) UX and Visual Direction (initial)

- Visual style: grayscale modern SaaS.
- Inspiration: Stripe/Linear clarity, Coursera-like course richness.
- No gradients.
- Strong left sidebar + content workspace pattern.
- Dense but readable data tables.
- Fast-feeling interactions and predictable state.

## 12) Technical Stack Recommendation

- Framework: Next.js (App Router) + TypeScript.
- Auth: Better Auth (email/password + Google).
- DB: PostgreSQL + Prisma.
- Cache/queue: Redis (BullMQ/Upstash QStash equivalent for reminder jobs).
- Email: Resend.
- Push: Web Push (VAPID).
- File artifacts: object storage for certificate PDFs.
- Observability: structured logs + error tracking.

## 13) Delivery Plan (phased)

### Phase 1: Foundation
- Auth, roles, profile setup, level model, lesson model, base dashboard shell.

### Phase 2: Learning Flow
- Lesson player (audio + notes), completion tracking, progression gates.

### Phase 3: Assessment + Review
- Quiz engine, short-text/manual grading, written responses, unified review queue.

### Phase 4: Q&A + Notifications
- Private Q&A inbox, event notifications, inactivity reminder scheduler.

### Phase 5: Admin Operations
- Students table/search/saved views, student detail timeline, suspension/reactivation/reset.

### Phase 6: Graduation + Certificates
- Graduation workflows, override+audit, PDF generation, certificate email automation.

### Phase 7: Hardening
- Performance tuning, indexing, permission audits, end-to-end tests, launch readiness.

## 14) Non-functional Targets

- Instant-feeling in-app navigation through route/data prefetch + cache.
- Tables usable at 10k registered users with server pagination and indexed sorting.
- Clear operational observability for reminders, notifications, and grading workflows.

## 15) Open Inputs Before Final UI System

- Brand pack (logo files, exact grayscale palette tokens, preferred fonts, icon style).
- Final copy tone and naming conventions for learner-facing and staff-facing UI text.

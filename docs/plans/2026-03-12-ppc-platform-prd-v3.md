# PPC Platform PRD (v3)
**Product:** Pleros Perfecting Courses (PPC)  
**Domain:** `ppc.pleros.org`  
**Date:** March 12, 2026  
**Organization model:** Single organization

## 1. Product Summary
PPC is a free Christian course platform where the **level is the course**.  
There are 5 fixed levels (Level 1 to Level 5). Students progress through lessons in a level and are graduated to the next level by reviewer/admin action.

## 2. Learning Structure
- Fixed levels: 1, 2, 3, 4, 5 (levels never change).
- Each level contains lessons.
- Current baseline lesson counts:
- Level 1: 5
- Level 2: 11
- Level 3: 30
- Level 4: 60
- Level 5: 300
- Lesson counts can be increased later.
- Strict level prerequisite:
- Level N+1 unlocks only after Level N is marked graduated by reviewer/admin.

## 3. Roles and Access
### Student
- Self-signup.
- Starts at Level 1 by default.
- Must verify email before starting Level 1.
- Can take lessons, quizzes, written responses, and private Q&A.
- Can save drafts, edit, and resubmit written responses.
- Can progress through lessons in current level even if some items need revision.
- Gets read-only access to past graduated levels.

### Reviewer/Instructor (merged role)
- Single merged role.
- Assigned by level only.
- Can be assigned multiple levels.
- Can only see students active in assigned levels.
- Can manually grade short-text and written submissions.
- Can mark level graduation.
- Can manually override graduation even when requirements are incomplete.

### Admin
- Full access.
- Can override starting level.
- Can edit content directly in dashboard.
- Can reset student progress.
- Can assign reviewer level scope.
- Can mark graduation and apply override.

## 4. Authentication
- Better Auth.
- Google auth enabled.
- Email verification mandatory before Level 1 start.
- Resend for email.
- Admin 2FA: deferred for now.

## 5. Lesson Content
Each lesson is audio-first:
- Audio
- Teaching notes/transcript/sermon notes
- Questions/quizzes

Content handling:
- External hosting for media (likely UploadThing).
- Admin pastes existing audio URLs.
- Download options required.
- Direct links available once student has access.

## 6. Completion, Assessment, Graduation Rules
A lesson is complete only when all are done:
- Audio marked listened (self-attested).
- Notes marked read (self-attested).
- Quiz passed at 70% or higher.
- Written response approved by reviewer/admin.

Assessment rules:
- Unlimited attempts.
- Highest score counts.
- Quiz types: multiple choice and short text.
- Short text is manually graded.

Progression rules:
- Students can continue lessons in current level.
- Level graduation is blocked until all required submissions are approved.
- Reviewer/admin may apply manual graduation override.

## 7. Q&A
- Private per student.
- Staff can respond.
- Visible in student detail and staff workflows.

## 8. Notifications and Reminders
Channels:
- Email
- Browser web push

Cadence:
- First inactivity reminder after 2 days.
- Repeat every 2 days until activity resumes.
- Immediate notifications only (no digest mode).

## 9. Certificates
- Sent as PDF via email.
- Triggered automatically when reviewer/admin marks level graduation.
- No payment dependency.

## 10. Admin/Reviewer Dashboard Requirements
Required capabilities:
- Student list at a glance.
- Strong filtering/sorting.
- Student drill-down with full course/submission/response details.
- Reviewer visibility constrained to assigned levels.

Student list minimum columns:
- Name
- Level
- Progress
- No. Q&A pending
- Location
- Additional operational fields like status, current lesson, last activity, pending reviews.

## 11. Scale Targets
- 5,000 active students.
- 10,000 total registered.
- Baseline performance for now.
- In-app tables initially.
- Strong state management for instant-feeling navigation.

## 12. UX/UI Direction
- Primary reference: Coursera-level organization and navigability.
- Clean, modern, easy-to-scan UI.
- Dashboard + sidebar layout.
- Grayscale-first visual system.
- No gradient-heavy styling.

## 13. Branding and Design Baseline
- Logo: placeholder `PPC` wordmark.
- Typography: `Inter`.
- Grayscale token set below.

```css
:root {
  --gray-0: #ffffff;
  --gray-25: #fcfcfd;
  --gray-50: #f8f9fa;
  --gray-100: #f1f3f5;
  --gray-200: #e9ecef;
  --gray-300: #dee2e6;
  --gray-400: #ced4da;
  --gray-500: #adb5bd;
  --gray-600: #868e96;
  --gray-700: #495057;
  --gray-800: #343a40;
  --gray-900: #212529;
  --gray-950: #111315;

  --bg: var(--gray-0);
  --bg-muted: var(--gray-25);
  --surface: var(--gray-0);
  --surface-muted: var(--gray-50);

  --text: var(--gray-900);
  --text-muted: var(--gray-700);
  --text-soft: var(--gray-600);
  --text-inverse: var(--gray-0);

  --border: var(--gray-300);
  --border-strong: var(--gray-400);

  --primary: var(--gray-900);
  --primary-hover: var(--gray-800);
  --primary-active: var(--gray-950);
  --primary-foreground: var(--gray-0);

  --focus-ring: #6b7280;
  --success: #2f3438;
  --warning: #52575c;
  --danger: #3b3f44;
}
```

```tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
```

```css
body {
  font-family: var(--font-sans), sans-serif;
  background: var(--bg);
  color: var(--text);
}
```

## 14. Business Model
- Entirely free.
- No payments.


## 15. MVP Acceptance Criteria
- Student self-signup, email verification, Level 1 default start.
- Admin starting-level override works.
- Audio + notes + quizzes + written submissions work.
- Completion signals enforce lesson completion.
- Strict level unlock by graduation mark.
- Graduation blocked until approvals complete unless override applied.
- Reviewer sees only assigned levels.
- Admin/reviewer has sortable student list and detailed student view.
- Email + web push notifications with 2-day inactivity recurrence.
- Certificate PDF emails on graduation mark.
- Draft/publish content workflow with immediate global replace.

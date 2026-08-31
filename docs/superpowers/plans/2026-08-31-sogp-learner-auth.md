# SOGP Learner Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace public email-only soft sessions with verified SOGP signup, password and email-code login, required password creation, and safe dashboard return paths.

**Architecture:** The existing SOGP form starts a short-lived pending-enrolment record and sends a Better Auth OTP. `/setup` verifies the mailbox, establishes a fresh session, requires a password, then finalises the enrolment and redirects to the Welcome Pack. `/login` supports password and email-code authentication for existing accounts, while scoped Welcome Pack cookies remain resource access rather than full identity.

**Tech Stack:** Next.js 16 App Router, React 19, Better Auth 1.5.4, Drizzle/PostgreSQL, Resend, TanStack Query, Vitest, Tailwind CSS v4.

---

### Task 1: Pending enrolment model and pure flow helpers

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `drizzle/0017_sogp_pending_enrolments.sql`
- Create: `lib/sogp/auth-flow.ts`
- Create: `lib/sogp/auth-flow.test.ts`

- [ ] **Step 1: Write failing helper tests**

Cover safe dashboard return paths, flow expiry, token hashing, password validation, and OTP send cooldown:

```ts
expect(normalizeLearnerReturnTo("/dashboard/sogp")).toBe("/dashboard/sogp");
expect(normalizeLearnerReturnTo("//evil.example")).toBe("/dashboard");
expect(validateLearnerPassword("short", "short")).toEqual({ password: "Password must be at least 8 characters." });
expect(canSendSogpCode({ sentAt: now, sendCount: 1 }, now)).toBe(false);
```

- [ ] **Step 2: Run the helper test and observe failure**

Run: `npm test -- lib/sogp/auth-flow.test.ts`  
Expected: FAIL because `auth-flow.ts` does not exist.

- [ ] **Step 3: Implement the helpers**

Export:

```ts
export const SOGP_SETUP_COOKIE = "pleros_sogp_setup_v1";
export const SOGP_SETUP_TTL_SECONDS = 30 * 60;
export const SOGP_OTP_TTL_SECONDS = 10 * 60;
export function normalizeLearnerReturnTo(value?: string | null): string;
export function hashSogpFlowToken(token: string, secret: string): string;
export function validateLearnerPassword(password: string, confirmation: string): Record<string, string>;
export function canSendSogpCode(input: { sentAt: Date | null; sendCount: number }, now?: Date): boolean;
```

- [ ] **Step 4: Add the typed pending table and SQL migration**

Use a JSONB payload containing the already-normalised `SogpEnrollmentInput`, plus `flowTokenHash`, `cohortId`, `email`, `authUserId`, `otpPurpose`, send counters, verification/completion timestamps, expiry, and ordinary timestamps. Index token, email, and expiry.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- lib/sogp/auth-flow.test.ts && npx tsc --noEmit && git diff --check`  
Commit: `git commit -m "add pending SOGP enrolment model"`

### Task 2: Better Auth OTP and learner emails

**Files:**
- Modify: `lib/auth/better-auth.ts`
- Modify: `lib/auth/auth-client.ts`
- Modify: `lib/email/send.ts`
- Modify: `lib/email/templates.ts`
- Create: `lib/email/sogp-auth.test.ts`

- [ ] **Step 1: Write failing OTP email and configuration tests**

Assert that the generated email escapes input, displays the six-digit code and ten-minute expiry, and that the auth source includes `emailOTP`, hashed storage, three attempts, and disabled OTP signup on `/login`.

- [ ] **Step 2: Run tests and observe failure**

Run: `npm test -- lib/email/sogp-auth.test.ts`  
Expected: FAIL because OTP delivery is not configured.

- [ ] **Step 3: Configure server and client plugins**

```ts
emailOTP({
  disableSignUp: true,
  otpLength: 6,
  expiresIn: SOGP_OTP_TTL_SECONDS,
  allowedAttempts: 3,
  storeOTP: "hashed",
  overrideDefaultEmailVerification: true,
  sendVerificationOTP: ({ email, otp, type }) =>
    sendSogpAuthCodeEmail({ to: email, otp, type }),
})
```

Add `emailOTPClient()` beside `twoFactorClient()`. Require verified email for password sign-in, retain session cookie settings, rename the app to `Pleros Ministries and Missions`, and keep staff 2FA behaviour intact.

- [ ] **Step 4: Add the code email**

Implement `sogpAuthCodeHtml()` and `sendSogpAuthCodeEmail()` with sender `Pleros Ministries & Missions`, subject `Your SOGP verification code`, generic security copy, and no bearer link.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- lib/email/sogp-auth.test.ts lib/email/sogp-enrollment.test.ts && npx tsc --noEmit`  
Commit: `git commit -m "configure SOGP email code authentication"`

### Task 3: Start, verify, and finalise enrolment

**Files:**
- Modify: `lib/db/queries/sogp.ts`
- Create: `lib/sogp/enrollment-auth.ts`
- Create: `lib/sogp/enrollment-auth.test.ts`
- Create: `app/api/sogp/enrol/start/route.ts`
- Create: `app/api/sogp/enrol/verify/route.ts`
- Create: `app/api/sogp/enrol/complete/route.ts`
- Modify: `app/api/sogp/enrol/route.ts`

- [ ] **Step 1: Write failing state-machine tests**

Test new email, existing verified email, existing unverified email, expired flow, email/session mismatch, invalid password, retry after finalisation failure, and completed-flow replay.

- [ ] **Step 2: Run tests and observe failure**

Run: `npm test -- lib/sogp/enrollment-auth.test.ts`  
Expected: FAIL because the orchestration module is absent.

- [ ] **Step 3: Add pending-enrolment queries**

Implement create/update lookup by hashed token, code-send accounting, mark verified, mark completed, and delete expired records. Validate the stored payload again before use.

- [ ] **Step 4: Implement the start route**

Validate the form and cohort, stage the payload, establish an unverified auth user only when needed, send an email-verification OTP for new/unverified users or a sign-in OTP for verified users, set the secure setup cookie, and return `{ redirectTo: "/setup" }`. Always return enumeration-safe browser copy.

- [ ] **Step 5: Implement the verify route**

Resolve purpose from the pending record, verify through Better Auth, require exact email agreement, mark the flow verified, and return `{ nextStep: "password" }` with the Better Auth session cookie.

- [ ] **Step 6: Implement the completion route**

Require the verified flow and fresh session, hash/update the credential through a server-only helper, revoke other sessions, persist the app user and SOGP enrolment, send the confirmation email, clear setup state, and return the Welcome Pack redirect.

- [ ] **Step 7: Retire direct final submission**

Make the old `POST /api/sogp/enrol` delegate or return a migration-safe response; no public email-only request may call `provisionWelcomeSession`.

- [ ] **Step 8: Verify and commit**

Run: `npm test -- lib/sogp/enrollment-auth.test.ts lib/sogp/enrollment.test.ts && npx tsc --noEmit`  
Commit: `git commit -m "add verified SOGP enrolment flow"`

### Task 4: Multi-step enrolment and setup UI

**Files:**
- Modify: `components/sogp/sogp-enrollment-form.tsx`
- Modify: `components/sogp/sogp-enrollment-page.tsx`
- Create: `components/sogp/sogp-setup-form.tsx`
- Create: `app/(site)/setup/page.tsx`
- Create: `app/(site)/setup/loading.tsx`
- Modify: `lib/sogp/enrollment-page.test.ts`
- Create: `lib/sogp/setup-page.test.tsx`

- [ ] **Step 1: Write failing UI contract tests**

Assert “Already enrolled? Log in”, start-endpoint submission, `/setup` verification/password labels, `autocomplete="one-time-code"`, password confirmation, visible errors, and no password persistence.

- [ ] **Step 2: Run tests and observe failure**

Run: `npm test -- lib/sogp/enrollment-page.test.ts lib/sogp/setup-page.test.tsx`

- [ ] **Step 3: Switch the enrol form to the start endpoint**

Preserve current validation and fields. On success use `window.location.assign(payload.redirectTo)` for immediate acknowledgement.

- [ ] **Step 4: Build the guarded setup wizard**

Server page checks the flow cookie and pending record. Client form renders one step at a time, focuses the first invalid field, supports resend cooldown, and redirects only after completion.

- [ ] **Step 5: Verify and commit**

Run focused tests, TypeScript, and browser checks at 320/375/488px.  
Commit: `git commit -m "build SOGP account setup wizard"`

### Task 5: Login, signup, and learner password recovery

**Files:**
- Create: `components/auth/learner-login-form.tsx`
- Create: `components/auth/learner-password-recovery.tsx`
- Create: `app/(site)/login/page.tsx`
- Create: `app/(site)/signup/page.tsx`
- Create: `app/(site)/forgot-password/page.tsx`
- Create: `app/(site)/reset-password/page.tsx`
- Create: `lib/learner-auth.test.tsx`
- Modify: `lib/auth-entry.ts`

- [ ] **Step 1: Write failing route and form tests**

Cover password login, code login, unknown-email neutrality, safe return path, signup copy/CTA, password reset code, and authenticated redirect.

- [ ] **Step 2: Run tests and observe failure**

Run: `npm test -- lib/learner-auth.test.tsx`

- [ ] **Step 3: Build `/login`**

Use the public SOGP shell. Password is primary; “Email me a sign-in code” swaps to the code flow. Add “Create or reset your password” and the approved signup block linking to `/signup`.

- [ ] **Step 4: Build `/signup` and recovery routes**

`/signup` permanently redirects to `/sogp/enrol`, preserving only UTM keys. Recovery uses Better Auth’s email-OTP password-reset endpoints and the same password policy.

- [ ] **Step 5: Verify and commit**

Run focused tests, TypeScript, and browser login/recovery smoke tests.  
Commit: `git commit -m "add SOGP learner login and recovery"`

### Task 6: Dashboard guards, legacy redirects, and soft-auth retirement

**Files:**
- Modify: `app/(site)/dashboard/layout.tsx`
- Modify: `app/(site)/dashboard/sogp/layout.tsx`
- Modify: `app/(site)/dashboard/sogp/page.tsx`
- Modify: `app/api/welcome-access/route.ts`
- Modify: `app/api/welcome-access/session/route.ts`
- Modify: `lib/dashboard-action-session.ts`
- Create: `app/(site)/sign-in/page.tsx`
- Create: `app/(site)/sign-up/page.tsx`
- Modify: `app/ppc/sign-in/page.tsx`
- Modify: `app/ppc/login/page.tsx`
- Modify: `app/ppc/sign-up/page.tsx`
- Modify: `app/ppc/signup/page.tsx`
- Modify: `app/ppc/forgot-password/page.tsx`
- Modify: `app/ppc/reset-password/page.tsx`
- Modify: `lib/dashboard-shell.test.ts`
- Modify: `lib/ppc-routing.test.ts`
- Modify: `lib/welcome-session.test.ts`

- [ ] **Step 1: Write failing access and redirect tests**

Assert exact `returnTo` preservation from `x-pleros-pathname`, `/login` redirects, legacy route targets, Welcome Pack cookie scoping, and absence of `provisionWelcomeSession` in public endpoints/actions.

- [ ] **Step 2: Run tests and observe failure**

Run the three focused test files.

- [ ] **Step 3: Update dashboard guards**

Welcome Pack cookie remains sufficient only for its scoped surfaces. Full learner and SOGP routes require `getAppSession()`. Unauthenticated users go to `/login?returnTo=<safe path>`.

- [ ] **Step 4: Remove public soft-session escalation**

Welcome access continues to mint/refresh its signed access cookie but cannot create a Better Auth session. Persistence actions that need an app user return a login requirement instead of silently provisioning identity.

- [ ] **Step 5: Add legacy redirects and verify**

Run focused tests and browser route checks.  
Commit: `git commit -m "route learner access through verified login"`

### Task 7: Migration, complete verification, and rollout

**Files:**
- Modify: `docs/ai_scratchpad.md`
- Modify: `docs/superpowers/plans/2026-08-31-sogp-learner-auth.md` checkboxes

- [ ] **Step 1: Apply the development migration**

Run the repository’s documented Drizzle migration command against the development database, then inspect the pending table and indexes.

- [ ] **Step 2: Run the complete automated suite**

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
npx react-doctor@latest --verbose --scope changed
git diff --check
```

Expected: all tests/type/build pass; lint has no new errors; React Doctor does not regress.

- [ ] **Step 3: Verify live browser stories**

Use `/_next/mcp` plus a real browser for new signup, invalid OTP, resend, required password, Welcome Pack redirect, password login, email-code login, reset, unknown email, legacy redirects, and dashboard return paths. Verify 320/375/488px and desktop, keyboard operation, focus, and no console/runtime errors.

- [ ] **Step 4: Verify real email delivery**

Send a uniquely marked setup code to an owned inbox and confirm sender, expiry copy, receipt, valid-code success, and expired/invalid-code failure. Never expose the code in logs or screenshots.

- [ ] **Step 5: Finalise documentation and commit**

Compress scratchpad rules, mark plan checkboxes, and commit remaining verified work with `git commit -m "complete SOGP learner authentication"`.

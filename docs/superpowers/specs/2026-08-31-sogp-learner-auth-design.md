# SOGP learner authentication design

**Date:** 31 August 2026  
**Status:** Approved direction; implementation pending final spec review

## Goal

Give SOGP learners durable, recoverable authentication now that the homepage no longer collects an email and creates a soft Better Auth session.

The completed experience must let:

- a new learner enrol, verify their email, create a password, and continue to the Welcome Pack;
- an existing learner sign in with a password or a one-time email code;
- a learner create or reset a forgotten password;
- an unauthenticated dashboard visitor return to the dashboard page they originally requested;
- Welcome Pack-only visitors retain their scoped access without being silently promoted into a full learner account.

## Non-goals

- Reworking staff/admin authentication or two-factor authentication.
- Adding usernames, phone-number login, passkeys, or new social providers.
- Merging accounts with different email addresses.
- Moving SOGP enrolment data out of the existing SOGP tables.
- Removing the Welcome Pack access-cookie flow from `/welcome`.

## Route map

| Route | Purpose |
| --- | --- |
| `/login` | Learner password login, email-code login, password recovery, and the SOGP signup callout. |
| `/signup` | Friendly signup entry point; redirects to `/sogp/enrol` while preserving safe campaign parameters. |
| `/sogp/enrol` | Canonical SOGP details form and “Already enrolled? Log in” entry. |
| `/setup` | Short-lived enrolment wizard: verify email, then create password. |
| `/forgot-password` | Request password creation/reset email. |
| `/reset-password` | Choose a new password from a valid recovery flow. |
| `/dashboard/welcomepack/join` | First destination after successful setup. |

Legacy routes retain permanent redirects:

- `/sign-in` → `/login`
- `/sign-up` → `/signup`
- `/ppc/sign-in` and `/ppc/login` → `/login`
- `/ppc/signup` and `/ppc/sign-up` → `/signup`
- `/ppc/forgot-password` → `/forgot-password`
- `/ppc/reset-password` → `/reset-password`
- `/sogp/enroll` → `/sogp/enrol`

`/setup` is never a general settings page. Without a valid short-lived enrolment-flow cookie it redirects to `/signup`.

## New learner flow

### 1. Submit enrolment details

The existing form remains at `/sogp/enrol`. Its successful submit changes from “create a session and persist the final enrolment” to “start a verified enrolment flow.”

The start endpoint:

1. normalises and validates every field using the existing SOGP validation;
2. confirms that enrolment is open;
3. writes the validated payload to a short-lived pending-enrolment record;
4. creates an opaque flow token, stores only its hash, and sets the raw token in an HttpOnly, SameSite=Lax cookie;
5. identifies whether the matching Better Auth user is new, unverified, or verified;
6. for a new email, creates an unverified Better Auth credential account with a high-entropy server-generated temporary credential, but creates no session and never exposes that credential;
7. sends the appropriate six-digit email challenge without revealing which account state exists;
8. returns `/setup`.

No final SOGP enrolment, app session, confirmation email, or dashboard access is created at this point.

### 2. Verify the email at `/setup`

The first setup screen is titled **Verify your email**.

It shows the masked destination email and one numeric input with:

- `inputmode="numeric"`;
- `autocomplete="one-time-code"`;
- a six-digit limit;
- clear invalid, expired, and too-many-attempts messages;
- a resend action with cooldown feedback.

The server resolves the challenge purpose from the pending flow rather than trusting a client-supplied account mode:

- new or unverified Better Auth user → email-verification OTP;
- verified Better Auth user → sign-in OTP.

Successful verification proves mailbox control, establishes a Better Auth session, marks the pending flow verified, and advances the same `/setup` page to password creation.

### 3. Create the password

The second setup screen is titled **Create your password**.

Requirements:

- password and confirmation fields;
- 8–128 characters, matching Better Auth’s current credential policy;
- show/hide controls with accessible names;
- server-side confirmation and policy validation;
- no password stored in the pending-enrolment table, cookies, URL, logs, analytics, or client persistence.

The password endpoint requires:

- the verified pending-flow cookie;
- a fresh Better Auth session;
- exact agreement between the session email and pending-enrolment email.

It hashes and writes the learner’s credential through one server-only auth helper. For legacy accounts with an internally generated credential, this replaces that unknown credential only after email proof. Other sessions are revoked while the fresh setup session remains valid.

### 4. Finalise enrolment

Only after the password succeeds does the server:

1. ensure the app-user record exists and is email-verified;
2. upsert the SOGP enrolment against that app-user ID;
3. send the SOGP enrolment confirmation email;
4. mark/delete the pending record and clear the setup cookie;
5. return `/dashboard/welcomepack/join`.

The browser performs a normal same-origin redirect to that destination.

## Existing learner flow

The `/login` page offers two equivalent identity methods.

### Password

- email and password;
- generic invalid-credential error;
- “Create or reset your password” link;
- validated internal `returnTo` support.

### Email code

- email entry followed by a six-digit code;
- no automatic signup from the login route;
- the same generic response for known and unknown email addresses;
- code expiry, attempt limits, and resend cooldown;
- successful sign-in returns to the validated `returnTo` path.

Existing SOGP accounts created by the old soft-auth flow remain usable: learners can first use an email code, then create/reset a password. Existing valid sessions and progress records remain untouched.

## Login-page signup copy

The signup block is distinct from the login form:

**New to SOGP?**  
Enrol to create your account and access your dashboard.

CTA: **Enrol for SOGP** → `/signup` → `/sogp/enrol`

The enrolment page includes:

**Already enrolled? Log in** → `/login?returnTo=/dashboard/sogp`

## Dashboard access and return paths

The existing proxy already supplies `x-pleros-pathname`. Dashboard layouts use it to construct an internal-only return path.

Rules:

- unauthenticated `/dashboard/sogp` → `/login?returnTo=/dashboard/sogp`;
- unauthenticated `/dashboard/...` → `/login?returnTo=<requested dashboard path>`;
- valid Welcome Pack access cookies may still open their allowed Welcome Pack surfaces;
- a full learner action or SOGP surface requires a Better Auth app session;
- a signed-in user without SOGP enrolment is sent to `/sogp/enrol`, not allowed into SOGP APIs.

Return-path validation accepts only single-slash same-origin dashboard paths. It rejects protocols, protocol-relative values, backslashes, encoded bypasses, and non-dashboard destinations.

## Better Auth configuration

Use the installed Better Auth email-OTP plugin and client plugin.

Configuration direction:

- keep email/password enabled;
- require verified email for credential sign-in;
- use six-digit OTPs;
- use a 10-minute expiry;
- allow at most three verification attempts;
- store OTPs hashed;
- rate-limit sends and verification attempts;
- disable automatic account creation from `/login` email-code requests;
- override the default signup verification link with the SOGP email-verification OTP;
- keep `nextCookies()` for server-route cookie propagation;
- change the learner-facing app name from `Pleros PPC` to `Pleros Ministries and Missions` and the 2FA issuer to `Pleros`, without changing cookie names in the same release.

The plugin’s existing `verification` table is sufficient; no second OTP store is introduced.

## Pending-enrolment persistence

Add `sogp_pending_enrollments` with:

- `id`;
- `flow_token_hash` (unique);
- `cohort_id`;
- `email` (normalised and indexed);
- `payload` (versioned JSON containing the validated non-password form data);
- `auth_user_id` (nullable until known);
- `otp_purpose` (`email_verification` or `sign_in`);
- `code_sent_at` and `code_send_count`;
- `verified_at`;
- `expires_at`;
- `completed_at`;
- timestamps.

The payload is validated again before final persistence. Pending rows expire after 30 minutes and are deleted on completion or lazily when encountered after expiry. PII is not retained in abandoned pending rows beyond that window.

## Soft-auth retirement

Public possession of an email address must no longer create a Better Auth session.

- Remove `provisionWelcomeSession` from SOGP enrolment.
- Stop public Welcome Pack endpoints from upgrading an email-only submission into a Better Auth session.
- Keep the signed Welcome Pack access cookie as a narrowly scoped resource-access mechanism.
- Remove or rewrite dashboard actions that silently promote a Welcome Pack cookie into a learner session.
- Require `/login` or the verified enrolment setup for app-user actions.

This closes the existing boundary where an email-only public form can create a session for an already-existing auth user.

## Email delivery

Add a SOGP verification-code email:

- sender: `Pleros Ministries & Missions`;
- subject: `Your SOGP verification code`;
- large six-digit code;
- explicit ten-minute expiry;
- “If you did not request this, you can ignore this email.”;
- no dashboard or setup bearer link.

Password-recovery copy becomes Pleros/SOGP copy rather than PPC copy. The existing SOGP enrolment confirmation email is sent only after setup completes.

Learner password recovery also uses a six-digit code: `/forgot-password` requests it and `/reset-password` verifies it while accepting the new password. Existing staff/admin recovery remains out of scope.

Unknown login emails receive the same browser response but no email, preventing account enumeration.

## Error and recovery behaviour

- Invalid or expired setup cookie → `/signup` with a neutral restart notice.
- Expired pending flow → clear cookie and restart enrolment without creating an enrolment.
- Invalid OTP → remain on verification step and show attempts guidance.
- Too many OTP attempts → invalidate challenge and require resend.
- Existing email submitted through enrolment → continue the same proof flow; never overwrite a password before OTP verification.
- Password succeeds but enrolment finalisation fails → keep the verified flow recoverable and allow retry without resetting the password.
- Already-completed flow → redirect to the stored safe destination.
- Email delivery unavailable → do not claim a code was delivered; provide a retry-safe service message without leaking account existence.

## UI requirements

- Reuse the SOGP public Sen/Be Vietnam Pro typography and existing tokens.
- Keep `/login`, `/signup` handoff, `/sogp/enrol`, and `/setup` mobile-first.
- Render stable shells immediately with focused loading states.
- Use visible labels, native controls, `aria-invalid`, `aria-describedby`, and first-error focus.
- Make OTP and password steps keyboard-completable at 320px and 200% zoom.
- Do not expose raw auth-library errors.
- Keep signup and login vocabulary consistent: **Log in**, **Enrol**, **Verify email**, **Create password**.

## Analytics and observability

Record no password, OTP, token, or raw email in analytics.

Allowed events use existing SOGP analytics conventions and coarse states:

- `sogp_enrolment_started`;
- `sogp_email_verification_sent`;
- `sogp_email_verified`;
- `sogp_password_created`;
- `sogp_enrolment_completed`;
- `learner_login_succeeded` with method `password` or `email_code`;
- failure events only by coarse reason (`expired`, `invalid`, `delivery_unavailable`, `server_error`).

Server logs include a request/flow identifier, never secrets or PII payloads.

## Testing strategy

### Pure and server tests

- return-path normalisation and encoded-open-redirect cases;
- pending-flow expiry and token hashing;
- code-send cooldown and attempt policy;
- new, unverified, verified, unknown, expired, and completed account states;
- password policy and confirmation;
- exact email/session match before password update;
- final enrolment persistence only after verification and password;
- legacy-route redirects;
- Welcome Pack cookie cannot become an app session.

### Browser flows

- new learner: form → code → password → Welcome Pack;
- existing learner: password login → requested dashboard;
- existing legacy learner: email-code login → password creation/reset;
- invalid/expired code and resend;
- refresh/back navigation during `/setup`;
- unauthenticated dashboard return path;
- unknown login email remains enumeration-safe;
- mobile 320/375/488px and desktop;
- keyboard-only completion and focus restoration.

### Build and migration checks

- focused Vitest during TDD;
- full Vitest suite;
- TypeScript;
- lint and React Doctor;
- Drizzle migration generation/review and a real development schema apply;
- Next runtime compilation and error inspection;
- real email receipt and complete authenticated browser flow before production release.

## Rollout and migration

1. Add pending-enrolment schema and auth helpers behind tests.
2. Add OTP delivery and Better Auth plugins without changing current routes.
3. Add `/login`, `/signup`, `/setup`, and password recovery routes.
4. Switch SOGP enrolment to pending verification/setup.
5. Switch dashboard redirects to `/login` with validated return paths.
6. Remove public soft-session promotion.
7. Verify existing enrollee email-code login against real development data.
8. Apply the database migration before deploying route changes.
9. Deploy and monitor verification delivery, setup completion, login success, and errors.

Rollback keeps existing enrollment/progress data. The pending table and OTP verification rows are additive; route rollout can be reverted without deleting them.

## Acceptance criteria

- No dashboard session can be obtained by submitting only another person’s email.
- A new learner cannot reach the Welcome Pack redirect until email verification and password creation both succeed.
- Existing enrollees can authenticate without knowing the old generated password.
- Password and email-code login both work from `/login`.
- `/signup` leads to the SOGP enrolment form.
- `/setup` cannot be used without a valid pending flow.
- Unauthenticated dashboard requests return to their original safe dashboard path after login.
- Welcome Pack-only access remains functional but cannot silently escalate into learner authentication.
- Existing SOGP enrolment and progress records are preserved.

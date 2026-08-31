# Pleros project guidance

## Working rules

- Read `docs/ai_scratchpad.md` before complex work. After meaningful corrections, consolidate the relevant rule there instead of appending a diary entry.
- Preserve unrelated dirty work. Inspect overlap first, edit narrowly, and stage explicit paths only when the user asks for a commit.
- Use **npm**; `package-lock.json` is canonical even though `pnpm-lock.yaml` exists.
- Read the version-matched Next.js documentation in `node_modules/next/dist/docs/` before changing framework behaviour.
- Do not run tests, lint, builds, React Doctor, or post-edit browser verification unless the user explicitly requests verification. Report edits as unverified otherwise.

## UI foundations

- Reuse the tokens in `app/globals.css`; preserve their names and do not create a second token system.
- Suisse Int'l is committed under `app/fonts/suisse-intl/`. Public/SOGP pages use the existing Sen and Be Vietnam Pro pairing through CSS variables.
- Reuse the branded primitives and public shells already in the app. Keep UI mobile-first, sentence case, calm, and visually distinct from stock shadcn.
- Keep learner auth pages (`/login`, `/forgot-password`, `/reset-password`, `/setup`) compact: 24px headings, 14px body/button copy, 13px labels/actions/errors, 12px helper copy, and 16px free-text inputs.
- On `/sogp/enrol`, keep the mobile hero around 38px/two lines, labels at 13px, buttons and dropdown values at 14px, helpers at 12px, and free-text inputs at 16px. Empty selects use muted text/chevrons; selected values use strong text and brand-blue chevrons.
- Enrolment validation is submit-only: required labels have asterisks; blur stays neutral; an incomplete submit focuses the first error, shows inline guidance, and marks invalid controls red.
- The enrolment CTA is `Continue setup`. The top `Already enrolled? Log in` link is underlined; the duplicate below the CTA is not. Privacy/support copy is left-aligned.

## SOGP learner authentication

Better Auth is the durable identity layer. `getAppSession()` maps the Better Auth identity to the app `users` record and its `student`, `instructor`, `admin`, or `super_admin` role.

Canonical learner routes:

- `/login`: always renders password and email-code login, even if a retained session exists; accepts validated internal dashboard `returnTo` paths.
- `/signup`: preserves safe UTM parameters and redirects to `/sogp/enrol`.
- `/sogp/enrol`: collects the required learner/cohort details and starts verified setup.
- `/setup`: requires the short-lived HttpOnly `pleros_sogp_setup_v1` cookie; verifies the submitted email, then creates the learner password.
- `/forgot-password` and `/reset-password`: six-digit email-code password recovery.
- `/dashboard/welcomepack/join`: first destination after successful setup.
- `/welcome`: permanently redirects to `/sogp`.

Legacy friendly aliases permanently redirect to the canonical routes: `/sign-in` → `/login`, `/sign-up` → `/signup`, `/sogp/enroll` → `/sogp/enrol`, and learner-facing `/ppc` auth aliases to their corresponding learner routes.

### New learner flow

1. `POST /api/sogp/enrol/start` normalises and validates the form, requires an open cohort, creates a 30-minute pending-enrolment record, sets the hashed-token setup cookie, and sends the appropriate six-digit Better Auth OTP. It creates no final enrolment or dashboard session.
2. `/setup` verifies mailbox control using email-verification OTP for new/unverified users or sign-in OTP for verified users. Codes expire after 10 minutes; resend cooldown is 60 seconds.
3. The learner creates an 8–128 character password. Completion requires the verified pending flow and a matching Better Auth session email; it replaces the credential and revokes other sessions.
4. `POST /api/sogp/enrol/complete` upserts the app user/enrolment, sends the confirmation email, clears the setup cookie, and redirects to `/dashboard/welcomepack/join`.

Never store or log passwords, OTPs, raw setup tokens, or full enrolment payloads outside the intended pending/final tables. Do not create a full app session from a public email-only form.

### Existing learners and protected routes

- Existing learners can use password login or an email code. Password creation/reset is available from the login form.
- Dashboard layouts redirect missing app sessions to `/login?returnTo=<validated-dashboard-path>`.
- SOGP dashboard/API access additionally requires an SOGP enrolment; a signed-in but unenrolled learner returns to `/sogp/enrol`.
- Preserve `admin` and `super_admin` identities, accounts, roles, and sessions during auth migrations or cleanup. Super-admin access remains email-verified and fail-closed.

### Welcome Pack compatibility seam

The old signed Welcome Pack access cookie still exists in current code as a narrow compatibility path for `/dashboard` and `/dashboard/welcomepack/*`. It is resource access, not learner identity, and must not be accepted for SOGP learning APIs or expanded to new surfaces. `/welcome` itself is retired. When removing this seam, retain all app/auth users, enrolments, progress, and staff/admin identities; invalidate only the explicitly scoped legacy access/session material.

## Local commands and data

- Dev: `npm run dev` (Next.js/Turbopack; default port 3000, but local sessions may use another available port).
- Lint: `npm run lint`.
- Tests: `npm test`.
- Build: `npm run build`.
- SOGP seed: `npm run seed:sogp` (requires the configured database environment).
- PPC/admin database pages require `DATABASE_URL`; bulk seeds/migrations may require `DATABASE_URL_UNPOOLED`.
- Server mutations revalidate their affected layout/path. Keep learner SOGP and internal admin concerns separate even where older PPC infrastructure remains underneath.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

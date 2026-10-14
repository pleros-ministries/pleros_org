# Dashboard demo completion implementation plan

**Goal:** Spend the next hour replacing the legacy Community home with the supplied Paper composition, enabling the completed learning flow by default, and demonstrating the live connected routes.

**Architecture:** Replace presentation, reuse existing authorised services and mutations. Keep learner history, traditional assessment routes, community posting/moderation and server-side permissions intact. No new schema is needed for this checkpoint; shared migrations 0054 and 0055 have already been applied.

**Tech stack:** Next.js 16, React, existing dashboard tokens and Be Vietnam Pro, TanStack Query, existing Neon/Drizzle services.

Automated tests, lint, builds and diagnostic scans are deferred by the user. Verification is through internal browser snapshots and limited UI interactions, not a claim of full regression coverage. Timing is a working budget, not guaranteed completion.

## 0–5 minutes: completed learning activation

- [ ] Modify `lib/db/queries/sogp-learning-gate.ts`: enable the migrated learning schema and completed flow by default, retaining an explicit off override. Do not add a database-fingerprint restriction or remove session/ownership checks.
- [ ] Clean up the pending changes in `components/sogp/learning/plan-editor.tsx`, `learning-home.tsx`, `learning.module.css` and `app/(site)/dashboard/sogp/plan/page.tsx`: explicit path selection, accurate history copy, compact source episode rows.
- [ ] Commit and push only the named owned paths to `codex/dashboard-v3-baseline`. Do not imply a branch push confirms a hosted deployment.

## 5–30 minutes: Paper Community home

Source: `/tmp/pleros-v3-design/Pleros-Expanded-Mobile-Mockups/Pleros-community.svg`, supplied generators, current-truth addendum and implementation contract. Retain user-approved close root tabs and active dot rather than restoring conflicting mockup details.

- [ ] Create `components/community/community-home-v3.tsx` and `community-home-v3.module.css` for the source composition: “Growing together.”, Messages, Needs a response, leadership links and My groups. Use existing semantic tokens, not a new palette.
- [ ] Create `lib/db/queries/community-home.ts` for a bounded viewer-owned home projection. Reuse `getCommunityContext`, message reads, `getDiscipleshipRailSummary`, location membership and group-directory services; never lazily create a discipleship group during a home read.
- [ ] Replace the body in `app/(site)/dashboard/community/page.tsx`. Real unread conversations and own group counts replace mock names/counts. Show a truthful empty response queue when there are no actionable items. Never treat peer discussions as private check-ins.
- [ ] Keep My disciples under Community; show Church oversight only from server-derived church capability. Preserve the distinction between location groups, accepted discipleship membership and church appointments.
- [ ] Preserve the existing feed composer, sorting/filtering, pagination, likes, comments and moderation in a dedicated contextual feed route `app/(site)/dashboard/community/feed/page.tsx`, reusing `CommunityHub` and its services. Do not append the old feed as the default Community home composition.
- [ ] Adjust `components/community/community-tabs.tsx` only where necessary to expose contextual feed/messages/groups/Ask Pleros without duplicate root headers or a generic legacy destination inventory.
- [ ] Capture the live Community route at 390×844 and a desktop width; fix visible spacing, wrapping or duplicate navigation. Commit and push the focused Community checkpoint.

## 30–45 minutes: learning visual parity

- [ ] Match `/dashboard/sogp`, `/dashboard/sogp/path`, `/dashboard/sogp/plan` and `/dashboard/sogp/listen` against their supplied source screens using `components/sogp/learning/learning-home.tsx`, `plan-editor.tsx`, `listening-page.tsx` and `learning.module.css`.
- [ ] Prioritise heading hierarchy, blue lesson surfaces, section order, compact episode rows, primary controls and removal of default legacy clutter. Keep the existing library/search/reorder/replace and player controls reachable.
- [ ] Preserve explicit episode completion and Undo, saved playback positions, completed-slot locks, path-switch history and dated traditional links. Do not mark real learner progress merely to demonstrate it.
- [ ] Use snapshots of the chooser, resume, editor and player; fix visible/runtime blockers. Commit and push the learning checkpoint.

## 45–60 minutes: demo walkthrough and handoff

- [ ] Walk You → Community → My disciples → My learning → path chooser → plan editor → player in the internal browser. Review mobile and desktop screenshots, empty states and existing error boundaries.
- [ ] Check visible routes do not expose unauthorised leadership actions. Browser inspection is not a substitute for deferred permission regression tests.
- [ ] Fix only demo-blocking issues; do not start another schema or refactor.
- [ ] Final commit/push with a short status update: demo URLs, screenshots, completed items, remaining gaps, checks deferred and production deployment status.

## Remaining product work after the demo

1. Geographic/referral follow-up assignment and reassignment: dedicated server-authorised flows, separate from church hierarchy and accepted group membership.
2. Required weekly group reviews: discipler scheduling, leader-confirmed attendance, make-up sessions and certification integration using only approved rules. Existing legacy certificate policy must not be silently replaced with invented weekly thresholds.
3. Optional per-episode questions: implement once recipient/routing/privacy policy is settled; preserve the separate existing Ask Pleros flow meanwhile.
4. Remaining secondary-page Paper parity and role-specific loading, empty, validation and access-denied states across the consolidated flows.
5. Deferred regression/permission tests and hosted release acceptance. Pushed source, migrated schema and local browser verification are separate evidence.

## Scope guard

The demo hour is not a promise to complete all remaining backend flows. Do not rerun installed migrations, reset learner data, appoint users, activate unrelated reminder broadcasts, merge main or claim production delivery without evidence. No further Vercel access detour is needed for source work and branch pushes.

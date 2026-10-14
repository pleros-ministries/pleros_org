# SOGP persistence checkpoint implementation plan

**Goal:** Persist the approved learning path/episode plan safely without enabling new UI or changing old learner progress.

**Architecture:** Three additive owner-keyed stores: learning preferences/revision, ordered queue/history references, and per-episode playback position/revision. Existing `podcast_episode_progress` remains the sole listen ledger and existing traditional progress remains untouched. Schema-installed and write gates are separate; reads never lazily create a new choice. Canonical legacy listen/undo writers share the owner lock once the schema gate is installed, and actual listen changes invalidate stale plan drafts.

**Tech stack:** Drizzle/PostgreSQL, authenticated Next.js server actions, TypeScript/Vitest. Execute inline.

## Tasks

- [x] Write real local-PostgreSQL tests against a minimal pre-change schema and generated 0055, substituting only DB transport, auth boundary and network catalogue. Verify no automatic path/backfill changes, read/write gates, enrolment/withdrawal checks, owner isolation, stale revision rejection, identical retry idempotency, both pace changes, completed-slot protection, first-listen timestamp preservation, legacy undo restoration, playback conflicts and no traditional credit writes.
- [x] Generate `0055_sogp_learning_v3.sql` from `lib/db/schema.ts`: `sogp_learning_preferences`, `sogp_learning_plan_items`, `sogp_episode_playback`. Use indexed owner FKs, constrained path/pace/source, unique queue/history GUIDs, nonnegative order/position and positive revisions. Do not add a completion or certificate table.
- [x] Add `lib/sogp/learning-input.ts` and `lib/db/queries/sogp-learning-gate.ts`: validated path/revision/GUID/finite nonnegative playback and independent schema/write gates.
- [x] Add `lib/db/queries/sogp-learning.ts`: authenticated-owner caller services with enrolment checks, advisory transaction lock, catalogue validation before writes, atomic full-plan replacement, versioned path/edit saves and independently versioned playback saves. Missing state reads as traditional without persisting it. Traditional selection retains the podcast plan and all progress.
- [x] Add `lib/db/sogp-learning-lock.ts` and narrowly adapt `lib/db/queries/podcast-progress.ts`: only schema-installed writes use the shared lock and bump an existing learning revision on actual listen/undo changes. Gated-off legacy behaviour remains unchanged. Undo restores archived episode references to the waiting queue projection rather than losing them.
- [x] Add `app/_actions/sogp-learning-actions.ts`: session-derived subject, no proxy writes, controlled expected errors, and affected dashboard revalidation. No client or route binds these actions in this checkpoint.
- [x] Rehearse the generated additive migration against disposable `pleros_learning` on the private local socket only. Run focused/full regression, TypeScript, scoped lint and whitespace checks; inspect generated SQL and commit/push explicit paths.

## Release/migration boundary

Flags: `DASHBOARD_SOGP_LEARNING_V3_SCHEMA` only after 0055 verified, then `DASHBOARD_SOGP_LEARNING_V3` for writes. Both default off. Retain schema gate/privacy/concurrency-aware source during write rollback. No shared migration, activation, deployment, initial assignments, invitations, question routing or certificate changes here.

New tables do not infer a SOGP path from an old standalone podcast visit. Existing legacy `podcast_journeys` and timestamps survive migration exactly. Plan history stores GUID references, not independent completion claims. Playback does not automatically mark an episode listened. HTTP/UI and browser evidence belong to the subsequent presentation checkpoint.

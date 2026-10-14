# Slice 3 persistence checkpoint — migration review

14 October 2026. Additive persistence/services implemented and locally verified. No shared migration, flag activation or UI binding was performed. This is not the complete SOGP redesign.

## Migration 0055

Three new tables only:

- `sogp_learning_preferences`: explicit Traditional/one-podcast/two-podcast choice, retained podcast pace, whether a plan exists, optimistic revision and timestamps. Reads never create a preference; explicit Traditional selection does. An intentionally empty plan remains distinct from no plan chosen.
- `sogp_learning_plan_items`: owner-keyed ordered queue/history references, unique owner/GUID across both sources. History contains references, not completion facts. Completed slots cannot be moved/replaced in the editor. A pace change archives completed references and regroups the exact remaining sequence.
- `sogp_episode_playback`: owner/GUID-keyed finite nonnegative saved seconds and an independent revision. Positions survive plan replacement and path changes and never mark an episode listened.

`podcast_episode_progress` remains the canonical listen ledger. `podcast_journeys`, lesson/assessment progress, submissions, enrolments, memberships, reviews and certificate policies are neither backfilled nor rewritten. Existing standalone podcast visits do not imply a chosen SOGP path. Foreign keys are indexed by owner-first primary/unique keys; checks enforce path/pace, source, ordering, uniqueness and playback bounds.

## Server boundary and concurrency

New actions derive the subject from `getDashboardActionSession`, ignoring client owner fields. Services require an enrolment; withdrawn-only learners cannot write. No staff-role or church-assignment bypass is introduced. Reads are owner-only, and old withdrawn enrollee history remains readable under its existing authenticated boundary.

Plan writes use an owner advisory lock and expected revision, replacing references atomically. Identical retries return the existing revision; conflicting stale drafts are refused. Playback has separate revisions to preserve seeks while avoiding stale-device overwrites. Catalogue I/O happens before transaction locks. Queries on the single transaction connection run sequentially.

Once the schema-installed gate is on, existing canonical mark/Undo writers use the same owner lock. Only actual insert/delete changes advance an existing learning revision; repeated marking preserves the first listened timestamp. Legacy Undo restores an archived episode to the waiting read projection, without writing during reads or manufacturing credit.

## Gates and application sequence

Both new gates default off; no environment file was changed.

1. Independently verify the intended shared DB, migration journal and actual objects. Confirm missing 0055 and retain the prior deployment identity before application. Do not replay unrelated historical migrations or use schema-push on a shared database.
2. Apply reviewed 0055 transactionally, using a bounded lock/statement timeout. It creates only the three new tables, checks/FKs and unique index. Verify existing journey/listen/traditional-progress counts and timestamps unchanged and no preferences automatically inserted.
3. Set `DASHBOARD_SOGP_LEARNING_V3_SCHEMA=1` only after schema verification. This enables safe owned reads and shared legacy writer locking; retain it after installation.
4. Enable `DASHBOARD_SOGP_LEARNING_V3=1` only when the live presentation/adapters are verified. It controls new writes, not whether retained data is readable.
5. Roll back by disabling new writes/UI while retaining schema, owner guards and concurrency-aware canonical writers. Do not drop learner data or revert to writers that bypass the owner lock while new plan writes are active.

This checkpoint intentionally does not activate either gate, migrate any shared DB, change reminders, infer appointments or grant certificate credit. Pushing source alone does not install or activate the new schema.

## Actual verification

- Generated 0055 was applied to disposable local PostgreSQL (`pleros_learning`, private Unix socket). Legacy journey, listen timestamp and traditional progress were seeded before migration and checked unchanged afterwards; preferences stayed empty. This was a minimal pre-change seam, not a production clone.
- 16 real PostgreSQL service/action checks passed, plus 10 input tests: owner isolation, enrolled/withdrawn access, explicit/default choices, empty plan, concurrent retries/editors/listens, both pace/path switches, completed-slot locking, legacy Undo, first-listen timestamp preservation, playback conflicts/ownership, full-draft validation, DB constraints, readable write rollback and schema-disabled operation with new tables temporarily unavailable.
- Full checkout regression: 1,164 passed; 59 opt-in database checks skipped in that run (the 16 above ran separately). TypeScript, scoped ESLint and production build passed; the build retains the two pre-existing learning-progress-image filesystem tracing warnings.
- This persistence checkpoint claimed no new UI or browser evidence. A subsequent checkpoint connected the redesigned `/dashboard/sogp/discipleship` presenter, preserving existing tools; see `DISCIPLESHIP-LIVE-REVIEW.md`. Its navigation now belongs to Community. That work does not complete the pending learning path chooser, queue editor or player bindings.

## Remaining work

Bind the approved path chooser, My SOGP, podcast library/editor and explicit per-episode controls to these services. Connect a GET read adapter using TanStack Query/Suspense and error boundaries. Verify immediate start and published-content guards separately, without removing traditional assessments. Add live mobile/desktop/role evidence. Question routing/privacy and later group-review/certification decisions remain separate; no thresholds or equivalence formula are invented here.

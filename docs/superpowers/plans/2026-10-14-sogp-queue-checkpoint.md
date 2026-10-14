# SOGP queue checkpoint implementation plan

**Goal:** Implement approved podcast queue rules without changing live routes, schemas or canonical progress.

**Architecture:** An additive pure module consumes an ordered episode plan and read-only canonical listen/playback projections. Completed episode references retained during regrouping are plan history references, never a second completion ledger. A plan has stable groups until the learner explicitly changes pace.

**Tech stack:** TypeScript, Vitest. Execute inline; no database or browser dependency for this checkpoint.

**Verification:** 25 new queue tests and 1,154 full-checkout regressions passed (43 opt-in database checks skipped); TypeScript, scoped ESLint and diff whitespace checks passed. The initial test run proved the module was absent; a separate failing test proved malformed string input was accepted before the array-shape guard was added. Existing podcast journey/progress and traditional progression regressions also passed. There are no UI changes or new screenshot claims.

## Approved scope and boundaries

The owner approved the additive approach and this first checkpoint on 14 October 2026. Keep `/dashboard/podcast`, its legacy journey model, all database tables, traditional lessons/assessments, notifications, questions and certification unchanged. This module alone does not implement live path selection, immediate enrollee access or durable playback saving.

### Task 1: Queue and completion rules

Files: create `lib/sogp/podcast-plan.ts` and `lib/sogp/podcast-plan.test.ts`.

- [x] Write failing tests for 30 one-episode slots, 60 two-episode slots, empty plans, explicit per-episode completion, and a partial final day. Use literal GUIDs and canonical listen sets, not RSS/network or clock mocks.
- [x] Run `npx vitest run lib/sogp/podcast-plan.test.ts --exclude '.claude/**'` and record the expected missing-module failure.
- [x] Implement `createPodcastPlan(episodeGuids, episodesPerDay)` with unique nonempty string identifiers and pace 1/2; clone inputs. Plans are not capped at 30 days because pace switching must retain all remaining content.
- [x] Implement `readPodcastPlan(plan, progress)` to chunk the ordered queue at the saved pace, describe each explicit listened state and playback position, and select the first incomplete day. Do not accept a calendar day or Prayer Watch result as completion evidence. Empty days are never complete; an empty plan has no next day.
- [x] Re-run the tests. An episode at its playback end without a listen mark remains incomplete.

### Task 2: Pace switching and protected plan editing

Files: extend the same pure module and tests.

- [x] Add failing tests for 2→1 with one of 60 episodes completed (59 remaining days); 1→2 with an odd remainder; repeated same-pace switches; unavailable legacy episode retention; completed-slot replacement/movement denial; reorder/replace of only unfinished slots; unavailable/duplicate/blank draft rejection; frozen input preservation.
- [x] Implement `switchPodcastPace(plan, nextPace, progress)`: same pace returns a copy without regrouping; changed pace archives references to completed queue items and regroups the exact remaining sequence. Preserve all pre-existing history references and playback projections. Never write timestamps or traditional credit.
- [x] Implement `editPodcastPlan(plan, desiredEpisodeGuids, progress, availableEpisodeGuids)`: validate the full proposed queue, preserve each completed queue item's absolute position, and allow unavailable existing GUIDs to remain without allowing unavailable new GUIDs. Preserve the active pace and history references.
- [x] Run focused tests including existing `lib/podcast-journey.test.ts`, `lib/podcast-progress.test.ts` and `lib/sogp/progression.test.ts` to confirm the legacy implementation is untouched.

### Task 3: Verify and push checkpoint

- [x] Run the full checkout regression with `.claude/**` excluded, `npx tsc --noEmit`, scoped ESLint and `git diff --check`.
- [x] Inspect the staged diff: only the additive pure module, tests and checkpoint documentation/rule updates; no schema, route, assessment or migration edits.
- [x] Commit explicit paths and push to `codex/dashboard-v3-baseline`.
- [x] Report actual test counts and distinguish the finished rules from pending persistence/UI. No screenshot is claimed because no UI changes in this checkpoint.

Example acceptance vector: a pace-2 plan `[a,b,c,d,e]` with only `a` explicitly listened still opens its original first day `[a,b]`; after switching to pace 1, history references include `a` and remaining days are exactly `[b]`, `[c]`, `[d]`, `[e]`. Saved playback for `b` remains attached to GUID `b`.

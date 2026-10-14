# SOGP learning bindings — 14 October 2026

The live source is connected and pushed in bounded checkpoints. This is not a claim of shared migration, flag activation, production deployment or completion of every slice 3 acceptance check.

## Connected routes and retained capabilities

- `/dashboard/sogp`: My SOGP reads the signed-in learner’s path and canonical progress through a narrow owned adapter. The You home card also follows the selected podcast path, with episode counts rather than traditional-track credit.
- `/dashboard/sogp/path`: three native radio choices; existing plans show remaining-day regrouping before confirmation. Switching through Traditional retains the podcast queue and positions. First podcast selection continues to the editor before any preference is saved.
- `/dashboard/sogp/plan`: catalogue-matched optional 30/60-episode suggestions, full queue, search and All/Purpose/Faith filters, day jump, episode previews, accessible move/replace controls, removal and explicit save. Completed indices are locked. The draft captures its base revision and never silently replaces an active plan during browsing; interrupted failures retain the draft.
- `/dashboard/sogp/listen`: the chosen learning day stays visible while its one/two explicit marks save. Both marks are needed for a two-episode day. Undo is retained. Saved position is independent, versioned and restored; saves coalesce while in flight and offer retry/reload on failure.
- `/dashboard/sogp/traditional`: the existing calendar, assessments, Prayer Watch, daily review tools and progress are retained. Old `/dashboard/sogp?date=YYYY-MM-DD` reminders redirect here with their valid date preserved. Course/day, certificate, referral, leaderboard, Pre-SOGP and standalone `/dashboard/podcast` routes remain available.

The player reuses existing custom controls, including seek, ±15 seconds, speed, volume, download and media reload. Dashboard-only targets are enlarged; existing teaching callers retain their defaults. Reaching the audio end never invokes listened marking.

## Permissions and persistence

`GET /api/sogp/learning` derives the owner from the app session, returns 401/403 for missing identity/enrolment and uses private/no-store caching. Client reads use TanStack Query, Suspense and an error boundary. Successful mutations reconcile the shared query cache so navigation cannot show the preceding path for its 30-second cache period.

The new explicit mark action sends desired state rather than a toggle: an identical retry is idempotent. The service rechecks enrolment, ownership of the plan episode and expected revision under the existing owner lock; it uses the canonical `podcast_episode_progress` table and preserves first-listen timestamps. Withdrawn-only learners cannot write; their UI explains withdrawal separately from disabled rollout settings. Existing legacy mark/Undo writers retain their shared lock coordination.

No additional schema was introduced. Migration 0055 was applied only to the already disposable local browser database for this rehearsal. Main/shared environment files and flags were not changed. Shared target verification, migration and activation remain pending; a Git push does not perform them.

## Actual checks

- Full checkout suite: **1,187 passed**, 60 opt-in database checks skipped in that run. The **17 real PostgreSQL learning service/action checks** passed separately, including ownership, withdrawal, idempotence, concurrent edits/listens, both pace directions, distinct traditional progress, canonical Undo and playback revision handling.
- TypeScript, scoped lint and production build passed; the build retains two pre-existing learning-share-image filesystem tracing warnings. React Doctor score remains 49/100. Remaining new warnings concern presenter complexity; owner-transaction sequential awaits are intentional, not independent connections. No diagnostic rules were suppressed.
- Authenticated main app: real traditional progress/resume and three path choices rendered with the disabled-write explanation. No real learner progress, path, invitation or message was changed.
- Synthetic learner in the isolated local app: saved 60 suggested episodes; marked one and verified an incomplete two-episode day; saved an end seek without awarding completion; moved an unfinished slot without shifting the completed one; switched to one/day with all 59 remaining episodes; reloaded; switched through Traditional and back to two/day; marked both, then used Undo; replaced an unfinished episode with a non-Purpose choice and verified its persistence.
- After those operations: 59 queue references, one retained history reference, two canonical listens and one saved position. No cross-path assessment credit or certificate was awarded.
- Withdrawn synthetic learner: history/settings route remains readable, confirmation is disabled with an explicit withdrawal explanation. Date-pinned reminder redirect was verified in-browser. Signed-out/unenrolled read rejection is covered by the actual GET handler tests.
- Browser checks at actual CSS widths 390, 320 and 1440: no outer overflow or off-screen controls in the tested listening viewport. A media select width collision found visually was fixed; small-screen footer controls wrap instead of clipping. Font resolves to the committed dashboard font. No runtime/config errors reported by Next’s local diagnostic endpoint.

## Evidence and design deviations

Synthetic captures (safe to publish): `evidence/sogp-resume-mobile.png`, `sogp-path-mobile.png`, `sogp-plan-mobile.png`, `sogp-listening-mobile.png`, `sogp-listening-desktop.png`.

These are actual running UI screenshots, not pixel-parity approval. The player’s verified fixture was changed by the tests (Parts 4/3 rather than the source’s Parts 1/2). Live RSS durations differ slightly from the reference YouTube runtimes. Native scrollbar geometry also differs from the exported artboard. Existing shared header replaces the mock device/back bar; no fake device clock or home indicator is rendered. Native keyboard-accessible move/replace menus implement the illustrated episode-menu intent rather than claiming a drag interaction was delivered. The reused media controls expose the retained speed/volume/download features beyond the source’s simplified transport example.

## Still pending

- Matched per-screen reference overlays/token evidence and final visual review; do not call these screenshots design parity.
- Complete the immediate-start acceptance audit for future/preparing cohorts: existing published-content/release guards were retained. No Welcome Pack or follow-up-owner prerequisite was added.
- Episode-specific optional question delivery awaits its unresolved routing/privacy contract. The UI clearly labels it unconnected and links to existing Ask Pleros with its separate privacy choice; it does not invent a recipient or silently prefill/send an episode question.
- Required weekly group reviews, attendance, make-ups and certification integration remain slice 5. Existing daily reviews/certificate status are not represented as satisfying the new requirement. No thresholds or equivalence rules were invented.
- Shared schema/flag rollout and production checks remain independent release work.

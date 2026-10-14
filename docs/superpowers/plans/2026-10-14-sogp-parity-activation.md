# SOGP parity and activation implementation plan

> Execute inline as bounded checkpoints; do not delegate or run a shared write merely because local tests pass.

**Goal:** remove unapproved default UI carry-over, verify immediate start, then activate only the independently verified migration target.

**Architecture:** retain the server-owned navigation inventory and existing services; render the approved drawer separately. Published cohort teaching access gains an explicit, gated immediate-start rule while draft and withdrawn guards remain. Migration 0055 stays additive and activation remains a separate release gate.

**Tech stack:** Next.js 16.3.1, React, Vitest, Drizzle, Neon/PostgreSQL; supplied SVG generators and current Paper reference.

## Checkpoints

- [ ] Test the actual drawer presenter with `lib/dashboard/menu-presentation.test.tsx`; it must expose the root/workspace links but not the legacy certificate/Welcome Pack inventory by default. Extract `components/dashboard/shell/dashboard-menu-navigation.tsx`, remove the generic fallback and keep capability-scoped church tools.
- [ ] Add immediate-start tests to `lib/sogp/day-access.test.ts` and the service read seam. A preparing learner may open published teaching without Welcome Pack/owner prerequisites; withdrawn and unpublished teaching remain denied. Preserve legacy behaviour while the learning gate is disabled.
- [ ] Compare current Paper/source sidebar and learning bodies using exact viewport/fixture data, computed tokens and recorded overlays. Do not claim perfect parity for mismatched data, inaccessible style exports or incomplete flow adapters.
- [ ] Read the configured shared database metadata and migration journal without printing secrets or learner records. Verify intended target independently; stop if environment ownership cannot be confirmed.
- [ ] Only after all preceding checks pass: apply just `drizzle/0055_sogp_learning_v3.sql` under a bounded transaction/advisory lock, record its exact journal hash, verify objects and unchanged legacy counts, then enable schema/read and write gates in the verified deployment environment. Never replay unrelated migrations or use schema push.
- [ ] Run focused/full tests, TypeScript, scoped lint, build and actual mobile/desktop checks; commit explicit paths and push each completed checkpoint. Record release blocks honestly.

Commands for source checks:

```sh
npm test -- --run lib/dashboard/menu-presentation.test.tsx lib/sogp/day-access.test.ts --exclude '**/.claude/**'
npx tsc --noEmit
git diff --check
```

Do not invent a deployment scope, database branch, certificate threshold or optional-question recipient to unblock release.

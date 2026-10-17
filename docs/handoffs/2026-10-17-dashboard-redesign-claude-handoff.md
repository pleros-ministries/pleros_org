# Dashboard redesign — Claude handoff

Use this handoff to continue the authenticated Pleros learner-dashboard work with Claude from the primary checkout.

## Ready-to-paste continuation prompt

> Work in `/Users/letroot/code/fcc/pleros_org`, the primary worktree on `main`. Read `AGENTS.md`, `docs/ai_scratchpad.md`, and `docs/handoffs/2026-10-17-dashboard-redesign-claude-handoff.md` completely before acting. Start with `git status --short` and preserve every newer or unrelated change. The dashboard checkpoint described here was committed and pushed to `origin/main` on 17 October 2026; treat later work as user-owned. The homepage slice is implemented but unverified. First show Daniel the saved My learning proposal at `/Users/letroot/.codex/visualizations/2026/10/16/01a14626-9191-7bf2-806e-1082b3ed565f/claude-handoff/my-learning-proposal.png` and ask for approval or corrections. Implement the My learning production screen only after approval. Follow the repository rule not to run tests, lint, builds, React Doctor, or browser verification unless Daniel explicitly requests verification. Leave commits, pushes, deployments, migrations and live data unchanged until Daniel authorises the specific action.

## Checkout and safety

- Primary checkout: `/Users/letroot/code/fcc/pleros_org`
- Branch: `main`
- Base HEAD before this checkpoint: `61170ed0f3dc55f7c3de969305b59f8e824ff1dc`
- Dashboard implementation checkpoint: `14617824e0320c1595587fe00b5294bff3a92a32` (`feat: refresh learner dashboard home`)
- Work directly in this checkout unless Daniel requests a different worktree.
- A separate Claude worktree exists at `.claude/worktrees/sogp-enrol-form-issue-6df5e6`; it is unrelated to this dashboard slice.
- This checkpoint includes several mixed-ownership files that were already dirty before the homepage slice. Inspect file history and overlap before editing them again.
- Tests, lint, type-check, builds, React Doctor and post-edit browser verification have not been run for this work, following the repository instruction. Report the work as unverified until Daniel authorises verification.
- The checkpoint was committed and pushed to `origin/main`. No deployment, migration or live-data change was made.

## Product decision: dashboard home

The authenticated `You` home is a neat two-destination hub:

1. `My learning`
2. `My reports`

Nothing else belongs on the home. Specifically, keep out the former support card, essentials links, church invitation strip, extra destinations, AM/PM layouts and schedule timelines. Support remains reachable through Community.

### My learning card

- All labels, path data, progress and actions render dynamically in code.
- Background-only artwork: `public/assets/dashboard/learning-card/my-learning-background-v5.webp`.
- The asset is a 54 KB WebP with a tactile blue field, compact lower-right 2.5D steps, a thin path and a restrained lime doorway.
- The card handles real states:
  - not started;
  - traditional SOGP;
  - one-episode podcast pace;
  - two-episode podcast pace;
  - fallback data.
- Podcast copy says `Day N is waiting for you`, never `Today's episode`. Incomplete podcast days do not advance by date.
- Progress is dynamic and accessible. The resume/start CTA keeps its real destination.
- `My learning` opens `/dashboard/sogp`; the CTA opens the real resume/start route.

### My reports card

- Shows the Lagos date, summary count and real Devotional/Ministry/Meetings rows.
- Status pills preserve the approved semantic colours: Reported/Confirmed green, Not confirmed amber, Nil declared lilac, Not reported neutral.
- The entire card date-pins to `/dashboard/community/report?day=YYYY-MM-DD`.
- The dedicated report workspace keeps the reporting actions; the home remains summary-only.

## Typography and surface decisions

- Authenticated dashboard `h1`–`h3` headings use Sen.
- Inter remains the body, control, navigation, label and status typeface.
- Preserve existing sizes, weights and line heights.
- Shared dashboard/community canvas: warm off-white `#f8f6f2`.
- Shared edge: `#d9dde3`.
- Raised cards remain white.
- Keep the existing centred You/Community tabs and dashboard shell.

## Implemented files

- `components/dashboard/v3/home-view.tsx`
  - Replaced the old learning/report/support stack with the two approved destinations.
  - Removed client-router button handlers in favour of real links.
  - Added dynamic learning projection and date-pinned report card.
- `components/dashboard/v3/dashboard.module.css`
  - Added home learning/report card styles.
  - Applies Sen to dashboard `h1`–`h3`.
  - Includes narrow-phone wrapping rules.
- `public/assets/dashboard/learning-card/my-learning-background-v5.webp`
  - Only production artwork candidate retained in the repository.
- `lib/dashboard/home-data.ts`
  - Removed the unused Community context/discipler support reads from the home projection.
- `lib/dashboard/home.ts`
  - Removed obsolete `support` and `community` fields from `DashboardHomeData`.
- `app/preview/dashboard-v3/home/page.tsx`
  - Updated sample date/data shape.
- `app/globals.css`
  - Warm canvas and stronger card edge.
- `lib/dashboard/home-view.test.tsx`
  - New focused presentation assertions; unrun.
- `lib/dashboard/home-data.test.ts`
  - Asserts obsolete support/context reads are skipped; unrun.
- `lib/dashboard/menu-presentation.test.tsx`
  - Mixed-ownership file: it already had dirty work before this task. This task adjusted the shared canvas expectation and added the Sen-heading assertion. Preserve all other hunks.
- `docs/ai_scratchpad.md`
  - Consolidated current dashboard typography, surface and artwork rules.

## Mixed-ownership files in the checkpoint

These already contained changes before the homepage implementation and were included in the requested current-state commit. Preserve their unrelated behaviour when editing them again:

- `lib/dashboard/menu-presentation.test.tsx` (now contains both prior work and this task's small updates)
- `lib/dashboard/shell-navigation.test.ts`
- `lib/sogp/learning-ui.test.tsx`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`

## Next decision gate: My learning

The latest visual proposal is saved at:

`/Users/letroot/.codex/visualizations/2026/10/16/01a14626-9191-7bf2-806e-1082b3ed565f/claude-handoff/my-learning-proposal.png`

Do not treat it as approved yet. Show it to Daniel and collect approval or corrections before changing the production My learning screen.

The proposed hierarchy is:

1. `Back to You`
2. Eyebrow `My learning`
3. H1 `Your learning, your pace`
4. Next unfinished learning card using the same v5 background
5. Reassurance that unfinished episodes/lessons wait and are never skipped
6. `Learning settings`
   - `Your daily commitment` → `/dashboard/sogp/path`
   - `Your tracklist` → `/dashboard/sogp/plan` (podcast plan only)
   - `App and reminders` → `/dashboard/welcomepack/setup`
7. `More from your learning`
   - Learning history
   - Weekly group reviews
   - Follow-up person and reassignment
   - Referral sharing
   - Certification readiness
   - Collapsed traditional tools

### Existing backend behaviour to preserve

- Path choices are exactly:
  - `1 hr/day` Traditional SOGP;
  - `30 min/day` two podcast episodes/day;
  - `15 min/day` one podcast episode/day.
- Existing learners preview and confirm path changes; do not add inline path toggles.
- `/dashboard/sogp/plan` requires a podcast plan and redirects learners without one to `/dashboard/sogp/path`.
- App/reminder settings already live at `/dashboard/welcomepack/setup`.
- `/dashboard/podcast` is a separate devotional podcast journey, not an SOGP learning setting.
- Preserve write-disabled messaging from `learningWriteNotice`.
- Preserve all history, progress, review, follow-up, referral and certification behaviour.
- Child screens need explicit back links to their true parent.

## Later work

After My learning is approved and implemented:

1. Review the dedicated My reports workspace information architecture.
2. Keep the dashboard summary-only and make the report workspace clearly own Add activity, Confirm and Declare Nil actions.
3. Run a final consistency pass across canvas, cards, headings, icons and parent links.
4. Verify at mobile and desktop sizes only when Daniel authorises verification.

## Post-checkpoint status

The implementation checkpoint `1461782` was pushed to `origin/main`, after which `main` matched `origin/main` and `git status --short` was clean. This handoff finalisation is a later documentation-only follow-up. Re-run both `git status --short --branch` and `git log -2 --oneline --decorate` before acting because Daniel or another agent may have changed the checkout after this handoff was finalised.

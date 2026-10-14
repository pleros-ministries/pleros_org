# Dashboard redesign: agent handoff

Snapshot: 14 October 2026, Africa/Lagos. Repository: `/Users/letroot/code/fcc/pleros_org`.

## Goal and restart point

Complete the consolidated Paper mobile designs against the live database, with real persistence, server-side permissions and preserved history. A redesigned preview or shell is not completion. This document records the stop point, not production acceptance.

**Branch: `codex/dashboard-v3-baseline`. Implementation HEAD: `04ca661`**, confirmed pushed to `origin`. That commit adds the facts-only certification readiness checkpoint. Its rendering and behaviour are unverified. This handoff will be a subsequent documentation commit.

Start here:

1. Read `AGENTS.md`, `docs/ai_scratchpad.md`, the current-truth addendum and implementation contract beside this file. Inspect `git status --short`, current branch/HEAD and remote tracking before editing. Preserve concurrent work listed below.
2. Inspect the committed readiness checkpoint, including its policy wording and own-enrolment queries. Finish its Paper presentation using browser snapshots. Weekly reviews are already required; only their quota/eligibility formula is unresolved. Do not present the requirement itself as an open decision.
3. Audit reporting activation and live route bindings. Migration 0054 is installed, but the reporting gates still require explicit flags. Separate installed schema, enabled writes and actually verified live behaviour.
4. Implement approved referral-owner/geographical routing and the in-app invitation lifecycle. These are principal functional gaps, not optional polish. Keep follow-up ownership, church appointments and accepted group membership separate.
5. Work through the screen register below in bounded vertical slices. Record exact visual and functional evidence separately. Commit/push focused checkpoints and tell the user the next item without repeatedly asking permission to continue approved scope.

The user stopped implementation to request this handoff. Do not assume another implementation turn has already begun.

## Authority and execution preferences

Order of authority: latest direct user decisions → `Pleros-Current-Truth-Addendum-2026-10-13.md` → `Pleros-Design-Implementation-Contract-2026-10-13.md` and final indexed sources. Existing code is the migration baseline, not permission to override approved behaviour. Older ledgers may be stale.

- Baseline was explicitly approved before live propagation. Reuse it; do not reopen the design direction.
- Match Paper/source first. Do not carry the previous UI's destination inventory into default navigation. Retained capabilities should remain contextually reachable, not all be appended to the new home.
- User deferred tests, lint, builds and scans in favour of implementation and browser snapshots. Do not run them automatically; report unverified work honestly. Later obtain permission for the deferred functional acceptance phase.
- Commit and push frequently to this branch. Push is authorised; merge to main is not implied.
- User authorised migrations/deployment, but asked to avoid Vercel access detours and keep pushing. Verify the actual target before any further shared writes. Do not replay installed migrations.
- User rejected database-fingerprint-restricted runtime activation. Learning is default-live with explicit rollback switches. Migration scripts still restrict their target for safety; that is not a user rollout gate.
- Preserve unrelated edits. Use npm, explicit staging paths and existing tokens/components. Read version-matched Next.js docs before framework changes.
- Do not retain passwords, OTPs, tokens, database URLs or personal report content in handoff/evidence/commits.

## Working tree and what is on the branch

All dashboard implementation owned by this agent through readiness is committed at `04ca661`. Authenticated screenshots, user input archives and several older local notes/scripts remain untracked and were deliberately not bulk-staged.

Concurrent/unowned changes observed at handoff:

- Modified: `app/(site)/login/page.tsx`, `components/auth/learner-login-form.tsx`, `components/sogp/sogp-enrollment-page.tsx`.
- Untracked: `components/auth/auth-geometry-panel.tsx`, `auth-geometry-panel.module.css`, `auth-page-card.module.css`.
- These are not this dashboard agent's edits. Do not revert, stage or overwrite them without establishing ownership.

Input addendum/contract/ZIPs are also untracked. They exist on this workstation; a remote-only successor needs the user to supply them or explicitly authorise adding them. `git add .` would capture unrelated work and private screenshots.

Useful implementation checkpoints:

| Commit | Scope |
| --- | --- |
| `efa3f6e` | Church appointment target-rank/every-affected-branch restriction |
| `d485a99` | Approved shared shell connected to live dashboard |
| `af90b2b` | Reporting, private contacts, shared meetings; migration 0054 |
| `21923f0` | Additive learning plans/progress/playback; migration 0055 |
| `f267c96`, `8e180a1`, `7df9934` | Redesigned live Discipleship, preserved group tools |
| `a1ac2d1` | My disciples belongs under Community |
| `152fc9d`, `3333b88`, `82a308e` | Live chooser/resume/editor/player, immediate start and corrections |
| `f8e2d0d` | Paper Community home with live scoped data; retained feed separate |
| `919751a` | Learning default-live; source-aligned learning screens |
| `a4cf1fa` | Reassignment request and admin queue; migration 0056 |
| `a667160` | Group-lead review scheduling/attendance; migration 0057 |
| `ab2c02b` | Explicitly linked make-up offers/choice/confirmation; migration 0058 |
| `04ca661` | Own facts-only certification readiness; unverified checkpoint |

Inspect `git show` for exact touched paths. Older `DELIVERY-STATUS.md` and checkpoint notes are supporting history, not a substitute for this snapshot or fresh code inspection.

## Design inputs and visual acceptance

Paper: https://app.paper.design/file/01M4TACCHKAMJY1BYTABRBNBMS

Source ZIPs in this directory:

- `Pleros-Coding-Agent-Handoff-SVG.zip`
- `Pleros-PNG-Previews-Part-1.zip`
- `Pleros-PNG-Previews-Part-2.zip`

Existing extraction: `/tmp/pleros-v3-design/Pleros-Expanded-Mobile-Mockups/`. It contains `screen-index.json` (71 screens), tokens, generators, SVGs and supplied assets. If missing on another host, inspect ZIP entries and extract safely. The temporary path is not a durable repository dependency.

Paper's public viewer was accessible; detailed children/JSX/computed-style extraction required edit access and failed. Use the supplied approved SVG/generators rather than retrying inaccessible APIs or inventing a replacement design.

Reuse `components/dashboard/v3/`, `components/dashboard/shell/` and `app/globals.css`. Authenticated font is real local Be Vietnam Pro 400/500/600/700. Contract colours: white, ink `#252B33`, muted `#63676D`, line `#E7E9EC`, soft `#F6F7F8`, action `#2056D6`. Follow the full contract for type, icons, spacing, radii and source-specific variants.

Latest visual corrections: snug equal-padding pills; close You/Community tabs with active dot; finger-tracked premium swipe; profile inside menu; focused leaves use Back/title/More rather than a duplicate root tab row. My disciples is Community despite its SOGP URL; personal reports are You despite their Community URL.

Compare at CSS 390×844, same fixture/state/scroll and loaded fonts; keep long screens scrollable. Every screen ultimately needs reference/render pair, overlay/diff, token/bounds audit and discrepancy disposition. Browser captures already taken are useful evidence, not full contract acceptance. Desktop/tablet retain existing responsive capability; the pack does not approve a new desktop design.

## Live database and rollback

Confirmed shared target fingerprint:

`d3d229e68f00b0a26fb78f2dd4081adae7f4ffcf5d6a920c03329c525dfc88c1`

Installed during this work: **0054 → 0055 → 0056 → 0057 → 0058**. Journal/predecessor/hash checks and transactional application were used. Existing row digests were compared around these migrations. This is migration-time preservation evidence, not end-to-end feature acceptance. Re-read journal/table metadata before another migration if configuration changes; do not log connection strings.

| Migration | Added data |
| --- | --- |
| 0054 | Shared church meetings/reports and private ministry contacts/report companions |
| 0055 | Learning preferences, editable plan references and independent playback positions |
| 0056 | Follow-up reassignment requests |
| 0057 | Group reviews and lead-confirmed attendance |
| 0058 | Make-up offers linked to exact original missed review/enrolment |

0054/55 preservation snapshot included 470 users, 397 enrolments, 1,350 student-progress rows, 33 podcast journeys and 2,159 listened-progress rows. These counts are historical evidence, not current invariants. Later migration comparisons included assignments, memberships, classes/attendance and certificates. New tables started empty; no fake real-user attendance was seeded for screenshots.

Read-only target helper: `scripts/audit-sogp-learning-target.mjs`. Migration helpers: `scripts/rollout-sogp-learning.mjs` and `scripts/rollout-follow-up-requests.mjs` (`--group-reviews`, `--make-ups`). They enforce exact predecessors/target and should refuse already-installed application. Do not invoke `--apply` just to verify this handoff. `.env`/`.env.local` precedence is explicit in these helpers. Verify HTTP and pooled/unpooled transaction connections identify the intended database without exposing values.

Learning gate (`lib/db/queries/sogp-learning-gate.ts`): schema ready unless `DASHBOARD_SOGP_LEARNING_V3_SCHEMA=0`; writes/UI enabled unless `DASHBOARD_SOGP_LEARNING_V3=0`. Use the latter for rollback after schema installation, retaining schema-aware legacy coordination and data. No fingerprint runtime restriction remains. Other deployment databases need the migrations before using the new defaults.

Reporting gate (`lib/db/queries/reporting-v3-gate.ts`): requires `DASHBOARD_REPORTING_V3_SCHEMA=1`, `DASHBOARD_REPORTING_V3=1` and daily reporting enabled. Prior local setup enabled schema readiness, not reporting writes. Audit current non-secret flags and live bindings; do not claim all new reporting is activated.

Older gates: daily declarations `DASHBOARD_DAILY_REPORTS_V2=1`; church `DASHBOARD_CHURCH_V2=1`; multi-branch `DASHBOARD_CHURCH_MULTI_BRANCH_V2=1`; reminders require daily+church+`DASHBOARD_REPORT_REMINDERS_V2=1`. Keep reminder consent and rollout separate: a general UI rollout is not permission to send new reminders or appoint people.

Review/follow-up services currently use installed tables directly. Audit deployment environment/schema compatibility before shipping to a different target. Rollback should disable new entry points/writes while preserving canonical history; never drop migrated data to roll back presentation.

## Implemented flows and remaining functional work

### Shared shell, You and Community

Shell: `components/dashboard/shell/dashboard-shell.tsx`, `dashboard-menu-navigation.tsx`, `lib/dashboard/{navigation,shell-navigation,viewer,swipe-tabs}.ts`, `components/dashboard/v3/use-tab-swipe.ts`.

Root Community now uses `components/community/community-home-v3.tsx` and `lib/db/queries/community-home.ts`: Growing together, Messages, Needs response, People I lead, My groups. Counts/links come from session-scoped services; check-in previews do not select answer text. It does not create a group on read. Retained feed moved to `/dashboard/community/feed`, reusing the existing composer/feed/filter/moderation capability. It is not appended as the old home.

Preserve messages, location groups, member-created groups, Ask Pleros and private discipleship discussions. Community discussion links use `/dashboard/community/discipleship?group=<id>`; not a nonexistent dynamic group route. Audit every retained destination for contextual discoverability, rather than restoring a wholesale old sidebar. Secondary community bodies still need source/retained-state classification.

### Reporting and private contacts

UI: `components/community/report/ministry-v3/`; actions: `app/(site)/dashboard/community/_actions/reporting-v3-actions.ts`; queries include `shared-church-meetings.ts`, `private-ministry-contacts.ts`, `reporting-v3-store.ts` and ministry-report companion queries.

Leader creation precedes attendance reports. Actual leader may be worker, unit leader, Branch Pastor or Pastor. This does not change appointments. Teaching has one subject; prayer has venue/times and no subject. Personal attendance, brought people and leader total are separate. Total includes everyone, not a sum added to personal/brought figures. Missing meeting says “Meeting not listed yet.” without requesting/notifying anyone.

Overnight prayer belongs to Lagos start day, with explicitly entered next-day end date/time. Daily write window is today plus previous seven Lagos days; historical reads remain. Named contacts are included in totals, not double-added. Counts-only Discipleship remains supported.

Complete activation/bindings and all source states, save/edit/undo/Nil/history, repeated saves and private contact surfaces. Name/phone required, optional email, no automatic account creation/link/invite. Private contacts must not leak through old staff readers. Contact collections are a proposal, not permission to implement a new collection subsystem. Optional outcomes/unknown-versus-zero need approved definitions.

### Learning

Live routes: `/dashboard/sogp`, `/path`, `/plan?path=podcast_one|podcast_two`, `/listen?day=<n>`, `/traditional`. Traditional date-pinned/course/day routes, assessments, existing certificates, referrals, leaderboard and Pre-SOGP are retained contextually.

Presentation: `components/sogp/learning/`; rules: `lib/sogp/{podcast-plan,learning-view,learning-input,day-access}.ts`; services: `lib/db/queries/{sogp-learning,sogp-learning-view,sogp-learning-gate,podcast-progress,sogp}.ts`; actions/API: `app/_actions/sogp-learning-actions.ts`, `app/api/sogp/learning/route.ts`; locking: `lib/db/sogp-learning-lock.ts` and transaction adapter.

Own REST state uses TanStack Query key `["sogp","learning-v3"]` and mutation reconciliation. Editable queue has full remaining-plan editing, library selection/filter/preview, optional Purpose, reorder/replace, day jump, completed locks and dirty-navigation protection. Player keeps explicit listened/Undo separate from saved playback positions and inherited media controls. Switching pace regroups remaining only; traditional/podcast histories remain distinct.

Complete matched visual states, interrupted/repeated editing and switching, actual saved-player restoration, deep links/back/dirty guards and a future-cohort immediate-start scenario. Published learning may start without Welcome Pack/owner; withdrawn/draft access stays denied. Optional episode question delivery is not connected: specify recipient/privacy before adding it; existing Ask Pleros is not proof of episode-question completion.

### Follow-up ownership and invitations

Request routes: `/dashboard/sogp/follow-up`, `/follow-up/request`; admin `/admin/follow-up-requests`. Files: `sogp-follow-up-requests.ts`, `app/_actions/sogp-follow-up-actions.ts`, `components/sogp/follow-up-request*`, `components/ppc/follow-up-request-queue.tsx`.

Own pending request keeps current owner; one pending per enrolment. Existing admins/super admins resolve using assignment authority. Expected-owner checks reject stale resolution. No membership/appointment changes or sensitive notifications were added. Real approval/decline saves have not been runtime-checked.

**Remaining:** `lib/sogp/enrollment-side-effects.ts` must implement approved referral code/link owner routing instead of attribution-only plus geography. Direct joins use geographical leader. Handle unavailable/unsuitable owner exceptions only with an agreed rule. Current admin replacement candidates use legacy staff pastors (`role=pastor` / `isPastor`); that is incomplete for referral owners who may be any enrollee. Resolve SOGP ownership without granting church/staff powers.

Implement safe existing-account recipient discovery, in-app invite delivery/pending/accept/decline and outcomes. Non-account contacts share WhatsApp link; matching phone/email never silently links or joins. Keep current explicit invite-link acceptance, self/cycle checks, one active discipler and minors/privacy protections. Saving a contact is never invitation acceptance.

### Discipleship and church oversight

`/dashboard/sogp/discipleship?group=<id>` has redesigned `discipleship-page.tsx`, `discipleship-groups.tsx`, `discipleship-v3.tsx`. Preserve named groups (max five), last-open/paused/closed protections, max 12 disciples, per-group regenerable links/WhatsApp consent, check-ins, nudges, prayer requests, private follow-up logs and disciple detail tools. These are not disposable old features.

Church routes `/dashboard/church` and `/dashboard/church/[userId]`, actions/queries `church-organisation.ts` and `church-reports.ts` need Paper drill-down parity and every role/state review. Appointment fix checks target's current peer/senior rank, requested rank and every removed/retained/added branch, not just primary branch or direct-report count. Church hierarchy remains Pastor → Branch Pastor → Unit leader → Worker; geographic moderators and SOGP follow-up owners are separate.

Organisational report projections exclude notes/contacts. Unit leaders see directly assigned workers only; Branch Pastors own branches; Pastor all branches. Bulk hierarchy import remains a proposal pending separate approval. Do not create a general org-chart/events module from mockups.

### Required weekly reviews and make-ups

Routes `/dashboard/sogp/reviews?group=<id>`, `/reviews/schedule`, `/reviews/[reviewId]/attendance`, `/make-up`, `/make-up-offer`. Services `sogp-group-reviews.ts`, `sogp-review-makeups.ts`; actions `app/_actions/sogp-group-review-actions.ts`; presentation `components/sogp/group-review-*`; validation/time `lib/sogp/group-review.ts`.

Settled: only actual group lead schedules/leads/confirms; no alternate-leader picker or admin/church bypass. New sheets begin unconfirmed; absent marks are not Missed. Confirmation occurs after session ends and checks accepted eligible members server-side. Writes use locks/idempotency; first attendance confirmation is immutable pending correction policy.

Make-up offers reference exact original `(review, enrolment)` Missed record. Learner selects an explicitly offered slot; only group lead confirms after it ends. Made up is derived alongside the untouched original Missed row. Arbitrary later attendance gives no credit. Learning continues, and no learning/certificate credit is fabricated.

Review remaining issues before completion:

- Real scheduling/attendance/offer/choice/confirmation mutations were not runtime-checked. Evidence is empty live views and labelled synthetic presenters.
- Reschedule/cancel, attendance corrections and required-review quota are unresolved. Do not invent them.
- Current make-up flow requires learner choice before lead confirmation; audit this interaction assumption with the intended flow, not an invented further policy.
- Review-list Made up enrichment should match the exact selected attendance enrolment as well as review ID; multiple-enrolment badges may otherwise be too broad.
- Review reads are bounded (100); audit pagination, historical/multiple-enrolment selection, changed membership and rejoin behaviour rather than claiming exhaustive history.
- Scheduling currently handles future same-day Lagos start/end, not a general overnight/recurrent events system.

### Certification: current stop point

Committed but unverified: `/dashboard/sogp/readiness`, `components/sogp/certification-readiness.tsx`, `lib/db/queries/sogp-certification-facts.ts`, contextual links in learning/review lists and focused shell title.

This is **facts-only**: selected-path progress, recorded attended/missed/explicitly made-up reviews and existing unrevoked certificate availability. It does not issue certificates or add eligibility thresholds. Fix wording that currently suggests the review requirement itself needs confirmation: the requirement is settled; quotas/formula are not.

Before certificate enforcement/issuance, inspect `lib/db/queries/sogp-completion.ts` and all issuance callers. Existing `/dashboard/sogp/certificate` renders already-issued certificates; do not revoke or reinterpret them. Obtain approved session counts/percentages/podcast qualification/cross-path rules before enabling new eligibility. Visual readiness can be completed without inventing those rules; full certification cannot.

## 71-screen source register

Each row covers the exact indexed stems listed. This is a conservative implementation map, **not 71 accepted screens**. “Connected” means source code/live route exists; “partial” still needs behaviour or presentation. All rows still need final contract evidence and relevant state coverage. Use `screen-index.json` for precise titles/generator references.

| Indexed stems | Route / adapter | Handoff state and next action |
| --- | --- | --- |
| `Pleros-you`, `Pleros-sidebar-open` | `/dashboard`, shared shell/v3 primitives | Connected; approved baseline; retained capability/role audit remains |
| `Pleros-community` | `/dashboard/community`, community-home-v3/community-home query | Rebuilt and live-render checked; final source comparison remains |
| `Pleros-control-centre` | Existing `/admin` operations | Retained, new coordinator presentation pending; do not duplicate admin home |
| `Pleros-enrollee-details`, `Pleros-change-owner`, `Pleros-my-enrollees` | `/admin/my-enrollees`, follow-up request queue and existing assignment services | Partial; full source parity and referral-owner candidates pending |
| `Pleros-referral-code`, `Pleros-referral-link` | Existing referral/enrolment entry points | Sharing/attribution retained; automatic owner routing and choice lifecycle pending |
| `Pleros-reassignment-pending`, `Pleros-request-reassignment` | `/dashboard/sogp/follow-up/request` | Connected; real resolution/retry/negative-scope proof pending |
| `Pleros-church-pastor`, `Pleros-church-branch`, `Pleros-church-appointment`, `Pleros-church-allocation`, `Pleros-church-unit`, `Pleros-church-worker` | `/dashboard/church`, `[userId]`, organisation/report services | Existing functional baseline/security patch; Paper parity and scoped acceptance pending |
| `Pleros-create-branch`, `Pleros-appoint-branch-pastor` | Existing church actions | Map actual service/UI before rebuilding; presentation/role proof pending |
| `Pleros-review-hierarchy-import` | No approved new import workflow | Proposal; classify explicitly, obtain authority before implementing |
| `contacts_groups`, `saved_contacts`, `add_contact`, `contact_history` | Private contacts/report contact adapters; retained outreach browser | Partial; dedicated surfaces/source parity/privacy across readers pending |
| `move_contact`, `contact_moved` | Contact collection proposal | Not approved as a new subsystem; separate from accepted group membership |
| `Pleros-lesson` | Traditional course/day lesson/player | Retained; source presentation and all assessment/media controls audit |
| `Pleros-report` | `/dashboard/community/report` under You | Connected baseline; activation/history/Nil/undo acceptance pending |
| `Pleros-oversight` | Church scoped report drill-down | Retained/partial; direct-worker/all-branch restrictions and parity pending |
| `Pleros-disciple` | Redesigned discipleship and disciple detail | Connected; preserve all private tools and role/privacy checks |
| `Pleros-home-start-sogp` | `/dashboard` start card | Connected; no-owner/no-Welcome-Pack immediate-start proof pending |
| `Pleros-onboarding-choice` | `/dashboard/sogp/path` | Connected; source-aligned chooser |
| `Pleros-onboarding-30min`, `Pleros-onboarding-15min`, `Pleros-onboarding-ready` | Path → plan/library → resume | Connected adapters; exact separate visual states/save/back acceptance pending |
| `Pleros-onboarding-1hour` | Chooser → `/dashboard/sogp/traditional` | Connected; traditional immediate-start/history acceptance pending |
| `Pleros-home-1hour`, `Pleros-home-30min`, `Pleros-home-15min` | Adaptive You learning cards | Partial source state coverage; preserve named white-card variants |
| `Pleros-onboarding-day-one` | `/dashboard/sogp/listen?day=1` | Connected; real saved playback/completion proof pending |
| `Pleros-tracklist-suggested`, `Pleros-tracklist-reorder`, `Pleros-tracklist-review`, `Pleros-tracklist-review-15min` | `/dashboard/sogp/plan`, editor/library | Connected; full 30/60-slot edit and repeated/interrupted actions pending |
| `Pleros-report-ministry-evangelism`, `Pleros-report-ministry-discipleship`, `Pleros-report-inline-add-contact` | ministry-v3 reporting components/actions | Source implementation exists; activation and real write acceptance pending |
| `Pleros-report-ministry-outcomes` | Unified report optional outcomes | Proposal; definitions/unknown versus zero unresolved |
| `Pleros-report-teaching-led`, `Pleros-report-prayer-led` | Shared meeting creation | Implemented service/form; gate/time/total/idempotency acceptance pending |
| `Pleros-report-meeting-select`, `Pleros-report-teaching-attendee`, `Pleros-report-prayer-attendee`, `Pleros-report-meeting-missing` | Meeting selection/personal reports | Implemented service/form; selection and missing empty-state acceptance pending |
| `Pleros-my-sogp` | `/dashboard/sogp`, learning-home | Connected; contextual referrals/reviews/readiness, final parity pending |
| `Pleros-share-referral` | `/dashboard/sogp/referrals` | Existing per-enrollee sharing retained; new visual/owner-routing proof pending |
| `Pleros-review-learner-list`, `Pleros-review-discipler-schedule`, `Pleros-review-leader-attendance` | `/dashboard/sogp/reviews` and children | Connected; empty/schedule live rendering only, actual writes/role proof pending |
| `Pleros-review-missed-makeup` | `/reviews/[reviewId]/make-up` plus lead offer | Connected; synthetic visual evidence; real lifecycle unverified |
| `Pleros-review-certification` | `/dashboard/sogp/readiness` | New committed facts checkpoint unverified; no new eligibility formula |
| `Pleros-invite-existing-account`, `Pleros-group-invitation-pending`, `Pleros-group-invitation-accept` | New in-app invite lifecycle alongside existing group-link joins | Pending; safe discovery, explicit recipient acceptance/decline, delivery/privacy |
| `Pleros-invite-whatsapp-link` | Existing group invite link and WhatsApp sharing | Partial retained flow; exact non-account source treatment pending |
| `Pleros-learning-podcast-library`, `Pleros-learning-edit-full-plan` | `/dashboard/sogp/plan` | Connected; latest live library/editor snapshots, persistence/edge proof pending |
| `Pleros-learning-switch-one-episode`, `Pleros-learning-switch-traditional` | Learning actions/plan rules/path chooser | Implemented rules; both pace directions/history and source confirmation states pending |
| `Pleros-learning-listen-two-episodes` | `/dashboard/sogp/listen` | Connected explicit marks/Undo; real persisted two-mark/position proof pending |
| `Pleros-learning-optional-question` | Episode question adapter not implemented | Pending routing/privacy; retained Ask Pleros is not equivalent completion |

## Verification and release boundaries

No hosted deployment or merge has been verified. Vercel access to `plerosdev` / `pleros-org` failed previously; user requested continuing by branch pushes. Do not relink to a personal project. Check actual configured deployment branch, CI and hosted revision when release acceptance is authorised. A branch push does not prove production changed.

Older automated results predate the latest work: 1,187 passed with 60 opt-in DB tests skipped; separate earlier 17 learning DB checks; earlier church permission tests/build/type checks. They do not certify migrations 0056–0058, latest default activation, new review flows or readiness. Tests remain deferred now.

Browser work used the internal browser via CUA. After session compaction, reload CUA documentation. Use measured CSS viewport, not screenshot pixel dimensions: a 90% browser zoom made 351×760 correspond to CSS 390×844. Temporary viewport overrides should be reset. Avoid opening many cold-route tabs on CDP timeouts; re-read the same selected tab. Never create real private data merely to make a screenshot look populated.

Evidence under `docs/pleros-dashboard-v3/evidence/` includes live Community home, learning chooser/library/editor/resume, live follow-up empty/admin views, live review list/schedule and labelled synthetic attendance/make-up states. Many authenticated images remain untracked to avoid publishing private account data. Most recent signed-in rendering used Super Admin Daniel, also enrolled/group owner: this is not an ordinary learner or negative permission check.

`review-make-up-capture-changed-page.jpg` captured the baseline after the user navigated: **not make-up evidence**. Correct synthetic make-up files are `review-make-up-preview-mobile.jpg` and `review-make-up-preview-desktop.jpg`. `review-make-up-live-unavailable.jpg` proves an unavailable own route state, not saved make-up behaviour.

Later functional acceptance needs explicit permission and safe fixtures/reversible records, covering:

- New/no-owner/preparing-cohort learner immediate start; existing progress untouched; plan save/reorder/replacement, both pace switches, traditional switch, marks/Undo/positions/reload.
- Own versus other enrolment requests; admin resolution, stale/repeated submissions; code/link owner versus direct geography; invitation pending/accept/decline and no implicit membership.
- Report writes/window/history/Nil/undo, same meeting shared correctly, explicit overnight end, distinct totals and owner-only contacts across all readers.
- Group lead versus member/nonmember/admin/church-role scheduling and confirmation; unmarked attendance unchanged; explicitly linked make-up with original Missed retained; membership removal/rejoin and multiple enrolments.
- Branch Pastor cannot edit peers/seniors; every removed/retained/added branch validated; direct-worker projections exclude notes/contacts.
- Loading, empty, error, retry, validation, denied, disabled, historical, long-content and keyboard states. Screenshots alone cannot prove server enforcement or durable writes.

## Completion criteria and next-agent starter

Done means all 71 indexed designs are explicitly classified and their approved flows connected to durable services, not merely previewed; retained features remain reachable; exact source comparisons are dispositioned; permissions/history/idempotency work; agreed migration/activation is proven on the intended database; release revision is evidenced. Proposal-only screens and unresolved policies must be explicitly excluded/approved, not quietly invented. Full certification and unspecified question/invite exception behaviour may require narrowly scoped user decisions.

Paste into the successor agent:

> Continue in `/Users/letroot/code/fcc/pleros_org` on `codex/dashboard-v3-baseline`. Read `docs/pleros-dashboard-v3/AGENT-HANDOFF-2026-10-14.md`, AGENTS, scratchpad, addendum and contract before editing. Implementation is pushed through `04ca661`; readiness is committed but unverified. Preserve concurrent auth edits and private/untracked inputs. Finish the readiness presentation, audit reporting activation, then complete referral-owner routing and in-app invitation acceptance before the remaining Paper screen register. Use existing services and preserve progress/history/privacy. Tests are deferred; verify approved UI work with internal browser snapshots and keep focused commits/pushes. Shared migrations 0054–0058 are installed; re-audit target/journal read-only, never replay them. No database-fingerprint runtime gate, no invented certificate rules, no implicit memberships, no inferred merge authority. Tell me the next work item and proceed within approved scope.

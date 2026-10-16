# Dashboard v3 audit and bounded implementation

13 October 2026. Current checkout `939482b`; dedicated branch `codex/dashboard-v3-baseline`. Initial dirty state: only the user-supplied untracked `docs/pleros-dashboard-v3/`. Earlier work remains in the existing named stash; it was not applied. No commits, pushes, deployment or database changes.

## First gate

The current-truth addendum governs product policy. The indexed SVG/PNG, `originals.py`, `sidebar.py`, `core.py`, local font assets and canonical icon paths govern the baseline. Build `/preview/dashboard-v3` with frozen fictional Tolu/Efe data, then review the matched screenshot, computed-token audit and discrepancies. Propagation to live dashboard routes waits for visual approval.

The baseline has working drawer, root-area and notification interactions, report/plan/message inspection panels, and links to retained guarded routes. It does not simulate persisted reporting, playback or membership. Lesson playback and live home data binding are still needed for a fully connected first slice after the visual gate. Fixture roles change display only; live routes continue to enforce their real session permissions.

## Existing foundations and implementation sequence

| Flow | Routes / components | Owning services / data | Work type |
|---|---|---|---|
| You / Community / sidebar | `/dashboard`, `/dashboard/community`, `components/dashboard/shell`, `lib/dashboard/navigation.ts`, `lib/dashboard/viewer.ts` | `getDashboardViewer`, `getAppSession`, `getCommunityContext`; shared TanStack provider and notifications | Visual: one-row header, profile sidebar, local fonts, card/pill primitives. Keep desktop 256px sidebar breakpoint and retained navigation. Bind presenter to existing read models after baseline approval. |
| Reporting and contacts | report/new/[activityId]/history/people, `components/community/report/activity-form` | `activity-form.ts`, `daily-report.ts`, ministry-activity/outreach-contact queries | Visual form simplification plus new shared-meeting identity, individual reports and optional contact email. Compatible migration design required. Preserve self-only writes, date locks, Lagos eight-date edit window, Nil/confirmation distinctions and old metrics. |
| Learning paths | `/dashboard/sogp`, course/day/quiz/response, `/dashboard/podcast` | `podcast-journey.ts`, `podcast_journeys`, listened/progress records, active SOGP journey | New editable queue and pace/path state, earliest unfinished work, explicit episode marks, preserved separate histories. No podcast assessments or inferred cross-path credits. |
| Ownership / invitations | enrolment/start/complete, SOGP referrals/discipleship, `/sogp/discipleship/[code]`, `/admin/my-enrollees` | `enrollment-side-effects.ts`, referral/pastor-follow-up queries, `lib/sogp/discipleship.ts`, community messaging rules | New owner/reassignment lifecycle and account invitation delivery/acceptance. Keep follow-up ownership separate from accepted membership, church assignments and geography. |
| Church oversight | `/dashboard/church`, `[userId]`, church actions | `lib/church/permissions.ts`, church-organisation/reports queries | Reuse hierarchy drill-down and assignment-derived scope. No automatic SOGP staff rights from church appointment. |
| Required group reviews | SOGP journey/discipleship and certificate | Existing live-class/session attendance and certificate progress | New group/session scheduling and confirmed attendance with make-up evidence. Keep legacy attendance. Certification changes wait for approved thresholds/equivalence; no invented numbers. |

## Source-confirmed deltas

- `outreach_contacts.phone` is nullable; validation permits omission; no contact email column. New required-phone input must preserve legacy rows. Current access includes the owner, assigned geographic pastor and admins; private-first contact requirements need a scoped service/migration review, not a UI-only change.
- `daily_report_meeting_details` supplements individual activities; it is not a shared meeting record. The current leader validator requires taught text for both meeting kinds. New Teaching subject and Prayer venue/times must use the new compatible model without rewriting historical rows.
- `podcast_journeys` stores one `track` and `started_on`; the calendar model has one episode per date. It cannot represent editable 30/60-slot queues or the new continuity/pace rules yet.
- Enrolment referral attribution and geographic pastor assignment are independent post-response side effects. Approved referral-owner routing needs ordered/idempotent assignment and pending reassignment state.
- Existing discipleship group invitation confirmation is reusable but does not implement private-contact account matching or in-app invitation accept/decline.
- Existing assessment/Prayer Watch/daily live-review certificate logic is legacy behaviour. The addendum supersedes using those numbers as the new weekly-review policy.

## Deferred decisions

None blocks the visual baseline. Before each affected behaviour slice, resolve only its outstanding details: optional outcome unknown/zero semantics; shared-meeting visibility, cancellation/correction/duplicates/overnight zones and authorised leaders; owner-unavailable exceptions and reassignment authority; privacy-safe recipient discovery and invitation aftermath; review rescheduling/attendance corrections/make-up evidence and certificate rules. Collections, hierarchy bulk import and a general events module are not approved features.

## Verification

- Initial targeted regression suite: 7 files, 70 tests passed (shell, typography, welcome access, daily report states, church permissions, discipleship, podcast journey). TypeScript passed.
- Browser fixtures: learner plus Pastor/Unit leader display variants; canonical 390×844, narrow 320px, tablet and desktop checks. Record results in `BASELINE-REVIEW.md` and computed evidence. These fixtures do not replace real-role integration tests after live binding.
- Only supplied font weights 400/500/600/700; synthetic weights disabled. Inspect loaded font resources before captures.
- User inputs remain untouched. Source and baseline are uncommitted; evidence includes source fingerprints. No shared database was read or mutated by the preview.

## Paper

The supplied Paper file overview is accessible through its browser tools and confirms Be Vietnam Pro and the Start here page. Detailed child-node access returned an edit-access requirement. No Paper write or access change was made. The indexed supplied exports are the current visual comparison source.

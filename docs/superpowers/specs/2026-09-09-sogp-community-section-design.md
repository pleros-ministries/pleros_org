# SOGP Community section — design specification

## Status and scope

This specification defines the in-app Community section of the authenticated Pleros
dashboard. It supersedes the "native community discussion / messaging" out-of-scope
lines in `2026-08-28-sogp-dashboard-restructure-design.md` and
`2026-08-30-sogp-four-level-curriculum-design.md`. All other approved dashboard,
enrolment, Pre-SOGP, SOGP, Telegram, Prayer Watch, and public-shell decisions remain in
force.

Delivery is phased (Phase 1–5 below). Each phase ships its own migration and is
independently built, tested, and committed on the `feat/sogp-community` branch.

## Objective

Replace the dead "Community" dashboard card with `/dashboard/community`: a structured,
enrolment-gated, in-app community built on **location units** led by **unit leaders**,
containing

1. **official posts** — the ministry voice and unit-leader announcements;
2. a **discussion zone** — native threaded conversation among learners;
3. **unit spaces** — each learner's location group, its members and its leader;
4. **leader activity reports** — read-only unit summaries for unit leaders.

The per-cohort Telegram groups remain. The in-app community is additive, not a
replacement.

## Canonical language

- A **unit** is a location: a country, optionally narrowed to a state / province /
  region. It is cohort-agnostic and persists across cohorts.
- A **unit member** is an enrolled learner assigned to exactly one active unit.
- A **unit leader** is a member with `role = 'leader'` in their unit. Leadership is
  unit-scoped authority; it does not change the learner's global role, which stays
  `student`.
- An **official post** is a one-to-many broadcast authored by an admin (ministry-wide)
  or a unit leader (their unit only). Learners never author posts.
- A **thread** is a learner-started discussion; a **message** is a reply within it.
- A **flag** is a learner report of a post, thread, or message for moderation.

## Product decisions

- Access requires a valid SOGP enrolment, the same gate as Pre-SOGP and SOGP. A
  signed-in learner without an enrolment sees the Community card explaining the gate and
  linking to `/sogp/enrol`.
- Every enrolled learner belongs to exactly one active unit, assigned automatically from
  the country and region captured at enrolment. Admins can reassign, and can split,
  merge, or archive units.
- Each unit has one leader. Co-leaders are out of scope for the first version; a unit
  with no leader is a valid state (surfaced to admins).
- Discussion is native and threaded, with one level of reply nesting. Moderation
  actions are flag, hide, remove, and lock a thread. Bans, suspensions, and appeals are
  out of scope for the first version.
- Admins are central: the sole authors of ministry-wide posts, the owners of unit
  structure and the leadership roster, and the moderation backstop across every unit.
  Once units and leaders exist, admins are not in the day-to-day loop.
- Peers see only a learner's first name, unit, and a coarse progress stage. Email,
  phone, and surname are never shown to peers or included in any learner- or
  leader-facing payload.
- UK English, sentence case, Africa/Lagos as the authoritative timezone, the existing
  design tokens and warm visual system, and the compact MOOC-density SOGP shell (a
  sticky dark-brand-blue nav with a white back action and a lime identifier).

## Information architecture

The dashboard keeps its four two-card sections and eight-card order. The `community`
card in "Your Commitment" changes from a non-interactive `coming_soon` placeholder to an
`available` card linking to `/dashboard/community` for enrolled learners, resolved
server-side exactly as the `pre-sogp` and `sogp` cards are. Non-enrolled learners keep
the `coming_soon` treatment pointing at `/sogp/enrol`.

`/dashboard/community` is a hub with a sticky nav and four tabs:

- **Feed** — official posts: the ministry-wide stream merged with the learner's own
  unit posts, pinned items first, then most recent. Learners react but do not comment.
- **Discussion** — learner-started threads, in the community-wide scope or the
  learner's unit scope.
- **Your unit** — `/dashboard/community/unit/[unitId]`: the unit name, member count,
  leader card, the unit's Telegram link, the unit's posts and discussion, and a
  peer-safe member directory.
- **Leader** — `/dashboard/community/leader`: the activity report for the learner's
  unit. The tab is hidden unless the learner is a unit leader; admins reach it with a
  unit picker.

Administration lives at `/admin/community` (or a Community tab in the existing SOGP
admin): author and manage global posts, manage units, appoint and revoke unit leaders,
work the moderation queue, and view all-unit reports and community-health figures
(open-flag backlog, units without a leader, thread volume). It sits inside the existing
`/admin` shell and is gated by `requireAdmin()`.

## The unit (location) model

A unit is keyed on `(country_code, region_key)` where `country_code` is the ISO
alpha-2 code already stored on the enrolment and `region_key` is a canonical slug for
the state / province / region, or null for a country-level unit.

Assignment happens on enrolment completion: the country code and region are resolved to
a unit, creating it on demand, and the learner is inserted as a member. Because the
enrolment form currently collects `region` as free text — real values include "Oyo
state", "Ibadan" (a city), and "Osun/Ogun" — the design adds a structured state /
province selector to `/sogp/enrol` for supported countries, starting with Nigeria, and
keeps free text as a fallback for other countries. A free-text region that cannot be
canonicalised falls back to the country-level unit and is listed for an admin to place.

A one-off backfill assigns every existing enrolment to a unit on the same rules and
prints the residue that needs manual placement.

Unit leaders are appointed through an invite / accept / revoke flow modelled on
`staff_invites`: an admin issues a unit-scoped invite, the invitee accepts while signed
in and email-verified, and their `unit_members.role` becomes `leader`. Revoking returns
the row to `member`.

## Roles and permissions

A single helper, `getCommunityContext(userId)`, returns
`{ enrollment, unit, membership, isUnitLeader, isAdmin }`. Every community route,
server action, and query gates on it. Global role continues to come from
`getAppSession` and `requireAdmin`; leader authority is read from `unit_members.role`
and is always checked against the specific unit being acted on.

| Capability | Admin / super admin | Unit leader (own unit) | Enrolled student | Non-enrolled |
| --- | --- | --- | --- | --- |
| Read community and own unit | All units | Yes | Yes | No |
| Author an official / global post | Yes | No | No | No |
| Author a unit post | Any unit | Own unit | No | No |
| Start a thread, reply, react | Yes | Yes | Yes | No |
| Flag content | Yes | Yes | Yes | No |
| Hide / remove content, lock a thread | Anywhere | Own unit only | No | No |
| Create / split / merge / archive units, set a unit's Telegram link, reassign a member | Yes | No | No | No |
| Appoint / revoke unit leaders | Yes | No | No | No |
| Activity report | All units, plus community health | Own unit only | No | No |

## Official posts

An official post has a scope (global or unit), an author, an author kind (ministry or
leader), an optional title, a body in a limited markdown subset, a pinned flag, and a
status (published, hidden, removed).

Global posts are composed by an admin in `/admin/community`, reusing the Telegram
broadcast composer already in the SOGP admin. Publishing writes a global post shown in
every enrolled learner's Feed; an opt-in checkbox also posts the same text to the cohort
Telegram channel, carrying no learner PII. Unit posts are composed by that unit's leader
from within the unit page and are visible only to that unit's members. An author or an
admin can edit, pin, or hide a post; remove is a moderation state.

Learners react to posts with a single "🙏" reaction and cannot comment. Conversation
belongs in the discussion zone.

## Discussion zone

A thread has a scope, an author, a title, a status (open, locked, removed), and
maintained `last_message_at` and `message_count`. A message has a body, a status
(visible, hidden, removed), and an optional single-level `reply_to`. Any enrolled
learner opens threads in the community-wide scope or their own unit scope and replies
within them. Messages carry the same "🙏" reaction.

Thread and message creation is rate-limited per user with a short new-account cool-down,
using a windowed row count — no new infrastructure.

## Moderation

Any learner flags a post, thread, or message with a reason. A flag has a status of
open, actioned, or dismissed and records who handled it. A unit leader actions flags on
content in their own unit; an admin actions anything. The actions are hide (content is
replaced by a tombstone for everyone), remove (same, and the item 404s on direct
access), and lock (a thread accepts no further messages). The admin moderation queue
lists open flags with a link to the target.

## Leader activity reports

The leader report is a read-only, batched summary of one unit, computed the same way as
the admin SOGP roster: member count; the distribution of Pre-SOGP days completed; the
distribution of course level reached; morning Prayer Watch attendance; an at-risk list
of members with no tracked activity in a recent window; and recent joiners. Every figure
is an aggregate or a first name — no PII and no row-level export. A leader may optionally
nudge at-risk members, which creates an in-app notification and an opt-in push.

## Notifications

A single `notifications` table holds per-user entries with a kind, a JSON payload, and a
read timestamp. Entries are created for a new global post (fanned out to all enrolled
learners as a batched insert), a reply to your thread or message, being made a leader, a
flag resolution, and a leader nudge. Opt-in web push reuses the existing VAPID push
infrastructure and the staff-assignment notification pattern. The hub nav shows an
unread count and a list with mark-as-read.

## Relationship to Telegram

The per-cohort Telegram groups remain the place for real-time chat. Each unit stores its
own optional Telegram link, surfaced on the unit page. The standing rule not to promise
in-app discussion until a group is linked is satisfied by the native discussion zone
itself.

## Data model

New tables, one migration per phase:

- Phase 1 — `units`, `unit_members`, `unit_leader_invites`.
- Phase 2 — `community_posts`, `post_reactions`.
- Phase 4 — `community_threads`, `community_messages`, `message_reactions`,
  `content_flags`.
- Phase 5 — `notifications`.

All learner-owned rows reference `sogp_enrollments` or `users` with cascade delete.
`region_key` canonicalisation and the unit find-or-create run inside the assignment
transaction.

## Phasing

1. **Units, membership, assignment.** Schema, the structured state selector on
   `/sogp/enrol`, the enrolment assignment hook, the backfill script, and admin unit
   management. No learner-facing community UI.
2. **Community hub and official posts.** Activate the dashboard card, build
   `/dashboard/community` with the Feed tab, the admin global-post composer, and
   reactions.
3. **Unit pages.** The unit page, the peer-safe member directory, and leader-authored
   unit posts.
4. **Discussion and moderation.** Threads, messages, reactions, flags, and the hide /
   remove / lock actions with the admin moderation queue.
5. **Leader reports and notifications.** The leader report, the notifications table and
   centre, opt-in push, and the at-risk nudge.

## Out of scope

- Real-time chat, direct messages, and typing indicators.
- Media uploads in posts or messages beyond links.
- Bans, suspensions, and appeals.
- Public, unauthenticated visibility of any community content.
- Replacing the Telegram groups.
- Cross-cohort continuity of unit leadership terms (see open questions).
- Curated state lists beyond Nigeria; other countries stay country-level until curated.

## Open questions

- Countries other than Nigeria are country-level units until their state lists are
  curated. Confirmed as the first-version default.
- One leader per unit, with co-leader invites deferred. Confirmed as the first-version
  default.
- Official posts stay announcement-only with no learner comments. Confirmed as the
  first-version default.
- Reports are computed live rather than delivered as a scheduled snapshot. Confirmed as
  the first-version default.
- Learner relocation is handled by admin reassignment only; no self-service request.
  Confirmed as the first-version default.

## Verification

Automated coverage must prove, per phase:

- region canonicalisation, including the country-level fallback for unknown regions;
- enrolment assignment produces exactly one active membership, and admin reassignment
  moves it atomically;
- the permission matrix: a student cannot author a global or unit post or moderate; a
  leader's powers are confined to their own unit; a non-enrolled learner is blocked and
  sees the gated card;
- Feed ordering (pinned, then recency) and scope filtering, and reaction idempotency;
- the member-directory payload contains no email, phone, or surname;
- thread and message counters, the one-level reply cap, and the rate limit;
- a flag followed by hide or remove is reflected for every reader, and removed content
  404s;
- leader-report aggregates match a hand-computed fixture and the payload carries no PII;
- notification fan-out on a global post, mark-as-read, and push only when subscribed;
- the dashboard still exposes eight card titles in four two-card sections, and the
  Community card activates only for enrolled learners.

Release verification for each phase includes the focused tests, the full test suite,
lint, a production build, and responsive browser checks at mobile and desktop widths for
the hub, unit page, thread view, leader report, and the admin community panel.
Migrations are generated with a clean diff and applied only to a preview or staging
database until a production change is explicitly approved.

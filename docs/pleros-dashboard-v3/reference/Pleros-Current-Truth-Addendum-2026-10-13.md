# Pleros: current product decisions and build delta

**Decision cut-off:** 13 October 2026, including the latest review-scheduling answers.  
**Coverage checked:** 71 indexed mobile mockups after consolidation, including 18 new screens, their SVG text, source generators, flow index and retained-capability notes. Semantic review completed on 13 October at approximately 14:03 UTC.  
**Repository baseline:** main was checked on 13 October at approximately 12:05 UTC and resolved to [939482b](https://github.com/pleros-ministries/pleros_org/commit/939482b3d5aa8ba4486f580ee92662c2fd5dfb09). No later repository or production-state check is claimed.

## 1. Current truth: approved decisions

This addendum supersedes conflicting product statements in earlier requirements, mockups and repository documentation. Existing implementation is the migration baseline, not authority to override these decisions. Unmentioned existing capabilities and privacy protections remain in scope. Mockups illustrate intent; they do not prove functional completion.

### Learning and reviews

- Learners start immediately. Completing Welcome Pack or receiving an overseer is not a prerequisite. Existing learners keep their chosen path and progress unless they choose to switch.
- Paths remain traditional one-hour lessons, one podcast/day and two podcasts/day. Podcast plans start with suggested, editable 30-day lists of 30 or 60 slots. Purpose is a recommendation, not mandatory content.
- Missed learning waits for the learner; do not silently skip unfinished work because the calendar advances.
- A learner may switch paths at any time. Preserve completed history. Switching between one and two podcasts/day regroups remaining episodes. Traditional lessons are different content: podcast completion must not automatically award traditional-lesson credit, or vice versa.
- Learners mark each podcast episode listened. A two-episode learning day is complete only when both are marked. Podcasts have no required quiz or reflection. The learner may optionally ask a question. Traditional assessments are not removed by this decision.
- Weekly **group reviews are required for both traditional and podcast paths** and are required for certification. The discipler schedules reviews; the session leader confirms attendance. Missed reviews can be made up while learning continues.
- No new certificate percentage, required-session count, review equivalence or cross-path certificate formula has been approved.

### Follow-up, referrals and contacts

- Every enrollee has their own referral code and link. Code arrival automatically assigns the code owner. Link arrival automatically assigns the link owner, with the established accept/request-someone-else choice. These assignments do not create accepted group membership.
- Direct joins route to the geographical leader. Learners can request reassignment from their dashboard; current follow-up continues while the request is pending.
- A saved contact requires **name and phone**; email is optional. Contacts are private initially. Saving or organising a contact does not create an account, send an invitation or enrol anyone in a group.
- Group membership requires an invitation and explicit acceptance. Invite an existing account in-app; for a non-account contact, share the invitation link through WhatsApp. Do not infer account linking or membership merely from matching contact details.

### Ministry and meeting reports

- Use the simpler shared Evangelism/Discipleship form pattern, with accessible inline Add contact. The Discipleship form is approved, including reporting counts without names. Optional outcomes remain a visible proposal, not a final approved metric specification.
- The person who led first creates a **shared meeting record**. Workers and disciples select that existing meeting and submit their own attendance and people they brought. The leader also reports their own attendance and people brought, plus the total meeting attendance.
- Only **Teaching Meeting** has **Meeting subject**, replacing both the old meeting name and “What was taught” fields. Prayer has venue, start and end time, with no subject.
- When the meeting is absent, show **“Meeting not listed yet.”** There is no request/notification feature for this state.
- Meeting-report roles describe participation in that meeting; they do not create or change church appointments. Total attendance includes the leader and everyone present, rather than being added to personal/brought counts.

## 2. Consolidated mockup coverage and contradiction checks

### Prior contradictions corrected in the 71-screen source

- Both standalone and inline Add contact now require name/phone and offer optional email; privacy and no automatic invitation/account creation are explicit.
- Direct join now shows geographical assignment. Referral entry points say Start learning; pending reassignment explicitly retains current follow-up. My enrollees covers assignments across all sources.
- Purpose is optional in both onboarding and the episode library. Full-plan editing and a two-to-one pace preview retain completed history and regroup only remaining episodes. The example correctly expands 59 remaining episodes to 59 learning days rather than dropping content to fit 30 days.
- Traditional switching resumes that path’s saved place and preserves the podcast plan. No automatic cross-content credit is awarded.
- Episode marking and the optional question are separate. The two-episode day requires both explicit marks, even when an audio item has reached its end.

### New coverage now present

The 18 additions cover: My SOGP, enrollee referral sharing, dashboard reassignment request; learner weekly reviews, discipler scheduling and session-leader attendance; missed-review make-up and certification readiness; in-app invitation, pending acceptance, recipient accept/decline and WhatsApp-link sharing; episode library, full-plan editor, pace/path switching, two-episode listening and optional questions.

The prior shared-meeting screens remain aligned: leader creates a shared record; worker/disciple selects it; Teaching has one subject; Prayer has venue/times and no subject; only the leader supplies total attendance. Missing meeting offers no request feature. Counts-only Discipleship and accessible inline contact capture remain represented.

Church administration is represented as branch/unit/worker drill-down and reporting-line views, not a connected org-chart canvas. Separate SOGP coordinator views cover enrollee filtering, ownership, reassignment and My enrollees. Their access scopes must remain separate; a church appointment does not automatically grant every SOGP staff capability.

### Qualifications that must survive the build handoff

- The one-to-two pace change uses the same regrouping rule; the dedicated preview depicts two-to-one. Preserve both directions in implementation tests.
- Attendance controls contain example selections. New sheets begin **unconfirmed**; unmarked people must not default to missed.
- The make-up picker is a proposed interaction for explicitly offered sessions. Arbitrary later attendance does not automatically satisfy an earlier missed review. Certification has no invented numerical threshold.
- Optional question routing/privacy, safe recipient discovery, invitation success/decline aftermath and reassignment failure/resolution need complete interaction specifications.
- Full episode replacement, filters, day jumping and reorder controls are designed examples, not working controls. Validate all remaining days and interrupted/repeated actions during implementation.
- Existing profile/settings, notifications, auth/recovery, Welcome Pack, community/messages, Ask Pleros, traditional assessments, report history/edit/Nil/undo and staff routes are **retained**, not all newly redrawn. Map each route explicitly; absence from the new pack does not authorise deletion.
- Loading, empty, validation, retry, access-denied, historical and migration states still need implementation coverage. Account/group permissions and live behavior cannot be established from static screens.

## 3. Repository changes and remaining decisions

The existing repo already supplies reporting forms/history, declarations, church report drill-down, discipleship invitations, quizzes, profile, notifications and other dashboard destinations. Missing mobile mockups do not mean those features must be rebuilt from zero.

- [Podcast journey model](https://github.com/pleros-ministries/pleros_org/blob/939482b3d5aa8ba4486f580ee92662c2fd5dfb09/lib/podcast-journey.ts): currently one episode per calendar day, Foundations/series/latest choices and a Gospel-first default. Extend it for editable queues, missed-work continuity and safe pace/path switching.
- [Enrolment side effects](https://github.com/pleros-ministries/pleros_org/blob/939482b3d5aa8ba4486f580ee92662c2fd5dfb09/lib/sogp/enrollment-side-effects.ts): currently records referral attribution separately from geographic assignment. Implement approved referral-owner routing and the reassignment lifecycle without conflating ownership and membership.
- [Activity form](https://github.com/pleros-ministries/pleros_org/blob/939482b3d5aa8ba4486f580ee92662c2fd5dfb09/lib/community/activity-form.ts) and [meeting validation](https://github.com/pleros-ministries/pleros_org/blob/939482b3d5aa8ba4486f580ee92662c2fd5dfb09/lib/community/daily-report.ts): current per-person activity entries, generic attendance and required leader teaching text do not implement shared meeting identity, personal attendance/brought people and a separate total. Migrate compatibly; preserve historical records.

**Still unresolved; do not silently decide:**
- Exact optional ministry outcomes/definitions and whether omitted outcomes mean unknown versus zero. Existing metrics have not been explicitly deleted.
- “Others without names” in meeting reports and “Additional details” are proposals. Meeting-report visibility, corrections/cancellations, duplicate handling, time-zone/overnight validation and who may act as session leader need implementation specifications.
- Geographic/referral owner unavailable or unsuitable, reassignment authority/notification details and privacy-safe account matching need exception rules. Do not undo the settled routing defaults.
- Review make-up evidence, scheduling/rescheduling and attendance corrections need details. Certificate thresholds, counts and cross-path equivalence remain unapproved. Requiring reviews does not authorize inventing these rules.
- Private contact collections and bulk hierarchy import remain proposals unless separately approved. Do not infer a general events module from review scheduling.

## 4. Implementation acceptance checks

- [ ] A new enrollee can begin before Welcome Pack completion or owner assignment; existing learners retain their path/history.
- [ ] Missing a learning day leaves unfinished work waiting. Pace switching regroups only remaining episodes; path switching never fabricates cross-content credit.
- [ ] Purpose content can be replaced. One/two-episode completion follows explicit per-episode marks; no podcast quiz/reflection is required.
- [ ] Both paths expose required weekly reviews. Discipler scheduling and session-leader attendance confirmation are separately authorised. Make-up remains possible without blocking learning.
- [ ] Certification recognises the review requirement without introducing an unapproved threshold or equivalence formula.
- [ ] Every enrollee can share their code/link. Code/link and direct geographical routing follow the approved rules; pending reassignment retains current follow-up.
- [ ] All contact-entry surfaces require name/phone and permit optional email. New contacts remain private and saving has no account/invitation/membership side effects.
- [ ] Existing-account invitations arrive in-app; non-account links can be shared through WhatsApp. Membership changes only after explicit acceptance.
- [ ] Counts-only ministry reporting works. Named people are included in totals, not added again; optional outcomes remain distinguishable from approved mandatory fields.
- [ ] Leader creation produces one selectable shared meeting. Attendee reports reference it without overwriting its details. Teaching has one subject; Prayer has venue/times and no subject.
- [ ] Personal attendance, brought people and leader total remain distinct. Repeated saves are idempotent; neither brought-person claims nor reporter counts are presented as deduplicated attendance.
- [ ] Missing meetings show the approved empty state, without silently creating a meeting or request.
- [ ] Preserve self-only report writes, Lagos edit windows, Nil/not-reported/not-confirmed distinctions, reminder-only policy and server-side privacy/scope enforcement.
- [ ] Preserve historical content, attendance, reports, contacts, memberships and submissions. Test loading, empty, validation, retry, access-denied and historical states across retained routes.

**Build status:** the 71-screen consolidation covers the principal approved journeys and is sufficient to begin bounded implementation slices. Retained-route mapping, exception behavior and the explicitly unresolved policy details still need completion. This document is a product handoff, not evidence of code changes, deployment, migration or production verification.

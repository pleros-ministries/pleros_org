# Claude: redesign the authenticated Pleros dashboard

Redesign the **entire authenticated Pleros dashboard** as a polished, working interactive prototype on a new local branch. SOGP is one part of the dashboard, not the whole scope. Use `PLEROS-DEMO-HANDOFF.md` for detailed evidence. The demo must switch roles and explain the organization and daily reporting to the Pastor.

## 1. Inspect and protect
Read the latest checkout, AGENTS.md, docs/ai_scratchpad.md and relevant framework guidance. Inspect git status/current branch; preserve unrelated user changes. Create a clearly named feature branch safely. Never reset, clean, stash or overwrite work without approval. Current code/schema is truth; Oct 7 notes are historical. Use npm, existing tokens/components and server-action conventions. No automatic push, deployment, production migration, notifications or real-role changes. Follow repository verification restrictions; ask if QA needs approval and disclose unverified work.

## 2. Audit the actual current dashboard first
Before Mobbin research or redesign, run the current dashboard using an authorized local fixture/session and inspect its actual UI. The user explicitly requests this baseline audit and comparison QA; reconcile repository verification instructions with this authorization. No production writes, auth bypasses or real-role changes.

Audit Overview, SOGP, Reports, People/Organization, discipleship and shared navigation across available current roles at desktop and mobile widths. Capture labeled baseline screenshots. Inventory layout, typography, density, forms, navigation, repeated workflows, role visibility, and loading/empty/error states. Trace observed screens to routes/components and data/permission boundaries.

Produce a concise, prioritized audit with screen/source evidence and **keep / improve / replace** decisions. Distinguish actual bugs, missing meeting requirements and subjective visual preferences. Map planned changes to findings before implementation; timebox discovery so it enables the demo rather than delaying it. Do not seek approval for every design choice.

If the app cannot run, a session is unavailable or a role/state cannot be reached legitimately, state that limitation. Use code inspection plus available UI and label unobserved behavior; never invent screenshots or findings. Keep the baseline for post-redesign comparison.

## 3. Research the design
Use Mobbin to inspect 3–5 relevant desktop/mobile patterns for role-aware dashboards, organizational people views, reporting trackers and activity forms. Compare them, then choose one coherent direction. Record actual reference names/links and useful lessons. Do not copy whole screens or mix incompatible systems. If access fails, disclose that and proceed with an original design; never claim research not performed.

Aim for a confident, calm, high-quality **light UI**: deliberate typography, restrained color, strong alignment, useful density, excellent empty states and subtle interactions. You may depart from public-site fonts for the authenticated product while retaining recognizable Pleros identity. Reconcile repository guidance rather than inventing a competing token system. Prefer a finished product over generic admin cards or a decorative org chart.

## 4. Unified screen map
Build a coherent shell for **Overview, Daily reports, People/Organization and SOGP/formation**, with contextual discipleship and review access. Preserve routes/deep links where practical. Workers need daily actions; unit leaders need direct reports and missing-submission visibility; higher leaders need scoped roll-ups and exceptions. Separate personal devotion, personal discipleship and organizational oversight. Make navigation/density role-appropriate, responsive and keyboard-accessible, with visible focus and meaningful loading/error/empty states.

## 5. Make role-switching central
Add a clearly labeled **DEMO role/person switcher**, using synthetic fixtures only. Always display active person, organizational role and scope. This is presentation context, never authentication: no auth bypass, privilege elevation or fixture writes through live server actions. Isolate it behind an explicit preview boundary, preferably a preview route/state adapter, with no external side effects. Switching must change navigation, actions, people, scope and detail density, not merely labels. Share consistent fixture state across views; provide reset.

Demonstrate Pastor → intermediate pastor/pastorate layer → unit leaders → workers → disciples. Check schema labels and flag the uncertain spoken “pastorates” term; do not invent production enum roles. **Each leadership tier also leads its own disciples.** Keep organizational supervision separate from discipleship membership and follow-up ownership. Geographic community units, member-created groups and discipleship groups are different concepts. Count unique people separately from roles/memberships.

## 6. Reporting requirements
**Daily reports has exactly THREE primary choices:** Devotional reports, Ministry reports, Meetings reports. Support a selected day and show the consolidated full daily report beneath them.

**Devotional:** automatically reflect prayer, Bible reading, podcasts and word/SOGP participation already recorded elsewhere. Edit through canonical sources; no duplicate facts or re-entry. Remove the misplaced “On Pleros today” strip from the mixed landing; put its useful data in Devotional reports. Keep the concise daily-log prompt and consistent heading case; remove the extra Pleros-team visibility sentence identified in the call.

**Ministry has exactly TWO choices:** Evangelism / Discipleship. Preserve stored activity keys and validation. Capture online/offline context and platform where relevant, reach/outcomes and known contacts/status; anonymous online reach does not require names. Reach/attendance totals are not unique people. Outreach contacts versus accepted disciples remains partly unresolved: preserve access boundaries and never automatically remove inactive people.

Selecting an activity opens its form immediately: remove redundant Next after single choice, retain Back, focus management and validation. **Meetings** ask reporting role **Leader / Worker / Member**, separate from auth roles. Leaders report the whole meeting and what was taught; workers report people with them. Additional role-specific fields need confirmation. Retain existing teaching/prayer meeting kinds; do not create a fixed “Team meeting” taxonomy from imperfect audio. Meeting name/location were questioned, not definitively removed.

Distinguish **recorded activity, explicit Nil/no meeting, and not reported**. Show category/overall completeness to the person and authorized leader, with a clear date tracker. Completeness is reporting status, not spiritual merit or activity volume. Preserve Lagos dates and historical viewing; do not silently extend today's-plus-two-prior-days write window.

**Latest explicit user decision: daily reporting is expected; missing reports receive REMINDERS ONLY.** No sanctions, penalties, blocking, revoked access or punitive escalation. Reminder cadence/channel remain undecided; do not activate actual reminders. Prefer asynchronous submission and exception follow-up, not mandatory daily meetings. Reports/leader summaries update immediately from shared demo state; clearly distinguish this from unfinished live backend behavior.

## 7. Reuse and protect
Multiple named discipleship groups already exist: up to five led groups, twelve members per group, at most one active joined group under current rules. Preserve group IDs, invitations, ownership checks and paused/closed distinctions. Assignment is not membership: owner → contact → invitation → explicit acceptance. Reporting/reassignment must never auto-join someone.

Reuse `ministry_activities` and compiled devotional queries, not duplicate tables. Current privacy governs: admins see authorized administrative records; assigned location pastors see scoped activities/notes; disciplers see summed ministry numbers, not private notes; member-appointed unit leaders do not gain ministry access merely by title. Organizational preview access is illustrative until approved and enforced server-side. No private prayers, messages, answers, contact details or notes exposed by a newly drawn hierarchy. Proxy concepts separate subject/actor; never impersonate or manufacture consent.

## 8. Demo, QA and delivery
Make this journey work: worker opens three-category report → sees prefilled devotion → records Evangelism without extra Next → explicitly records Nil meeting → sees daily summary/completeness → switch to unit leader for submission status → switch upward for scoped roll-up → open that leader's own discipleship group → open SOGP in the same shell.

Prioritize this complete journey over unfinished breadth. Check role-dependent scope, consistent totals, Nil versus missing, date/filters, mobile navigation and isolation from live data. Clearly mark unsupported backend behavior. Retest the redesigned flows, keyboard/mobile states, errors and permission isolation against the captured baseline. Capture comparable after screenshots and explain which audited issues were resolved, retained or deferred. Respect AGENTS.md and the user’s explicit audit/QA authorization; disclose any checks still blocked or unrun.

Deliver branch name, concise audit and changes, baseline/after screenshots, exact local preview route, Mobbin references actually reviewed, demo script, checks actually run and remaining backend/policy gaps. **Do not push or deploy automatically.**

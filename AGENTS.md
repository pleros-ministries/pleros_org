# Pleros project guidance

## Working rules

- Read `docs/ai_scratchpad.md` before complex work. After meaningful corrections, consolidate the relevant rule there instead of appending a diary entry.
- Preserve unrelated dirty work. Inspect overlap first, edit narrowly, and stage explicit paths only when the user asks for a commit.
- Use **npm**; `package-lock.json` is canonical even though `pnpm-lock.yaml` exists.
- Read the version-matched Next.js documentation in `node_modules/next/dist/docs/` before changing framework behaviour.
- Do not run tests, lint, builds, React Doctor, or post-edit browser verification unless the user explicitly requests verification. Report edits as unverified otherwise.

## UI foundations

- Reuse the tokens in `app/globals.css`; preserve their names and do not create a second token system.
- Suisse Int'l is committed under `app/fonts/suisse-intl/`. Public/SOGP pages use the existing Sen and Be Vietnam Pro pairing through CSS variables.
- Reuse the branded primitives and public shells already in the app. Keep UI mobile-first, sentence case, calm, and visually distinct from stock shadcn.
- Keep learner auth pages (`/login`, `/forgot-password`, `/reset-password`, `/setup`) compact: 24px headings, 14px body/button copy, 13px labels/actions/errors, 12px helper copy, and 16px free-text inputs.
- On `/sogp/enrol`, keep the mobile hero around 38px/two lines, labels at 13px, buttons and dropdown values at 14px, helpers at 12px, and free-text inputs at 16px. Empty selects use muted text/chevrons; selected values use strong text and brand-blue chevrons.
- Enrolment validation is submit-only: required labels have asterisks; blur stays neutral; an incomplete submit focuses the first error, shows inline guidance, and marks invalid controls red.
- The enrolment CTA is `Continue setup`. The top `Already enrolled? Log in` link is underlined; the duplicate below the CTA is not. Privacy/support copy is left-aligned.

## SOGP learner authentication

Better Auth is the durable identity layer. `getAppSession()` maps the Better Auth identity to the app `users` record and its `student`, `instructor`, `admin`, or `super_admin` role.

Canonical learner routes:

- `/login`: always renders password and email-code login, even if a retained session exists; accepts validated internal dashboard `returnTo` paths.
- `/signup`: preserves safe UTM parameters and redirects to `/sogp/enrol`.
- `/sogp/enrol`: collects the required learner/cohort details and starts verified setup.
- `/setup`: requires the short-lived HttpOnly `pleros_sogp_setup_v1` cookie; verifies the submitted email, then creates the learner password.
- `/forgot-password` and `/reset-password`: six-digit email-code password recovery.
- `/dashboard/welcomepack/join`: first destination after successful setup.
- `/dashboard/welcomepack/setup`: the Welcome Pack's fourth card, "App and reminders" (install the app, turn on notifications, choose a teaching time, set reminders). The Telegram CTA on `/join` hands off to it, and its Continue button is never blocked.
- `/welcome`: permanently redirects to `/sogp`.

Legacy friendly aliases permanently redirect to the canonical routes: `/sign-in` → `/login`, `/sign-up` → `/signup`, `/sogp/enroll` → `/sogp/enrol`, and learner-facing `/ppc` auth aliases to their corresponding learner routes.

### New learner flow

1. `POST /api/sogp/enrol/start` normalises and validates the form, requires an open cohort, creates a 30-minute pending-enrolment record, sets the hashed-token setup cookie, and sends the appropriate six-digit Better Auth OTP. It creates no final enrolment or dashboard session.
2. `/setup` verifies mailbox control using email-verification OTP for new/unverified users or sign-in OTP for verified users. Codes expire after 10 minutes; resend cooldown is 60 seconds.
3. The learner creates an 8–128 character password. Completion requires the verified pending flow and a matching Better Auth session email; it replaces the credential and revokes other sessions.
4. `POST /api/sogp/enrol/complete` upserts the app user/enrolment, sends the confirmation email, clears the setup cookie, and redirects to `/dashboard/welcomepack/join`.

Never store or log passwords, OTPs, raw setup tokens, or full enrolment payloads outside the intended pending/final tables. Do not create a full app session from a public email-only form.

All authentication emails—SOGP OTP, password reset, email verification, staff invite, and super-admin setup—use the shared branded table-based shell in `lib/email/templates.ts`: soft sky header, lime eyebrow, white content, brand-blue action, Sen headings, Be Vietnam Pro body copy, medium weights, safe font fallbacks, and Outlook/MSO support. Keep them visually aligned with the SOGP enrolment confirmation email.

### Existing learners and protected routes

- Existing learners can use password login or an email code. Password creation/reset is available from the login form.
- Dashboard layouts redirect missing app sessions to `/login?returnTo=<validated-dashboard-path>`.
- The shared dashboard navbar shows sign out in the desktop navbar and inside the mobile menu for a full Better Auth session; signed-out mobile menus show `Log in`. Sign-out uses the server action in `app/_actions/auth-actions.ts` to clear the Better Auth session and redirect to `/login`.
- Local development trusts HTTP loopback origins on any port while production origins remain explicit; keep CSRF/origin validation enabled.
- SOGP dashboard/API access additionally requires an SOGP enrolment; a signed-in but unenrolled learner returns to `/sogp/enrol`.
- Preserve `admin` and `super_admin` identities, accounts, roles, and sessions during auth migrations or cleanup. Super-admin access remains email-verified and fail-closed.

### SOGP discipleship groups

- Any enrolled learner leads up to five named groups at `/dashboard/sogp/discipleship` (`DISCIPLESHIP_GROUPS_LED_MAX`). The first is created lazily; the rest are created, renamed and closed by the leader. Each group has its own regenerable 8-hex invite link `/sogp/discipleship/[code]`, its own WhatsApp consent, check-ins and prayer requests, and caps at 12. `?group=<id>` picks which led group the page loads in full, so per-disciple reads stay bounded to one group. The page separates "Groups you lead" from "Group you're in".
- One level only: each learner has at most one active discipler (partial unique index), so they lead many groups but belong to one, and cannot join their own group or their own disciple's group (`lib/sogp/discipleship.ts`).
- A group has three statuses: `active`, `archived` (paused by an admin) and `closed` (ended by its leader). Closing kills the link and releases the disciples but deletes nothing, cannot be undone, and is refused for the leader's last open group. A leader with a paused group cannot create another, and a paused group cannot be renamed or closed by its leader, so a pause cannot be sidestepped. Nothing in the schema caps groups per leader: `createDiscipleshipGroup` and `closeDiscipleshipGroup` lock the leader's enrolment row first (`lockLeader`). Every leader write re-checks that the group, disciple, answer or request belongs to an active group led by the caller's enrolment (`requireActiveLedGroup`, `requireLeaderMembership`).
- Joining always needs explicit confirmation on the invite page. Signed-out visitors log in with that invite path as `returnTo`; non-enrolled visitors go through `/sogp/discipleship/[code]/enrol`, which sets the code-only `pleros_discipleship_invite` cookie and forwards to `/sogp/enrol?ref=<leader referral code>`; `/dashboard/sogp` then shows a "Finish joining" banner.
- Disciplers see status, progress, average quiz scores and each disciple's daily ministry numbers only—never quiz answers, written submissions, email or a ministry report's note. WhatsApp shortcuts appear only with per-side consent (`shares_phone`, `leader_shares_phone`). Check-in answers are visible only to the current leader and hide when the disciple leaves or is removed.
- Accountability tools: preset-only encouragement nudges (plus a ≤200-char personal line, one per disciple per Lagos day via a `notification_checkpoints` key), a private discipler follow-up log (`discipleship_contact_logs`; WhatsApp taps log automatically), disciple prayer requests (Prayed/Answered with optional testimony, hidden when the disciple leaves), and check-in suggestions built from the teachings released in the last 7 days for the group's majority cohort.
- The daily `/api/cron/sogp-reminders` cron (05:20 WAT) runs `runDiscipleshipCron`: it alerts disciplers only on status transitions into at-risk/not-active or back on track (tracked in `last_known_status`) and sends a Monday digest per group (named when the leader runs more than one); the same cron prunes old reminder checkpoints, and neither job's failure blocks the other. Push text never contains check-in or prayer text; a group's name reaches only its own leader.
- Admins pause/restore groups one at a time from `/admin/community`; a restore never reopens a closed group. Never post discipleship data to Telegram.

### Learner reminders and notification preferences

- Hosting is Vercel Pro. `vercel.json` schedules two crons: the daily `/api/cron/sogp-reminders` and `/api/cron/reminder-dispatch` every five minutes. The dispatcher (`runReminderDispatcher`, `lib/notifications/dispatcher.ts`) sends every scheduled learner push: Prayer Watch, the teaching reminder, the evening nudge, the Monday summary and new-content alerts.
- Never match an exact minute. Each reminder has a due instant and a window, and claims a dated `notification_checkpoints` key (`claimCheckpoint`, `lib/db/queries/notification-checkpoints.ts`) before sending, so a late or repeated run delivers once. Prayer Watch, teaching, nudge and weekly reminders release their claim if they fail after taking it, so the next run retries; the one-a-day new-content claim is never released. The rules are pure functions in `lib/notifications/reminder-plan.ts`; zone maths lives in `lib/notifications/zoned-time.ts`.
- `learner_notification_preferences` holds one row per learner and is written only from `/dashboard/welcomepack/setup`. No row means the defaults (morning Prayer Watch reminder and community pushes on, everything else off), so no new kind of push starts until they save. The Prayer Watch audience is everyone in a cohort that has not ended by date (not by `status`), plus anyone who saved the reminders step. Read rows through `resolveReminderPreferences`.
- Prayer Watch reminders stay on Africa/Lagos, ten minutes before each session the learner chose. The teaching reminder, the 7:00 pm nudge and the Monday 8:00 am summary use the learner's saved IANA zone. Teachings unlock a week at a time, so only a Monday is held until the 6:00 am WAT release. The teaching day is the learner's own calendar date, and reminder links are always date-pinned (`?date=`) because the dashboards default to Lagos today.
- Choose the reminder cohort by dates, never by `status` (`chooseReminderCohort`), and discard a journey that belongs to a different cohort: the journey loaders pick enrolments differently.
- `sendPushToUser` requires a gate. `community` respects `community_enabled` (messages, replies, discipleship, Ask Pleros and Pleros updates); `none` is for staff pushes and for callers that already applied preferences. `notify()` filters a fan-out once with `listUsersWithCommunityPushOff`; the in-app notification is always written.
- A device is learner-bound (`push_subscriptions`) or anonymous (`site_web_push_subscriptions`), never both. `bindPushSubscription` re-binds the endpoint to the signed-in learner and removes the anonymous row; `PushBindingSync` in the dashboard layout repairs devices that subscribed through the public banner, which is hidden on every `/dashboard` path.
- New-content alerts are capped at one per Lagos day, and the first sighting of a source is only recorded. Anonymous subscribers receive nothing scheduled: `/api/cron/prayer-watch-reminder` and `/api/cron/new-video-check` stay unscheduled.
- Reminder push text carries titles and counts only, never message, check-in, prayer, quiz or written-response text.
- The browser fires `beforeinstallprompt` once per page load, so it is captured by `lib/pwa/install-prompt-store.ts`, loaded from the root layout. Do not move that listener back into a component.

### SOGP community

- `/dashboard/community` is the feed, `/dashboard/community/unit/[unitId]` the learner's location group (shown as "group" in learner copy; tables stay `units`), and `/dashboard/community/messages` private messages. `getCommunityContext()` is the single gate for every route, action and query; access needs an enrolment, admin rights or an assigned pastor region.
- Any enrolled learner raises a `discussion` (required title, optional topic from `lib/community/topics.ts`) in their own group or community-wide. `official` posts stay with admins anywhere and a leader inside their own unit (`lib/community/permissions.ts`); reposts stay with leaders and admins. Feeds sort Latest / Top / Unanswered and filter All / Official / Discussions (`lib/community/feed-view.ts`).
- Location groups (`units`) keep automatic membership: one unit per enrolment from country or Nigerian state, with no joining or leaving. Each is managed by the pastor assigned to its region (`pastor_regions`), an optional admin-appointed member leader, and admins; use `managesUnit` / `canSeeUnit` (`lib/community/permissions.ts`), never `isUnitLeader` alone. An assigned pastor has community access without an enrolment.
- Member-created groups (`community_groups`, `/dashboard/community/groups`): any community member creates one and owns up to three. Public groups are readable by everyone and joined at once; private groups show posts and members to members only and take join requests the owner or a moderator approves. Posting and commenting need membership even in a public group. Owners edit, close and choose moderators; moderators approve, remove and block members and pin or hide posts; admins can open and moderate any group, including private ones, from `/admin/community`. All rules live in `lib/community/groups.ts`.
- Peers see first name, join month and coarse stage only (`lib/community/visibility.ts`). The one exception is the new-message picker (`searchMembers` and `listSuggestedContacts`), which lists full names through `fullNameOf` so people who share a first name can be told apart; under-18s are never listed in that search, and the inbox, thread header and push text stay on first names. A user id reaches the client only as `messageUserId`, and only when the viewer may message that person; never send an age or under-18 flag to the client.
- Private messages are open between adult members. A conversation involving an under-18 (year of birth only, so anyone who could still be 17 this year) is allowed only with their unit leader, active discipler or an admin; every rule lives in `evaluateCanMessage` (`lib/community/messaging.ts`) and is re-checked in the server action on each send. Blocking stops messages both ways and is never revealed to the other person.
- Message text goes only to the two participants. Admins see a single message only when it has been reported (`content_flags` target `message`), never the rest of the conversation; unit leaders never see private-message reports. Push text names the sender only, and private messages never go to Telegram or into notification payloads.
- `/dashboard/community/discipleship` gives each discipleship group a private discussion space (`community_posts.scope = 'discipleship'` with `discipleship_group_id`) plus a member list by first name and join month. Only the group's discipler and current disciples can see, post or comment (`lib/community/discipleship-access.ts`); the posts never appear in the community or location-group feeds, cannot be shared, and admins see one only when it is reported. The discipler pins and hides; a paused group or a learner who has left loses access. A new post notifies the group by naming its author only, and a discipleship post's title stays out of push text. The learner sees one space for the group they joined and one for each group they lead that has disciples, listed apart. Progress, check-ins, prayer requests and the invite links stay on `/dashboard/sogp/discipleship`; the community view is read-only for membership and never creates a group.
- Posts have four scopes: `global`, `unit`, `discipleship` and `group`. Every read or write goes through `canViewPostRow`, `canCommentOnPostRow` and `canModeratePostRow` (`lib/db/queries/community-posts.ts`), including comments and likes; add any new scope there first. Discipleship and member-group posts stay out of the main feed and cannot be shared.
- Ask Pleros (`/dashboard/community/ask`, answered at `/admin/questions`): a learner asks the ministry a private question and must choose "Ask anonymously" or "Show my name" each time. When a question is anonymous, no admin screen, action result or email may identify the asker. Enforce that structurally: staff reads in `lib/db/queries/ask-pleros.ts` never select `asker_id` and null the name in SQL; `staffAskerView` (`lib/community/ask-pleros.ts`) is the only source of what staff see; `getQuestionDeliveryTarget` stays on the server for delivering the reply. Never list or surface `pleros_question_mutes`: showing who is muted would unmask an anonymous asker. Only the asker can reveal their name, one conversation at a time. Admins and super admins reply as "Pleros"; new questions email `ASK_PLEROS_INBOX_EMAIL` (falling back to `CONTACT_INBOX_EMAIL`) with no reply-to. The reply notification, push and email never contain the question or the answer, and none of it goes to Telegram or the moderation queue.
- Daily ministry reports (`/dashboard/community/report`, admin view at `/admin/ministry`): a member logs one or more activities per Lagos day (`ministry_activities`, at most 10 a day). The form offers evangelism (stored as `outreach`), discipleship (stored as `follow_up`), teaching meeting and prayer meeting, in that order; `church_service` and `other` stay in the enum and in `ALL_ACTIVITY_KINDS` so older rows still show and can be corrected, but cannot be added through the step-by-step form at `/dashboard/community/report/new` (edit at `/dashboard/community/report/[activityId]`), for today and the previous seven Lagos days. `ACTIVITY_KINDS` and `activityFields` in `lib/community/ministry-activities.ts` are the one list of which number fields each kind shows and requires (outreach reads its reached fields from its online/offline/both mode and records a platform or a location); `MINISTRY_FIELDS` in `lib/community/ministry-report.ts` lists the stored numbers for tables and the export (`totalReached` adds online, offline and people present); the step rules live in `lib/community/activity-form.ts`. An activity's kind and day never change after saving (remove it and add it again); removing an activity never deletes people. Their Pleros activity for the day (Bible reading, Prayer Watch, SOGP, podcast) is compiled live in `lib/db/queries/ministry-activities.ts` and never stored. Admins see everything; the pastor assigned to the member's location group sees that group's activities and notes on the leader page; a discipler sees summed numbers only; a member leader sees none. Totals and the 14-day table live on the History tab; the report is reached from the community navigation only. `/admin/ministry` takes a from/to range of up to 366 days (`resolveMinistryRange`) with sortable totals per member and per day, per-kind counts and expandable activity rows. `ministry_reports` is deprecated: migration 0046 copied every row into an outreach activity; drop it in a later migration once production is verified.
- People met in ministry (`outreach_contacts`): a lasting record per person (name, optional phone and note, salvation status, discipleship status, follow-up plan, next follow-up date) with an interaction history (`outreach_contact_interactions`: the `met` entry from the evangelism activity they were added in, then every call, WhatsApp, visit or message logged, each with saved/filled/healed outcomes and a note). People are added as rows in an evangelism activity's People step (the form always sends that activity's full list, so a row removed there deletes the person, refused when a pastor or admin has logged an interaction with them) and followed up either through a discipleship activity (picks existing people, one interaction each) or "Log a follow-up" on any list. `followed_up_at` / `followed_up_by` are derived from the earliest non-`met` interaction (`syncContactFollowUp`), so the "To follow up" / "Followed up" filters keep working. Every list (the member's People tab, the pastor's leader page, the admin page) uses `OutreachContactBrowser`, whose search, filters and sort come from `filterAndSortContacts`. They are people outside Pleros, so their details and history go only to the member who met them, the pastor assigned to that member's location group, and admins (`canSeeOutreachContact` in `lib/community/outreach-contacts.ts`; deleting an interaction also needs `canDeleteInteraction`): never to a discipler, a member leader or other learners, and never into notifications or Telegram. The range export (Activities, People met and Interactions sheets) contains these names and numbers and stays admin-only.
- Reports feed the admin queue at `/admin/community` and, for a unit's own posts and comments, the leader page. Admins pause a member's posting or messaging through `community_restrictions`.
- Expected failures in community server actions return `{ ok: false, error }` (`CommunityError`), because thrown messages are hidden in production. Client components import only types from `lib/db/queries/*`.
- Authenticated dashboard navigation now lives in `components/dashboard/shell/` and `lib/dashboard/navigation.ts`, with capabilities loaded by `getDashboardViewer()`. Desktop uses the left sidebar; tablet/mobile use one drawer, with one expanded parent at a time and text-only children. Community keeps its contextual title/messages/notification bar, not a duplicate bottom bar or left navigation rail. Its query provider is shared with the dashboard shell. `CommunitySidebar` remains feed-owned, and `CommunityGrid` gives feed/messages the full width while other pages stay readable. Feature sticky headers use `--dashboard-topbar-offset` (48px below `lg`, 0 on desktop). New church responsibilities are not derived from community moderator titles or auth role labels.
- Feeds, comments, the inbox and threads poll with TanStack Query; there is no realtime service; scheduled work runs only from the two crons in `vercel.json`.

### Retired Welcome Pack soft access

Dashboard and Welcome Pack resources require a full Better Auth app session. The old `pleros_welcome_access_v2` cookie is expired by `proxy.ts` and is never accepted by dashboard layouts, focused Welcome Pack routes, dashboard resources/actions, or downloads. `/welcome` permanently redirects to `/sogp`. Keep existing users, enrolments, progress, lead records, and staff/admin identities intact; the retired cookie is not an identity source.

### Dashboard consolidation rollout

- On this branch, report writes cover today and the previous seven Lagos days. Preserve historical read access and the existing activity keys/number validation.
- Migration `0050_daily_reporting_v2` prepares daily declarations and companion meeting-role details without duplicating canonical devotional facts or altering existing activity columns. Do not run production migrations automatically. Keep `DASHBOARD_DAILY_REPORTS_V2` disabled until migration and live form bindings are verified. Disabled reads must not query the new tables.
- Declaration actions derive subject/actor from the session; no proxy reporting. New activity writes and Nil declarations share a dated transaction lock; recording activity clears stale Nil.
- Church hierarchy/permission decisions and remaining implementation are in `docs/dashboard-demo/CONSOLIDATION.md`. They are not yet production assignments. Organisational readers never gain ministry notes/contact details by title.
- Missing-report reminders are in-app plus opted-in push, automatic at 8 pm Lagos plus manual, with one shared per-person/per-Lagos-day cap. Planning logic must not activate sends, change existing notification preferences or introduce penalties.

## Local commands and data

- Dev: `npm run dev` (Next.js/Turbopack; default port 3000, but local sessions may use another available port).
- Lint: `npm run lint`.
- Tests: `npm test`.
- Build: `npm run build`.
- SOGP seed: `npm run seed:sogp` (requires the configured database environment).
- PPC/admin database pages require `DATABASE_URL`; bulk seeds/migrations may require `DATABASE_URL_UNPOOLED`.
- Server mutations revalidate their affected layout/path. Keep learner SOGP and internal admin concerns separate even where older PPC infrastructure remains underneath.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

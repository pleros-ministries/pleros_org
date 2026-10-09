# Pleros organization and reporting: coding-agent handoff

Version 3 — 9 October 2026, 13:59 UTC. Final demo handoff incorporating both complete Thursday recordings and targeted independent transcription cross-checks. This is an implementation brief, not a claim that changes were built or deployed.

## 1. Start here: implement these explicit UI requests first

**The first demo priority is the Daily reports redesign, supported by Thursday p2 20:20–21:25:**
1. Landing has exactly three report choices: **Devotional reports**, **Ministry reports**, **Meetings reports**.
2. Devotion already logged in Bible reading, SOGP or podcast flows appears automatically in Devotional reports; allow correction through the canonical activity source, not duplicate entry.
3. Remove the misplaced “On Pleros today” block from the old mixed reporting screen; the separate Devotional reports destination replaces that placement. Keep the concise daily-log prompt, remove the extra Pleros-team visibility sentence, and use consistent heading capitalization.
4. Selecting an activity immediately opens its form; remove the redundant Next step after a single selection (p2 17:42–18:12).
5. Teaching/team meeting (exact spoken label uncertain) and prayer meeting forms ask **Your role: Leader / Worker / Member**, and adjust the form/report to that role (p2 18:12–18:42). Role-specific exact fields remain partly undefined; do not invent mandatory requirements.
6. **Ministry reports has exactly two choices: Evangelism / Discipleship** (p2 21:25–21:55 independently decoded). Capture online/offline context and online platform as appropriate; reuse existing data keys.
7. Show the **full report for the selected day** beneath the categories, explicit Nil/no meeting responses, and a reporting tracker visible to the member and authorized leader (p2 23:25–25:51). Distinguish reporting completeness from the quantity of activity.
8. Reporting is asynchronous each day; leader dashboards surface missing submissions and follow-up needs. Do not schedule mandatory daily worker meetings.

These concrete requests outrank the optional broader navigation proposals below.

### The organizational story behind the UI

Make **my personal activity**, **people I disciple**, and **leaders/workers I oversee** distinct, connected workspaces. A pastor or unit leader can do all three. Do not collapse them into one group or one permission role.

For the imminent demo, start at the three-choice Daily reports landing, then show this story: a worker records ministry and sees their separate devotion report → their unit leader reviews the worker's daily summary → the next leader sees the unit roll-up and outstanding reports → the leader switches to their own discipleship group. Preserve the separate enrolment-owner → contact → invite → explicit join flow.

Build on the existing reporting and multiple-group implementation. The Oct 7 brief is historical: current main already contains substantially more functionality. Do not recreate tables, introduce duplicate reporting, or remove current constraints based on that older brief.

### Evidence labels
- **CONFIRMED-CALL:** clearly supported by the Oct 7 reviewed notes or understandable Thursday audio/transcript passages; names and unclear terminology are excluded.
- **EXISTING-CODE:** observed in current repository files; not a deployed-environment verification.
- **PROPOSED:** recommended demo/engineering choice, not an approved ministry policy.
- **OPEN:** needs product/organizational confirmation or remaining recording review.

## 2. Sources and coverage

- [Oct 7 implementation notes](https://docs.google.com/document/d/1K7uot6gqEl5LTO_CHuSyF9NAtnggO2cOYGmdZ3LaysQ/edit): complete prior 19:31 call review; historical code baseline 701b530bcbfd14847f73e0a1c690ffbc505a9d4e. The text is included as OCT7-BASELINE.txt.
- [Thursday Oct 8, part 1](https://drive.google.com/file/d/1lOyJLf0Aj4gGIZ2WEvyq8d6gwmQeA7AO/view): 19:42 total; part 1 transcription is complete; this version incorporates its full 19:42.
- [Thursday Oct 8, part 2](https://drive.google.com/file/d/1DyFGGU_FIs3eXE6XmIHGxbjtLzHbSWrK/view): 30:47 total; complete 30:47 transcription incorporated; three-category/report-field and hierarchy/async passages independently decoded again.
- Thursday recordings are voice-call screen recordings. Part 2 verbally walks through the current UI, but no full visual site demonstration was verified. Machine transcription has recognition errors. Timestamps below are relative to the named part. Exact names, disputed roster count (97), and the second-level label must not become production data without confirmation.
- Current repository search resolved main to **81ffba8f25623287027ae7735c6255b6ff717dbf**. Light source inspection, not exhaustive audit or live testing.

## 3. Organization model and vocabulary

### Call-supported relationships

**CONFIRMED-CALL**, Thursday p1 12:11–14:16: the described five layers are Pastor → pastorates/pastors → unit leaders → workers → disciples. The second-layer term is imperfectly transcribed: use a configurable label and confirm it before a migration or fixed role taxonomy.

The crucial distinction: the Pastor leads the next leadership layer **and their own disciples**; the next pastor tier leads unit leaders **and their own disciples**; a unit leader leads workers **and their own disciples**; workers lead disciples. Organizational oversight and personal discipleship are overlapping responsibilities, not the same edge in a single tree.

**CONFIRMED-CALL**, p1 05:07–06:46: fix roster gaps; show authority layers and a deduplicated total number of people. Proxy registration/reporting for less digitally active people is suggested. Do not assume they all have app accounts. Four/seven/fourteen-person examples are capacity discussion, not approved caps.

### Recommended conceptual entities (PROPOSED; reuse equivalents)

| Entity | Responsibility | Important distinction |
|---|---|---|
| Person | One human, stable identity, optional linked login/enrolment | A roster person is not necessarily an authenticated user |
| Organizational unit | Named ministry/oversight unit, parent if approved | Existing geographic community unit is not automatically this unit |
| Role assignment | Person + organizational role + scope + active dates | Domain title must not automatically grant global admin access |
| Oversight relationship | Supervisor → accountable worker/leader, scoped and dated | Separate from discipleship membership and follow-up ownership |
| Discipleship group | Named group led by enrolment, explicit accepted members | Multiple led groups; at most one joined group under current rules |
| Follow-up assignment | Enrolment → accountable follow-up owner | Assignment is never acceptance into a group |
| Activity / participation | What occurred, subject, date, source, submitting actor | Imported/derived activity differs from self-report or proxy entry |
| Review meeting | Purpose, supervising scope, time, reviewed period, outcomes | Discipleship engagement differs from organizational review |

Deduplicate people using stable IDs, not names. Count **unique people**, **role assignments**, and **group memberships** separately. Do not sum overlapping subtree/group headcounts and label the result unique people. A leader serving in two capacities appears once in unique totals but can appear in both responsibility lists.

Proxy entry recommendation: display “Recorded by X for Y,” keep subject and actor separately, make authorization explicit, and allow correction with history. Never impersonate the person's login, mark invitation acceptance, or backfill consent. Treat real proxy registration as backend work until identity and consent policy is approved.

## 4. Current implementation: reuse this foundation

**EXISTING-CODE**, current main:

- Daily ministry activities already exist in `ministry_activities`; `ministry_reports` is deprecated after migration 0046. Daily form at `/dashboard/community/report/new`; edit `/dashboard/community/report/[activityId]`; Report / People / History tabs under `/dashboard/community/report`.
- The form offers **Evangelism** (`outreach`), **Discipleship** (`follow_up`), **Teaching meeting**, **Prayer meeting**. Old `church_service` and `other` rows remain readable/correctable but are not new-form options.
- Activities can be entered for today and the preceding two **Africa/Lagos** dates; maximum 10 per person/day. Preserve until changed deliberately. These are existing implementation rules, not a new call mandate.
- `/admin/ministry` already includes date ranges, unit/member filters, sortable totals per member/day, kind counts, expanded activities and exports. Default range is last 30 days, capped at 366 days.
- `DayActivity` compiles Bible reading, Prayer Watch, SOGP and podcast participation live beside ministry reports; do not copy these facts into a second report table.
- Named discipleship groups already support list/create/rename/close and per-group invite links. `DISCIPLESHIP_GROUPS_LED_MAX = 5`, `DISCIPLESHIP_GROUP_MAX = 12`, one active joined group. `?group=<id>` selects the led group. `archived` means admin pause; `closed` means leader closure. Preserve distinctions.
- `/dashboard/sogp/discipleship` is progress/check-ins/prayer/invites; `/dashboard/community/discipleship` is the private group discussion space. Do not merge their data access casually.
- Existing follow-up foundation from Oct 7 is `pastor_assignments`, scoped My Enrollees, contact logging, location routing and explicit group invitation acceptance. Recheck current assignment files before changing them.
- Welcome dashboard already links Podcast (`/dashboard/podcast`), Devotion (`/dashboard/prayer-watch`), SOGP and Community. Code describes a 30-day podcast journey; the Oct 7 tailored one/two-per-day request must be assessed against the current journey implementation, not rebuilt blindly.
- Existing staff navigation in `lib/ppc-shell.ts` includes Community, Ministry reports, Pastors and My Enrollees. Organizational oversight can be a coherent surface joining these concepts, not another unrelated admin app.

### Repository working constraints

Read repository `AGENTS.md` and `docs/ai_scratchpad.md` before implementation. Use npm and existing tokens/primitives; preserve unrelated dirty work. Current AGENTS.md explicitly says **do not run tests, lint, builds, React Doctor or post-edit browser verification unless the user requests verification**. This brief's acceptance checks are specifications, not permission to run them. Read installed Next.js version-matched docs before framework changes. No code changes, migrations, commits, deployment or external communications were made for this handoff.

## 5. Reports: meaning, audience, fields and cadence

### Thursday UI correction and later clarification (CONFIRMED-CALL, p2 09:00–21:25)

The call navigates Community → More → Daily reports and asks to remove the “On Pleros today” / Bible-reading-type block from that reporting surface. The later explicit design puts devotion inside a separate **Devotional reports** choice on the **Daily reports landing**. Do not restore the old mixed-page block; do include the requested devotional-report destination. Make the report title capitalization consistent, keep the short daily-logging prompt, and remove the explanatory line about the Pleros team seeing reports. Exact original copy must be checked in current components because transcription is imperfect. The four activity choices are discussed; reuse current code labels. Direct notes/logging on assigned people is discussed.

### A. Devotion / formation report

**EXISTING-CODE:** Bible chapters and current book/chapter; Prayer Watch sessions (morning/afternoon/evening or unspecified); podcast episode count; applicable SOGP preparation/listening/quiz attempt/written submission/review attendance. SOGP is absent when no cohort applies; no teaching released is different from not listened.

**CONFIRMED-CALL:** Devotional reports is one of three Daily reports choices and automatically reflects activity logged elsewhere, with editing. **PROPOSED UI:** within that destination, show four compact labeled rows or cards with “Recorded / Not recorded / Not applicable,” period and source. Never translate missing activity into a judgment of spiritual commitment. Keep detailed quiz answers and private written responses out of leader roll-ups.

**Audience/cadence:** personal daily activity and authorized leader review. Current repository permissions govern exposure. Do not re-enter devotional facts: use existing canonical queries and source-specific edit controls. The call requests automatic display and editing, not a second daily submission for already-recorded activity.

### B. Ministry activity report

**CONFIRMED-CALL**, p2 21:25–22:55: Ministry has Evangelism / Discipleship; evangelism distinguishes online/offline and platform, overall reach/outcomes, identifiable contacts and their status where known. Discipleship updates can concern people inside or outside the discipleship group (p2 22:55–23:25), but access rules and People-tab design remain unresolved. Do not require identities for anonymous online audience reach.

**EXISTING-CODE:** date, kind, optional title/place/note, contextual number fields. Shared numeric keys: reachedOnline, reachedOffline, attendance, saved, notSaved, filled, healed, followUps.

- Evangelism: online/offline/both, platform/location, relevant reached counts required; optional outcome counts and people met.
- Discipleship: follow-up count and optional saved/filled/healed; existing people selected for interactions. Blank follow-up count can default to number of selected people.
- Teaching/prayer meeting: attendance required, optional saved/filled/healed, title/location.
- Notes have 500-character limit; integers are nonnegative. Reuse existing validation and label constants.

Current `totalReached` adds online + offline + attendance. Label this as recorded reach/attendance totals, not deduplicated individual people or verified conversion outcomes. Repeated attendance across activities is not unique reach.

**Audience:** own records; admins all; assigned location pastor scoped activities/notes; active discipler summed ministry numbers only; member-appointed unit leader no ministry access under current rules. Any new oversight permissions need explicit policy and server-side implementation.

**Cadence:** activities recorded daily/current allowed window; oversight daily review is discussed in Thursday p2 opening. Do not impose new deadlines from that discussion.

### C. Organizational oversight report (new synthesis, PROPOSED)

For selected period and authorized scope: direct reports, expected reporting population if defined, submitted/recorded/not recorded, activity totals by category, meetings held, outstanding follow-ups, and “needs attention” based on explicit missing information. Show the source rows and generation time. “Expected” requires a real scoped roster; don't use all accounts as denominator.

Two lenses: **my direct reports** and **entire permitted scope**, clearly labeled; deduplicate roll-ups. Personal disciples' activity stays separate from the supervisor's own reporting duties. Drill-down must not reveal private notes merely because a person appears below the supervisor.

### D. Follow-up ownership report

**CONFIRMED-CALL**, Oct 7: accountable owner, attempted contact and response visibility, report assembly from recorded events. **PROPOSED fields:** owner, routing reason, assigned date, last contact, outcome, next action/date, unresolved assignment reason. Distinguish not attempted/no response/responded/declined. Routing precedence and approved roster remain OPEN. Thursday p1 18:39–19:40 reinforces prompt/immediate follow-up once assigned, location/pastoral structure and SOGP participation for online entrants. Church attendance is a separate later matter; do not automatically make entrants church members.

### E. Meeting/review report

**CONFIRMED-CALL**, p1 13:05–17:04: distinguish discipleship engagement from unit leader–worker, pastorate–unit leader and Pastor–pastorate oversight meetings.

**CONFIRMED-CALL**, p2 17:42–18:42: meeting forms need reporting role Leader / Worker / Member; reports differ by role, and worker reporting should account for people with them. Single activity choice should enter its form immediately, with Back available. Meeting name/location are questioned rather than definitively removed; retain optional existing fields pending confirmation.

**PROPOSED minimum for organizational review records:** purpose/type, organizer, scope, scheduled/held date, participants or expected participants, reviewed reporting period, decisions, assigned next actions and next review. These exact fields are not dictated by the call. Existing ministry teaching/prayer activity types are not automatically organizational accountability meetings.

### F. Full daily report and completion tracker (CONFIRMED-CALL, p2 23:25–25:51)

Three report categories are shown for today or another selected day. Generate a full daily report beneath them and expose whether the person has finished reporting. A person explicitly recording no meeting/Nil must not look identical to someone who never reported. Leadership sees reporting status as well as the reported content. A SOGP-like date tracker/dashboard is suggested.

**PROPOSED state model:** each category is `not_reported`, `reported_activity`, or `reported_nil`; `not_applicable` only where a real rule establishes it. Overall is `not_started`, `in_progress`, or `complete`, calculated from applicable categories. Derived devotional activity is prefilled; whether it automatically finalizes that category or needs a confirmation click is OPEN. A zero count alone must not mark a category reviewed.

This likely needs explicit persisted category declarations or a daily-report envelope; merely adding up activity rows cannot distinguish Nil from missing. Reuse canonical activities and add minimal metadata only after a schema audit. Under the demo deadline, use isolated preview declarations and label persistence unfinished if not implemented. Never claim mock completeness is stored in production.

“Maybe compulsory” is considered; do not invent blocking mandatory validation, deadlines, sanctions, or reminder automation. Allow historical viewing; current today-plus-two-day edit policy stays until changed deliberately. Broad “any other day” wording does not by itself settle backdating permissions.

## 6. Meeting cadence: retain uncertainty honestly

Thursday p2 00:00–04:05 discusses daily discipleship engagement and daily unit-leader/worker reporting, with higher-level cadence initially uncertain. Short meetings of about ten minutes per adjacent layer and a roughly thirty-minute reporting sequence are floated; individuals in two tiers would spend roughly twenty minutes. Morning review and a possible evening alternative are discussed.

**Later discussion supersedes the blanket-meeting idea:** p2 04:05–07:42 proposes asynchronous daily reports through the Pleros dashboard. Unit leaders check workers’ submissions and make reminder calls / meet when reports are missing. Each layer needs its dashboard and a daily reporting process/timeline. Prioritize submission coverage and exception follow-up, not mandatory meetings for every person every day.

**Do not hardcode a 9 a.m./9 p.m. schedule or create recurring calendar events.** The call is considering mechanisms. For demo show configurable cadence / next review / “time to confirm.” Reports can be assembled before meetings; a meeting is a review mechanism, not the only way to submit activity. Later p2 26:30–28:26 targets roughly ten minutes for reporting and ten–fifteen minutes for issues, proposes daily unit-leader/pastorate discussion and possible weekly wider review. These are planning ideas, not an approved schedule or system-enforced SLA.

## 7. Proposed screen map for the refactor

Keep existing route contracts where possible; names below are UI proposals.

1. **Overview**: personal vs leadership context; today/period; my activity summary; people awaiting contact; reviews due only when dates exist.
2. **Daily reports (explicit requirement)**: exactly three primary choices: Devotional reports / Ministry reports / Meetings reports. Devotional shows compiled existing participation; Ministry contains evangelism/discipleship; Meetings routes teaching/prayer forms with Leader/Worker/Member reporting role. The two Ministry choices are explicit call requirements; mapping the existing teaching/prayer activity kinds into Meetings is the natural implementation mapping, with exact teaching/team label to confirm. Preserve stored enum keys. Keep People/History contextual, not extra competing primary report categories. Remove old “On Pleros today” placement; short daily-log prompt.
3. **My disciples**: groups I lead selector; separate group I belong to; named groups, progress, appropriate numbers, explicit invitation link.
4. **Oversight**: direct reports list with role and unit; tree/list toggle; unique headcount; missing roster links; person detail with separate Responsibilities / Activity / Reviews tabs.
5. **Leadership reports (proposed separate oversight surface)**: Devotion / Ministry / Oversight / Follow-up lenses; shared date/scope bar; totals → drill-down; clear coverage labels. Do not add these as fourth/fifth choices to the three-choice Daily reports landing.
6. **Meetings**: Upcoming / Held; type distinguishes discipleship and organizational reviews; review selected period then record outcomes. If backend absent, clearly labeled preview data only.
7. **People to follow up**: preserve existing My Enrollees and outreach People ownership boundaries; do not collapse their access rules just to share a visual table.

Design: mobile-first, branded blue/sky/lime and current typography/tokens, strong page title, compact data-dense cards, one obvious action per page, accessible selected state. Breadcrumb should show organizational scope, while personal discipleship group selector is visibly separate. No decorative org chart at the expense of a useful roster table.

## 8. Three end-to-end demo flows

### Flow 1 — Worker to leadership visibility (primary)
1. Open Daily reports as fictional Worker A; date is Lagos today. Show exactly three report choices.
2. Open Devotional reports: existing Bible/Prayer Watch/podcast/SOGP entries appear automatically; select edit to reach the canonical source, then return. No duplicate devotional entry.
3. Open Ministry reports (Evangelism / Discipleship only), select Evangelism and enter its form immediately without a redundant Next.
4. Record an evangelism activity using existing form, appropriate mode/counts and synthetic person only in isolated demo state.
5. Open Meetings reports, explicitly record no meeting for the synthetic day; show the full daily report and reporting-completeness tracker. View History; activity summary comes from the same source.
6. Switch clearly labeled demo role to Unit Leader B. Open direct reports, review A's permitted summary, filter date, drill into permitted numbers.
7. Show next-level aggregated unit report with unique people separate from activity/reach counts. Do not claim new cross-tier permissions are live.

### Flow 2 — Leader has two responsibilities
1. In Oversight, show Unit Leader B's workers.
2. Switch to My disciples; choose one of B's named groups.
3. Show a second group and its distinct invitation link; keep group membership/leadership separate from the oversight roster.
4. Show organizational review meeting separately from a discipleship encounter. A worker report meeting is not a group-enrolment operation.

### Flow 3 — Contact before joining (regression-protection story)
1. New enrollee has an accountable follow-up owner or explicit unresolved status.
2. Owner records contact and response.
3. Owner chooses correct named group and obtains its invitation link.
4. Learner opens link and explicitly accepts; only now does group membership change.
5. Reassignment or reporting never joins the learner to a group. No external messages should be sent merely to stage the demo.

## 9. Twenty-minute preparation scope

**Minutes 0–3: orient.** Read current guidance, inspect working tree and existing components, choose reusable shell. Confirm demo uses local/synthetic data and identify what is already functional.

**Minutes 3–10: the explicit report redesign.** Implement the three-choice Daily reports landing, compiled Devotional reports and direct-entry activity choice. Reuse existing activity forms; add Leader/Worker/Member meeting-role selection with honest preview labels if persistence is absent. These beat a new organization-tree feature under the deadline.

**Minutes 10–15: completeness and oversight preview.** Add full daily summary, explicit Nil and reporting-state/date tracker using honest preview state if needed. Then reuse report cards/forms; consistent date/scope, and a compact direct-reports preview with separate oversight/discipleship relationships. Add no new production security roles. If time is short, skip the tree and use a roster list.

**Minutes 15–20: prepare the demonstration.** Seed only isolated fixtures, add deterministic role/scope preview if appropriate, document route sequence and unfinished backend. Run verification only if user authorizes it; otherwise state unverified.

**Defer:** monthly giving/pledge confirmation (p2 28:56–29:30 is a future idea), production organizational migration/roster import, proxy registration, new security roles, transitive identifiable access, durable reporting jobs, external calendar or messaging integration, live notification sends, automatic owner routing redesign and deployment. These need policy, backend work and authorized verification.

## 10. Acceptance criteria / invariants

- Ministry has only Evangelism / Discipleship; Meetings remains its own report category.
- A full selected-day report and tracker distinguish reported activity, explicit Nil and missing; completion is not an activity score.
- Daily reports has exactly three primary report categories; existing devotional entries are automatically reflected and edited at source, never duplicated.
- Activity selection opens its form directly; meeting role is explicit and changes only approved/preview fields, not global app permissions.
- One person can have oversight responsibilities and personal discipleship groups without duplicate identity or unintended permissions.
- Organizational unit, geographic community group, member-created group and discipleship group are labeled distinctly in data and UI.
- Unique roster count does not double-count roles/groups; reach totals are not called unique people.
- Reports show period, scope, generation/source and missing/not-applicable states; daily dates follow existing Lagos rules.
- Personal activity remains the source of truth; devotional activity is compiled rather than duplicated.
- Existing numeric fields and four offered activity types remain compatible; deprecated history renders.
- Group selector always passes group ID; current ownership, paused/closed distinction, limits and consent are preserved.
- Assignment/contact/invite/explicit acceptance remain separate. No automatic membership changes.
- Proxy UI separates actor from subject and does not impersonate or imply unrecorded consent.
- Server-side authorization protects all reads/actions/exports; new hierarchy cannot expose outreach contact details, private prayers, messages, answers or ministry notes to unauthorized people.
- Demo fixtures cannot mutate production, send notifications or appear as actual ministry results.

## 11. Open decisions (do not block the UI preview)

1. Exact second-level title and authoritative roster; role-to-app-permission mapping; one or multiple organizational parents.
2. Who may record for whom, who can correct proxy entries, and how non-account people become verified accounts without duplicates.
3. Exact role-dependent meeting fields, final reporting deadline, whether derived devotion needs explicit confirmation to complete, and any mandatory-submission rule; higher-tier cadence and meeting times.
4. Which organizational supervisors may see identifiable activity versus aggregates; private-note boundaries stay restrictive until approved.
5. Whether location units equal organizational units in any scope; do not infer equality from the word “unit.”
6. Eligible follow-up roster, routing precedence and failure handling; capacity examples are not policy.
7. Current podcast presets/tailoring requirements relative to Oct 7 request; preserve completion history.
8. Disciple → worker → unit-leader progression was discussed as future complexity, not an automatic promotion rule.
9. People-tab scope is debated at p2 14:26–15:06: receptive contacts vs strictly accepted disciples; postponement is suggested. Preserve existing outreach-contact and discipleship privacy boundaries until settled. Do not remove people automatically for inactivity.
10. Exact fields by meeting reporting role, and whether name/location should stay. Keep reporting role separate from authentication/organizational role.

## 12. Targeted implementation entry points

- `components/community/report/pleros-today-strip.tsx` contains the exact “On Pleros today” block. Remove its old placement; reuse its underlying data in the new Devotional reports destination rather than deleting activity tracking.
- `components/community/report/activity-form/activity-form.tsx`: `chooseKind` currently updates draft only; `next` separately validates/advances. Make selection advance to the appropriate next step with the selected kind, preserving Back, validation, edit-mode locked kind, and focus behavior. Do not call stale-state-dependent step logic immediately after setting React state.
- `lib/community/activity-form.ts` owns draft/steps/validation/toSaveInput. If adding meeting role, propagate through validated draft, save input, action, persistence and readback; a visual selector alone is not a completed backend feature.
- `components/community/report/report-tabs.tsx` owns Report/People/History. Keep these contextual tools while the Report landing gets exactly the three requested report categories.
- Existing report route action: `app/(site)/dashboard/community/_actions/report-actions`. Reuse server-action conventions and enforce current access rules.

## 13. Source-code anchors

Use this inspected commit for comparison; check the working branch before editing:
- [Repository guidance](https://github.com/pleros-ministries/pleros_org/blob/81ffba8f25623287027ae7735c6255b6ff717dbf/AGENTS.md)
- [Ministry fields and date/participation rules](https://github.com/pleros-ministries/pleros_org/blob/81ffba8f25623287027ae7735c6255b6ff717dbf/lib/community/ministry-report.ts)
- [Activity kinds and validation](https://github.com/pleros-ministries/pleros_org/blob/81ffba8f25623287027ae7735c6255b6ff717dbf/lib/community/ministry-activities.ts)
- [Admin report UI](https://github.com/pleros-ministries/pleros_org/blob/81ffba8f25623287027ae7735c6255b6ff717dbf/components/community/admin-ministry-page.tsx)
- [Report tabs](https://github.com/pleros-ministries/pleros_org/blob/81ffba8f25623287027ae7735c6255b6ff717dbf/components/community/report/report-tabs.tsx)
- [Discipleship queries](https://github.com/pleros-ministries/pleros_org/blob/81ffba8f25623287027ae7735c6255b6ff717dbf/lib/db/queries/sogp-discipleship.ts)
- [Discipleship constants/rules](https://github.com/pleros-ministries/pleros_org/blob/81ffba8f25623287027ae7735c6255b6ff717dbf/lib/sogp/discipleship.ts)
- [Staff navigation](https://github.com/pleros-ministries/pleros_org/blob/81ffba8f25623287027ae7735c6255b6ff717dbf/lib/ppc-shell.ts)
- [Learner dashboard content](https://github.com/pleros-ministries/pleros_org/blob/81ffba8f25623287027ae7735c6255b6ff717dbf/lib/welcome-dashboard-content.ts)

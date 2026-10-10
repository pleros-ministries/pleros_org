# Authenticated dashboard baseline audit

9 October 2026. Baseline commit `d6071fc`; branch `codex/authenticated-dashboard-demo`. Clean checkout before work. Local server: port 3011. No production session, writes or role changes.

## Observation limits

Inspected actual existing components through their built-in synthetic previews: Overview (`/preview/dashboard`), SOGP (`/preview/dashboard/sogp`), discipleship (`/preview/dashboard/sogp/discipleship`). Captured desktop 1440 × 1000 and mobile 390 × 844 screenshots in `screenshots/baseline-*`. These are existing learner/discipler fixtures, not authenticated production-role screenshots. `/dashboard/community/report` redirected to login; screenshot records this limitation. At initial discovery, Reports, organization and staff/admin visibility were code-inspected only. Later a legitimate local session became available; the unchanged Reports landing, activity chooser and People empty state were inspected read-only and captured at both widths. This supplemental baseline was captured during preview implementation, after initial research, without editing the original components. The selected Evangelism choice visibly retains a Next button. Initial empty activity choice shows Save activity before a kind is selected. Other unobserved role/error states remain labelled.

## Priorities and decisions

| Priority / type | Evidence | Decision / demo response |
| --- | --- | --- |
| P1 meeting requirement | Overview baseline has Start here / Your devotion / Your training / Your commitment cards, without organizational scope or reporting coverage. `components/dashboard/welcome-dashboard-view.tsx`, `lib/welcome-dashboard-content.ts`. | Replace launcher as primary demo home with role-aware Overview, daily actions and leadership coverage. Retain devotion/training destinations. |
| P1 meeting requirement | `components/community/report/report-day-view.tsx` mixes all ministry activities and `PlerosTodayStrip`; no three-category landing or Nil metadata. Visually unobserved. | Replace in isolated preview with exactly Devotional / Ministry / Meetings, full selected-day summary and explicit Nil versus missing. Preserve compiled devotion concept; no duplicate facts. |
| P1 workflow friction, source-confirmed | `ActivityForm.chooseKind` only changes draft; `next` advances separately. `components/community/report/activity-form/activity-form.tsx`. | Direct-entry activity form in demo, preserving Back, shared pure validation and stored kinds. Do not change live actions for prototype. |
| P1 policy/data gap | Schema auth roles are student/instructor/admin/super_admin/pastor. Organizational hierarchy and report completeness do not represent approved live permissions. | Synthetic role/person adapter; clear scope, unique headcounts and illustrative oversight labels. No auth changes. |
| P2 visual preference | Overview pastel tiles and large dark header; SOGP and discipleship each use separate navigation/visual density. See paired screenshots. | Improve one light shell, Suisse product type, existing brand tokens, restrained colour and persistent navigation. |
| P2 keep/improve | SOGP baseline has useful date tracker, ordered tasks and course outline. `components/sogp/sogp-journey-page.tsx`. | Keep weekly rhythm and task ordering; show formation within unified shell, with fixture-only learning actions. |
| P2 keep/improve | Discipleship baseline explicitly separates led and joined groups, distinct invites, 12-member cap, consent and private panels. Mobile uses condensed rows. `components/sogp/discipleship-page.tsx`, `lib/sogp/discipleship.ts`. | Keep group identity/limits and distinctions; improve contextual roster density and empty group state. Never expose private material via hierarchy. |
| P2 scope/permission boundary | `lib/db/queries/ministry-activities.ts`: devotional `getDayActivity` compiled live; discipler queries numbers only. `lib/community/outreach-contacts.ts`: owner/assigned location pastor/admin access. | Reuse pure activity keys/validation. Demo supervisors see status/numbers only; own contacts remain separate from accepted disciples. |

## Screen map

One isolated `/preview/pleros` experience: Overview → Daily reports → People & organization → My disciples → SOGP. Personal devotional sources stay distinct from organization oversight; contextual leadership review is reached through People/Overview. All tiers have personal discipleship. Mobile navigation must offer all destinations and show active synthetic person/role/scope. Shared fixture state updates reporting/coverage immediately; reset restores fixture state.

## Risks and deferred decisions

No verified current UI bug is claimed from unavailable screens. Three-category reporting, Nil, hierarchy and role-dependent meeting fields are requirements/backend gaps; shell/density choices are visual preferences. "Pastorate" terminology is uncertain. Reporting expected; reminders only, channel/cadence undecided, no automated sends. Production category declarations, organizational roster/access policy and exact meeting-role fields require later backend work. Historical viewing stays separate from today's plus two prior days write window.

## Supplemental authenticated observations

The Reports screen visibly confirms the mixed activity landing, lengthy visibility copy and misplaced devotional strip. Its empty state is clear but cannot distinguish explicit Nil. People is an empty owned-outreach-contact browser with search and four filters; retain its access and useful filtering rather than treating it as an organization roster. Current source components are unchanged by the isolated preview. Available session was used only for reads and unsaved form selection, never live submission or role changes.

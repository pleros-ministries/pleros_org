# Pleros demo: paste-ready coding-agent brief

Read PLEROS-DEMO-HANDOFF.md for evidence, current code and permission boundaries. This brief is a plan; execute only within the user-authorized coding environment/scope. Do not deploy, migrate production, contact people or change live roles just to stage a demo.

## Build first
1. Daily reports landing: exactly Devotional reports / Ministry reports / Meetings reports.
2. Devotional: auto-populate prayer, Bible reading, podcasts and word/SOGP activity from existing records, with editing through canonical sources. Remove the old misplaced On Pleros today strip.
3. Ministry: exactly Evangelism / Discipleship. Online/offline context and platform where relevant. Reuse ministry_activities and existing validation.
4. Select activity → enter form immediately; remove redundant Next after kind selection, retain Back and validation.
5. Meetings: reporting role Leader / Worker / Member; use role-specific fields only where established. Existing teaching/prayer meeting kinds remain compatible. Role is report context, never an auth upgrade.
6. Full selected-day report beneath categories; explicit Nil/no meeting; reporting-completeness tracker for self and authorized leader. No activity and no submission must differ. If persistence is missing, show clearly isolated demo state.
7. If time remains: compact direct-reports view and separate personal discipleship-group selector. Async daily reports and missing-submission follow-up; no mandatory blanket daily meetings.

## Preserve
- Current multi-group support already exists: up to five led groups, 12 per group, at most one active joined group.
- Follow-up assignment is not discipleship membership. Contact → invite → explicit acceptance stays intact.
- Organizational oversight, geographical community units, member-created groups and discipleship groups are separate concepts.
- Existing ministry-report privacy: admin all, assigned pastor scoped notes/activity, discipler numbers only, member-appointed unit leader none. New organizational reporting permissions are not yet approved.
- Africa/Lagos report dates; current today plus previous two days mutation window. Historical viewing does not authorize unlimited backdating.
- Use existing tokens/primitives and npm. Read AGENTS.md and docs/ai_scratchpad.md. Current repo forbids tests/lint/build/browser verification unless user explicitly requests verification.

## Demo sequence
Worker opens three-category report → sees prefilled devotion → adds Evangelism without extra Next → records Nil meeting → full report/completeness → authorized leader sees submission state → switch from oversight roster to own named discipleship group.

## Defer / disclose
Production org tree, proxy account registration, new permissions, report-envelope persistence if unfinished, automated reminders, calendar schedules, routing overhaul, giving/pledges and deployment. No hardcoded role promotions, personal names from ASR, disputed headcounts, meeting deadlines or fixed span-of-control caps.

Evidence: full Oct 8 recordings (19:42 + 30:47) with targeted re-decoding, prior Oct 7 notes, light current-main inspection at 81ffba8f25623287027ae7735c6255b6ff717dbf. See main handoff for links and unresolved choices.

# SOGP feedback round two — design specification

## Objective

Improve the SOGP conversion and onboarding experience, support a 24-track curriculum model, make preparation content date-driven and admin-managed, and make Telegram the urgent first action after enrolment.

## Approved scope

### Public landing page

- Keep `/sogp` as a distraction-free conversion page.
- Add the selected “immersive learning world” hero visual: a responsive phone mockup showing the SOGP dashboard, with floating Telegram and daily-formation cards.
- Preserve the white hero and current headline hierarchy.
- Replace “What is SOGP?” copy with the supplied copy, correcting obvious grammar and UK English.
- Place the section CTA after the highlighted outcomes.
- Change audience item 5 to: “Those desiring empowerment to do the work of ministry and to function in the supernatural.”
- Use contextual CTA labels, all linking to `/sogp/enrol`:
  - Hero: `Enrol to get started`
  - Early sections: `Begin your enrolment`
  - Mid-page sections: `Start your journey`
  - After curriculum: `Enrol to start learning`
  - After the free-access offer is introduced: `Enrol for free`

### Enrolment

- Replace full name with required first name and last name fields.
- Use `Phone number` as the label and `Use the number linked to your WhatsApp account.` as helper text.
- Use an international phone input, validate the number, and store E.164 format.
- Use a searchable country-of-residence selector.
- Preselect country from Vercel request geolocation when available; fall back to Nigeria; allow the learner to change it.
- Keep phone-number country and country of residence independently editable.
- Add a required `State / province / region` field.
- Add this privacy assurance below the form: “Your information is kept private and used only to manage your enrolment, learning experience, and relevant SOGP communications. We will not sell your personal information.”
- Store structured first name, last name, country code/name, and region while maintaining the existing derived full-name contract for sessions, email, and dashboard display.
- Show region in `/admin/sogp` enrolment operations.

### Curriculum

- Model SOGP curriculum placement independently of the source PPC level.
- Support exactly 20 required weekday tracks and up to four optional Level 3 tracks.
- Optional tracks prepare learners for Saturday live sessions and do not affect certification.
- Discipline replaces Commitment in SOGP Level 1.
- Cohort activation requires all 20 required tracks to be selected and content-ready.
- Certification and progress percentages count required tracks only; optional completion may be displayed separately.
- Five additional Level 3 selections remain intentionally undecided: one required and four optional. Ask the user for these after the rest of this scope is complete, then finish the curriculum assignment and public list.

### Preparation dashboard

- Date-specific preparation content belongs to authenticated `/dashboard/sogp`, not the public landing page.
- Add cohort-specific preparation days and resources managed from `/admin/sogp`.
- A preparation day includes publication date, countdown label, introduction, ordered resources, and draft/published status.
- Resource types are teaching, podcast, video, reading, gift, and announcement.
- Learners see today’s published content first, followed by previous published days in descending order.
- Future and draft content is never exposed to learners.
- If no item is published for today, show a clear pending state and retain the previous-days archive.
- All day boundaries and countdown labels use the Africa/Lagos calendar.

### Enrolment email

- Make the message urgent and Telegram-first.
- Subject: `Your SOGP enrolment is confirmed — join Telegram now`.
- Primary CTA: `Join the Telegram channel now`.
- Explain that Telegram supplies information, gifts, reminders, updates, and the dashboard link throughout learning.
- Remove the dashboard button and direct dashboard link from the email.

## Data design

### Enrolments

Add structured fields to `sogp_enrollments`: `first_name`, `last_name`, `country_code`, and `region`. Retain the legacy `name` and `country` columns for compatibility, writing them from the structured values. Backfill structured names from existing full names on a best-effort basis; new submissions enforce all approved required fields in application validation.

### Cohort tracks

Extend `sogp_cohort_tracks` with SOGP curriculum level, required/optional status, and optional live-session association. Required tracks keep weekday day numbers. Optional tracks use ordered curriculum positions and release dates without contributing to required-track completion.

### Preparation content

Add `sogp_preparation_days` and `sogp_preparation_resources`. Days belong to a cohort and are unique by cohort and publication date. Resources belong to a day and have type, title, optional description, URL, and sort order.

## Admin behaviour

- Add preparation management inside the existing `/admin/sogp` surface.
- Use existing admin shell, permissions, TanStack Query, Suspense/error-boundary conventions, and compact operational styling.
- Support create/edit/publish/unpublish/delete for preparation days and ordered resources.
- Update curriculum readiness to distinguish `20 required` from `up to 4 optional`.
- Do not expose unselected placeholder teaching names publicly.

## Error handling and privacy

- Geolocation is only a default; enrolment never fails because geolocation is missing.
- Invalid phone numbers, missing structured names, country, or region return field-level errors.
- Country and phone defaults remain user-editable.
- No learner personal data is sent through Telegram broadcasts.
- Preparation reads are cohort- and enrolment-scoped; preparation writes remain admin-only.

## Verification

- TDD for enrolment normalisation/validation, phone formatting, curriculum required/optional calculations, Lagos preparation visibility, and email output.
- Migration/schema contract tests and query tests.
- Focused component and route tests for CTA ordering, copy, phone/country fields, privacy assurance, admin preparation controls, and learner archive states.
- Browser verification at mobile and desktop widths for `/sogp`, `/sogp/enrol`, `/dashboard/sogp`, and `/admin/sogp`.
- Verify Telegram redirect after successful enrolment remains unchanged.
- Run lint, focused tests, full test suite, production build, and React diagnostics before commit/push/deploy.

## Out of scope until final user selection

- Naming and assigning the five additional Level 3 teachings.
- Publishing placeholder Level 3 titles.
- Making optional tracks certificate requirements.

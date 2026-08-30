# SOGP four-level curriculum — design specification

## Status and scope

This specification replaces the curriculum, active-SOGP schedule, progression,
eligibility, administration, and active-dashboard sections of
`2026-08-28-sogp-dashboard-restructure-design.md`. The approved dashboard,
Welcome Pack, Pre-SOGP, enrolment, Telegram, Prayer Watch, notification, and
public-shell decisions remain in force unless explicitly changed here.

## Objective

Organise SOGP into four sequential levels of six required tracks so that each
learner sees a clear near-term goal, completes one level before entering the
next, and still finishes the 24-track programme within four Monday-to-Sunday
cohort weeks.

## Canonical language

- A **PPC source level** identifies where a reusable lesson record originated.
- An **SOGP level** is a six-track learner progression gate. It is independent
  of the lesson's PPC source level.
- A **track** is one required SOGP teaching and its assessment.
- A **review** is the required Sunday live session or its recording.
- A **formation requirement** is Prayer Watch or review attendance. Formation
  requirements affect certification, not level unlocking.

## Canonical curriculum

All 24 tracks are required. There is no optional Extras section.

### SOGP Level 1 — Gospel foundations and the Spirit

| Order | PPC source | Track |
|---:|---|---|
| 1 | L1.1 | Gospel: The Word of Truth |
| 2 | L1.2 | God's Purpose: Why We Exist |
| 3 | L1.3 | The New Creation: Who You Are in Christ |
| 4 | L1.4 | Faith Stand: How to Grow in Christ |
| 5 | L3.2 | Discipline – The Foundation of the Pursuit of Purpose |
| 6 | L3.1 | Baptism of the Holy Ghost |

### SOGP Level 2 — Doctrinal foundations

| Order | PPC source | Track |
|---:|---|---|
| 7 | L2.1 | Introduction to Doctrinal Summaries |
| 8 | L2.2 | Bibliology |
| 9 | L2.3 | God and His Eternal Purpose |
| 10 | L2.4 | Biblical Origin and Ontology |
| 11 | L2.5 | Sin and Its Implication |
| 12 | L2.6 | God's Wisdom Towards Redemption |

### SOGP Level 3 — Redemption and lived faith

| Order | PPC source | Track |
|---:|---|---|
| 13 | L2.7 | Christology |
| 14 | L2.8 | Redemption |
| 15 | L2.9 | Church and Its Mission |
| 16 | L2.10 | Eschatology |
| 17 | L2.11 | The New Creation |
| 18 | L3.3 | The Walk of Faith |

### SOGP Level 4 — Practical life and assignment

| Order | PPC source | Track |
|---:|---|---|
| 19 | L3.4 | The Life of Prayer |
| 20 | L3.5 | Believer's Authority |
| 21 | L3.6 | Healing in the Newness of Life |
| 22 | L3.7 | Natural Assignment in the Newness of Life |
| 23 | L3.8 | Spiritual Assignment in the Newness of Life |
| 24 | L3.9 | Supernatural in the Newness of Life |

## PPC Level 3 data mapping

The database's generic PPC Level 3 lesson titles are replaced as follows while
remaining draft until their complete teaching content is supplied:

1. Baptism of the Holy Ghost
2. Discipline – The Foundation of the Pursuit of Purpose
3. The Walk of Faith
4. The Life of Prayer
5. Believer's Authority
6. Healing in the Newness of Life
7. Natural Assignment in the Newness of Life
8. Spiritual Assignment in the Newness of Life
9. Supernatural in the Newness of Life
10. Unused; remains draft and outside SOGP

Renaming rows does not publish them. Audio, notes, quiz questions, written
response prompt, and marking guide remain mandatory readiness requirements.

## Cohort schedule

- Every cohort starts on a Monday in Africa/Lagos.
- Monday through Saturday releases one track each day.
- Sunday contains Prayer Watch and one required review session; no teaching is
  released on Sunday.
- Four weeks produce 24 tracks, four Sunday reviews, and 28 Prayer Watch dates.
- Track `n` releases at the start of its mapped Lagos calendar date.
- Learners can finish incomplete work after the cohort ends.

The release date for track position `p` is derived from:

- `weekIndex = floor((p - 1) / 6)`
- `dayIndex = (p - 1) mod 6`
- `releaseDate = cohortMonday + weekIndex * 7 days + dayIndex days`

## Level unlocking

SOGP uses both date gating and completion gating.

- Level 1 opens when the cohort begins.
- Levels 2–4 require their scheduled Monday to arrive and every assessment in
  the previous level to be complete.
- Tracks inside an unlocked level still require their individual release date.
- Completing a previous level late immediately unlocks every already-dated
  track in the next level.
- Completing a level early never exposes a future week's tracks.
- Assessment completion retains the existing rule: required quiz passed and
  required written response successfully submitted. Later staff-review state is
  visible but does not reverse calendar completion.

Prayer Watch and review completion do not unlock levels. This keeps progression
focused on learning while formation remains visible and certificate-gating.

## Calendar states

The active SOGP calendar retains the established colours:

- **Green:** every requirement for that date is complete.
- **Grey:** future date, or current date with an incomplete requirement.
- **Red:** past date with an incomplete requirement.

Monday–Saturday dates require Prayer Watch plus the track assessment. Sunday
dates require Prayer Watch plus the scheduled review. A track whose release date
has arrived can still be level-locked; its daily panel explains which previous
level must be completed.

## Progress and certification

Learner progress displays:

- current level and `x of 6` level completion;
- four-level overview with locked, available, in-progress, and complete states;
- `x of 24` overall track completion;
- Prayer Watch attendance percentage across 28 dates;
- `x of 4` required reviews.

Certification requires:

- all 24 assessments complete;
- at least 80% Morning Prayer Watch attendance across the cohort dates;
- all four reviews completed live or by recording.

Podcast remains independent of SOGP progress and certification.

## Data and domain design

- One typed canonical curriculum map is the source of truth for source lesson,
  SOGP level, order, week, and day.
- `sogp_cohort_tracks.curriculum_level` supports values 1–4.
- Every configured cohort track has `is_required = true` and a non-null
  `day_number` from 1–24.
- `week_number` equals the SOGP level for this fixed programme.
- `curriculum_order` is the stable global order 1–24.
- Optional-track and Extras behaviour is retired from SOGP reads, writes,
  eligibility, UI, and tests. Existing columns remain compatible but unused.
- Existing progress, quiz, written submission, Prayer Watch, review attendance,
  certificate, and reward tables remain the persistence sources.

No configured cohort tracks currently exist in the target database, so the
change requires no destructive cohort-track migration.

## Administration

- Remove arbitrary required/optional practical-track selection from the SOGP
  admin experience.
- Show the fixed four-level curriculum and readiness of every source lesson.
- Configure the cohort from the canonical 24-track map only when all tracks are
  present and content-ready.
- Activation requires a Monday start date, 30 valid Pre-SOGP lessons, 24
  content-ready curriculum tracks, and four required Sunday reviews.
- Readiness groups missing content by SOGP level and source coordinate.
- Learner operations show current level, level completion, overall completion,
  Prayer Watch, and reviews.

## Public curriculum

The `/sogp` curriculum accordion changes from three levels to four and uses the
canonical ordering and level descriptions in this specification. The public
page continues to describe SOGP as a four-week programme.

## Learner dashboard

- Replace the Extras section with a four-level progress section.
- The selected day shows its SOGP level and position within that level.
- Locked-level dates show the previous-level completion requirement instead of
  assessment controls.
- Mobile keeps the calendar above daily content.
- Desktop keeps the calendar beside daily content.
- Calendar selection remains local and immediate; mutations remain optimistic
  with rollback and authoritative query reconciliation.

## Preview routes

Create durable, sign-in-free previews:

- `/preview/dashboard/pre-sogp`
- `/preview/dashboard/sogp`

Fixtures are deterministic, contain no learner data, and never call mutation
APIs. The SOGP fixture demonstrates:

- completed and missed Level 1 dates;
- an available current Level 2 track;
- a future date;
- a level locked by incomplete prior assessments;
- a Sunday review;
- all four level-summary states.

## Migration

Add a Drizzle SQL migration that renames PPC Level 3 lesson rows 1–9 to the
approved titles without changing publication status. The migration verifies the
expected source rows and leaves row 10 unchanged.

The curriculum map, public content, admin configuration, preview fixtures, and
database mapping must use the same source coordinates.

## Error handling

- Reject cohort configuration if the start date is not Monday in Lagos.
- Reject configuration unless exactly 24 unique source lessons resolve.
- Reject duplicate curriculum positions or source coordinates.
- Keep future and locked lesson content unavailable server-side; visual locks
  are not access control.
- Preview mode uses injected fixture data and local-only interactions; it never
  calls enrolment, progress, Prayer Watch, review, or push APIs.

## Verification

Automated coverage must prove:

- exact 24-track canonical ordering and four groups of six;
- Baptism is Level 1 track 6;
- PPC Level 2 splits 6 then 5 across SOGP Levels 2 and 3;
- The Walk of Faith is Level 3 track 6;
- Monday–Saturday releases and Sunday reviews for four weeks;
- Monday cohort-start validation;
- date-plus-prior-level unlock rules, including late catch-up;
- 24-track certificate eligibility and removal of Extras;
- public four-level curriculum fidelity;
- fixed admin readiness and configuration;
- deterministic, non-persistent preview fixtures;
- mobile calendar-before-content order;
- full tests, lint, TypeScript, build, React diagnostics, and browser checks.

## Out of scope

- Publishing incomplete PPC Level 3 content.
- Changing Pre-SOGP's 30-day curriculum.
- Changing the 80% Prayer Watch threshold.
- Native community discussion.
- Advanced SOGP.

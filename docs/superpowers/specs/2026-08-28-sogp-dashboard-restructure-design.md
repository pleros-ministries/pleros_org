# SOGP-centred dashboard restructure — design specification

## Objective

Reorient the authenticated Pleros dashboard around School of God's Purpose (SOGP), retire PPC as a learner-facing product, add a 30-day enrolment-gated preparation journey, and make the active four-week SOGP experience calendar-led.

The restructure reuses the working cohort, lesson, assessment, progress, administration, and browser-push foundations. It does not create a parallel SOGP platform or redesign the public homepage.

## Product decisions

- The existing cohort-based SOGP experience becomes the only live training product on the dashboard.
- PPC is retired from learner-facing navigation and routes. Reusable PPC-era lesson, assessment, progress, staff, and admin infrastructure remains until it can be renamed safely.
- Existing PPC accounts do not receive SOGP access automatically. Every learner must enrol in a dated cohort through `/sogp/enrol`.
- `/sogp/enrol` remains the canonical enrolment route.
- Legacy learner-facing `/ppc` routes permanently redirect to `/sogp`.
- Pre-SOGP and SOGP experiences require a valid SOGP enrolment.
- Africa/Lagos is the authoritative timezone for dates, completion deadlines, countdowns, and reminders.
- User-facing copy uses UK English and sentence case.
- Existing token names and the warm public Pleros visual system remain unchanged.

## Dashboard information architecture

The dashboard shows four paired rows in this order:

1. Welcome Pack / Pre-SOGP Lessons
2. Podcast / Devotion
3. SOGP / Advanced SOGP
4. Community / Partnership

Destinations and states:

- **Welcome Pack** links to `/dashboard/welcomepack`.
- **Pre-SOGP Lessons** links to `/dashboard/pre-sogp` for enrolled learners. A non-enrolled learner is directed to `/sogp/enrol`.
- **Podcast** retains the existing podcast-dashboard destination.
- **Devotion** retains the existing Prayer Watch/devotion destination.
- **SOGP** links to `/dashboard/sogp` for enrolled learners. During preparation it shows the start date/countdown; after the start it becomes the primary active-learning destination. A non-enrolled learner is directed to `/sogp/enrol`.
- **Advanced SOGP** is visibly unavailable and labelled `Coming soon`.
- **Community** is visibly unavailable and labelled `Coming soon`.
- **Partnership** links to `/partner`.

Coming-soon cards must not look interactive. Enrolment-gated cards explain the gate and provide a clear enrolment action. No learner-facing surface uses PPC terminology.

## Welcome Pack experience

The Welcome Pack page leads with a welcome video. Its primary CTA is `Join the orientation group`, linking to the existing SOGP Telegram community. The welcome speaker's Telegram CTA and the page CTA therefore refer to one destination, not separate groups.

Below the welcome video, two visual thumbnail destinations link to:

- the orientation video;
- the learner's gifts.

The page retains the existing public Pleros shell, welcome access rules, gift configuration, and responsive typography.

## Pre-SOGP journey

### Schedule and content

- Pre-SOGP begins 30 consecutive calendar days before the cohort start date.
- Day 30 is the calendar day immediately before SOGP begins.
- The journey contains exactly 30 dated preparation videos.
- Learners who enrol after preparation has begun can access and complete earlier dates.
- Pre-SOGP remains available as an archive after SOGP starts.

The initial content seed follows this deterministic order:

1. Existing Purpose videos in their configured order.
2. Existing Gospel Answers videos in their configured series order.
3. Existing Discipleship videos in their configured order.
4. Other suitable hosted Pleros teachings, in their configured order, only as needed to reach 30.

The seed rejects duplicate media URLs and incomplete items. Admins can reorder or replace the 30 lessons without a code change.

### Daily requirements

Every preparation date contains:

- the assigned video;
- a download action;
- the 5:30 am Prayer Watch link to Pleros Live;
- a manual `I joined Prayer Watch` confirmation;
- a manual `Mark lesson complete` action.

Opening or downloading a video never marks it complete because downloaded media cannot be tracked reliably.

### Calendar states

- **Green:** both the lesson and Prayer Watch are complete.
- **Grey:** the date is in the future, or it is today and either requirement remains incomplete.
- **Red:** the date is in the past and either requirement remains incomplete.

Completing missing work changes a red past date to green. Learners who enrol late see earlier incomplete preparation dates as red and recoverable.

### Layout

The mobile order is:

1. Sticky `X days until SOGP begins` countdown or programme status.
2. Calendar with today and the selected date clearly distinguished.
3. Selected day's video and requirements.
4. Progress summary and secondary material.

On desktop, the calendar sits beside the selected-day content so both remain visible. Selecting a date changes the content in place rather than navigating to another page.

## Active SOGP journey

### Core programme

The core programme remains four weeks:

- 20 required weekday teachings, one per weekday;
- four required live review sessions scheduled on exact weekend dates;
- four optional additional teachings in a separate Extras section.

The four extras are downloadable, excluded from progress percentages, and excluded from certificate eligibility.

### Weekday requirements

A weekday contains:

- the 5:30 am Prayer Watch link and manual confirmation;
- one downloadable core teaching;
- the teaching's assessment.

Teaching playback is not tracked. The assessment is the authoritative teaching-completion signal:

- a quiz must be passed;
- a written assessment becomes calendar-complete when it is successfully submitted, while any later staff-review state remains separately visible.

A weekday becomes green only when Prayer Watch and the assessment are complete.

### Weekend requirements

Every weekend date contains Prayer Watch. The exact date of each scheduled review session also contains the required live-review action.

- A non-review weekend date becomes green when Prayer Watch is complete.
- A scheduled review date becomes green only when Prayer Watch and the live review are complete.
- A learner who misses the live review can complete it using the recording and manually confirm completion.

Four review sessions are required for programme completion.

### Calendar and eligibility

The SOGP calendar uses the same grey, red, and green semantics as Pre-SOGP. Individual missed Prayer Watch dates remain red, while overall certificate eligibility retains the 80% Prayer Watch threshold.

SOGP eligibility includes:

- all 20 required core teachings completed through their assessments;
- at least 80% of available Prayer Watch dates confirmed;
- all four required review sessions completed live or by recording.

Podcast activity is removed entirely from SOGP daily requirements, progress, and eligibility. Podcast remains an independent dashboard experience.

The mobile calendar appears above the selected day's content. Desktop keeps calendar and content visible together. The four optional teachings appear in a separate Extras section below core progress.

## Data design

The existing SOGP cohort, enrolment, curriculum, preparation, live-class, assessment, progress, Prayer Watch, and push-subscription tables remain the foundation.

Extend the model to persist:

- one preparation-lesson completion per enrolment and preparation day;
- required versus optional preparation resources where needed for exact daily derivation;
- required review-session status and exact scheduled calendar date;
- learner completion of a review live or through its recording;
- optional-extra activity without eligibility impact.

Existing Prayer Watch attendance remains the source of truth for the prayer requirement. Existing quiz attempts and written submissions remain the source of truth for core assessments. Duplicate completion submissions are idempotent.

The old podcast percentage is removed from SOGP assessment-policy types, calculations, UI, and newly persisted cohort policies. Previously stored policy objects remain readable during migration, but their podcast key has no effect.

Calendar colours are derived on the server from the cohort schedule, Lagos date, and persisted completion records; clients do not invent authoritative status.

## Administration

SOGP management remains consolidated under the existing `/admin` shell. Administrators can:

- assign and order the 30 Pre-SOGP videos;
- publish preparation content;
- assign and order the 20 required core teachings;
- assign and order the four optional extras;
- schedule the four required weekend review sessions;
- add live and recording links;
- inspect per-learner calendar progress;
- correct an incorrectly recorded completion;
- manage cohort dates and enrolment status.

Admin validation prevents cohort activation unless the cohort has exactly 30 valid preparation lessons, 20 content-ready required teachings, four optional extras, and four scheduled required reviews. Learner and admin copy changes to SOGP terminology immediately even where internal identifiers still contain `ppc`.

## Browser-push reminder

Enrolled learners are invited to enable browser notifications. The permission request is user-initiated and is not repeatedly shown after denial.

At 5:20 am Africa/Lagos time on every applicable Pre-SOGP and active-SOGP date, the system sends one idempotent browser push per subscribed learner. The notification:

- names the 5:30 am Prayer Watch;
- deep-links to the correct date in `/dashboard/pre-sogp` or `/dashboard/sogp`;
- exposes the Pleros Live action from that daily view.

If push is unsupported or permission is not granted, the dashboard shows a quiet reminder-enablement notice. The product does not claim guaranteed delivery when the browser or operating system suppresses notifications.

## Client behaviour and failures

- Server data and mutations use TanStack Query through the existing query providers.
- Route-level reads use Suspense and ErrorBoundary conventions.
- Manual completion actions update optimistically, then roll back with an actionable message if persistence fails.
- Duplicate writes are harmless.
- Future or draft preparation content is never exposed.
- Enrolment and cohort access are checked server-side; a hidden card is not an access-control boundary.
- Public input and identifiers are validated before database access.

## Migration and redirects

- Replace PPC labels in learner navigation, dashboard cards, footer/header links, learner email copy, metadata, and tests.
- Permanently redirect learner-facing `/ppc` pages to `/sogp`.
- Keep internal APIs or database identifiers temporarily when SOGP still consumes them; remove or rename them only with an explicit compatible migration.
- Preserve unrelated public-site routes and the full homepage design.
- Keep `/sogp` conversion-focused and `/sogp/enrol` canonical.

## Delivery order

The restructure ships as one complete product change, implemented in these internal slices:

1. Domain rules, schema changes, and migrations.
2. Dashboard information architecture and legacy learner redirects.
3. Welcome Pack restructure.
4. Pre-SOGP calendar, completion APIs, and admin content controls.
5. Active SOGP calendar, required reviews, optional extras, and revised eligibility.
6. Browser-push reminder and deep links.
7. Admin progress visibility and correction controls.
8. Responsive browser verification and release audit.

## Verification

Automated coverage must prove:

- 30-day preparation generation and Day 30 placement;
- Lagos midnight and 5:20 am boundaries;
- grey, red, and green transitions for preparation, weekdays, ordinary weekend dates, and required-review dates;
- late-enrolment catch-up;
- enrolment gates and legacy redirects;
- manual preparation completion and idempotency;
- assessment-driven weekday completion;
- four required review completions, including recording completion;
- the retained 80% Prayer Watch threshold;
- optional extras having no progress or eligibility effect;
- podcast having no SOGP progress or eligibility effect;
- push-reminder idempotency and deep links;
- admin ordering, validation, progress inspection, and correction;
- Welcome Pack Telegram, orientation-video, and gift destinations;
- mobile calendar-before-content ordering;
- optimistic completion rollback.

Release verification includes focused tests, the full test suite, lint, production build, React diagnostics, and browser checks at mobile and desktop widths for the dashboard, Welcome Pack, Pre-SOGP, active SOGP, and SOGP admin surfaces.

## Out of scope

- A public-homepage redesign.
- Native community discussion or messaging.
- Advanced SOGP content or access.
- Automatic proof that downloaded media was watched or heard.
- Podcast participation as an SOGP requirement.
- Automatic SOGP enrolment for legacy PPC accounts.

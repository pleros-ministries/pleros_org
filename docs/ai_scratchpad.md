# AI scratchpad

Consolidated 2026-08-31. Keep this file short, current, pattern-focused, and free of duplicate rules.

## Working rules

- Use `npm`; `package-lock.json` is canonical. Keep Better Auth pinned exactly to the lockfile version.
- Read `AGENTS.md` and version-matched Next.js docs in `node_modules/next/dist/docs/`. Preserve the managed Next.js block.
- Preserve unrelated worktree changes. For rollbacks, inspect the touched files, restore only the requested scope, remove only task-added files, and verify with `git status --short`. Stage explicit paths when committing.
- Use ESM imports with `node --input-type=module` for inline Node scripts that use top-level `await`.
- Use existing shells, tokens, fonts, and components before adding patterns. Do not redesign `app/globals.css` tokens.
- Implement clear, annotated UI feedback directly; pause only when ambiguity would materially change the result.
- Use sentence case and UK English in user-facing copy. Preserve technical identifiers, routes, schemas, events, and third-party names.
- Verify UI work in the visible browser at relevant mobile and desktop widths; tests alone are not proof of the rendered flow.
- After meaningful corrections or newly proven patterns, update the relevant section here instead of appending a dated diary entry.

## Project setup

- Next.js 16.3.1 and Tailwind v4 are installed. Use `/_next/mcp` and browser checks for runtime verification.
- Suisse Int'l files are committed under `app/fonts/suisse-intl/`; load exact filenames with `next/font/local`, expose a CSS variable, and integrate through existing tokens.
- Core checks: `npm run lint`, `npm test`, `npm run build`, and `npm run dev`.
- PPC DB routes need `DATABASE_URL`. The default Neon HTTP Drizzle client cannot run transactions; use the dedicated Neon `Pool` transaction client for atomic admin writes and `DATABASE_URL_UNPOOLED` with `Pool`/`Client` for bulk scripts.

## Product and architecture

- SOGP is the only learner-facing training product. PPC learner routes redirect to SOGP, but proven PPC-era content, assessment, progress, and admin infrastructure may remain internally.
- Use the existing `/admin` shell for all operations. `/admin` is the super-admin overview; `/admin/platform` is operational controls, not a competing home.
- Protected pages call `getAppSession()` before data work. Admins enter at `/admin`; learners at SOGP; staff onboarding is invite-based.
- `super_admin` manages staff and instructor invites; `admin` manages content/platform; `instructor` is lower privilege. Render friendly role labels, never raw identifiers.
- Super-admin bootstrap is fail-closed: never expose the email allowlist or request a setup token; send a short-lived inbox claim link, then let the verified owner set a password.
- Server mutations revalidate the appropriate layout. Query-backed admin mutations invalidate their TanStack key and reconcile after an immediate local update.
- Prefer Suspense and Error Boundaries for loading/errors. Use TanStack Query for REST/GraphQL client state. With React Compiler, avoid habitual `useMemo`/`useCallback`.
- Serialize server dates safely; cached values may already be ISO strings. Use request-scoped session memoization when layouts and pages share auth.
- Keep the authenticated admin shell mounted across destinations. Show route skeletons and optimistic nav selection immediately; profile visible-content and URL-commit latency before claiming improvement.
- Expensive admin read models should use batched queries, short-lived shared caches or TanStack Query, and mutation-driven invalidation.
- PPC operational UI stays compact: tight controls/radii, zinc surfaces, concise copy, 2-column mobile stat grids, text-only metric cards, and icons reserved for actions.
- Full account resets clear Better Auth and app identity state (`user`, `session`, `account`, `verification`, `two_factor`, `users`, `welcome_pack_leads`) and verify zero counts.

## Legacy PPC content rules

- Student access is level-gated, not lesson-sequence-gated. Published lessons require audio, notes, quiz, written response prompt, and admin marking guide; centralise this in `getLessonPublishReadiness()`.
- Only MCQs auto-score. SAQs belong in written submissions and admin review; marking schemes are admin-only and must never reach learners.
- Section A imports map to `quiz_questions`; Section B maps to lesson response prompts and admin marking guides.
- Source text is in `tmp/ppc-l*-notes.txt` and `tmp/ppc-l*-questions.txt`; `docs/level-*-ppc-teachings.json` contains audio manifests, not transcripts.
- Parse/import only confirmed tracks, protect unexpected non-MCQ data, keep strictness in mutation paths, and make readiness reports tolerant but explicit.
- Content sync and release are separate. Known prior scope: Level 1 and Level 2.1-2.2 released; Level 2.3-2.11 and Level 3 draft until supplied. Reverify before release work.
- PPC notifications should show channel, trigger, browser-subscription, and environment readiness before delivery complexity. Represent unavailable actions as blocked status, not disabled primary CTAs.
- Do not link this repo to a guessed Vercel project; provide paste-ready environment values when the correct account is unavailable.

## SOGP programme

- For SOGP orientation materials, agree the Markdown content before designing the PDF. Match the `/sogp` landing voice and use plain learner language such as learning, progress, prayer, and spiritual growth; avoid `formation`. In PDF treatments, centre cover-label text, use Sen 600 for the cover title, vertically centre header logos clear of divider rules, and remove draft markers before Telegram publication.
- Canonical routes: `/sogp`, `/sogp/enrol`, `/dashboard/sogp`, `/admin/sogp`. `/sogp/enroll` permanently redirects; old `school-of-purpose` aliases stay removed; learner `/ppc` routes redirect to `/sogp`.
- Pre-SOGP is a gated 30-day consecutive calendar ending before cohort start. Match the SOGP dashboard shell with a sticky dark-blue nav/back action, lime PRE-SOGP identifier, compact lessons/countdown row, current-day indicator, provider-aware stream-only lesson media with no download action, a compact mobile progress total, and a collapsible Preparation lesson activity with a compact numbered single-line header and the lesson title above its description in the body. The preview must use the real 30-item seed order rather than repeated placeholder media. Seed only a verified target cohort, then post-check exactly 30 published days, resources, and unique URLs. Keep the desktop sticky offset below the nav. Each day requires a manually completed lesson and Morning Prayer Watch; past incomplete is red/recoverable, current/future incomplete grey, complete green. Calendar precedes content on mobile.
- Core SOGP is four sequential Monday-Sunday levels, six teachings Monday-Saturday and Sunday review. Unlock by date plus all six prior assessments. No Extras.
- Track anchors: Discipline L1.5, Baptism L1.6, Walk of Faith closes L3. Legacy PPC Level 3 rows 1-9 map to Baptism, Discipline, Walk of Faith, Life of Prayer, Believer's Authority, Healing, Natural Assignment, Spiritual Assignment, and Supernatural; row 10 is unused.
- Certificate gating requires all 24 assessments, at least 80% Morning Prayer Watch attendance across 28 cohort dates, and four Sunday reviews. Podcast is independent.
- Attendance is session-aware (`morning`, `afternoon`, `evening`); legacy `unspecified` records do not count toward morning attendance.
- Course progression is date-guided but incomplete work may continue after cohort end. Assessment policy is cohort-configurable; certificates are digital and SOGP-branded.
- Telegram supplies launch community/text/voice notes. Enrolment redirect and confirmation email lead to `/dashboard/welcomepack/join`, whose configured CTA leads to `https://t.me/pleros_sogp`.
- `/dashboard/welcomepack/join` defaults to the versioned 720px square H.264/AAC welcome video and poster under `public/site/sogp/`; preserve the full square frame, metadata-only preload, and optional `WELCOME_PACK_JOIN_VIDEO_URL` override.
- Telegram bot broadcasts only; never post learner PII or promise discussion until a group is actually linked. Use admin composer for immediate sends.
- Hobby cron permits the daily browser-push reminder at `20 4 * * *` (05:20 WAT); higher frequency needs Pro or an external scheduler.
- Learner UI combines public typography/warmth with MOOC density. Use a compact sticky dark-brand-blue SOGP app nav with a white Dashboard back action and lime identifier, then keep the greeting/cohort in one responsive content row below it. Mobile: keep the compact current-week calendar above activities and omit the course-menu trigger/drawer. Desktop: fixed left progress/outline rail, central activities, right progress/review rail, with sticky offsets clearing the nav.
- The daily content header is a compact current-level/track-position indicator, not a lesson-title banner; place the teaching name inside the Teaching activity. Keep metadata muted and activity panels neutral, spaced, independently collapsible, with simple grey headers/dividers. Reserve colour for state and primary actions; omit a Telegram promo card from the context rail.

## SOGP public funnel and enrolment

- Landing copy follows the `SOGP Landing Page` Google Doc plus Pastor corrections; preserve meaning/order and fix only obvious grammar. Use the public Sen/Be Vietnam Pro system.
- Approved learner-auth design uses `/login`, `/signup` → `/sogp/enrol`, and a guarded `/setup` wizard. New learners verify a six-digit email code, then must create a password before final enrolment and `/dashboard/welcomepack/join`; login supports password plus email code, and public email-only forms must not create full app sessions.
- The main homepage uses a dedicated one-time SOGP promotional sheet with no lead form; it links directly to `/sogp/enrol` and has dismissal state independent of Welcome Pack access. Keep the Welcome Pack email form unchanged on `/welcome`.
- The landing page has no navbar: white hero, four-part headline, no pre-headline label, `Your doubts, Your questions, Your struggles.`, natural-height question rows, then `Our Answer and Solution for You`; its supporting line is `Watch to see the solution we are offering you.` and the section CTA follows the welcome video. Outcomes remain under `What is SOGP?`; only the footer links away.
- Use contextual CTAs after persuasive sections; introduce `Enrol for free` only after free access is explained. Keep mobile type compact.
- The welcome video is the versioned self-hosted square H.264/AAC MP4 with matching poster and immutable caching. Keep Welcome Pack orientation media separate.
- Curriculum is a compact editorial list of four closed accordions with continuous numbering and short descriptors. Use a connected schedule table, recognisable Telegram/dashboard visuals, ministry biography without social distractions, and approved community photography.
- FAQs follow Benefits in a pastel-blue/white accordion: cost, other-church participation, eligibility, self-paced four-week framing, device/platform needs; defer certification demands to orientation.
- `/sogp/enrol` has no navbar. Required fields: first name, surname, E.164 phone, editable country, state/province/region, year of birth, referral source, and explicit initially-unselected WhatsApp Yes/No consent. Do not restore the removed outcome question.
- Country defaults from Vercel IP with Nigeria fallback but remains editable. `Other` referral reveals required detail persisted as `other: <detail>`. Do not show Telegram in the enrolment summary.
- Use medium-weight labels/headings, a restrained bordered card, familiar outline icons, one custom select chevron with 44px right padding/16px inset, and a balanced two-line mobile hero.
- Because enrolment reads request headers, retain route `loading.tsx` and full CTA prefetch for immediate acknowledgement.
- Email sender is `Pleros Ministries & Missions`. Email uses soft sky/white, layout-safe Arial/Helvetica fallback, CTA weight 500, one short instruction plus `Open Dashboard`, no decorative emoji, and an MSO fallback.

## Public-site system

- Organisation name is `Pleros Ministries and Missions` (plural). Public additions reuse `HomepageNav`, `HomepageFooter`, `.site-font-theme`, tokens, and brand-blue CTAs; they must not resemble admin UI.
- Page-view roots include `.site-font-theme`. Use `.site-shell-bar-inner` for full-bleed bars, `.site-shell-page` for content, `PublicSitePageShell` (`max-w-none`) around nav/footer, and shell padding variables at breakpoints.
- Every SOGP content wrapper pairs `site-shell-page` with `sogp-shell-page`; the former alone has no horizontal padding.
- Prefer shared typography classes (`site-hero-eyebrow`, `site-hero-heading`, `site-section-heading`, `site-section-intro`, `site-pathway-title`) over ad hoc font/tracking/size rules.
- Public display headings and short intros usually omit terminal periods. Pathway copy uses Pleros language, and established pathway hero proportions beat generic marketing heroes.
- Canonical routes: `/fcc` with `/fcchurch` redirect; `/fulfil` with permanent `/fulfill` redirect. Keep internal token names stable.
- Upgrade placeholder routes through dedicated route, page-view, content module, and focused tests. Avoid touching actively edited files unless asked.
- Desktop nav dropdowns are full-width stacked menu panels. Mobile drawer is square-cornered, softly eased, and fully off-canvas when closed.
- Use explicit responsive gaps/padding. Mobile carousel sections need breathing room without changing card proportions. Autoplay uses state/transforms, never page-scrolling APIs; previous stops at first and next wraps.
- Active media controls need strong contrast; muted styling is only for unavailable actions. Teaching archives prefer divided inline-expansion lists over repetitive cards/modals.

## Public media and assets

- Verify both filename match and upload availability before replacing production media URLs. Use descriptive slugs and explicit assets under `public/site/home/assets/*`; verify mobile rendering.
- Embedded videos use each item's canonical watch URL; playlist links are subscribe/open actions. Public podcast playback starts in-page.
- Podcast platform marks use their standard colours without circles. Dialogs inherit public fonts/colours, keep header/platform fixed and scroll only episodes, use restrained radii and thin tinted scrollbars.
- Podcast play uses sky-blue with blue icon; external action is a simple tilted arrow. `MORE PLATFORMS` is uppercase, un-underlined, with a close animated arrow. Journey copy is 15px on mobile.
- Use official ministry/media wording when available. Store direct playback per item and external platform links for full libraries.
- Questions/podcast surfaces lean bright low-saturation yellow/olive, not orange.
- Community imagery stays grayscale with a dark overlay and features Black/African American people unless a new treatment is requested. Avoid the rejected blue tint.
- Separate SVG foreground colour from card surface colour; brand artwork may sit on white.

## Prayer Watch and partner pages

- Prayer Watch times: Morning 5:30 am, Afternoon 12:30 pm, Evening 8:30 pm.
- Render them as a connected low-radius schedule strip: soft-sky `Next session` header, one active segment, pale inactive segments, light borders, and no dividers touching the active segment.
- Use branded devotional posters without tint/filter when raw YouTube thumbnails are weak.
- Partner copy follows Vision and Mission: reach people with the word of truth of the Gospel, online and offline, for salvation, establishment, and fulfilment of God's purpose.
- Partner CTAs are WhatsApp-first with a prefilled message when requested. Use solid blue impact surfaces, compact mobile labels/badges, generous post-hero spacing, and no duplicate closing CTA after the giving card.

## Welcome, thank-you, and dashboard funnel

- `/welcome`, `/thankyou`, and `/dashboard/welcomepack` form one stateful funnel: main access is immediate, extra gifts are trust-unlocked, and email failure never blocks access.
- Contact submission may redirect to `/welcome` but does not mint welcome access or prefill the dashboard unless explicitly coupled. Treat all public input as untrusted and HTML-escape email values with regression coverage.
- Verify required DB tables/indexes before persistence E2E tests. If migration history disagrees with objects, inspect actual schema first and repair migration records only after confirming objects exist.
- `/welcome` is responsive: mobile stack plus tablet/desktop grids. Keep a white hero with visible realistic tablet/book art, restrained naturally wrapping type, 16px calm mobile body copy, no metadata or `Free purpose book` eyebrow, and concise burden/answer/free/gifts bands.
- Welcome CTAs ask for email/book access and say `grant you access now`; homepage may use gift language. Use `welcome pack` as two words.
- `/thankyou` starts with `Click here to access your book`, scrolling to access near the footer. Use section-level colour, heading-led purpose/reward content, and compact `Share this gift` jumps to `#share-gift`.
- The share strip owns pill buttons, labels, `Copy your referral link`, and Instagram/TikTok inbox links. Do not promise supplementary gift unlocks while unavailable; provide the main download/email fallback.
- Reuse `extraGifts` and assets from `lib/welcome-pack-gifts.ts`; prefer production covers in `public/assets/dashboard/free-gift-book-covers/`.
- Focused Welcome Pack pages need zero-minimum grid tracks plus `min-w-0`/`max-w-full`; verify `/join`, hub, orientation, and gifts at 320px and 375px. Use public shell gutters.
- `/join` eyebrow is `Welcome to SOGP`. Keep dashboard hero copy lean and locked actions visibly muted.
- Reuse the shared community section and keep it flush with the footer. Keep its CTA close to copy, intro measure narrow on mobile, and image/overlay intact.
- Greetings prefer explicit submitted names and suppress names inferred from email identifiers.
- `/dashboard` accepts a valid app session or welcome-access cookie; otherwise redirect to `/welcome`. Render cookie-based navigation immediately and defer Better Auth provisioning until persistence is needed.
- Welcome cookies last 100 days and refresh on dashboard visits. Send access email only when durable state says the lead is newly created.
- Welcome submission grants access then uses immediate browser navigation after `/api/welcome-access`; it neither auto-downloads nor waits on an App Router transition.
- Progress checkboxes update state directly; bulk completion is reversible. Podcast remains independent. Media hubs use compact series cards leading to vertical episode lists.
- Dashboard church invitation is a full-width pre-footer strip with light blue surface, strong text, masked bottom-corner church logo, and `/fcc` CTA; keep it out of Start Here cards.

## Copy and reset details

- Prefilled public-form values remain editable without explanatory hints.
- Use a left-arrow icon for public back links when requested. Preserve requested mobile heading line breaks with a wide enough measure.
- Keep FCC first-time worshipper fields, validation, and per-location Sheet headers aligned; capture WhatsApp number and home address.
- Scope reset/minimal-state requests narrowly; a requested minimal home reset removes route-specific pages/components and leaves `app/page.tsx` minimal.

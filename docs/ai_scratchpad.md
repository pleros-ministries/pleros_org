# AI scratchpad

Consolidated 2026-07-04 from prior session notes. Keep this file concise and pattern-focused.

## Always check first

- If this file is missing, initialize it immediately and continue.
- Use `npm`; `package-lock.json` is canonical even when pnpm files exist.
- Read `AGENTS.md` and preserve the existing token system in `app/globals.css`.
- For UI work, use existing shells, tokens, fonts, and component patterns before introducing new styling.
- Sentence case is the default copy style.
- Use UK English for all user-facing copy (`fulfil`, `fulfilment`, `enrol`, `enrolment`, `programme`, `centre`, and `-ise` forms); preserve technical routes, identifiers, schema fields, event names, and third-party product names.
- Do not revert unrelated worktree changes. For rollback requests, inspect the touched-file set, restore only the requested files, remove added-only files from that task, and verify with `git status --short`.
- For PPC work, commit and push completed slices frequently when safe, using explicit path staging so unrelated dirty work is not bundled accidentally.

## Current project setup

- The app uses Next.js 16.3.1 and Tailwind v4. Read version-matched framework docs from `node_modules/next/dist/docs/`; keep the managed Next.js block in `AGENTS.md`, and use `/_next/mcp` plus browser verification for runtime checks.
- Local Suisse Int'l fonts are committed under `app/fonts/suisse-intl/`; wire them with `next/font/local`, handle exact awkward filenames, expose a CSS variable, and integrate through globals tokens.
- Important commands: `npm run lint`, `npm test`, `npm run build`, `npm run dev`.
- PPC DB pages require `DATABASE_URL`; `/ppc/sign-in` or redirect-compatible auth pages can work without DB depending on the flow.

## PPC product rules

- This thread has historically been PPC-focused. For PPC status or “what’s next” questions, anchor on the broader PPC roadmap, not only the current subtask.
- Admin operational visibility is higher priority than placeholder notification settings unless the user asks for notifications specifically.
- Dense PPC dashboard style: compact `h-7`/`h-8` controls, `text-xs` where appropriate, zinc-based surfaces, sentence case, and `useTransition` for action pending states.
- PPC surfaces and controls should use tight operational radii; avoid pill-like or overly rounded dashboard cards, sidebar items, buttons, and badges unless the shape is semantic.
- PPC student dashboards should avoid redundant instructional copy; prioritize active task/progress information over explaining navigation that the UI already shows.
- Check `getAppSession()` at the top of protected PPC pages and redirect unauthenticated users to the canonical auth entry.
- Serialize `Date` objects to ISO strings before passing data to client components.
- Server actions should call `revalidatePath("/ppc", "layout")` after mutations.
- Use `onConflictDoUpdate` for student progress upserts.
- Student access is level-gated, not lesson-sequence-gated: students may access any published lesson in graduated/current levels, but not future levels.

## PPC auth and access

- Canonical student auth URLs are `/ppc/login` and `/ppc/signup`; legacy `/ppc/sign-in` and `/ppc/sign-up` should redirect.
- When changing auth paths, update canonical routes, legacy redirects, link targets, guarded-route redirects, and public-path tests together.
- Staff access is invite-based. `super_admin` manages admin/instructor invites; configured super admin emails are `akintyr@gmail.com` and `adeyemodaniel10@gmail.com`.
- Super admin bootstrap must be fail-closed with minimal round-tripping: never render the configured email allowlist, do not ask for a setup token, send one short-lived inbox claim link, then let the verified inbox owner create and save the password on the setup claim page before using `super_admin`.
- Admins enter at `/admin`, students at `/ppc`, and staff onboarding should use invite links/password setup.
- Keep admin work consolidated under `/admin`; do not create parallel admin surfaces when expanding PPC/admin visibility.
- Treat `/admin/platform` as operational controls, not the PPC admin home; the `/admin` dashboard is the super-admin overview surface for cross-product analytics.
- `super_admin` is the staff-management role; `admin` is content/platform admin; instructors are lower-level staff.
- Admin sidebar pages should feel instant: avoid loading full student dashboard payloads for summary/dropdown views, batch DB queries, and add route-level loading states for server-rendered destinations.
- Keep the authenticated admin shell in the shared `/admin` layout so dashboard and sidebar destinations do not cross layout boundaries and remount the shell; memoize request-scoped session lookup when layouts and pages both need it.
- Sidebar clicks should optimistically replace the content area with the route skeleton and update the selected nav state immediately; do not wait for the server-rendered page payload before showing navigation progress.
- Profile sidebar latency in the signed-in browser before claiming an improvement: separately time visible destination content and the URL transition. Dynamic App Router commits can remain slow even when TanStack data is cached; render a query-backed destination preview during a pending transition so cached content is not gated by that commit.
- Better Auth cookie-cache optimizations require `nextCookies()` to be the final plugin and a same-origin client `GET /api/auth/get-session` to issue the cache cookie for existing sessions. Keep its TTL short for staff access.
- The Content CMS overview can be payload-heavy because lesson notes are large; batch its data, cache the shared overview briefly, and invalidate that tag from every content mutation.
- Values returned through `unstable_cache` may be ISO strings even when the uncached DB query yields `Date` objects; server-to-client serializers must accept both forms before calling date methods.
- Admin routes with expensive read models, including the main `/admin` dashboard, should use a shared TanStack Query client under `/admin`, with role-checked server-action query functions and short stale windows so repeat sidebar visits render cached data immediately while refreshing in the background.
- When an admin mutation changes query-backed data, invalidate its TanStack query key instead of relying on `router.refresh()`; retain the immediate local update and let the active query reconcile from the server.
- Admin summary stat/card groups should render as 2-column grids on narrow viewports, then expand to their existing wider desktop layouts.
- Keep admin dashboard metric cards text-only; reserve icons for actionable navigation and workflow items.
- Admin/staff role values are internal identifiers; display them through role labels such as `Super Admin`, `Admin`, `Instructor`, and `Student`, never raw `super_admin`.
- Full PPC account resets must clear auth identity/session tables plus app users and welcome leads: `user`, `session`, `account`, `verification`, `two_factor`, `users`, and `welcome_pack_leads`; verify row counts are zero.

## PPC content and lesson rules

- Quiz scoring: only MC questions are automatically scored; short text is manually graded.
- PPC SAQs belong in `written_submissions`/lesson response prompts and admin review, not quiz short-text unless that workflow is expanded.
- Section A imports go to `quiz_questions`; Section B prompts go to lesson response prompts; Section B marking schemes must be admin-only and surfaced in `/admin/review`.
- Marking schemes must never be visible to students.
- Use `DATABASE_URL_UNPOOLED` with `Pool`/`Client` for bulk PPC content scripts.
- PPC source text files are `tmp/ppc-l*-notes.txt` and `tmp/ppc-l*-questions.txt`; `docs/level-*-ppc-teachings.json` files are audio manifests, not transcripts.
- Parse/import only explicitly confirmed tracks and guard against deleting unexpected non-MCQ quiz data.
- Strict parsing belongs in import/mutation paths; readiness reports should tolerate missing/malformed track sections and report exactly what is missing.
- Published lesson readiness must include audio, notes, quiz, written response prompt, and admin marking guide.
- Use `getLessonPublishReadiness()` for CMS and dashboard debt summaries so readiness logic stays consistent.
- When extending authoring, update schema, editor UI, review surfaces, publish gating, and completeness indicators together.
- Content sync and release are separate. Wire media broadly when available, but enforce published/draft status from an explicit release-scope map.
- Current known release scope from prior work: Level 1 and Level 2.1-2.2 are released; Level 2.3-2.11 and Level 3 remain draft/locked until data is supplied.

## PPC notifications

- Notifications v1 should expose operational readiness before adding delivery complexity.
- Show configured channels, wired event triggers, browser subscription state, and blocked environment prerequisites.
- Do not render unavailable PPC notification actions as disabled primary buttons; use status pills or clear blocked-state messaging instead.
- Add tested pure status helpers first, render `/admin/notifications` from that model, and reuse the existing push subscription hook.
- Do not link this repo to a guessed Vercel account/project. If env values are needed, generate a paste-ready env snippet for the user to add in the correct Vercel account.

## SOGP product rules

- Canonical routes are `/sogp`, `/sogp/enrol`, `/dashboard/sogp`, and `/admin/sogp`; `/sogp/enroll` permanently redirects to `/sogp/enrol`. Permanently remove old `school-of-purpose` routes and aliases; do not preserve redirects for those removed routes.
- SOGP is a guided four-week cohort experience; PPC remains a separate flexible, self-paced product. SOGP may reuse PPC lesson/progress records without inheriting PPC UI styling.
- SOGP preparation is cohort-specific and admin-managed: `/dashboard/sogp` shows today’s published Lagos-date material first and previous published days as an archive; drafts and future days are never learner-visible. The public `/sogp` route remains a conversion page.
- First SOGP curriculum is 20 weekday tracks: all Level 1, all Level 2, plus four explicitly selected Level 3 tracks. Weekends are for YouTube live classes.
- Telegram provides launch community, text, and voice notes. After DB persistence, enrollment redirects directly to the configured Telegram channel; do not use bot deep links or identity-linking in this flow. Bot handles scheduled/admin-triggered channel broadcasts only; never post learner PII. Do not build native discussion or voice storage for launch.
- SOGP enrolment email is urgent and Telegram-first: Telegram is the sole CTA and supplies information, gifts, reminders, updates, and the dashboard link; do not include a direct dashboard button/link in that email.
- SOGP learner UI should combine public-site typography, tokens, warmth, and cohesion with modern MOOC density: continue-learning focus, week/day navigation, progress, live class, community, and assessment state. Do not copy `/ppc` zinc styling and do not redesign tokens.
- SOGP needs a status-aware learner area at `/dashboard/sogp` and an operations center inside the existing admin shell at `/admin/sogp` for cohorts, curriculum, enrolments, live classes, completion, certificates, and rewards.
- Course structure is guided and date-based, but learners may carry unfinished work beyond cohort end. Assessment policy should be cohort-configurable; certificates must be digital and SOGP-branded.
- Public landing copy sources are the `SOGP Landing Page` Google Doc and the Pastor’s launch corrections; preserve meaning/order while fixing obvious grammar and punctuation. The landing page is a focused conversion funnel: no navbar, white hero beginning immediately with the headline, “What are you seeking?” above natural-height reader-question rows, outcomes inside “What is SOGP?”, CTA after every persuasive section (at least 10), and only the footer may link away from the funnel.
- Live DB verification on 2026-08-22 found all 5 Level 1 and all 11 Level 2 lessons published and content-ready. Approved Level 3 display titles are Discipline – The Foundation of the Pursuit of Purpose, Being Led by the Spirit of God, The Life of Devotion, and Ministering and Receiving Christ’s Healing Power; backend lesson content still needs wiring before cohort activation.
- Verified Telegram bot is channel admin and can post/edit messages; public channel is `https://t.me/pleros_sogp`. No linked discussion group existed at verification time, so do not promise interactive community until one is attached.
- SOGP formation requirements are certificate-gating: log Morning Prayer Watch on at least 80% of cohort mornings, and log one distinct Pleros Podcast episode on every cohort day (100%; multiple episodes on one Lagos calendar day count once). Dashboard must link to both existing trackers and show both counts/targets.
- SOGP enrolment captures required first/last name, E.164 phone number, independently editable country of residence, and required state/province/region; default country comes from Vercel IP country with Nigeria fallback, and the form carries the approved privacy assurance.
- Prayer Watch attendance is session-aware (`morning`, `afternoon`, `evening`); legacy undifferentiated records remain `unspecified` and do not count as SOGP morning attendance.
- Vercel project uses Hobby cron limits: keep SOGP Vercel cron at once daily (`0 5 * * *`, 06:00 WAT). Use admin bot composer for immediate sends; hourly/one-hour automation needs Pro or an external scheduler.
- Every SOGP public/learner content wrapper must pair `site-shell-page` with `sogp-shell-page`; `site-shell-page` alone has no horizontal padding. SOGP gutters use existing public shell padding tokens at each breakpoint.
- SOGP public landing hero uses a white background, explicit four-part headline, and a distinct pastel-sky treatment only for “School of God’s Purpose”; prioritize compact mobile readability and avoid pre-headline labels or navigation.
- SOGP landing hero includes the immersive dashboard-phone visual with Telegram and daily-formation cards; contextual CTA labels replace one repeated label, and “Enrol for free” appears only after the free-access offer is introduced.
- SOGP landing FAQs belong after Benefits in a mobile-first pastel-blue/white accordion. Approved basics cover free cost, participation from another church, eligibility, four-week format, guided-but-flexible pacing, device/platform needs, and certification requirements.
- SOGP landing curriculum is a compact editorial list grouped into three independently collapsible levels, all closed initially, with continuous numbering and short level descriptors. Structure uses a connected schedule table; Tools use recognizable Telegram/dashboard visuals; facilitator has a ministry biography but no social-link distractions; social proof uses approved changed-lives copy and existing community photography.

## Public site visual system

- Public-facing additions should reuse `HomepageNav`, `HomepageFooter`, `.site-font-theme`, brand-blue CTAs, and existing public tokens before adding new patterns.
- Public pages should feel like the Pleros public site, not the PPC/admin dashboard.
- The organization name is `Pleros Ministries and Missions`; do not use singular `Mission` for the site title or metadata.
- Public page-view roots must include `.site-font-theme`; otherwise scoped heading/body rules fall back to the global Suisse font even when Next font files are loaded.
- Use `.site-shell-bar-inner` for full-bleed nav/footer and `.site-shell-page` for page content columns.
- Desktop public padding should flow through shell vars: `--site-shell-padding-x`, `--site-shell-padding-x-lg`, and `--site-shell-padding-x-xl`.
- Use `PublicSitePageShell` (`max-w-none`) for nav/footer; do not nest `HomepageNav` inside narrow columns that clip desktop dropdowns.
- Public routes under the shared site shell should inherit the project/public font system and avoid ad hoc font-family overrides.
- For `/library`, use inherited `site-font-theme`, project body font for UI copy, and project heading font for the main title.

## Public pathway and page patterns

- Public placeholder routes should become dedicated route + page-view + content module + focused tests when upgraded into real pages.
- For public landing pages, prefer the existing pathway-page hero proportions over broad marketing hero patterns unless asked otherwise.
- On the homepage pathways section, give mobile visitors breathable outer space and a small, deliberate carousel-to-card separation; preserve card proportions rather than making cards taller to create that space.
- Public pathway copy should use Pleros ministry language and internal concepts, not generic outsider language.
- `/fcc` is the canonical Fullness of Christ Church route; preserve `/fcchurch` as a legacy redirect when route references are updated.
- `/fulfil` is the canonical public route; preserve a permanent redirect from `/fulfill`. Keep internal theme token names stable.
- `/fulfil` is the public entry point into PPC and should use PPC-specific language, levels, and growth structure.
- Do not touch `components/home/fulfil-page-view.tsx` or `lib/fulfil-page-content.ts` while the user is actively editing them unless explicitly asked.
- The current Pleros Podcast presentation is intentional; limit `/podcast` feedback to functional blockers, tests, responsiveness, or explicitly requested polish.

## Public media and content fidelity

- For media migrations, verify both filename matching and upload readiness. Only replace production URLs with assets confirmed live/uploaded.
- Use descriptive text slugs for public pathway videos when the subject is known.
- For YouTube Shorts feed work, test the no-API-key RSS path, avoid stale Instagram copy, and do not render ordinary uploads as Shorts.
- Embedded YouTube playback should use each item’s direct canonical watch URL; playlist links are for subscribe/open actions.
- Public podcast playback should happen in-page before sending visitors out to YouTube.
- Public podcast platform icons should use standard colored service marks directly, without enclosing circles or monochrome brand treatment.
- Public podcast dialogs should use the same public-site font/color styling and platform icon treatment as the parent page.
- Public podcast “MORE PLATFORMS” links should use uppercase text with no underline and a close animated tilted arrow.
- For public podcast series dialogs, keep the header/platform area fixed and make only the episode list internally scrollable.
- Public podcast series dialogs should use restrained radii, around `1rem` for the modal and `0.5rem` for internal lists.
- Public podcast internal scroll areas should use thin, quiet, brand-tinted scrollbars instead of default heavy browser scrollbars.
- Public podcast episode play buttons should use sky-blue surfaces with blue icons, avoiding both heavy blue and lime bases.
- Public podcast episode external/open actions should use a simple tilted arrow, not the boxed external-link glyph.
- Public podcast journey card body copy should be 15px on mobile, with larger text reserved for wider breakpoints.
- For teaching archives, prefer a divided editorial list with inline expansion over repetitive card grids or modal playback.
- When official ministry/media copy exists, use the source wording first; summarize only when asked for a rewrite.
- For public series pages, store direct per-item playback URLs and use external platform links for subscribe/full-library CTAs.

## Public library and carousel details

- Available media controls should use strong brand-color contrast; reserve faded opacity for disabled states.
- Questions pathway/podcast journey surfaces should lean bright, low-saturation yellow/olive rather than orange.
- Public library play/download controls should feel actionable, avoid decorative shadows, and keep muted styles only for unavailable audio.
- On mobile library tables, keep serial-number headers/cells tight, around `w-8` with minimal padding; use wider sizing only at desktop breakpoints.
- Multi-line library teaching titles need breathing room, such as `leading-[1.2]`.
- Carousel autoplay must not call `scrollIntoView` or any page-scrolling browser API; use state/transform-driven movement and regression coverage.
- Homepage carousel navigation is asymmetric: previous should stop at the first slide, while next should wrap from the last slide back to the first.

## Public nav, assets, and partner surfaces

- Desktop public nav dropdowns should be real menu panels with vertically stacked full-width links, left-aligned text, and enough width/padding to scan quickly.
- Public mobile menu open/close motion should stay soft and eased, but the sidebar itself should be square-cornered, move fully off-canvas on close, and avoid leaving an empty frame after content fades.
- On public blue section/card headers, compact brand-lime pills with primary-blue text read better than translucent white pills.
- When public motion feedback says "not feeling it," adjust the concrete homepage component motion as well as shared primitive timing; primitive-only easing changes can be too subtle.
- In the shared homepage community section, keep the Join Now CTA close to the text block; section separation belongs outside the card/section, not between copy and CTA.
- In the shared homepage community section, keep the intro copy on a narrower mobile measure than desktop so it does not span nearly the full viewport.
- In the shared homepage community section, keep a grayscale photo with dark overlay unless the user specifically asks for a new treatment; community imagery should feature Black/African American people and avoid reintroducing the rejected blue tint edit.
- On public video/CTA bands, use explicit scaled group gaps and balanced mobile top/bottom padding; avoid ambiguous arbitrary gap classes.
- Do not add redundant explanatory captions between public video embeds and their primary CTA when the heading/intro already establishes the action.
- Public display headings and short section intro lines should generally omit terminal periods unless the punctuation is intentional copy.
- Public Prayer Watch session times are Morning 5:30 am, Afternoon 12:30 pm, and Evening 8:30 pm.
- Public Prayer Watch session times should use a connected schedule strip rather than three separate cards, with a distinct but soft sky-blue `Next session` header, one active segment highlight, very pale non-next segment backgrounds, low table-like corner radii, and very light borders.
- Public Prayer Watch active time segments should suppress adjacent vertical dividers so the highlight does not have awkward side rules.
- Public Prayer Watch video posters should use the branded devotional artwork without tint overlays or image filters, not the raw YouTube thumbnail when that thumbnail looks visually weak.
- For homepage/card asset swaps, import explicit source assets into `public/site/home/assets/*`, update the specific card data, and verify mobile rendering.
- For welcome dashboard card backgrounds, copy the named source image into `public/site/home/assets/dashboard-cards/`, wire it through card data, and verify the rendered preview card image.
- Separate SVG foreground color from card header surface color; brand-colored logo artwork may still sit on a white card header.
- Partner/support copy should use the Vision and Mission page as source of truth: reaching people with the word of truth of the Gospel, online and offline, for salvation, establishment, and fulfillment of God's purpose.
- Partner CTAs should be WhatsApp-first with a prefilled message when requested.
- Partner impact items on blue sections should use solid blue surfaces, not low-opacity translucent blue/white overlays that read faded.
- Partner page mobile details should stay compact: section eyebrows should be 11px on mobile and use the shared public eyebrow letter spacing, with smaller reason step badges, small bank card titles, and bank-field eyebrow labels.
- Partner page intro CTA section under the hero needs generous top padding; avoid tight attachment to the hero band on mobile.
- Partner page should not include the secondary `Next step / Become a partner today` CTA section after the giving card.

## Welcome, contact, and dashboard funnels

- Public contact submissions redirect to `/welcome` but must not create welcome-pack access, mint welcome tokens, or prefill welcome dashboards unless explicitly requested.
- Public form input is untrusted. Escape user-provided values before rendering HTML email and add regression tests for injected markup.
- For persistence-backed form features, verify the target DB has the new table/indexes or run the documented schema push before end-to-end submit tests.
- `/welcome`, `/thankyou`, and `/dashboard/welcomepack` are one stateful public funnel: main access is immediate, extra gifts are trust-unlocked, and email failures must not block access.
- `/welcome` should be a real responsive public page: preserve the mobile stacked flow, but use tablet/desktop section grids and shared public shell widths instead of a cropped mobile column.
- `/welcome` purpose-book copy is text-heavy; keep it sectioned into a white hero with visible book cover, distinct burden/answer/free/gifts bands, and concise CTA moments instead of reverting to excerpt-heavy copy blocks.
- `/welcome` hero headlines should stay restrained on mobile and wrap naturally to the viewport; avoid oversized clamp-driven display type or narrow `ch` caps that force awkward multi-line breaks.
- `/welcome` hero should not show read/audio metadata; keep the intro copy and primary CTA direct.
- `/welcome` hero supporting paragraphs should use calm body weight; avoid bold emphasis that makes the long-form pitch feel salesy.
- `/welcome` hero supporting paragraphs should use 16px body text on mobile, reserving larger sizes for wider breakpoints.
- `/welcome` hero should not use the `Free purpose book` eyebrow; keep the headline closer to the nav with tighter top padding.
- `/welcome` hero book art should use a realistic tablet border around an attractive branded cover; avoid flat covers, pale blue boxed frames, physical book/page-edge previews, and unclear third-party mockup licenses.
- The welcome gift drawer copy is context-sensitive: homepage can use gift language, but `/welcome` CTA openings should ask for email/book access directly and say "grant you access now" rather than "open access immediately."
- `/thankyou` should match the sectioned `/welcome` style: clear access prompt, share appeal, heading-led purpose/reward sections, multiple social share buttons, and a strong closing urgency. Do not use standalone numbers as card titles.
- `/thankyou` should start with a simple `Click here to access your book` prompt that scrolls to the dashboard/book access component near the footer, rather than putting dashboard access first.
- On `/thankyou`, the main blue purpose/reward content should sit directly on the parent blue section background, not inside repeated card boxes.
- `/thankyou` non-share sections should include a compact `Share this gift` jump to the `#share-gift` share strip, while the share strip itself owns the platform buttons.
- `/thankyou` share strip should use pill buttons with text labels, include a `Copy your referral link` button, and treat Instagram/TikTok DMs as inbox links because they do not reliably preserve prefilled share text through redirects.
- `/thankyou` callout share CTAs should keep the same text-to-button spacing rhythm as the first share appeal section.
- For `/welcome`, `/thankyou`, and related public funnel pages, use shared public typography primitives (`site-hero-eyebrow`, `site-hero-heading`, `site-section-heading`, `site-section-intro`, `site-pathway-title`) before custom font-family, tracking, or arbitrary text-size classes.
- Welcome-pack hero headings should avoid narrow mobile `ch` caps that create five-line wraps; widen the measure and use explicit breakpoint sizes rather than viewport-scaling text.
- Welcome-pack dashboard hero copy should stay lean; omit supporting paragraphs when the heading and gift sections already explain the page.
- Welcome funnel greetings must prefer explicit submitted names from lead/cookie data and suppress names derived from email identifiers; stale Better Auth session names may predate the first-name modal.
- Welcome-pack and thank-you main content should use the public shell horizontal padding vars instead of legacy `container-pleros` gutters or hard-coded `px-6`.
- If asked to revert `/dashboard/welcomepack` after the collaborator redesign, restore the compact `Access your Welcome Pack here` dashboard layout, but keep the shared `HomepageCommunitySection` and shared gift config unless the user explicitly asks to revert those dependencies too.
- Public welcome/contact/share links should use the canonical public site URL (`https://pleros.org`) or a dedicated public-site env var, not `NEXT_PUBLIC_APP_URL`, because that value may point to Vercel, PPC, or auth infrastructure.
- Gift content can stay in typed code config for now and should use public-site Sen/Be Vietnam Pro styling, not PPC dashboard styling.
- When `/thankyou` references the two special books, reuse `extraGifts` and the welcome-pack cover assets from `lib/welcome-pack-gifts.ts` instead of duplicating text-only lists.
- Extra gift cover art should come from `public/assets/dashboard/free-gift-book-covers/` when those production assets are available.
- `/thankyou` callout colors should usually fill the whole section; avoid inset tinted cards when the section itself is the message.
- Welcome-pack pages should reuse the shared public community section instead of duplicating only its text/CTA; otherwise white overlay copy can become invisible without the image layer.
- When a welcome-pack page ends with the shared community section, keep it flush to the footer; do not add page-level bottom padding after it.
- Welcome-pack locked or coming-soon actions should look visibly unavailable with muted surfaces/text, not the same brand-blue treatment as active CTAs.
- `/dashboard` should require either a valid app session or welcome-access cookie and redirect unauthenticated visitors to `/welcome`.
- Dashboard navigation for welcome-cookie visitors should render from the cookie with route-level loading feedback; defer Better Auth provisioning to server actions that actually persist progress or waitlist data.
- Dashboard progress tracking should avoid duplicate per-item action buttons; checking an item should directly update the tracked state.
- Dashboard podcast progress should include a clear link to the public `/podcast` page so users can listen from the tracker.
- Dashboard bulk progress actions should be reversible when the whole group is already complete.
- Dashboard media hubs should open with compact series/title-card grids, then route into vertical per-series video lists; use local thumbnail assets for hub cards when available.
- Welcome dashboard card titles should stay at 16px, and dashboard media title cards should use tighter corners with taller proportions.
- Dashboard church ministry invitations should sit as a full-width strip above the footer, use a non-footer light background with the church logo as a visible bottom-corner masked/gradient watermark rather than a faded opacity image, clip the logo wordmark fully out of view on desktop, use `color-text-strong` for heading and body copy on the tinted blue surface, keep the eyebrow close to the title while preserving body/CTA breathing room, and include a `Learn more` CTA to `/fcc` rather than crowding the Start Here card grid.
- Welcome access cookies should last 100 days and refresh on dashboard visits when present.
- Welcome-pack access email should send only when durable lead state says the lead is newly created; client in-flight guards are secondary.
- Welcome modal/drawer submission should grant access and redirect only; do not auto-trigger downloads during submission or use download-focused pending copy.
- Welcome modal/drawer submission should redirect with immediate browser navigation after `/api/welcome-access` succeeds, not an App Router transition that leaves users staring at pending button copy.
- While supplementary welcome packs are not ready, thank-you sharing must not promise unlocks; show the main download fallback and email download link instead.
- When Drizzle migration history is out of sync with existing DB objects, verify the actual tables/indexes/enums first, then repair `drizzle.__drizzle_migrations` only after confirming the objects already exist.

## Security and operational hygiene

- Escape public/semi-public input in HTML email templates.
- Keep operational notifications plain and safe rather than rich and permissive.
- Treat lead capture and welcome-access onboarding as separate workflows unless explicitly coupled.
- For reset/minimal-state requests, scope the reset carefully. If the user asks for a minimal home reset, remove existing route pages/components and keep `app/page.tsx` minimal.

## Scratchpad update rule

## [2026-08-15] Session Note

### Preference
- On public forms, prefilled contact details must remain editable when a visitor may need to correct them.
- Avoid hyphenating the phrase "welcome pack" in public-facing copy.

### Action Rule
- Present detected form values as editable fields without an explanatory hint, and use "welcome pack" as two words in public copy.
- Use a left-arrow icon with public-site back-navigation links when requested.
- Use intentional line breaks for mobile public-page headings when requested, with a sufficiently wide measure or non-wrapping line to preserve the intended line count.
- Keep FCC first-time worshipper fields, validation, and per-location Sheet headers aligned; capture both WhatsApp number and home address.

- After meaningful tasks, add only concise, reusable notes when there was an error, correction, expressed preference, or clearly better strategy.
- Prefer updating these consolidated sections over adding another dated entry unless chronology is important.

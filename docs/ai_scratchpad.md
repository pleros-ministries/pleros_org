## [2026-03-11] Session Note

### Mistake
- Tried to read the scratchpad before confirming the file existed.

### Correction
- Create and maintain `docs/ai_scratchpad.md` in this repo.

### Lesson
- If the scratchpad is missing, initialize it immediately and continue using it.

### Preference (if any)
- User wants the app reset to a minimal state with a blank home screen showing only "Pleros".

### Action Rule
- For reset requests, remove existing route pages/components and keep `app/page.tsx` minimal.

## [2026-03-13] PPC Full Implementation

### Lesson
- Use `npm` not `pnpm` when `package-lock.json` is canonical lockfile
- Server actions must use `revalidatePath("/ppc", "layout")` after mutations
- Demo auth resolves DB user ID from email via `resolveDbUserId()` in app-session.ts
- Quiz scoring: only MC questions scored automatically; short text graded manually
- Build passes with 21 routes including all student + staff pages

### Preference
- Dense Vercel dashboard style: h-7/h-8 buttons, text-xs, zinc palette
- Sentence case throughout
- `useTransition` for all action pending states

### Action Rule
- Always serialize Date objects to ISO strings before passing to client components
- Use `onConflictDoUpdate` for student progress upserts
- Check `getAppSession()` at top of every page, redirect to sign-in if null

## [2026-05-07] Pathway media wiring

### Mistake
- Assumed newly uploaded UploadThing files were ready to wire before checking their actual upload status.

### Correction
- Verify UploadThing file status first and only swap production URLs for assets that are actually `Uploaded`.

### Lesson
- For media migrations, treat filename matching and file readiness as separate checks.

### Preference
- Use descriptive text slugs for public pathway videos instead of numeric-only ids when the subject is known.

### Action Rule
- Before replacing an existing media URL, confirm the replacement asset is live; if not, keep the existing source and report the blocker explicitly.

## [2026-05-07] Public site campaign pages

### Mistake
- None in this task.

### Correction
- User emphasized that new UI must remain consistent with the public-facing pages.

### Lesson
- New public pages should reuse the existing public shell, Sen/Be Vietnam Pro typography classes, brand-blue CTAs, and mobile-width constrained layout.

### Preference
- Ads and referral pages should feel like part of the public Pleros site, not the PPC dashboard.

### Action Rule
- For public-facing additions, start from `HomepageNav`, `HomepageFooter`, `.site-font-theme`, and current public tokens before introducing any new visual pattern.

## [2026-06-10] Public site desktop shell

### Preference
- Public site was mobile-first; desktop should expand via shared shell tokens, not one-off padding per component.

### Lesson
- Use `.site-shell-bar-inner` for full-bleed nav/footer and `.site-shell-page` for page content columns.

### Action Rule
- Desktop public padding: `--site-shell-padding-x` (20px) → `--site-shell-padding-x-lg` (40px) → `--site-shell-padding-x-xl` (48px). Roll page views to `.site-shell-page` instead of repeating max-w utilities.

## [2026-06-08] Thread scope

### Mistake
- Mixed public-site video migration work into a thread the user wanted reserved for PPC work.

### Correction
- Keep this thread strictly focused on PPC features and operations.

### Lesson
- When a thread has an explicit scope boundary, do not continue adjacent work even if it is in the same repo.

### Preference
- This chat should be strictly for PPC work.

### Action Rule
- In this thread, redirect or defer any non-PPC work and keep recommendations limited to PPC surfaces.

## [2026-06-08] Public placeholder replacement

### Mistake
- Generic public placeholder routes can linger too long and diverge from the real public-site design language.

### Correction
- Replace real public destinations with dedicated `app/(site)/<slug>/page.tsx` routes plus matching `components/home/*-page-view.tsx` and `lib/*-content.ts` files.

### Lesson
- For public Pleros pages, the stable pattern is route + home page-view + content module + focused file-based tests, all using the existing homepage shell.

### Preference
- Public pages must stay in the same homepage/theme system and must not borrow PPC or admin dashboard styling.

### Action Rule
- When upgrading a placeholder public page into a real page, add a dedicated route and content/view/test trio instead of extending the generic `[slug]` placeholder template.

## [2026-06-08] Public podcast page refinement

### Mistake
- Started the podcast landing page with a broader marketing-style hero and generic theme cards instead of matching the tighter public pathway-page structure.

### Correction
- User wanted the hero patterned after `/questions` and `/purpose`, no hero subtitle or CTA cluster, and the real podcast sub-series wired to their starting episodes.

### Lesson
- For public Pleros landing pages, prefer the existing pathway-page hero proportions and swap abstract category cards for ministry-specific content when the source structure is known.

### Preference
- Public podcast links should use the provided canonical playlist/source link, and card titles in pathway surfaces should skew bolder.

### Action Rule
- When a public page represents a real teaching series, use the actual series list and source-backed episode links rather than descriptive placeholder topic cards.

## [2026-06-08] Embedded podcast playback

### Mistake
- Built the podcast series links by appending a second `v` parameter onto the playlist URL, which made the embedded player resolve the wrong starting episode.

### Correction
- Give each playable series item its own canonical watch URL and keep the playlist link separate for subscribe/open actions.

### Lesson
- Embedded YouTube playback should be modeled from the exact video URL that will be played, not by mutating a playlist URL in-place.

### Preference
- Podcast playback should happen in-page in the Pleros site before sending people out to YouTube.

### Action Rule
- For future media galleries, store a direct per-item playback URL and use external platform links only for subscribe or full-library CTAs.

## [2026-06-08] Public podcast series presentation

### Mistake
- Presented the podcast sub-series as repeated pastel cards with generic CTA pills and a modal player, which felt too template-like for a long-form teaching archive.

### Correction
- User wanted softer list separation, inline playback, proper primary typography, and richer row content with subhead descriptions plus a play icon at the far right.

### Lesson
- When a public page is presenting a sequence of teachings, a divided editorial list with inline expansion reads better than a repeated stack of equal cards.

### Preference
- Avoid repetitive card grids for public teaching archives; prefer softer horizontal dividers, left-aligned copy, and in-place playback.

### Action Rule
- For future public media series sections, start from a line-separated list pattern with inline player expansion before considering modal playback or repeated CTA-card layouts.

## [2026-06-08] Source-backed teaching copy

### Mistake
- Replaced official episode-description language with editorial summaries on the podcast series list.

### Correction
- User wanted the sub-series rows to use the official description copy from the starting episode description boxes.

### Lesson
- When the user asks for official ministry/media copy, treat the source text as the content system of record and avoid rewriting it into fresher marketing language.

### Preference
- Keep public teaching surfaces close to the source wording when that wording is already available on the episode itself.

### Action Rule
- For future public series pages, pull description copy from the canonical episode/page source first; summarize only when the user asks for a rewrite.

## [2026-06-08] Ministry voice on public pathway pages

### Mistake
- Wrote `/fulfil` in a generic spiritual-growth voice instead of the tighter ministry voice already established across the public Pleros pages.

### Correction
- The page needed to speak directly about PPC as the Pleros Perfecting Course, in the same internal frame the ministry already uses elsewhere.

### Lesson
- Public pathway pages should not sound like an outsider describing the ministry; they should use the repo's own ministry concepts, naming, and progression.

### Preference
- `/fulfil` should function as the public entry point into PPC, with PPC-specific language, levels, and growth structure.

### Action Rule
- Before writing public page copy for a ministry pathway, inspect the linked destination product or course in the repo and write from that internal structure rather than from generic category language.

## [2026-06-08] Concurrent page edits

### Mistake
- None in this task.

### Correction
- User indicated they are actively working on the Fulfil page while asking for review/next-step guidance.

### Lesson
- When the user is editing a page concurrently, avoid touching that route's component/content files and keep feedback at the coordination level unless explicitly asked to implement.

### Preference
- Do not overlap edits on `/fulfil` while the user is working there.

### Action Rule
- Treat `components/home/fulfil-page-view.tsx` and `lib/fulfil-page-content.ts` as user-owned until they ask for implementation help.

## [2026-06-08] Podcast page intent

### Mistake
- Treated some podcast page presentation choices as possible critique targets while the user considered them deliberate.

### Correction
- User clarified that everything currently visible on the Pleros Podcast page is intentional.

### Lesson
- Do not second-guess intentional public-page design decisions after the user has approved the direction.

### Preference
- Preserve the current Pleros Podcast page presentation unless asked for a specific implementation fix.

## [2026-06-09] Revert requests

### Mistake
- None in this task.

### Correction
- User asked to undo the public-site responsiveness pass entirely.

### Lesson
- For rollback requests, scope the revert to the exact files changed by the task and confirm the worktree returns to `HEAD`.

### Preference
- When backing out a UI pass, remove the whole pass cleanly rather than leaving partial responsive scaffolding behind.

### Action Rule
- If asked to undo recent work, inspect the touched-file set first, restore only those files, remove any added-only files, and verify with `git status --short`.

## [2026-06-09] PPC roadmap awareness

### Mistake
- Answered a PPC “what is pending” question too narrowly from the immediate file-upload task instead of from the broader PPC roadmap.

### Correction
- In this PPC thread, pending work must be framed against the active PPC roadmap, not just the current subtask.

### Lesson
- Tactical implementation context is not enough; roadmap context has to stay live between slices.

### Preference
- The user expects roadmap-aware answers for PPC, especially when asking what remains or what is next.

### Action Rule
- Before answering PPC status, pending-work, or next-step questions, re-anchor on the current PPC roadmap/handover and distinguish the current subtask from the broader remaining queue.

## [2026-06-08] Fulfill route spelling

### Mistake
- Left the public PPC entry page on `/fulfil` and let some public-facing copy keep the old spelling.

### Correction
- The canonical public route should be `/fulfill`, and the visible public-site wording should match that spelling.

### Lesson
- Route naming and public labels need to stay aligned; path spelling is part of the product language, not just an implementation detail.

### Preference
- Keep the internal theme token names stable, but use `fulfill`/`fulfillment` in public routes and visible copy.

### Action Rule
- When this pathway is touched again, keep `/fulfill` as the canonical public URL, preserve a redirect from `/fulfil`, and use the shared Sen heading classes for major public headings.

### Action Rule
- For `/podcast`, limit feedback to functional blockers, tests, responsiveness, or explicit requested polish; do not suggest design-direction changes.

## [2026-06-08] Public contact flow boundaries

### Mistake
- None in this task.

### Correction
- User clarified that public contact submissions must redirect to `/welcome` without creating welcome-pack access or carrying data into the welcome flow.

### Lesson
- Treat lead capture and welcome-access onboarding as separate workflows unless the user explicitly asks to connect them.

### Preference
- Public contact flows should stay in the public-site theme while remaining operationally separate from welcome access.

### Action Rule
- For future public lead forms in this repo, do not mint welcome tokens, auto-provision access, or prefill welcome dashboards unless that coupling is explicitly requested.

## [2026-06-09] Public email templating

### Mistake
- Interpolated public contact-form fields directly into the staff notification HTML email.

### Correction
- Escape user-provided values before rendering any operational email markup.

### Lesson
- Public form submissions should be treated as untrusted input even when the destination is an internal staff inbox.

### Preference
- Keep operational notifications plain and safe rather than rich and permissive.

### Action Rule
- For all future HTML email templates fed by public or semi-public input, apply HTML escaping before interpolation and add a regression test for injected markup.

## [2026-06-09] Contact-flow deployment check

### Mistake
- Tried to smoke-test the contact submit flow before confirming the `contact_submissions` table existed in the target database.

### Correction
- Apply the Drizzle schema change first, then run the real submit test.

### Lesson
- New form features that persist data are not actually testable end to end until their schema migration is live in the database being exercised.

### Action Rule
- Before future end-to-end checks on new persistence-backed features, verify the target DB has the new table/indexes or run the documented schema push first.

## [2026-06-09] PPC content imports

### Mistake
- Started the PPC lesson-content import through the Neon HTTP query path and by parsing the whole source export, even though the Level 2 questions export was only partially complete.

### Correction
- Use the unpooled DB connection for bulk PPC content scripts and scope parsing/imports only to the explicitly confirmed track numbers.

### Lesson
- PPC content imports should be conservative: import the MCQs that fit the current quiz model, transform transcript notes into HTML for `notes_content`, and refuse to overwrite unexpected non-MCQ quiz data.

### Preference
- Keep PPC question imports aligned to the existing app model rather than expanding the schema just to mirror SAQ rubrics.

### Action Rule
- For future PPC lesson imports, use `DATABASE_URL_UNPOOLED` with `Pool`/`Client`, parse only the requested tracks, and guard against deleting non-MCQ quiz content.

## [2026-06-09] PPC SAQ modeling

### Mistake
- Treated the presence of `short_text` quiz rendering as if the PPC app already had an end-to-end grading workflow for SAQs.

### Correction
- The correct existing grading workflow is `written_submissions` plus the admin review queue; quiz short-text answers are not staff-reviewable yet.

### Lesson
- In PPC, MCQs belong in the quiz flow, while SAQs fit the written-response workflow with student-visible prompts and admin-only marking guides at the lesson level.

### Preference
- Marking schemes should be visible to admins grading the work, but never to students.

### Action Rule
- For future PPC question imports, import Section A into `quiz_questions`, import Section B into lesson response prompts, and store Section B marking schemes in an admin-only lesson field surfaced in `/admin/review`.

## [2026-06-09] Welcome pack funnel state

### Mistake
- None in this task.

### Correction
- Welcome-pack funnel work must persist lead/unlock state while preserving the public-site visual identity.

### Lesson
- Treat `/welcome`, `/thankyou`, and `/dashboard/welcomepack` as one stateful public funnel: main access is immediate, extra gifts are trust-unlocked, and email failures should never block access.

### Preference
- Keep gift content in typed code config for now and use public-site Sen/Be Vietnam Pro styling, not PPC dashboard styling, for visitor-facing surfaces.

### Action Rule
- For future welcome-pack changes, update lead persistence, gift config, email copy, dashboard lock state, and admin visibility together so the funnel stays coherent.

## [2026-06-09] Public homepage asset swaps

### Mistake
- None in this task.

### Correction
- User supplied a specific external church-logo asset and wanted it used directly on the homepage church card.

### Lesson
- For public-site art swaps, locate the exact card/slot, bring the provided asset into repo-backed public assets, and wire it into the existing component pattern instead of inventing a new visual treatment.

### Preference
- When a card image is provided explicitly, use that source asset on the live homepage surface.

### Action Rule
- For future homepage asset updates, import the provided file into `public/site/home/assets/*`, update the data model for the specific card, and verify the rendered result at mobile width before committing.

## [2026-06-09] Public library typography

### Mistake
- Let the public library page keep hard-coded `Figtree` and `DM Sans` overrides instead of using the shared project fonts.

### Correction
- `/library` should inherit the project/public-site font system, with project body font for UI copy and the project heading font for the main page title.

### Lesson
- Public-site routes under the shared site shell should not introduce ad hoc type families unless the user asks for a deliberate exception.

### Preference
- The library page should use the project fonts, not separate dashboard-style typography.

### Action Rule
- When touching `/library` again, default to inherited `site-font-theme` typography and remove any local font-family overrides before adding new styles.

## [2026-06-10] PPC auth route canonicals

### Mistake
- PPC auth entry URLs drifted between `sign-in`/`sign-up` and the newer `login`/`signup` naming the user wanted.

### Correction
- The canonical student auth URLs are `/ppc/login` and `/ppc/signup`, while the legacy `/ppc/sign-in` and `/ppc/sign-up` paths should remain as redirects.

### Lesson
- Route renames should preserve backwards compatibility for existing links, welcome-access redirects, and public-path allowlists.

### Preference
- Use conventional auth naming: `login` and `signup`, not `sign-in` and `sign-up`.

### Action Rule
- When changing PPC auth paths, update canonical routes, legacy redirects, link targets, guarded-route redirects, and public-path tests together.

## [2026-06-10] PPC account reset scope

### Mistake
- None in this task.

### Correction
- A full PPC reset means clearing Better Auth users plus welcome-pack leads, not only the app-level `users` table.

### Lesson
- “Start from fresh” for PPC accounts spans both auth identity tables and funnel capture tables.

### Preference
- When asked to reset PPC accounts, include the saved welcome-pack emails in the wipe.

### Action Rule
- For future fresh-start resets, clear `user`, `session`, `account`, `verification`, `two_factor`, `users`, and `welcome_pack_leads`, then verify row counts are zero.

## [2026-06-10] Public nav dropdown presentation

### Mistake
- Treated the nav regrouping request as mostly information architecture and under-styled the desktop dropdown menus.

### Correction
- Desktop dropdowns should read like proper menus: well styled, vertically stacked, one child link per line.

### Lesson
- When the user asks for grouped nav dropdowns on the public site, the popup presentation matters as much as the grouping itself.

### Preference
- Public desktop nav dropdown items should be full-width rows, not cramped inline-looking pills.

### Action Rule
- For future public nav dropdown work, make the popup a real menu panel with stacked full-width links, left-aligned text, and enough width/padding to scan quickly.

## [2026-06-10] Welcome email idempotency

### Mistake
- Tied the welcome-pack access email to every successful access POST, so repeated submits or retries could send duplicate emails.

### Correction
- Email sending should be gated by durable lead state and only happen when the lead is newly created.

### Lesson
- Client-side disabling reduces accidental duplicate requests, but server-side idempotency is the real protection for funnel emails.

### Preference
- Welcome-pack form submissions should not send multiple copies of the same email.

### Action Rule
- For future funnel email work, make the database state determine whether an email should send, and add client in-flight guards as secondary protection.

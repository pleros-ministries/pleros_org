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

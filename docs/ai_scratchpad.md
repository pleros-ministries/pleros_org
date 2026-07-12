# AI scratchpad

Consolidated 2026-07-04 from prior session notes. Keep this file concise and pattern-focused.

## Always check first

- If this file is missing, initialize it immediately and continue.
- Use `npm`; `package-lock.json` is canonical even when pnpm files exist.
- Read `AGENTS.md` and preserve the existing token system in `app/globals.css`.
- For UI work, use existing shells, tokens, fonts, and component patterns before introducing new styling.
- Sentence case is the default copy style.
- Do not revert unrelated worktree changes. For rollback requests, inspect the touched-file set, restore only the requested files, remove added-only files from that task, and verify with `git status --short`.
- For PPC work, commit and push completed slices frequently when safe, using explicit path staging so unrelated dirty work is not bundled accidentally.

## Current project setup

- The app uses Next.js and Tailwind v4.
- Local Suisse Int'l fonts are committed under `app/fonts/suisse-intl/`; wire them with `next/font/local`, handle exact awkward filenames, expose a CSS variable, and integrate through globals tokens.
- Important commands: `npm run lint`, `npm test`, `npm run build`, `npm run dev`.
- PPC DB pages require `DATABASE_URL`; `/ppc/sign-in` or redirect-compatible auth pages can work without DB depending on the flow.

## PPC product rules

- This thread has historically been PPC-focused. For PPC status or “what’s next” questions, anchor on the broader PPC roadmap, not only the current subtask.
- Admin operational visibility is higher priority than placeholder notification settings unless the user asks for notifications specifically.
- Dense PPC dashboard style: compact `h-7`/`h-8` controls, `text-xs` where appropriate, zinc-based surfaces, sentence case, and `useTransition` for action pending states.
- PPC surfaces and controls should use tight operational radii; avoid pill-like or overly rounded dashboard cards, sidebar items, buttons, and badges unless the shape is semantic.
- Check `getAppSession()` at the top of protected PPC pages and redirect unauthenticated users to the canonical auth entry.
- Serialize `Date` objects to ISO strings before passing data to client components.
- Server actions should call `revalidatePath("/ppc", "layout")` after mutations.
- Use `onConflictDoUpdate` for student progress upserts.
- Student access is level-gated, not lesson-sequence-gated: students may access any published lesson in graduated/current levels, but not future levels.

## PPC auth and access

- Canonical student auth URLs are `/ppc/login` and `/ppc/signup`; legacy `/ppc/sign-in` and `/ppc/sign-up` should redirect.
- When changing auth paths, update canonical routes, legacy redirects, link targets, guarded-route redirects, and public-path tests together.
- Staff access is invite-based. `super_admin` manages admin/instructor invites; bootstrap super admin email is `fccibadan@gmail.com`.
- Admins enter at `/admin`, students at `/ppc`, and staff onboarding should use invite links/password setup.
- `super_admin` is the staff-management role; `admin` is content/platform admin; instructors are lower-level staff.
- Full PPC account resets must clear auth identity/session tables plus app users and welcome leads: `user`, `session`, `account`, `verification`, `two_factor`, `users`, and `welcome_pack_leads`; verify row counts are zero.

## PPC content and lesson rules

- Quiz scoring: only MC questions are automatically scored; short text is manually graded.
- PPC SAQs belong in `written_submissions`/lesson response prompts and admin review, not quiz short-text unless that workflow is expanded.
- Section A imports go to `quiz_questions`; Section B prompts go to lesson response prompts; Section B marking schemes must be admin-only and surfaced in `/admin/review`.
- Marking schemes must never be visible to students.
- Use `DATABASE_URL_UNPOOLED` with `Pool`/`Client` for bulk PPC content scripts.
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
- Add tested pure status helpers first, render `/admin/notifications` from that model, and reuse the existing push subscription hook.
- Do not link this repo to a guessed Vercel account/project. If env values are needed, generate a paste-ready env snippet for the user to add in the correct Vercel account.

## Public site visual system

- Public-facing additions should reuse `HomepageNav`, `HomepageFooter`, `.site-font-theme`, brand-blue CTAs, and existing public tokens before adding new patterns.
- Public pages should feel like the Pleros public site, not the PPC/admin dashboard.
- Use `.site-shell-bar-inner` for full-bleed nav/footer and `.site-shell-page` for page content columns.
- Desktop public padding should flow through shell vars: `--site-shell-padding-x`, `--site-shell-padding-x-lg`, and `--site-shell-padding-x-xl`.
- Use `PublicSitePageShell` (`max-w-none`) for nav/footer; do not nest `HomepageNav` inside narrow columns that clip desktop dropdowns.
- Public routes under the shared site shell should inherit the project/public font system and avoid ad hoc font-family overrides.
- For `/library`, use inherited `site-font-theme`, project body font for UI copy, and project heading font for the main title.

## Public pathway and page patterns

- Public placeholder routes should become dedicated route + page-view + content module + focused tests when upgraded into real pages.
- For public landing pages, prefer the existing pathway-page hero proportions over broad marketing hero patterns unless asked otherwise.
- Public pathway copy should use Pleros ministry language and internal concepts, not generic outsider language.
- `/fulfill` is the canonical public route and visible spelling; preserve a redirect from `/fulfil`. Keep internal theme token names stable.
- `/fulfill` is the public entry point into PPC and should use PPC-specific language, levels, and growth structure.
- Do not touch `components/home/fulfil-page-view.tsx` or `lib/fulfil-page-content.ts` while the user is actively editing them unless explicitly asked.
- The current Pleros Podcast presentation is intentional; limit `/podcast` feedback to functional blockers, tests, responsiveness, or explicitly requested polish.

## Public media and content fidelity

- For media migrations, verify both filename matching and upload readiness. Only replace production URLs with assets confirmed live/uploaded.
- Use descriptive text slugs for public pathway videos when the subject is known.
- For YouTube Shorts feed work, test the no-API-key RSS path, avoid stale Instagram copy, and do not render ordinary uploads as Shorts.
- Embedded YouTube playback should use each item’s direct canonical watch URL; playlist links are for subscribe/open actions.
- Public podcast playback should happen in-page before sending visitors out to YouTube.
- For teaching archives, prefer a divided editorial list with inline expansion over repetitive card grids or modal playback.
- When official ministry/media copy exists, use the source wording first; summarize only when asked for a rewrite.
- For public series pages, store direct per-item playback URLs and use external platform links for subscribe/full-library CTAs.

## Public library and carousel details

- Available media controls should use strong brand-color contrast; reserve faded opacity for disabled states.
- Public library play/download controls should feel actionable, avoid decorative shadows, and keep muted styles only for unavailable audio.
- On mobile library tables, keep serial-number headers/cells tight, around `w-8` with minimal padding; use wider sizing only at desktop breakpoints.
- Multi-line library teaching titles need breathing room, such as `leading-[1.2]`.
- Carousel autoplay must not call `scrollIntoView` or any page-scrolling browser API; use state/transform-driven movement and regression coverage.
- Homepage carousel navigation is asymmetric: previous should stop at the first slide, while next should wrap from the last slide back to the first.

## Public nav, assets, and partner surfaces

- Desktop public nav dropdowns should be real menu panels with vertically stacked full-width links, left-aligned text, and enough width/padding to scan quickly.
- For homepage/card asset swaps, import explicit source assets into `public/site/home/assets/*`, update the specific card data, and verify mobile rendering.
- For welcome dashboard card backgrounds, copy the named source image into `public/site/home/assets/dashboard-cards/`, wire it through card data, and verify the rendered preview card image.
- Separate SVG foreground color from card header surface color; brand-colored logo artwork may still sit on a white card header.
- Partner/support copy should use the Vision and Mission page as source of truth: reaching people with the word of truth of the Gospel, online and offline, for salvation, establishment, and fulfillment of God's purpose.
- Partner CTAs should be WhatsApp-first with a prefilled message when requested.

## Welcome, contact, and dashboard funnels

- Public contact submissions redirect to `/welcome` but must not create welcome-pack access, mint welcome tokens, or prefill welcome dashboards unless explicitly requested.
- Public form input is untrusted. Escape user-provided values before rendering HTML email and add regression tests for injected markup.
- For persistence-backed form features, verify the target DB has the new table/indexes or run the documented schema push before end-to-end submit tests.
- `/welcome`, `/thankyou`, and `/dashboard/welcomepack` are one stateful public funnel: main access is immediate, extra gifts are trust-unlocked, and email failures must not block access.
- Public welcome/contact/share links should use the canonical public site URL (`https://pleros.org`) or a dedicated public-site env var, not `NEXT_PUBLIC_APP_URL`, because that value may point to Vercel, PPC, or auth infrastructure.
- Gift content can stay in typed code config for now and should use public-site Sen/Be Vietnam Pro styling, not PPC dashboard styling.
- `/dashboard` should require either a valid app session or welcome-access cookie and redirect unauthenticated visitors to `/welcome`.
- Welcome access cookies should last 100 days and refresh on dashboard visits when present.
- Welcome-pack access email should send only when durable lead state says the lead is newly created; client in-flight guards are secondary.
- While supplementary welcome packs are not ready, thank-you sharing must not promise unlocks; show the main download fallback and email download link instead.
- When Drizzle migration history is out of sync with existing DB objects, verify the actual tables/indexes/enums first, then repair `drizzle.__drizzle_migrations` only after confirming the objects already exist.

## Security and operational hygiene

- Escape public/semi-public input in HTML email templates.
- Keep operational notifications plain and safe rather than rich and permissive.
- Treat lead capture and welcome-access onboarding as separate workflows unless explicitly coupled.
- For reset/minimal-state requests, scope the reset carefully. If the user asks for a minimal home reset, remove existing route pages/components and keep `app/page.tsx` minimal.

## Scratchpad update rule

- After meaningful tasks, add only concise, reusable notes when there was an error, correction, expressed preference, or clearly better strategy.
- Prefer updating these consolidated sections over adding another dated entry unless chronology is important.

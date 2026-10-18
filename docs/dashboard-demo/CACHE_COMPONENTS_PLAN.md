# Cache Components for the dashboard: plan

Status: investigation and prototype only (18 October). Nothing here is enabled on `main`.
Prototype branch: `perf/cache-components-prototype` (cut from `76ac403`; `main` has moved on since, so rebase before reuse).

## What we get

Today every dashboard route is fully dynamic. A signed-in learner sees nothing until the server has
finished the session lookup, the viewer capability reads (SOGP access, community context, church
assignment, direct reports) and the page's own reads.

With `cacheComponents: true`:

- **Instant static shell.** Each route prerenders an HTML shell (top bar plus skeleton) that is served at
  once, from the CDN on Vercel. The session, navigation and page stream in behind it.
- **Partial prefetching** (`partialPrefetching: true`, Next 16.3). A `<Link>` prefetches one reusable
  App Shell per route instead of one prefetch per link. Shells from routes that read `cookies()` or
  `headers()` carry that session's data and are cached per session on the client.
- **Activity navigation.** Pages you leave are hidden, not unmounted, so going back keeps their state
  and scroll position. This is a behaviour change, covered under Risks.

## Measured

Local `next build` + `next start`, same machine, signed out (curl, 15 runs each, median).

| | Baseline (`76ac403`) | Prototype |
|---|---|---|
| Dashboard routes, build marker | 89 ƒ dynamic | 92 ◐ partial prerender (every dashboard route, including dynamic params) |
| Whole app | 230 ƒ, 55 ○ | 114 ƒ, 51 ○, 71 ◐ |
| `GET /dashboard` signed out | `307` to `/login` in 5.7 ms | `200` shell in 2.6 ms TTFB, then a streamed redirect |
| `GET /dashboard/sogp` signed out | `307` in 6.6 ms | `200` shell in 2.5 ms |
| `GET /dashboard/community/post/1` signed out | `307` in 6.6 ms | `200` shell in 2.8 ms |
| `/` and `/podcast` | static, 2.3 / 2.9 ms | still static, 2.3 / 3.0 ms (feeds moved to `use cache`) |

Not measured: signed-in timings. They need a real session against the shared Neon database, and these
local runs didn't use one. The expected gain is structural. Signed-in TTFB stops depending on the
session and viewer reads (one Better Auth lookup plus four parallel Neon reads before any byte today),
because the shell is static and the same for everyone. To measure: sign in on a local `next start` of
each build and compare First Contentful Paint for `/dashboard`, `/dashboard/sogp` and
`/dashboard/community` in the browser's Performance panel, or on a Vercel preview with Speed Insights.

## What the prototype changed

1. `next.config.ts`: `cacheComponents: true` (`staleTimes` kept).
2. Removed segment configs that Cache Components rejects: `revalidate = 0` (2 admin library pages),
   `dynamic = "force-dynamic"` (`/contact`, `/api/social/instagram`) and **every** `runtime = "nodejs"`
   (9 files). Even the default runtime value is a build error.
3. `app/(site)/dashboard/layout.tsx` and `app/(focused)/dashboard/layout.tsx`: the layout is now a
   synchronous frame: `<Suspense fallback={<DashboardFrameFallback />}>` around an async
   `DashboardFrame` holding the old body (headers, `getDashboardViewer`, redirect, `after()`, shell).
   `components/dashboard/shell/dashboard-frame-fallback.tsx` is the static shell: the blue top bar and
   the existing dashboard skeleton. **This one change cleared all 150 dashboard "runtime data outside
   Suspense" errors.** Nested layouts (community, SOGP) and pages render inside the boundary, so
   `getCommunityContext()` and `getAppSession()` needed no change.
4. `app/layout.tsx`: `<RootIntegrations />` wrapped in `<Suspense fallback={null}>`. It calls
   `usePathname()`, which blocked the App Shell of all 47 dynamic-param routes.
5. Sync clock reads, which `instant = false` cannot excuse:
   - `dashboard/prayer-watch/page.tsx`: `new Date()` moved after `await searchParams`.
   - `lib/anchor-rss.ts`: the `Date.now()` in-memory cache replaced by a `"use cache"` loader
     (`cacheLife` stale 5 min / revalidate 5 min / expire 1 h). Failures throw, so they're never cached,
     and the last good list on the instance is served instead.
   - `lib/homepage-feed.ts`: `getLatestYoutubeVideos` / `getLatestYoutubeEpisode` get `"use cache"`
     (revalidate 30 min, as their fetch cache had).
   - `/contact` (was force-dynamic): `await connection()` + `instant = false`.
   - Three `/preview/dashboard…` demo pages: `await connection()` + `instant = false`. Before, they were
     prerendered at build time with a frozen date.
6. Out-of-scope trees opted out with `export const instant = false`, so they render as they do today:
   `app/admin/layout.tsx`, `app/ppc/layout.tsx`, `app/preview/pleros/layout.tsx` and the public pages
   that read the request (`/login`, `/signup`, `/sogp`, `/fft`, `/thankyou`, `/sogp/discipleship/[code]`,
   `/sogp/prepare/[date]`).

Result: `next build` passes (exit 0). One regression to fix before adoption: `/opengraph-image` went
from static to dynamic because its uncached `readFile` now counts as request-time I/O. Wrap the read in
a `"use cache"` helper.

## Map of what has to change

### Dashboard layout and session (`app/(site)/dashboard/layout.tsx`, `lib/app-session.ts`)

- Done in the prototype: request reads live behind one `<Suspense>`.
- `getAppSession()` reads `headers()`, so it can never be `"use cache"`. Keep it as it is: React
  `cache()` dedupe per request still works and the shell doesn't need it.
- `x-pleros-pathname` (set by `proxy.ts`) is still read inside the boundary for `returnTo`. Keep it.
- **Auth redirect changes shape** (measured above). Signed-out visitors now get `200` plus the shell, then
  `NEXT_REDIRECT` in the stream and a `<meta http-equiv="refresh" content="1;url=/login…">`. That's
  correct but slower, and it briefly shows the dashboard skeleton. Fix: an optimistic check in
  `proxy.ts` that redirects `/dashboard/*` to `/login?returnTo=…` when no Better Auth session cookie
  exists (`getSessionCookie` from `better-auth/cookies`). Keep the layout check as the real gate,
  because a cookie can exist for a revoked session. This also keeps crawlers and link previews on a
  clean `307`.

### `getDashboardViewer` (`lib/dashboard/viewer.ts`) and `getCommunityContext` (`lib/community/context.ts`)

- No change is needed to adopt. Both run inside the boundary, and React `cache()` still dedupes them
  per request.
- **Don't** put `"use cache"` on them, and don't key a server cache by user. They gate permissions
  (admin, pastor regions, church roles, under-18 messaging rules). A stale entry would show or hide
  navigation after a role change, or keep a paused member's access. With partial prefetching, the
  App Shell already includes session data and is cached per session **on the client**, which is enough.
- Optional later step: `"use cache: private"` with `cacheLife({ stale: 30 })` on the viewer's
  capability read. It is never stored on the server, so it's safe, and it makes the nav part of the
  per-session shell. Only worth it if the signed-in profile shows the viewer reads on the critical path.

### `unstable_cache` users

| File | Today | Under Cache Components |
|---|---|---|
| `app/(site)/dashboard/library/page.tsx` | `getTeachingSeriesCounts`, 60 s | `"use cache"` + `cacheLife({ stale: 60, revalidate: 60, expire: 3600 })` + `cacheTag("teachings")` |
| `app/(site)/dashboard/library/teachings/page.tsx` | `getAllTeachings`, 60 s, Date→string | same profile and tag. Keep the string conversion (use cache serialises too) |
| `app/(site)/library/page.tsx` | same, public | same profile and tag |
| `lib/db/queries/content.ts` (PPC content overview) | tag `CONTENT_OVERVIEW_CACHE_TAG`, 60 s | `"use cache"` + `cacheTag(CONTENT_OVERVIEW_CACHE_TAG)`. The `updateTag` in `content-actions.ts` keeps working. Update `lib/admin-content-page.test.ts`, which asserts the string `unstable_cache` |
| `lib/anchor-rss.ts` | `Date.now()` memory cache + fetch `revalidate: 300` | done in the prototype |
| `lib/homepage-feed.ts` | fetch `revalidate: 1800` | done for the two YouTube readers. Instagram readers are still on `next.revalidate` / `no-store` and work as before |

`unstable_cache` keeps working, so this can trail the flag. One difference matters on Vercel:
`unstable_cache` and the fetch Data Cache persist across instances and deploys, while plain
`"use cache"` lives in memory per instance. The library and feeds are cheap enough to accept that.
If a cold-instance miss shows up, switch those loaders to `"use cache: remote"`.

Note on `staleTimes.static: 180`: it also lowers the `default` cacheLife profile's `stale` to 3 minutes.
Content below 5 minutes of `stale` is prerendered but left out of the App Shell. Give every cached
loader an explicit `cacheLife` (as above) instead of relying on `default`. If we lean on App Shell
prefetching, consider raising `static` to 300.

### Route segment configs

All configs Cache Components rejects are removed on the branch (see "What the prototype changed",
step 2). None remain under `app/(site)/dashboard`. `maxDuration` and `generateStaticParams` are still allowed.
`dashboard/discipleship-journey/[seriesId]` returns a non-empty list, which Cache Components now requires.

### Client hooks

`usePathname()` in the dashboard shell is fine because it renders inside the boundary. Any client
component that reads `usePathname`/`useParams` **above** a Suspense boundary on a dynamic-param route
breaks the build, which is how `RootIntegrations` was caught. `useSearchParams` always needs a boundary.

## Activity (state preservation) review

Hidden pages keep `useState`, form values and dialog state. Their effects clean up on hide and re-run
on show. What that means here:

- **Sign-out (must fix before adoption).** `signOutDashboardAction` redirects with `redirect("/login")`,
  which is a client navigation. Hidden dashboard pages, including drafts in message composers and
  report forms, stay in the DOM. A second person signing in on a shared phone could navigate back into
  the first person's preserved state. Make sign-out a full reload: return from the action and call
  `window.location.assign("/login")` in `SignOutSubmit`. The dashboard layout already keys
  `CommunityQueryProvider` by user id, which resets the query cache but not hidden page state.
- **Dialogs and menus** (14 files: `report-dialog`, `new-message-dialog`, `create-group-dialog`,
  `action-menu`, `post-card`, `feed-toolbar`, `chip-select`, `share-learning-progress-dialog`,
  `share-intent-buttons`, `sogp-join-cohort-banner`, `prayer-watch-page`, `podcast-track-picker`,
  `discipleship-journey-gallery`, the shell drawer): a dialog left open reappears open when you come
  back, and focus-on-open effects won't re-fire. Close open dialogs and menus in a `useLayoutEffect`
  cleanup, or drive the important ones from the URL.
- **Forms with `useActionState`** (`prayer-watch-page`, `podcast-progress-page`, `reminders-step`,
  `teaching-time-step`, `school-of-purpose-waitlist-form`): success and error banners persist on return.
  Reset them on the next edit or submit.
- **Step forms** (ministry report `activity-form`, `ministry-form`, `meeting-form`): keeping a half-filled
  report on back navigation is mostly a win. Check that a saved report doesn't reappear as a fresh draft.
- **Polling.** TanStack Query observers unsubscribe when a page is hidden, so hidden feeds stop polling
  and refetch on show. That's fine and cuts background load.
- **Shell.** `DashboardShell`'s module-level `mountedFrames` counter is balanced by its effect cleanup,
  and the shell lives in the persistent layout, so Activity doesn't affect it.
- **Tests.** Playwright or DOM tests that query by text may now match hidden copies. Use
  visibility-aware selectors.

## Risks

| Risk | Where | Mitigation |
|---|---|---|
| Per-user data in a shared server cache | Any future `"use cache"` near session data | Never cache a function that takes or reads the session. Cache only public data (library, feeds, teachings). Use `"use cache: private"` for anything per user. Review rule: a `"use cache"` body may not import `getAppSession`, `getDashboardViewer` or `getCommunityContext` |
| Auth redirect becomes `200` + streamed redirect | Signed-out hits on `/dashboard/*` | `proxy.ts` optimistic cookie redirect. The layout stays the real gate |
| Previous user's state after sign-out | Activity | Full-reload sign-out (above) |
| Stale nav or badges | Client App Shell per session, `staleTimes.dynamic: 30` | Unread counts are already client-polled (TanStack), so they're unaffected. Capabilities (Community, Oversight entries) can lag up to the client cache lifetime after a role change. `revalidatePath`/`revalidateTag` refresh prefetches, so check that the actions that change roles (church assignments, pastor regions, unit leaders) revalidate `/dashboard` (not audited yet). Avoid server-side caching of capabilities |
| `use cache` doesn't survive deploys or instances | library, feeds | Acceptable. Use `"use cache: remote"` if misses show |
| Whole-app flag | admin, PPC, public | Opted out with `instant = false`. They render exactly as today. Convert later or never |
| Sync clock reads added later | any server component | Build fails loudly ("unstable value `new Date()`"). Read the clock after request data, or in a client component |
| Blank shells | routes whose fallback is too thin | The dashboard fallback is the existing skeleton. Per-area `loading.tsx` files still give sibling navigations their own skeletons |

## Steps to adopt

1. **Rebase the prototype** onto current `main`, then fix `/opengraph-image` (cache the logo read) and
   the content-overview test.
2. **Must-fix pair before the flag ships:** full-reload sign-out, and the optimistic `proxy.ts`
   redirect for signed-out dashboard requests.
3. **Ship `cacheComponents: true`** with the prototype's changes. Verify signed in on a Vercel preview:
   FCP/LCP on `/dashboard`, `/dashboard/sogp`, `/dashboard/community`, plus a sign-out → sign-in as a
   different user on one device.
4. **Run `next dev` and clear the instant-navigation insights** for dashboard sibling navigations
   (dev overlay only, never a build failure). Add `loading.tsx` or local `<Suspense>` where a nested
   layout blocks: the community layout's `getCommunityContext()` and the SOGP layout's session check
   are the likely ones.
5. **Convert `unstable_cache`** users to `"use cache"` with explicit `cacheLife` and tags.
6. **Activity clean-up:** dialogs, menus and `useActionState` banners from the list above.
7. **Partial prefetching:** first `export const prefetch = 'partial'` on `app/(site)/dashboard/layout.tsx`,
   then the app-wide `partialPrefetching: true` once admin and public are checked. Only two
   `<Link prefetch={true}>` exist, both public (`homepage-sogp-drawer`, `sogp-landing-page`), so the
   audit is small. The shell's idle `router.prefetch` of the other area keeps working and gets cheaper
   (shell only).
8. Later and optional: `"use cache: private"` for the viewer capabilities; convert admin and PPC by
   removing their `instant = false`.

Do not enable on `main` without the user's go-ahead. No migrations are involved.

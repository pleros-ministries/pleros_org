# Pleros design system

The rules every Pleros screen follows. Pleros has **two separate visual systems**:

- **The dashboard:** everything a signed-in person sees under `/dashboard`.
- **The public site:** the homepage, `/sogp`, `/sogp/enrol`, auth, the partner pages and the rest of the marketing pages.

They share fonts and brand colours. They differ in density, sizing, surfaces and controls. Part 1 applies to both, part 2 is the dashboard, part 3 is the public site. When a rule here conflicts with an older note, this file wins. When the user gives new design feedback, update this file in the same change.

Related: `CLAUDE.md` (how to work here), `docs/handover/2026-10-20-full-handover.md` (history, decisions, fixes), `AGENTS.md` (product rules).

---

## 1. Shared foundations (both systems)

### Voice and copy

- **Language:** UK English and sentence case everywhere ("Groups you lead", not "Groups You Lead").
- **Tone:** calm, warm and plain. No exclamation marks, no hype, no emoji in UI.
- **Short labels:**
  - actions: "Save", "Edit", "Done", "Open", "Remind", "See all";
  - states: "All in", "Not yet", "Not reported".
- **People words:**
  - "members", not "disciples" (Pastor, 20 October);
  - "leader" or "Leads your group", not "discipler", in learner copy;
  - "oversight structure", never "church structure", in learner copy;
  - no FCC branding inside the app: Pleros is not FCC's app.
- **No backend words in copy:** never "at the source", "payload", "flag" or "sync".
- **Errors:** say what to do ("Couldn't save that. Check your connection and try again.").
- **Display headings and short intros have no full stop.**
- **Copy that must never appear:**
  - learner-facing text saying a leader can read their quiz answers or written work;
  - push or notification text containing message, check-in, prayer, quiz or written-answer text: names and counts only.

### Typography

- **Sen** for headings, **Be Vietnam Pro** for body, labels, controls and status.
- **Suisse Int'l** is committed under `app/fonts/suisse-intl/` but isn't the dashboard face.
- **No bold.** Font weight tops out at **500** (medium). Bare `<strong>` and `<b>` render 500 on the dashboard through a zero-specificity rule in `dashboard-shell.module.css`. The only 600 is the active You/Community dot and a few legacy PDF styles.

### Colour

- **Brand anchors** (in `app/globals.css`): `--color-brand-blue` #011585 (the public deep blue) and `--color-brand-green` #70d20b (lime, used as an accent only).
- **Never light green.** No mint, pale teal-green or seafoam on cards, illustration fields, tints or colourways. Exceptions:
  - small icon chips may use soft sage (#dcefe3 on #1f6b45);
  - the deep green ink token `--color-community-green-ink` #2c6a22 is the "done" colour for dots and text;
  - the existing semantic status pill greens stay.
- **No violet for Meetings** (Meetings is rose). The Advanced SOGP violet card is the accepted exception.
- **Amber means "needs attention"** (text #a15c12, dot #d98a1f, count badge #f7e4cd on #92400e). Don't use it decoratively.
- **Reuse the tokens** in `app/globals.css`. Never create a second token system, and never redesign token names.

### Accessibility basics

- Touch targets are at least 36px on the dashboard and 44px on the public site.
- Every icon-only button has an `aria-label`.
- Decorative art is `aria-hidden`.
- Status is never colour alone: it's always a word too ("Reported", "Not yet", "Ministry missing").
- Motion honours `prefers-reduced-motion`.

---

## 2. The dashboard (`/dashboard/**`)

### Philosophy

1. **Pleros is an SOGP app, not a church super app** (Pastor, 17 October). The You area is the learner's daily SOGP journey. Church and oversight tools live in Community, and only for the people who have them.
2. **Calm, dense, mobile-first.** Design at 375px first. Information density like a good MOOC, warmth like the public site. Nothing shouts.
3. **Show only what's missing.** Name the gap, not the full checklist: "Ministry missing" beats "Devotion ✓ Ministry · missing Meetings ✓". A complete state is one quiet word ("All in").
4. **Counts and dots, not bars and pills.** A count with a small coloured dot reads calmer than a filled pill or a progress bar. Colour appears only when something needs attention.
5. **One level of nesting.** A group opens to its members, never deeper. Drilling further opens a new view ("Their groups"), with a back link.
6. **Let cards breathe.** Titles on their own line, details under them, actions last, each on its own row on phones. Never squeeze a name to "Aki…" to fit buttons beside it.
7. **Optimistic by default.** Anything a person saves shows at once and rolls back with a message if it fails.
8. **Real data only.** Never fill a design with sample names, counts or timers in live screens. Previews under `/preview/**` label themselves "Preview · sample data · nothing saved".

### Fonts and scale

- **Fonts:** headings use `--font-dashboard-heading` (Sen, via `dashboardHeadingFont` in `components/dashboard/v3/font.ts`); never use `--font-sen`, which the shell remaps. The body uses Be Vietnam Pro.
- **Sizes** (px, size/line-height):

| Use | Size |
|---|---|
| Page `h1` | 21/28 (one global rule) |
| Titles inside cards | 24/32 |
| Section headings (`sectionTitle h2`) | 15/22 |
| Body | 14/22 (content often 13.5) |
| Metadata | 13/20, list meta 12–12.5 |
| Helper text | 12 |
| Status pills | 12/18 |
| Fields | 16 (prevents iOS zoom), placeholder 14 muted |
| Controls | 13 (compact ones 12.5) |

- **Tracking:** headings −2% (`--dashboard-tracking-heading`), body −0.6%, small 0. Never hard-code px tracking.
- **Utility sizes:** inside the shell, `text-sm` is 13px and `text-xs` 12px.

### Surfaces, radii and spacing (`components/dashboard/v3/dashboard.module.css`)

- **Canvas:** the warm `--color-community-canvas` #f8f6f2. Raised surfaces are white with a visible edge (`--dashboard-panel-edge` #e2e5ea).
- **Two radius tiers:**
  - 16px `--dashboard-card-radius` for illustrated and hero surfaces (learning card, group cards);
  - 10px `--dashboard-panel-radius` for data and list panels.
- **Gutter:** one 16px `--dashboard-gutter` on every page.
- **Section gap:** 32px (`--dashboard-section-gap`); inside a page, panels sit about 12–14px apart.
- **Quoted or inset surfaces** use cool #f6f7f9, never the warm canvas.

### Controls are svelte, never fat

- **Primary button:** 38px (`--dashboard-control-height`).
- **Compact inline and header actions** (Post, Send, Join, View, Remind, Done): 32px tall, 10px corners, 12.5–13px text. They're never pills.
- **Secondary buttons, chips, tabs, icon buttons and link hit areas:** 36px (`--dashboard-hit-size`).
- **Fields:** 38–42px with 16px text.
- **List rows:** about 40–48px; with an avatar, about 56–60px.
- **Never 44/48px fat controls on the dashboard.** The public site and auth keep their own sizes.
- **Segmented toggles:** a `#eceef2` track with 3px padding. The active segment is white with a 1px shadow, and the 32px segments use 13px medium text. Used for Structure/Reports/Updates, To do/Done and Plan the day/End of day.
- **Chips:** `sheetStyles.chip` with `aria-pressed` and a check icon when on. Used for picking any of several (SOGP, Podcast, Other; discipleship actions).
- **Quiet links:** `styles.quiet`, blue 12.5px medium, no border. Used for "Their groups ›", "See all", "Back to …".
- **Count badges:** an 18px round badge, `inline-grid place-items-center`, `box-border`, `leading-none`, `tabular-nums`, 11px medium. That combination keeps the number centred.

### Status language

| State | Look |
|---|---|
| Done / all in | Small dot plus word, `--color-community-green-ink` |
| Missing / needs attention | Dot #d98a1f, text #a15c12 |
| Nil | Counts as in |
| Group rate | "2 of 3" over "reported", amber only when someone is missing |
| Strip numbers | 22px Sen, coloured only above zero |

### Layout and shell (`components/dashboard/shell/`)

- **Top bar:** 44px, deep blue `--dashboard-topbar-bg` #051480. Menu on the left, the You | Community switch centred (Sen, with a lime dot under the active one), the bell on the right. The bell's unread count is a lime badge pinned to the glyph.
- **Sidebar** (desktop): starts with a white Pleros logomark on a blue strip level with the top bar and collapses to a 72px icon rail (localStorage `pleros-sidebar-collapsed`). An area name opens the area; its chevron only folds or opens the list.
- **Drawer:** tablet and phone get one drawer with the same contents as the sidebar.
- **Grounded bottom bars** (phones and tablets), with a matching layout on desktop:
  - **You:** Home · Learning · Library · Partner · Profile.
  - **Community:** Home · Feed · Inbox · Reports, plus Oversight for leaders, the Pastor and branch pastors.
- **Area memory:** each area remembers its last page (session storage `pleros-area-positions`), and the other area is prefetched when idle.
- **Breadcrumbs** (`components/dashboard/shell/breadcrumbs.tsx`): deep pages get a breadcrumb bar under the top bar instead of a back-titled header.
  - The bar has a back arrow and one line that never wraps.
  - Area roots are left out of the trail; it ends with the current page in strong text.
  - On phones, long trails fold the middle into "…".
  - Pages give crumbs real names with `<CrumbLabel href label />`.
  - Titles and back targets for each path pattern live in `lib/dashboard/shell-navigation.ts`.
- **Scroll:** every new page opens at the top. Only the You/Community switch and browser back/forward keep their position.
- **Sticky headers** use `--dashboard-topbar-offset` (48px below `lg`, 0 on desktop).
- **Footer:** the dashboard has its own `DashboardFooter` (wordmark linking to `/`, the About links and Download Pleros). It's not the public footer. `pb-24` leaves room for the bottom bar.

### Page anatomy (how every dashboard page is built)

1. A breadcrumb (from `shell-navigation.ts`), plus `<CrumbLabel>` for dynamic names.
2. A heading block (`styles.heading`: `h1` plus a `styles.sub` line of facts such as "2 groups you lead · 11 people in all"). Tabbed areas put the segmented tabs right under it.
3. Sections, each with a `styles.sectionTitle` (`h2` on the left, a quiet link or count on the right), then a `styles.panel` holding a `styles.list` of `styles.row`s.
4. Empty states sit in the panel (`styles.panel styles.empty`) as one plain sentence saying what will appear and how ("No one in this group yet. Invite people from the group's page.").
5. A note at the bottom (`styles.note`) explains the screen's rule in one or two lines. Privacy notes start with a small lock icon.

Most of these classes come from `components/community/discipleship/discipleship-group.module.css`, which is the shared dashboard vocabulary. Reuse it rather than writing new row and panel CSS.

### Building blocks to reuse

| Need | Use |
|---|---|
| Rows, lists, panels, section titles, buttons, pills, strips | `components/community/discipleship/discipleship-group.module.css` |
| Avatar with initials | `Initials` (`components/community/discipleship/shared.tsx`) |
| Illustrated group card | `GroupCard`, `leadColourways` (`components/community/community-home-v3.tsx`) |
| Group page hero and tabs | `GroupHero`, `GroupTabs`, `groupIcon()` (`components/community/groups/group-hero.tsx`) |
| Count strip | `Strip` (`components/dashboard/church/oversight-view.tsx`) or `styles.strip` |
| Lettered branch mark | `Mark` (`oversight-view.tsx`) |
| Bottom-sheet pop-up | `ReportSheet`, `Segmented`, `Stepper`, `sheetStyles` (`components/community/report/report-sheet.tsx`) |
| Oversight tabs header | `OversightHeader` (`components/dashboard/church/oversight-nav.tsx`) |
| Leaderboard preview | `LeaderboardPreview` (`components/sogp/learning/leaderboard-preview.tsx`, `dense` on Home) |
| Message someone | `MessageButton` (`bare` and `primary` let it match the buttons beside it) |
| Install the app | `GetAppButton` (tones `light`, `dark`, `quiet`) |
| Loading state | `PageSkeleton` in each tab's `loading.tsx` |

### Illustration on the dashboard

- **Two families**, both made with Codex image generation (method and prompts in the handover note, section 7):
  - **Learning card art:** each SOGP level has its own art, on dark saturated fields behind white text:
    - level 1: blue staircase;
    - level 2: green foundation stones (deep forest green, never mint);
    - level 3: terracotta arch;
    - level 4: plum hill and lantern.
  - **Group art:** light pastel fields behind dark text, one object per group type:
    - location: sky-blue map pin;
    - group you're in: butter field with a sprout in a pot;
    - groups you lead: three figures, in lilac and slate-blue colourways, alternated oldest first so neighbours differ;
    - public: apricot speech bubbles;
    - private: rose shelter.
- **Shared style:** soft 2.5D clay or paper-cut, visibly grainy, lit from the upper left. One compact object sits deep in the bottom-right corner, bleeding off the edge, and the rest is calm empty field so copy never overlaps the object. Never text, people, faces, crosses, Bibles, books, plants (except the sprout), stars or sparkles.
- **Three cuts per artwork:**
  - wide 3:2 for cards from 640px (`-wide-480/960.webp`);
  - compact square for phones (`-compact-320/640.webp`);
  - a centred icon for 40px list tiles (`-icon-96/192.webp`).
- **Delivery:** served with `image-set()` at 1x and 2x, from `public/assets/dashboard/community-groups/` and `public/assets/dashboard/learning-card/`.
- **No seams:** above a width threshold (measured on the container, not the window) a card switches to the 3:1 `-wide` cut on `background-size: cover`, anchored bottom-right. Work the threshold out; don't guess it. The compact 3:2 art at `auto 114%` of a card H tall, nudged 22px right, covers widths up to 1.14·H·1.5 − 22px. So Home (min 252px tall) switches at 400px, and the Learning hub (220px) at 350px. Otherwise the base colour shows as a strip where the art stops; this happened on the Learning hub at 399px, fixed 20 October.
- **Learning cards (Other learning)** are a third family (user, 21 October): one object per card on a light pastel field, in the same clay and grain style.
  - Objects and fields: Welcome Pack a gift (sky blue), Pre-SOGP a compass (butter), SOGP a gem (coral-apricot), Advanced SOGP a mountain path (lilac), Podcast headphones (rose), Library cassette tapes (warm sand).
  - The art is never stretched over the card. Each card is its field colour, and the object is a snug tile (`<key>-tile-192/384.webp` in `public/assets/dashboard/learning-cards/`, cut by `scripts/cut-learning-card-tiles.py`) set at a fixed size in the bottom-right corner: 96px, 80px below 360px, 108px from 640px. Only its top and left field margin fades out, so it stays snug at every width with no seam.
  - The app's paper grain (`grain-384.webp`, cut from the approved art) lies over the whole card, so field and object read as one surface.
  - Tag and title sit top-left, one short line bottom-left, as on the group cards. Prompts: `docs/handover/codex-prompts/5`, `6` and `7`.
- **Text over art is always live text**, never baked in.
- **No second blue hero:** only the My learning card is blue. Other illustrated tiles take their own complementary palette.

### Interaction

- **Pop-ups:** bottom sheets (`ReportSheet`) on phones. My reports never sends you to another page to fill a part.
- **Optimistic saves:** update local state at once, run the server action, replace with the saved truth, or roll back and show the error in the sheet or page (`role="alert"`). Use temporary negative ids for rows not yet saved, and disable editing them until they are.
- **Motion:** use the `--ease-out` and `--ease-drawer` tokens, and animate transform and opacity only. Anything that animates in animates out the same way (hold it mounted with `data-closing`). Never swap layout markup at the start of a size change.
- **Tabs that are routes** (Oversight) are `Link`s with `scroll={false}` and idle prefetch (`useIdlePrefetch`). In-page toggles are buttons with `role="tab"`.
- **Search in pickers:**
  - names only, never email;
  - full matches first (`nameSearch` in `lib/db/name-search.ts`);
  - episode search is deduped and ranked (`lib/podcast-episode-search.ts`).
- **Pickers:** the new-message picker closes when you choose someone. Long lists open near where the person left off and use "Show earlier" / "Show more", eight at a time, plus a search box.

### Report section colours (My reports)

- Devotion: blue (#e4ebfd on #2331ae).
- Ministry: sage (#dcefe3 on #1f6b45).
- Meetings: rose (#f6d9de on #7a2e45).
- Other reports: blue target icon.

Never violet for Meetings, and never the status-pill amber for a section.

---

## 3. The public site (everything outside `/dashboard`)

- **Shells:**
  - page roots include `.site-font-theme`;
  - full-bleed bars use `.site-shell-bar-inner`, content uses `.site-shell-page`, and SOGP content pairs it with `sogp-shell-page`;
  - nav and footer come from `PublicSitePageShell`, `HomepageNav` and `HomepageFooter`.
- **Typography:** use the shared classes (`site-hero-eyebrow`, `site-hero-heading`, `site-section-heading`, `site-section-intro`, `site-pathway-title`), not ad hoc sizes. Display headings have no full stop.
- **Colour:** brand blue CTAs and soft sky. Questions and podcast surfaces lean bright, low-saturation yellow or olive, never orange.
- **Community photography:** greyscale under a dark overlay, featuring Black and African people. The blue tint was rejected.
- **Controls:** public controls keep 44px targets. Desktop nav dropdowns are full-width stacked panels. The mobile drawer is square-cornered and fully off-canvas when closed.
- **SOGP landing (`/sogp`):**
  - no navbar;
  - white hero with a four-part headline, the welcome video, and "Enrol for free" only after free access is explained;
  - a compact curriculum accordion and a FAQ accordion.
- **Enrolment (`/sogp/enrol`):**
  - mobile hero about 38px over two lines;
  - 13px labels, 14px buttons and select values, 12px helpers, 16px free-text inputs;
  - required labels have asterisks;
  - validation runs on submit only (blur stays neutral, and an incomplete submit focuses the first error);
  - empty selects are muted, and chosen values get strong text and a blue chevron;
  - the CTA is "Continue setup", and the privacy note is left-aligned.
- **Learner auth** (`/login`, `/forgot-password`, `/reset-password`, `/setup`):
  - compact: 24px headings, 14px body and buttons, 13px labels, 12px helpers, 16px inputs;
  - a code-native abstract geometric panel (blue, sky and green with coral and sand) with tactile grain.
- **Emails:** one table-based shell (`lib/email/templates.ts`):
  - soft sky header, lime eyebrow, white content, brand-blue button;
  - Sen headings and Be Vietnam Pro body with safe fallbacks;
  - MSO support;
  - no emoji.
- **Prayer Watch times:** Morning 5:30 am, Afternoon 12:30 pm, Evening 8:30 pm. They show as a connected low-radius strip.

# Pleros: full handover (as of 20 October 2026, 17:20 WAT)

This note gives a new Claude session everything it needs to continue the Pleros dashboard work at the same quality: how the user works, the decisions behind the product, the design system, the illustration pipeline, the performance and privacy guarantees, and every significant change and fix.

**Read in this order:**
1. `CLAUDE.md`: working rules (short).
2. `DESIGN.md`: the visual system, dashboard and public site separately.
3. This file.
4. `AGENTS.md`: the detailed product rules for each feature; it's long, so search it.
5. `docs/ai_scratchpad.md`: older, pattern-level lessons.

Older handover: `docs/handover/2026-10-20-handover.md` covers 17–19 October in summary. This note supersedes it and adds 20 October.

---

## 1. The project and the people

- **What Pleros is:** the app of Pleros Ministries and Missions (plural "Missions"). Its core product is **SOGP**, the School of God's Purpose: cohorts, four levels, 24 teachings, Prayer Watch and group reviews. Learners use the dashboard at pleros.org/dashboard, and the public site sells and explains SOGP.
- **The user:** Daniel (git user Daniel Adeyemo; also signs in as olamide@agrolinking.com). He builds Pleros, relays the Pastor's reviews, and gives fast visual feedback by selecting elements in the browser pane. Use they/them unless they say otherwise.
- **The Pastor:** sets direction through recorded review meetings. Daniel shares a Drive link or audio, which we transcribe locally (section 15). The decisions from each review are in section 11.
- **The October 2026 cohort is live.** The September cohort ended on 11 October, though its learners can still finish.
- **Real people use this every day.** The local database is the production database (section 15).

## 2. How the user wants you to work

1. **Push to `main` after every piece.** No branches or PRs unless asked. Commit messages are Conventional (`feat:`, `fix:`, `style:`, `copy:`, `docs:`, `perf:`, `chore:`), with a one-line subject and a short body explaining why, ending with the Co-Authored-By line.
2. **No production flags.** Build the new behaviour on main and delete the old path in the same change. Never add env toggles: the user said "please I don't like production flags. just build on main". Some legacy `DASHBOARD_*` flags still exist from before; don't add new ones.
3. **Migrations:**
   - Write the SQL by hand, because `drizzle-kit generate` hangs on its prompt.
   - Show it to the user and wait for an explicit "apply".
   - Apply it with psql inside `BEGIN … COMMIT` and record it in `drizzle.__drizzle_migrations` (section 8).
   - Don't push code that needs an unapplied table unless its reads degrade safely; usually, commit locally and push after applying.
4. **Mockups first for big UI changes.** When the Pastor asks for a new structure, build a sample-data mockup at `/preview/dashboard-v3/<name>` and iterate with the user. Only then build the real thing, and delete the mockup component afterwards. The preview route can stay, rendering the real components on sample data.
5. **Act, don't ask.** When the next step is clear, do it and say what you did. Ask only for real decisions: a migration, something ambiguous in the Pastor's words, or an irreversible action.
6. **Feedback arrives as browser selections.** The user selects an element and writes a few words ("fix alignment", "too squished", "make denser", "can this be green?"). Treat each as a precise, local design correction. Make it, check it at 375px in the preview where possible, and push.
7. **Verification:**
   - `AGENTS.md` says don't run tests, lint or builds unless asked, but always run `npx tsc --noEmit -p .` before committing. A type error anywhere fails the Vercel deploy.
   - Run a focused vitest file when you add pure logic and the user asks you to make sure it works.
   - Check visually with the in-app browser at the mobile preset (375×812) and reset to desktop afterwards.
   - When you can't sign in (you can't type passwords), check on `/preview/**` pages with sample data. Or, if the user is signed in on pleros.org in the pane, look there read-only, without saving anything.
8. **Say what you couldn't verify.** For example: "I haven't seen it on a signed-in account". Never claim a check you didn't run.
9. **Another session may be working in the same checkout.**
   - Stage only your own paths.
   - If a shared file has someone else's dirty lines, stage your hunk with `git hash-object -w --stdin` plus `git update-index --cacheinfo`.
   - Never sweep someone else's files into your commit.
   - Leave `docs/dashboard-demo/videos/` (untracked) alone.
10. **Keep the docs current.** After each feature, add or adjust its rule in `AGENTS.md`. Design corrections go in `DESIGN.md`, and lasting preferences in `CLAUDE.md`.
11. **Keep them informed.** On long turns, send a one-line status every so often ("I'm adding the podcast picker to Teaching next").

## 3. Design philosophy and UX choices

The full rules are in `DESIGN.md`. These are the principles behind them, with where each came from:

| Principle | Origin |
|---|---|
| SOGP-centric: the You area is the learner's SOGP day; church tools sit in Community | Pastor, 17 October ("not a church super app") |
| Calm over complete: name only what's missing ("Ministry missing"), counts and dots instead of bars and pills | User, 20 October ("calmer on the eyes without losing anything"; "stacking devotion ministry meetings is cluttered") |
| Never nest deeper than one level; drill into a new view with a back link | User, 20 October ("too much nesting… should not exceed one level") |
| Cards breathe: title, then details, then actions, each on its own line on phones | User, 20 October ("too squished, let the cards breathe"; "name can't even fully show") |
| Group by relationship, always: "Groups you're under" vs "Groups you lead" | User, 19–20 October |
| Optimistic saves everywhere | User, 20 October ("please make all such updates optimistic"; "I hope we use optimistic updates") |
| One main action per row: e.g. Message in blue, WhatsApp quiet | User, 20 October |
| Search is names only, deduped, with full matches first | User, 19 October ("email matches are never the intention") and 20 October ("deduped and best practice") |
| No sample or fake data in live screens; previews label themselves | Standing |
| Real people never appear in demo or training videos | Standing |
| No bold, no light green, no violet for Meetings, sentence case | Standing user preferences |
| Install CTA conspicuous but not obnoxious | Pastor, 20 October |
| Don't tell members their leader can read their answers or written work | User, 18 October ("we don't have to disclose this please") |

## 4. Product model (what exists and why)

### Areas

- **You** (`/dashboard`, bottom bar Home · Learning · Library · Partner · Profile). Home has, in order:
  1. the greeting with cohort and week;
  2. the illustrated My learning card;
  3. a Welcome Pack row, until the reminders step is saved;
  4. Today (date, "x of y done", Mon–Sun strip, Prayer Watch, next review), shown only while today is inside the cohort's dates;
  5. Your progress;
  6. the **leaderboard preview** (dense: top 3 plus you);
  7. the **Invite someone panel** (link and code with Copy, Share your link, "N joined with you");
  8. Grow together rows (your group or groups, Share what you learnt);
  9. a compact My reports;
  10. the dashboard footer with Download Pleros.
- **Community** (bottom bar Home · Feed · Inbox · Reports, plus Oversight for leaders of groups with members, the Pastor and branch pastors). Community Home has count cards, then Groups you're under, Groups you lead (including location groups you look after) with "+ New group", then People to bring in.

### Groups as oversight (Pastor, 19 October)

The leader of the group you're in is your overseer.
- One group membership per person; you can lead up to 20 groups.
- Joining takes a one-tap accept, and accepting while already in a group moves you (with a warning first).
- Groups are invite-only: no Discover, no open joining, and interest groups are closed.
- The church org chart (units, unit leaders, workers) is retired. Branch pastor status and scope remain.
- The overseer reads the full daily report.
- Follow-up owners invite their enrollees into their default group.

All the rules are in `AGENTS.md` under "Groups as oversight", and the plan in `docs/plans/groups-as-oversight.md`.

### Oversight (Pastor, 20 October): three tabs

| Tab | Route | What |
|---|---|---|
| Structure | `/dashboard/community/oversight` | Groups you lead; Groups led by those you lead; the Pastor's or branch pastor's other groups; branches |
| Reports | `/dashboard/community/oversight/reports?day=` | Day chips (today and the 4 days before), "Groups you lead" / "Groups under them" toggle, strip, groups opening to member report lines |
| Updates | `/dashboard/community/oversight/updates` | The old "Needs you", oldest first, To do / Done |

- **Their groups:** "Their groups ›" on a member who leads opens `?under=<userId>` with "Back to X's groups".
- **Branch setup:** at `/dashboard/community/oversight/branches` (Pastor only). `/oversight/structure` redirects to Oversight.
- **Code:**
  - `lib/db/queries/group-oversight.ts` (`getGroupOversight`, options `under` and `day`; returns `under.backTo`);
  - `lib/db/queries/oversight-updates.ts`;
  - `components/dashboard/church/group-oversight-view.tsx`;
  - `oversight-nav.tsx`.
- **How Updates are built:**
  - computed live, never stored; only Done is stored (`oversight_update_dones`, migration 0072);
  - people you lead directly are named one by one;
  - further down there's one update per group, merging "N haven't reported in 3 days · N behind in SOGP";
  - a ticked quiet or at-risk update comes back after 7 days if it still holds;
  - keys: `quiet:<userId>`, `group-quiet:<groupId>`, `questions:<leaderId>`, `joined:<membershipId>`, `group-joined:<groupId>-<latestMembershipId>`;
  - this took the Pastor's list from 80 items to 19.

### My reports (`/dashboard/community/report`)

- **Devotion:**
  - **Bible reading:** a plan of chapters per day, with a one-tap Done.
  - **Prayer Watch:** session chips plus **Another time**, recording the time actually prayed (`prayer_watch_other_times`, migration 0071). The day's line reads "morning, 10:15 pm".
  - **Teaching:** any mix of SOGP, Podcast and **Other**. Other names the teaching (`other_title`, migration 0074; `source` is `none` for an Other-only day).
- **Podcast picker in Teaching:**
  - ticking Podcast lists every episode in release order, opening just before the last one listened;
  - "Show earlier" / "Show more" load eight at a time;
  - a search box sits on top (`lib/podcast-episode-search.ts`: deduped, ignores accents, case and punctuation, every word must match, ranked by start of title, then start of a word, then anywhere);
  - picking records the episode in `podcast_episode_progress` as listened on that report day (`setReportPodcastEpisodes`), so the podcast line, leaderboard and SOGP podcast plan all count it;
  - episodes listened on another day are ticked in grey and locked;
  - unticking Podcast never erases listening.
- **Ministry:** Evangelism (broadcast, one-to-one, or both in one entry) and Discipleship (ticked actions).
- **Meetings:** unchanged. The Pastor said to skip meetings work for now.
- **Other reports → Natural assignment** (`/dashboard/community/report/assignment?day=`; migration 0073):
  - optional, never part of the daily report;
  - plan the day's goals (up to 10), each with to-dos (up to 15) and an optional deadline;
  - tick them off during the day, then save "What happened?" per goal at the end of the day;
  - optimistic, with temporary negative ids;
  - the overseer sees it read-only on the person's report page (`/dashboard/church/[userId]`).
- **Optimistic saves:** devotion rows use the `optimisticSave` override in `DailyReportSections`, with `onOptimistic` and `onChange` props on the sheets.

### Learning and the calendar

- **Learning hub:** `/dashboard/sogp` (resume card, catch-up, this week, leaderboard preview, path, tools).
- **The calendar follows the learner's path** (fixed 20 October). `getActiveSogpJourney` returns `path: "traditional" | "podcast"`, read from `sogp_learning_preferences`: podcast means `path !== 'traditional'` and `has_podcast_plan`.
  - On the podcast path, a day requires only Prayer Watch and reviews; there are no Traditional quiz or response requirements.
  - The calendar page (`/dashboard/sogp/traditional`) is titled "Your calendar · Podcast path".
  - Its teaching row is "Your podcast day" with a Listen action, and the Traditional levels, outline and teachings count are hidden.
  - Preview: `/preview/dashboard/sogp?path=podcast`.
- **Today hides after the cohort ends:** Home's Today and This week appear only while today is inside the cohort's dates. September learners therefore no longer see it; that's expected.

### Install and footer

- `GetAppButton` (`components/pwa/get-app-button.tsx`) prompts the browser's own install. On iPhone it shows the two Add to Home Screen steps, and it's hidden once installed.
- It appears in the dashboard footer and the account menu.
- The install prompt is captured once per page load in `lib/pwa/install-prompt-store.ts`, loaded from the root layout. Don't move that listener.

## 5. How to build a new dashboard page

1. **Route:** `app/(site)/dashboard/<area>/<page>/page.tsx`, a server component.
   - If it reads the session, cookies, params or searchParams, add `export const instant = false;` with the comment `// Reads the session on every request (Cache Components).` Without it, Next 16.3 throws the "Instant" error. Every dashboard page has it as of `dca068a`, and so do preview pages that read searchParams.
   - Client-only (`"use client"`) pages can't export it.
2. **Auth:**
   - `const session = await getAppSession(); if (!session) redirect("/login?returnTo=…")`;
   - community pages also use `getCommunityContext()` and `canAccessReporting(ctx)` as appropriate;
   - re-check access on the server; never trust the client.
3. **Data:**
   - one query module under `lib/db/queries/` with `import "server-only"`;
   - start independent reads together in `Promise.all`, and start dependent reads as soon as their input resolves;
   - wrap repeated per-user reads in React `cache()`;
   - degrade when a migration isn't applied: catch Postgres `42P01` and return empty or `null`, and refuse writes with a friendly `CommunityError`.
4. **Actions:**
   - in `app/(site)/dashboard/<area>/_actions/*.ts` with `"use server"`;
   - return `{ ok: true, value? } | { ok: false, error }` (catch `CommunityError`, because thrown messages are hidden in production);
   - `revalidatePath` the affected layout.
5. **Client components** import only **types** from `lib/db/queries/*`.
6. **Breadcrumb:**
   - add the path to `lib/dashboard/shell-navigation.ts` (title and back target);
   - for dynamic names, render `<CrumbLabel href label />` in the page.
7. **Navigation:** add the item to `lib/dashboard/navigation.ts` / `dashboard-menu-navigation.tsx` if it's a destination.
8. **Look:** follow `DESIGN.md` page anatomy and reuse `discipleship-group.module.css` classes.
9. **Loading:** You tabs have a `loading.tsx` with `PageSkeleton`.
10. **Preview:** if the page is worth showing without sign-in, add `/preview/dashboard-v3/<name>` rendering the real component with clearly fake sample data (no real member names). Label it "Preview · sample data · nothing saved".
11. **Docs:** add the rule to `AGENTS.md`.

## 6. Performance guarantees (keep these true)

- **Cache Components is on.** `experimental.staleTimes` is `{ dynamic: 30, static: 180 }`.
- **Instant tabs:** tabs and areas prefetch when idle (`useIdlePrefetch`, plus the shell's area prefetch keyed on the address). A prefetch keyed on an object once looped and starved the database.
- **Lesson payload** went from 845 KB to 16 KB, and SOGP screens fetch in the browser. SOGP dashboard reads don't load every lesson's notes.
- **One lock read:** `getOwnSogpLearning` takes a per-learner advisory lock. Pass already-loaded learning state down (e.g. into `getLearningHubData`) rather than reading it twice.
- **Oversight:** people are capped at 2000. Report statuses for the Pastor's whole view take about 2 seconds from a laptop and are fast in production. Watch this as groups grow.
- **Updates scale:** they're aggregated per group further down, so the Pastor's list stays short.
- **Episode search** filters on the client: no requests while typing.
- **Functions run beside the database** (`"regions": ["iad1"]` in `vercel.json`, 23 October). They had been running in Frankfurt (`fra1`) against a Neon database in us-east-1, so every query crossed the Atlantic (about 90–100 ms each) and a page's 10 or more sequential reads added the 1–2 second lag the Pastor felt. Check with an API route's `x-vercel-id` header (`iad1::iad1::…` once deployed). Keep sequential reads few: Oversight's devotion lookup now reads everyone in one pass, and its first reads start together.
- **Neon HTTP** can't do transactions. Use `transactionDb` (the Pool client) for atomic writes; queries in one transaction run in sequence.

## 7. Illustrations: how they're made (Codex)

All dashboard art was generated with the **OpenAI Codex CLI's image generation**, using the approved level 1 art as the style reference. The prompts are in `docs/handover/codex-prompts/`:

| File | Made |
|---|---|
| `1-learning-card-levels.md` | Level 2, 3 and 4 learning card art |
| `2-group-cards-wide.md` | Five group card artworks (3:2) |
| `3-group-cards-square.md` | Compact square phone cuts of those five |
| `4-group-icons.md` | 40px app-icon cuts of the six group artworks (the leading art has a lilac and a slate version) |

**Method:**

```bash
D=<an empty scratch folder>; cp public/assets/dashboard/learning-card/my-learning-background-v5.webp $D/ref-v5.webp
codex exec --skip-git-repo-check -s workspace-write -C $D -i ref-v5.webp - < prompt.md > codex.log 2>&1
```

- Pass each reference image with `-i`. For the square and icon cuts, attach the wide versions you're recutting.
- The prompt asks Codex to "Generate exactly N images … copy each into the current working directory with these exact names … Do nothing else".
- Look at every output before using it. Regenerate any that break a rule (text, faces, wrong placement, too smooth).

**Prompt recipe** (keep it for new art):
- Name the reference as the exact **style** reference: "match it closely in every respect except colour and focal object".
- Grain: "same tactile, visible fine paper grain, at least as grainy as the reference, never smooth or flat vector".
- Look: "soft 2.5D clay or paper-cut, gentle rounded edges, light from the upper left, soft contact shadows".
- Composition: one compact focal object in the **bottom-right** (give a footprint, e.g. 26–34% wide), with generous bleed past the right and bottom edges. The left 60% and top 45% stay calm, almost empty field for text.
- One restrained warm glow accent.
- Field: for white text, a dark saturated field with hex values; for dark text, a light pastel field with hex values, and the object in mid and deep tones of the same hue.
- Constraints list: no text, letters, numbers, logos, UI, people, faces, hands, crosses, Bibles, books, stars, confetti, sparkles or watermark. "Calm, premium, adult Christian community; not childish, not gamified."
- Never light or mint green (the level 2 forest green is deep; the sprout card field is butter).

**Converting:** with `cwebp`, into the right folder.
- Learning cards: `cwebp -q 66` for `my-learning-level-N.webp`, plus a 3:1 `-wide.webp` cut for desktop.
- Group cards: `cwebp -q 72 -resize 960 0` and `-resize 480 0` for `<type>-wide-960/480.webp`, plus `-compact-320/640.webp`.
- Icons: `cwebp -q 86 -resize 96 96` and `-q 84 -resize 192 192` for `<type>-icon-96/192.webp`.
- Folders: `public/assets/dashboard/learning-card/` and `public/assets/dashboard/community-groups/`.
- Reference them through `image-set()` 1x/2x (see `groupIcon()` in `components/community/groups/group-hero.tsx` and `learningArt` in `components/dashboard/v3/home-view.tsx`).

**Placement in CSS:**
- The art anchors bottom-right.
- On phones the learning card scales 114% and is nudged 22px right and 30px down past the corner.
- On desktop, the 3:1 `-wide` cut is set to cover.
- Copy is capped at 74% / 420px so it never meets the object.

**Colourway rules:**
- groups you lead alternate lilac and slate, oldest first;
- the group you're in is butter;
- public is apricot (kept apart from butter);
- private is rose;
- location is sky.

**Known oddity (20 October):** in Claude's in-app browser pane, the group art sometimes didn't paint on pleros.org, even though the files and styles were correct. If the user reports missing art on their phone, investigate; otherwise it's likely a quirk of the pane.

## 8. Database and migrations

- **The local `DATABASE_URL` in `.env` / `.env.local` is the shared production Neon database.**
  - Reading is fine.
  - Never create real conversations, invitations, moves, handovers, reports or toggles to test.
  - Revert anything you change.
  - For read-only psql sessions, use `set default_transaction_read_only=on;`.
- **Applying a migration** (only after the user says so):

```bash
set -a; . ./.env; . ./.env.local; set +a
h=$(shasum -a 256 drizzle/00NN_name.sql | cut -d' ' -f1)
# apply.sql: \set ON_ERROR_STOP 1 / BEGIN; / \i drizzle/00NN_name.sql /
#   insert into drizzle.__drizzle_migrations (hash, created_at) select '<h>', <journal when> where not exists (…);
#   COMMIT;
psql "${DATABASE_URL_UNPOOLED:-$DATABASE_URL}" -f apply.sql
```

  Add the journal entry (`drizzle/meta/_journal.json`, `"version": "7"`, `when` one day, 86400000, after the previous one, 1-space JSON indent) and the matching tables in `lib/db/schema.ts`, in the same change.
- **Applied migrations** (id is in `drizzle.__drizzle_migrations`):

| File | id | What |
|---|---|---|
| 0064_people_follow_ups | 70 | Follow-up log, private contact invites |
| 0065_advanced_sogp_interest | 71 | Advanced SOGP "Notify me" |
| 0066_enrollee_handover_notifications | 72 | `enrollee_handed_over`, `follow_up_changed` |
| 0067_church_unit_worker_notifications | 73 | `unit_workers_added` (now unused) |
| 0068_report_popups | 74 | Bible plans, Teaching, ministry report details |
| 0069_group_oversight_identity | 75 | User ids on groups, memberships and invitations; triggers; one-overseer index |
| 0070_group_invitation_notifications | 76 | `group_invitation` kind (12 pending backfilled in-app) |
| 0071_prayer_other_times | 77 | Another time for Prayer Watch |
| 0072_oversight_update_dones | 78 | Done state for Oversight Updates |
| 0073_natural_assignment_reports | 79 | Natural assignment goals and to-dos |
| 0074_teaching_other | 80 | Teaching's Other (`other_title`, source `none`) |
| 0075_report_yes_no_meetings | 81 | Yes/No reasons, meeting details, `outreach_meeting` |
| 0076_next_learning | 82 | What's next after SOGP; your own podcast journey |

- **Live data changes outside the app:** on 19 October, `community_groups` id 3 was closed. Nothing else.
- **Scripts against server-only code** (read-only probes):
  - run `NODE_PATH=<dir containing an empty server-only package> npx tsx --tsconfig tsconfig.json script.ts`, with `.env` sourced;
  - import `lib/*` dynamically inside `async function main()`;
  - `fetchAnchorEpisodes` fails outside Next, because `cacheLife` needs Cache Components.

## 9. Privacy guarantees (never break)

- **Leader access to work:** quiz answers and written work are visible only to the direct leader of an active membership, and learner copy never mentions that.
- **Notifications and push:** names and counts only. Never message, check-in, prayer, quiz or answer text, and never a discipleship post's title. Nothing goes to Telegram except the private ops signup alert.
- **Ask Pleros anonymity is structural.** Staff reads never select the asker, and mutes are never listed.
- **Saved contacts:** a person's contacts go only to that person, the pastor of their location group, and admins. Never their leader.
- **Age:** no age restrictions anywhere (user, 22 October). Still never send age to the client.
- **Search:** names only, never email.
- **Videos and screenshots:** no real member names in demo or training material that leaves the machine.

## 10. Everything changed and fixed, by day

The `main` commit history is the full record (`git log --since=2026-10-17`). These are the significant ones, with the lesson each taught.

**17 October.**
- My enrollees moved into Community, with search and this-week grouping; people screens gained a follow-up log (0064).
- Breadcrumbs end with the current page and fold in the middle on phones; pages open at the top; You trails start at You. "My SOGP" became "Learning".
- Group thumbnails got dedicated square icon cuts, because they zoomed badly otherwise.
- Learning hub, change path and history screens.
- The sidebar is grouped by area with Leadership. **Be Vietnam Pro replaced Inter.**

**18 October.**
- You and Community bottom bars, the blue top bar, Library, Partner and SOGP days.
- Home's Grow together became action rows, after illustrated tiles were rejected.
- Collapsible sidebar; medium row titles; **no default bold on dashboard pages**.
- Oversight became one place; the area switch appears on every page.
- Cache Components merged (`49fc0c6`), with a full-reload sign-out fix.
- One-page daily report with review and submit; Devotion fills in place.
- Podcast pace buttons grow with their text; Continue no longer hides behind the bottom bar; the bottom bar rests at the foot of short pages; the lesson card and player fit 280px.
- Lesson payload went from 845 KB to 16 KB. Lesson tabs (notes, quiz, response) have their own ticks.
- Motion pass, and FLIP for the sidebar fold.
- Invite someone page, and an "invited by" pill on the public pages.
- Profile owns notifications and reminders.
- Enrollee handover (0066).
- One 16px gutter; the new-message picker closes on choose, with forgiving search.

**19 October.**
- The church member picker searches as you type and finds everyone. The cause: results were capped before ordering, so full matches got dropped. Lesson: order full matches first, then cap.
- Unit worker move and remove, rename, leader change, leader notifications (0067). Appointments never silently replace a leader.
- **Groups as oversight**, steps 1–6 (0069), no flag. Interest groups closed and invite-only.
- Report pop-ups (0068, a parallel session).
- Home lists location groups you look after; the empty "Your group" card was dropped.

**20 October.**
- Empty report ticks are hollow rings.
- Group invitations appear in notifications (0070).
- **Instant errors:** every dashboard page that reads the session opts out (`b29691c`, then `dca068a` for the rest, preview pages in `979c745`). The dev message "An error occurred while attempting to validate instant UI" at `DashboardLayout` was the signed-out redirect on pages missing `instant = false`.
- Another time for Prayer Watch, with optimistic devotion updates (0071).
- Pastor review fixes: "members" not "disciples"; no FCC branding; evangelism can be both kinds in one entry; Download Pleros button; footer clears the bottom bar.
- Count badges centre their number: `inline-grid` plus `box-border` plus `leading-none` plus `tabular-nums`.
- Oversight mockup iterations:
  - breathing room;
  - Done labelled;
  - icons aligned with titles (`self-start` with `marginTop: -2`; Tailwind lost to the CSS-module `.row`, so use inline styles there);
  - one-level nesting;
  - no name trail;
  - calmer counts, dots and links;
  - "only what's missing";
  - green done marks;
  - "Groups you lead".
- Built the real **Oversight** (0072) and the **natural assignment** report (0073). The Pastor's 80 updates were aggregated down to 19.
- **The calendar follows the path:** podcast learners had Traditional assessments counted as due each day.
- Home: leaderboard preview (dense), then the Invite someone panel.
- **Teaching:**
  - Other (0074);
  - the podcast episode picker;
  - deduped, ranked episode search (tests in `lib/podcast-episode-search.test.ts`; they pass).
- **Leader card on your group's page:**
  - full name and "Leads your group";
  - compact buttons aligned under the name, Message in blue and WhatsApp quiet with a green icon;
  - the Message button had been shrinking under a `justify-content: center` grid rule. `MessageButton` gained `bare` and `primary` props.
- Groups page splits Groups you're under from Groups you lead.

**Older recurring lessons** (also in `docs/ai_scratchpad.md`):
- Drizzle correlated sub-selects must alias the inner table.
- Cohort `status` isn't kept current: decide phases from the cohort's dates.
- Never correlate with an interpolated outer column.
- Serialise dates safely.
- Close native dialogs properly.
- Grid children need `min-w-0`.

## 11. The Pastor's reviews and the decisions taken

**17 October** (recording in `~/Music/pleros-meetings/`):
- v3 was rejected as a "church super app".
- You is the old SOGP dashboard brought forward.
- Community gets grounded tabs and group cards.
- Homes were needed for the podcast, Welcome Pack, Pre-SOGP, Advanced SOGP and partnership. All were done (Library, Learning, the Partner tab, Notify me).

**18 October** (workers' meeting):
- My reports became one page with pop-ups.
- Profile owns reminders.

**19 October:** groups replace the org chart (section 4). User decisions:
- one overseer;
- accept to join;
- retire the org chart but keep branch pastor;
- the overseer sees the full report;
- no conversion of old appointments;
- invite-only.

**20 October** (transcribed locally), with the user's answers:
1. "Members", not "disciples" ("add someone" is fine). **Done.**
2. No FCC branding. **Done.**
3. Oversight as Structure, Reports and Updates, with Updates holding Needs you. Mockups first, then built. **Done.**
4. A natural assignment report under "Other reports": goals, to-dos and deadlines. **Done.**
5. Another time for people who missed Prayer Watch, recording when they actually prayed. **Done.**
6. Meetings work: **skipped for now.**
7. Evangelism can be more than one kind per entry. **Done.**
8. A real install button, lighter setup copy, a conspicuous but not obnoxious install CTA; keep the About section of the footer. **Done.**
9. The unclear mobile empty-space screen: **ignored** by user decision.

**Later the same day:**
- a leaderboard preview on Home, not a row;
- the path-specific calendar (both Home and the calendar page);
- Invite someone as its own panel with the link and Copy;
- a denser leaderboard;
- Teaching's Other;
- the podcast episode picker.
All done.

## 12. Open items and ideas

1. **Optimistic updates are missing** on group actions: accepting an invitation, inviting by name, leave and rename. The user hopes "we use optimistic updates" everywhere; offer to convert these next.
2. **Overseers can't see Teaching details yet** on the person's report page (SOGP, podcast, Other and episodes). Ask before adding.
3. **People without an SOGP enrolment can't join groups:** memberships still need `disciple_enrollment_id`. A follow-up migration would make it nullable.
4. **Retired org-chart rows** (`church_units`, `unit_leader` and `worker` assignments, `church_shared_meetings`) remain. Drop them in a later migration once groups have settled.
5. **Location groups:** the Pastor wants to revisit what they're for. Unchanged for now.
6. **A calendar on Home after a cohort ends:** Today is hidden then. Ask if the Pastor wants something there for learners still finishing.
7. **The pre-existing test failures** (3 in `menu-presentation`, 1 in `learning-ui`) and lint errors in `partner-home.tsx` aren't ours.
8. `docs/dashboard-demo/videos/` is untracked and isn't ours. Leave it.
9. **Group art painting in the browser pane** (section 7): confirm on a real phone.

## 13. Key files map

| Area | Files |
|---|---|
| Shell, navigation, breadcrumbs | `components/dashboard/shell/*`, `lib/dashboard/navigation.ts`, `lib/dashboard/shell-navigation.ts`, `lib/dashboard/viewer.ts` |
| You Home | `components/dashboard/v3/home-view.tsx`, `dashboard.module.css`, `lib/dashboard/home.ts`, `home-data.ts` |
| Learning | `components/sogp/learning/learning-hub.tsx`, `leaderboard-preview.tsx`, `lib/dashboard/learning-hub.ts`, `lib/db/queries/sogp-journey.ts` |
| Calendar | `components/sogp/sogp-journey-page.tsx`, `sogp-daily-tasks.tsx`, `sogp-course-sidebar.tsx`, `sogp-other-details.tsx` |
| Community Home and groups | `components/community/community-home-v3.tsx`, `groups/groups-directory.tsx`, `groups/group-hero.tsx`, `discipleship/member-group.tsx`, `lib/db/queries/community-home.ts` |
| Oversight | `components/dashboard/church/group-oversight-view.tsx`, `oversight-nav.tsx`, `lib/db/queries/group-oversight.ts`, `oversight-updates.ts`, `oversight-tree.ts`, `lib/oversight/tree.ts` |
| Invitations | `lib/db/queries/sogp-group-invitations.ts`, `follow-up-group-invites.ts`, `components/sogp/follow-up-invitations.tsx` |
| My reports | `components/community/report/daily-report-sections.tsx`, `devotion-sheets.tsx`, `devotion-inline.tsx`, `ministry-sheets.tsx`, `report-sheet.tsx`, `natural-assignment.tsx`, `lib/db/queries/report-popups.ts`, `natural-assignment.ts`, `podcast-progress.ts`, `lib/community/report-popups.ts` |
| Search | `lib/db/name-search.ts`, `lib/podcast-episode-search.ts` |
| Notifications | `lib/community/notify.ts`, `components/community/notification-bell.tsx`, `lib/notifications/*` |
| Install and footer | `components/pwa/get-app-button.tsx`, `lib/pwa/*`, `components/dashboard/dashboard-footer.tsx` |
| Previews | `app/preview/dashboard-v3/*` (oversight, natural-assignment, home), `app/preview/dashboard/sogp` (calendar) |

## 14. Writing style for replies to the user

- Lead with what changed and whether it's pushed: "Pushed to main (abc1234)".
- Short sections with bold labels; bullets for lists.
- Say plainly what wasn't verified.
- End each working turn with a short recap of what's now true.
- When a decision is the user's, ask one clear question, with your recommendation first.

## 15. Environment and tools

- **Dev server:** `.claude/launch.json` → `dev` on port 3001 (`preview_start {name:"dev"}`). If `next` isn't found, run `npm ci`.
- **Local sessions:** these sometimes drop. Neon "fetch failed" from this machine logs you out, and you can't sign in for the user (no typing passwords). Use previews, or pleros.org when the user is signed in there in the pane (read-only).
- **Vercel:** deploys from `main` automatically in about 2–3 minutes. The CLI isn't authorised for the team, so watch pleros.org.
- **Transcribing Pastor recordings:**

  ```bash
  whisper "<file>.m4a" --model large-v3-turbo --language en --output_format txt --output_dir ~/Music/pleros-meetings/
  ```

  Transcripts sit next to the audio as `… (transcript).txt`.
- **Codex CLI:** `codex exec` (section 7). It's v0.160 and needs to be signed in on this machine.
- **Image conversion:** `cwebp` (installed).
- **Claude's memory for this project** is in `~/.claude/projects/-Users-letroot-code-fcc-pleros-org/memory/`; its content is folded into this note and `CLAUDE.md`. A different account may not load it.

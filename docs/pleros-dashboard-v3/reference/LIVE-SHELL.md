# Live shared shell and You home

13 October 2026. Local branch `codex/dashboard-v3-baseline`, based on `939482b`. The owner approved the baseline and requested the live connection. No push, merge, deployment or production migration was performed. Existing user inputs and unrelated work were preserved.

## Connected

- Both authenticated dashboard layouts still use `getDashboardViewer()` and their existing login redirects. Their shared query provider is keyed by authenticated user id so another account does not reuse the previous account's client cache.
- The existing `DashboardShell` now uses the approved shared header, local font assets, profile/sidebar workspace, snug pills and swipe motion. Notifications use the same endpoint, query key and mark-read action; a single bell replaces duplicate shell/community bells. Password recovery and server-owned sign-out remain available.
- Every original destination remains in More destinations, with the same role/capability gating. Saved contacts links to the existing owner-scoped People page. Church oversight/assignments derive from the server-built inventory, not the displayed auth role.
- Tabs and swipes navigate real Next routes. Personal reports stay under You; feed, groups, messages and Ask Pleros stay under Community. Switching areas remembers the last internal destination/query, while tapping the current root tab returns to its root. No protected page is duplicated in an unauthorised client cache.
- The animation track has no transform at rest. This is necessary to preserve existing fixed players and sticky feature headers. The shared 48px root-header offset applies to feature headers on desktop as well as mobile.
- `/dashboard` now renders the approved You presenter instead of the old WelcomeDashboardView card grid. Its data projection uses the authenticated user's existing course, ministry, devotional and gated declaration readers. A small read-only discipleship projection supplies support without creating a group or sending invitations.
- Existing activity/progress/declaration and discipleship actions also invalidate `/dashboard`, so returning home reflects updates. Their persistence, validation and permissions are unchanged.
- Welcome Pack, Prayer Watch, podcast, preparation, installation, the church invitation strip and the shared footer remain reachable. Other feature-page bodies and their actions remain intact; their full redesigns are later slices.

## Real-data differences from the fixture

- Lesson title and completion counts come from the existing authenticated course reader. Only accessible, published lessons are used for continuation; completed history is untouched.
- There is no durable audio-resume time in the existing data model. The home card therefore shows actual completed-track progress, not the fixture's invented `12:24 / 1:00:00`. The lesson route still owns its existing player and assessment behaviour.
- Report counts are for the current Lagos date. Canonical devotional facts do not imply confirmation. Explicit Nil, missing and unconfirmed remain distinct; gated-off declaration readers do not query the new tables. Read failures reach a generic retry boundary rather than turning into zero counts.
- Support is only an existing active accepted discipleship relationship. An absent connection has an empty state; geographic/referral follow-up ownership is not invented or conflated with membership. The projection exposes first name and whether the existing messaging rule permits a shortcut, with no phone, email, birth year, notes or group membership write.
- Long real lesson titles wrap and grow the card. Existing ministry inputs, editable podcast plans, reassignment and new weekly-review scheduling/certification behaviour are not implemented by this slice.

## Verification

- 157 targeted tests across 17 files passed, covering the new home projection/permissions/privacy, cache invalidation, report semantics/actions, root-area navigation, swipe direction, existing auth access, SOGP discipleship, podcast/devotional history, church access, messaging restrictions and private outreach contacts.
- TypeScript and focused ESLint passed. `git diff --check` passed.
- Signed-out `/dashboard` redirected to login before data access. Browser verification used the owner's supplied account, which has both staff and SOGP learner capabilities. No roles or appointments were changed, and no other identities were impersonated; other member/leader/church-only capabilities were covered in tests.
- Authenticated You showed the user's actual lesson and 5/24 completion, with no fictional playback position or support person. Daily-report links retained the Lagos date and correctly kept You active. Community navigation reached the existing live feed with one notification bell and its contextual title/messages bar below the root header.
- The menu showed the real profile and authorised workspace. Closed native dialogs remain absent from the visible/focusable page; Escape closes the menu and restores the trigger. More destinations retained the original feature inventory and account actions.
- Live swiping was observed during navigation (Community selected, outgoing You track at −275.116px), and the committed route removed the transform at rest. Existing notification opening/mark-read and Escape dismissal were checked. Session creation, normal dashboard analytics and notification mark-read used the existing application behaviour; no report, learning-history, membership or hierarchy writes were performed.
- Mobile/desktop evidence is under `evidence/live-*`. These images contain the authorised account's display name and own course state, not credentials. Community/report captures are limited to header/navigation areas to avoid retaining private content.

## Remaining work

The Community body remains the existing functional feed under the new shell. Reporting/contact forms, shared meetings, editable SOGP paths/plans, ownership/invitation lifecycle and required group-review operations remain the subsequent vertical slices. No certificate threshold, outcomes policy, new schema or production flag was introduced here.

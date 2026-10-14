# Discipleship live presenter connection

14 October 2026. `/dashboard/sogp/discipleship` now renders the redesigned body, not only the shared dashboard header. This is a presentation connection with no schema, enrolment, membership or permission changes.

## Design mapping

`Pleros-disciple` supplies the identity block (initials, 24/32 name, group, snug Connected pill), blue message action and Overview / Check-ins / Reviews navigation. The supplied detail reference is not a complete group-management dashboard, so retained leader/member tools use established white surfaces, hairlines, 16px gutters, 32px section gaps, Be Vietnam Pro, shared pastel status pills and 44/48px controls. Existing desktop two-column behaviour and sidebar are retained; no desktop pixel-parity claim is made.

Unsupported mockup facts are not invented: current learning path/level and confirmed weekly sessions are absent from the existing disciple summary. The Reviews pane displays recorded daily attendance and explicitly says weekly scheduling is not connected. Existing certificate eligibility is retained and labelled as existing rules; no new threshold or cross-path formula is introduced.

## Retained feature inventory

| Flow | Live components/services retained |
| --- | --- |
| Owned groups | `GroupSwitcher`, `GroupHeader`; create/switch/rename/close actions, five-group limit, pause restrictions, last-group protection |
| Invitations | Existing link/share/copy/regenerate and leader phone consent; settings are now under a native disclosure; acceptance stays explicit |
| Daily participation | Existing date bounds/arrows, per-disciple flags and responsive participation table |
| Ministry | Existing group-scoped numbers-only query; no notes or contacts added |
| Disciple details | Existing preparation/assessment/prayer/review totals, average scores, last activity and eligibility |
| Follow-up | Existing preset nudges/daily cap, private contact log/history, consent-gated WhatsApp tap logging and removal |
| Check-ins | Existing composer/suggestions, private responses and reply editing; profile pane filters responses by the selected enrolment ID |
| Prayers | Existing leader Prayed actions and member create/answer/testimony/delete flows |
| Joined group | Existing discipler, own answers/replies, prayer requests, phone consent and leave action |

The route still derives the viewer from the app session and loads only their scoped dashboard. No action/query/auth implementation was altered. Neither church titles nor geographic follow-up assignments are used to infer group permissions. Shared-header duplication remains absent on the live page.

## Actual verification and limits

- Seven new presentation tests cover identity/control slots, profile tabs, paused/empty groups, retained leader/member tools. Existing 33 discipleship rules and three community discipleship-access regressions passed (43 focused checks including presentation).
- Full checkout regression: 1,171 passed; 59 opt-in DB checks skipped in this UI run. TypeScript, scoped ESLint and production build passed; the two existing share-image filesystem tracing warnings remain.
- Actual authenticated localhost route: new title/body, 390×844 and 1440×900 CSS viewports, 320px narrow reflow, no outer horizontal overflow, arrow/Home tab switching with focus, rename/cancel without saving, 16px free-text/44px input and 48px blue Share control. Actual group data was not changed and nothing was sent/shared externally.
- Existing synthetic preview uses the same presenter: populated profiles, three profile tabs/keyboard navigation, selected-disciple private answer filtering, consent-hidden messaging, all legacy progress/follow-up controls. Paused/member/empty conditional states are also covered by rendered-component tests. This is not proof of new backend behaviour or every unchanged write flow being runtime-exercised in this pass.
- Next.js runtime diagnostics reported no configuration/session errors after the live and preview checks.
- Final React Doctor scan covered 90 files, retained the prior 49/100 score and reported 20 branch warnings, none at the Discipleship files changed here. The earlier attempt timed out at the score service and transiently flagged an unchanged dependency's supply-chain score; that flag was absent in the final run. No green score/security audit is claimed. Transaction-await warnings elsewhere concern a deliberately single-connection locked read. Nothing was suppressed or upgraded to change the diagnostics.

The IAB was at the user's existing 90% zoom; overrides were adjusted to verify actual CSS dimensions. These screenshots are rendered evidence, not matched-fixture pixel acceptance. Visual adaptations above are explicit and available for owner review.

## Evidence and rollout

`evidence/discipleship-profile-mobile.jpg` uses public synthetic fixtures and may be committed. Authenticated `discipleship-live-mobile.jpg` and `discipleship-live-desktop.jpg` stay local to avoid publishing private account context. The real invitation URL remains inside its closed disclosure in captures.

Source commits are pushed to `codex/dashboard-v3-baseline`. No merge, manual deployment or production migration is claimed. Other feature-page bodies and the remaining learning/review/member-invitation implementation are separate work; this connection is not completion of the entire dashboard redesign.

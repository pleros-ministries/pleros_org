# Pleros-you baseline review

Status: **baseline approved by the owner, 13 October 2026**, including the subsequent snug-pill, compact-tab/dot and swipe-motion corrections. The live shared-shell and You-home bindings are now implemented locally; later redesign slices remain pending.

Open locally: `http://localhost:3010/preview/dashboard-v3`. Implementation branch: `codex/dashboard-v3-baseline`, based on `939482b`. A fresh fetch confirmed origin/main still at that revision. Source is uncommitted; `evidence/source-fingerprints.json` identifies the captured implementation and font assets.

## Frozen comparison

- Stem: `Pleros-you`; intended live route `/dashboard`; frozen fictional learner Tolu, support Efe Daniels, traditional 1 hr/day, The life of faith, 7/24 tracks, 12:24/1:00:00 playback, three devotional activities, Nil ministry and one meeting.
- Supplied reference: 780×1912 (2×), normalised to 390×956. Remove the 40px simulated device-status region and 27px simulated home-indicator region; app reference content is 390×889. The implementation does not draw those device decorations.
- Canonical app viewport: 390×844, scroll position 0. Full comparison also shows the support row and the separate preview disclaimer below the source content.
- Browser: Codex in-app browser on macOS. Browser zoom/device ratio reported 0.9. Capture files contain extra trailing bounds; crop them to the measured CSS area rather than scaling the application. Raw JPEGs are retained. Browser engine/version was not exposed by the read-only inspection surface.
- Fonts: supplied local Regular/Medium/SemiBold/Bold TTFs, requested at 400/500/600/700. Preloads for all four are in the token audit; `document.fonts.status` was loaded. Font synthesis is disabled. Greeting and playback positions are frozen; no animations/time-dependent data drive the fixture.

## Evidence

- `evidence/comparison.png`: supplied reference left, actual browser implementation right, matched viewport.
- `evidence/comparison-full.png`: full source and implementation content.
- `evidence/overlay.png` and `evidence/difference.png`: comparison aids, not automatic approval scores.
- `evidence/mobile-drawer.png`: actual mobile drawer, including profile/settings, root destinations and workspace.
- `evidence/desktop-pastor.png`, `evidence/tablet-unit-leader.png`, `evidence/narrow-320.png`: representative display fixtures and responsive checks. These are not real authenticated-role tests.
- `evidence/token-audit.json`: measured DOM typography, geometry, colours, controls and font resources.
- `evidence/contrast.json`: all measured text pairs exceed 4.5:1 (minimum 4.89:1). Focus/action blue and main icons also exceed 3:1 against white. The check does not certify every future screen/control.

## Measured matches and remaining discrepancies

| Area | Result / review note |
|---|---|
| Header | User correction, 13 October: compact content-sized You/Community tabs with 8px gap and a 4px blue dot underneath the active destination; minimum 44px targets. This supersedes the source's 132/236 tab centres. One 48px row; 44px menu/bell targets; 20px canonical paths; active/inactive weights 600/400. No header logo/avatar/bottom bar. `evidence/tabs-and-pills-corrected.png` records the revised header and pills. |
| Main geometry | 20px gutters; greeting 21/28/500; learning heading 15/22/500; card at (20,178), 350×228, radius 16; lesson title 24/32/500; action 48px, radius 11. |
| Status | User correction, 13 October: pills fit their text, with centred labels and equal 8px inline padding. Removed the source's fixed widths and Nil overhang. Height 26px and radius 6 remain. Text keeps unconfirmed, Nil and reported distinct. Earlier comparison images show the superseded widths; `evidence/pills-corrected.png` records this correction. |
| Card padding conflict | The SVG/generator leaves 12px beneath its action; the blanket contract says 20px. Baseline follows the exact SVG geometry with 20px top/sides and 12px bottom. This source-specific variation requires owner review before reuse. |
| Type / rasterisation | Exact font assets and CSS sizes are used. SVG and browser text retain small baseline/raster differences visible in the overlay; approval must assess the actual wraps/positions, not excuse geometry as antialiasing. |
| Captured colour | Computed card background is exactly `rgb(32,86,214)` / #2056D6. A flat JPEG screenshot sample is `rgb(45,85,206)`, while the source PNG is `rgb(32,86,214)`. The capture colour-profile/encoding difference is unresolved; raw images are retained and no colour correction was applied to hide it. Do not interpret this as an approved palette change. |
| Drawer | Matches primary contents and 330px mobile width. Church oversight is conditional in display fixtures. `More destinations` is an additional expandable section to keep existing capabilities reachable; its treatment is a review item. The sidebar screen has not received independent visual approval. |
| Desktop/tablet | Existing 1024px sidebar breakpoint and 256px desktop sidebar are exercised. The mobile specimen stays 390px wide; no new desktop composition is asserted or rolled out. |
| Preview-only copy | A fictional-data disclaimer appears after the source content. Detail panels explain which operations are not connected; these are review utilities, not approved production layouts. |

## Functional results and limits

- 7 regression files / 70 tests pass: existing dashboard shell/type/access, report state rules, church permissions, discipleship and podcast journey.
- TypeScript and focused ESLint pass after replacing internal anchors with Next Link. Preview links disable prefetch so they do not trigger live data reads merely by rendering.
- Browser: menu and notifications open; empty notification state appears; native dialog contains focus, closes with Escape and restores focus; lesson/report panels open and close; the final Message action remains reachable at 320px. No horizontal overflow observed at 320, 390, 768 or 1440 CSS widths.
- Learner drawer hides Church oversight; Pastor and Unit leader display fixtures show it. Real permission enforcement remains in unchanged live route/services and the regression suite. No synthetic role grants access.
- Loading fallback was observed during navigation. Error/retry boundary is implemented but no forced error was exercised. Form validation, mobile virtual keyboard, long-content data, real notifications, live media playback, persisted actions and real-role integration checks remain for connected vertical slices.
- No session/database/notification/media mutation is performed by the fixture. Root tracking, push and service-worker effects are suppressed for this preview. No shared database migration, push, merge or deployment was run.

## Next gate

User-requested navigation update: taps and horizontal swipes now share independent You/Community selection. Left opens Community, right returns to You; vertical/short gestures do not switch, while a deliberate drag can be held before release. Each area's scroll position is restored. Community is still the explicitly labelled preview utility, not the full approved feed implementation. Gesture rules are covered by `lib/dashboard/swipe-tabs.test.ts`.

Motion update: the content track follows the pointer directly, with soft resistance at the outer boundaries and a release spring (`duration: 0.5`, `bounce: 0.2`). New gestures interrupt the current settle from its current position. Transform is applied directly to the track via Motion values; no layout properties animate. Reduced-motion preferences skip spatial movement, and keyboard-triggered tab changes remain immediate. Motion is confined to the preview pending the shared-shell gate. Dependency: `motion` installed through npm with the canonical lockfile updated.

Browser motion checks (390px CSS viewport): a left drag selected Community with an intermediate track position of −252.412px, then settled at −350px; a right drag selected You with an intermediate −94.1758px position. Keyboard Enter switched immediately to −350px/0px. No horizontal document overflow. Inactive panels have both `inert` and `aria-hidden`. These are desktop browser pointer checks at mobile dimensions; physical touchscreen feel and forced reduced-motion emulation remain to be reviewed.

The owner approved the rendered baseline and authorised the live connection. See `LIVE-SHELL.md` for the current bindings, validation and data-specific differences. This approval does not authorise pushing, deployment or shared-database migrations; later behaviour slices remain governed by the addendum and reviewed migration plans.

# Pleros design implementation contract

**Baseline:** 71 mobile screens in the final consolidated source, checked 13 October 2026. This contract prevents design drift during implementation. It does not authorise new features or claim the mockups are functional.

## 1. Authority and first-screen gate

Use the current-truth addendum for product behavior. Use each indexed final SVG/PNG and its generator for the corresponding visual state; use `paper-tokens.json`, `pill-palette.json`, `core.py` and the supplied assets for shared components. Paper is the editable review reference. Older experiments, fallback defaults and presentation-board styling are not replacement app designs.

**Before implementing the screen set:** build one representative end-to-end screen, `Pleros-you`, using shared components and real font assets. Produce a matched reference/implementation screenshot, computed-token audit and discrepancy list. Obtain the product owner’s visual baseline approval before mass rollout. An approved screenshot is not permission to skip functional tests.

Create reusable shell/header, typography, buttons, fields, status pills, person rows, cards, player controls and report sections. Subsequent screens must reuse these components. Centralise colours, type, spacing, radii and sizes in semantic tokens; do not scatter unexplained one-off values or substitute framework defaults. A genuine source-specific variation must be named and documented, not silently normalised away.

If a source value conflicts with a token or Paper state, record the exact screen/property and resolve it against the reviewed reference. Do not “improve” the design independently. Missing screens/states inherit established components; a materially new layout needs review.

## 2. Measurable source-derived specifications

All values below are CSS pixels unless marked otherwise.

### Typography

- **Be Vietnam Pro** throughout the authenticated UI. Use supplied Regular/Medium/SemiBold/Bold assets for **400/500/600/700**, without synthetic weights or fallback-font screenshots.
- Page title **24/32, weight 500**; greeting **21/28, 500**; section heading **15/22, 500**; body **14/22, normally 400**; metadata **13/20**; badge **12/18, 500**; input value **16/24**. Format is size/line height.
- Preserve intentional row/action weight 500 and active root tab 600. Do not make all labels bold. Match per-screen wrapping, alignment and letter spacing; the source uses local adjustments such as −0.4 on some titles, not a universal tracking rule.
- These line heights are recorded in `paper-tokens.json`, `paper_native.py` and the design-system typography guide. SVG text positions are baselines, not CSS top offsets. Do not copy baseline coordinates directly into CSS.

### Spacing and geometry

- Default screen gutter/card padding **16**; the You learning surfaces use **20**. Preserve Community’s actual per-screen 16px layout rather than interpreting “home” as a blanket override.
- Major section gap **32**; heading-to-content **12**; within-section gaps **12/16**. The token file’s general `[8,12,24]` list does not override these specific rules. Match the reference geometry where its composition varies.
- Primary buttons **48** high; input/search controls **44** high; icon-only hit targets at least **44 × 44**. Small visible icons or badges do not justify smaller interactive targets.
- Home learning cards: radius **16**. General fields and core buttons: radius **11**. Source-specific cards/panels include **10/12/16**; preserve each named variant. Do not turn every card into a 16px-radius box. The token map also records sheet radius **20**.
- Core status chips are **26** high, radius **6**, with **8** horizontal text inset; the design-system showcase’s 28px chip is not the app-screen baseline. Avatars are generally **36**. Hairlines are **1**.

### Colour and hierarchy

- Canvas/surface **#FFFFFF**; primary text **#252B33**; secondary text **#63676D**; line **#E7E9EC**; soft surface **#F6F7F8**; action blue **#2056D6**.
- The `Pleros-you` and pre-enrolment Start SOGP examples use a **blue learning card**, white heading, metadata **#D8E4FF**, a white action with blue text, radius 16 and padding 20. Some supporting copy uses **#E1EAFF**.
- Final adaptive 1-hour/30-minute/15-minute home examples in `adaptive_home.py` instead use **white bordered cards with blue actions**. Preserve these explicit variants; the generic blue-card token does not recolour all learning screens. Escalate any desired unification for approval.
- Status palette, background/text: amber **#F7E4CD / #92400E**; green **#D5E8DC / #166534**; blue **#E4EBFD / #2331AE**; neutral **#E9EDF5 / #4A5273**; lilac **#E9DFFA / #6D28D9**. `lime` aliases green here.
- Preserve status meaning and visible text: pending/not confirmed use amber; reported/confirmed use green; Nil declared/not reported/unlinked use neutral in the report examples. Follow the actual state’s reference; never use colour alone or merge Nil, missing and unconfirmed.
- No new gradients, shadows, decorative artwork, icon tiles or background tinting. Keep colour concentrated in actions, the specified learning cards and semantic states.

### Icons and navigation

- Use the supplied canonical **Lucide** paths from `assets/lucide-icons.json`. Visible stroke is **1.75**, rounded caps/joins. Sizes are **16/20/24**; transport icons use 24. At a 24-unit viewBox, scale stroke as `1.75 × 24 / renderedSize` to retain visual weight, or use an equivalent non-scaling stroke. Default Lucide stroke 2 at every size is not a match.
- Root navigation is **one row**: plain menu left, centred text-only You/Community tabs, bell right. No logo or profile avatar in that row, no second tab row and no duplicate bottom navigation. Profile/settings lives in the sidebar.
- At 390px width: tab text centres **132/236**, baseline **68**; menu/bell hit regions **x=4/338, y=42, 44×44**; visible icons **20**. Active tab: 14px/600; inactive: 14px/400. Treat these as reference geometry, not an instruction to hard-code the whole application with absolute positioning.

## 3. Visual acceptance gates

1. **Freeze comparison inputs.** For each indexed screen record its stem, route, role, selected state, fixture data, viewport, browser/OS, device scale and implementation commit. Use the same names, counts, copy and playback positions as the reference. Wait for fonts/assets; freeze animations and time-dependent data.
2. **Match dimensions.** Canonical device viewport is **390 × 844**. Many exported artboards contain longer scroll content; do not shrink the whole artboard into 844px. Compare both the same viewport crop/scroll position and the full content. Source PNGs are 2×; normalise scale before comparison.
3. **Require evidence per screen.** Supply reference and rendered screenshot side by side, an overlay/diff, and a short discrepancy list covering type, line wraps, alignment, spacing, card/control geometry, colour, icons and status. No unexplained deviations may be accepted. Token assertions and measured DOM bounds accompany visual review.
4. **Do not game the diff.** No arbitrary pixel-difference percentage constitutes approval. Font antialiasing/rasteriser differences may be documented; wrong font, wrapping, spacing, colour or layout may not be dismissed as antialiasing. A zero-pixel-difference promise across renderers is not required.
5. **Test real mobile behavior.** Verify vertical scrolling, no unintended horizontal overflow, reachable last fields/actions, safe-area padding and keyboard behavior. Sticky actions must not cover content/focus. Preserve 44px minimum targets without overlapping neighbors. Do not render the mock device clock/status bar/home indicator as application UI; compare app content within the equivalent safe region.
6. **Check accessibility.** Verify readable contrast, accessible labels, visible keyboard focus and states distinguishable without colour. Use at least **4.5:1 normal text**, **3:1 qualifying large text**, and **3:1 required control/state indicators** against adjacent colours, with the applicable exceptions. Decorative hairlines need not act as the sole boundary of an interactive control. If source styling fails a required check, report it and approve the smallest correction rather than silently changing the palette. These are acceptance requirements, not claims that every mockup already passes. Sources: [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
7. **Preserve responsiveness.** Retain and test existing tablet/desktop breakpoints, navigation and capabilities. The pack does not establish newly approved desktop mockups; do not stretch the mobile composition into a new desktop design or claim visual parity where no reference exists.

## 4. Completion and change control

Maintain a 71-screen coverage matrix: implemented and visually reviewed; retained existing route; or explicitly pending. Include appropriate loading, empty, error, disabled, denied and long-content states. Approval of one happy-path screenshot does not cover these states.

Keep two independent gates: **visual fidelity** and **functional correctness**. Functional checks cover permissions, history preservation, validation, persistence, repeated submissions, back/cancel/navigation, playback, invitations and attendance. A build passing tests does not prove the design matches; a matching screenshot does not prove the feature works.

Each delivery must include the reviewed screen list, test results, screenshot evidence and approved deviations. Never update visual baselines merely to make a regression pass. Changes to approved spacing, hierarchy, palette or component treatment require a stated reason and explicit design approval before propagation.

**Reference files:** `screen-index.json`; per-screen SVG/PNG; `core.py`; `originals.py`; `adaptive_home.py`; `sidebar.py`; `paper-tokens.json`; `pill-palette.json`; `paper_native.py`; `assets/BeVietnamPro-*.ttf`; `assets/lucide-icons.json`. Product policy remains governed by `Pleros-Current-Truth-Addendum-2026-10-13.md`.

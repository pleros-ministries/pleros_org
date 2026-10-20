# Working on Pleros

This file is loaded by every Claude session in this repo. Keep it short: the detail lives in the files it points to.

## Read first

1. **`DESIGN.md`:** the design system, with the dashboard and the public site kept separate. Follow it for every screen.
2. **`docs/handover/2026-10-20-full-handover.md`:** the full context. It covers:
   - how the user works;
   - the product model;
   - the Pastor's decisions;
   - the illustration pipeline (Codex prompts in `docs/handover/codex-prompts/`);
   - performance and privacy guarantees;
   - migrations;
   - every significant fix.

   Read it at the start of any new piece of work.
3. **`AGENTS.md`:** the detailed product rules for each feature (auth, groups as oversight, reports, reminders, community). It's long; search it for the area you're touching.
4. **`docs/ai_scratchpad.md`:** older pattern-level lessons.

@DESIGN.md

## Non-negotiables

- **Push to `main` after each piece.** Conventional commit subjects (`feat:`, `fix:`, `style:`, `copy:`, `docs:`, `perf:`), a short body explaining why, and the Co-Authored-By line. Stage only your own paths; another session may be editing the same checkout.
- **No production flags.** Build the behaviour on main and delete the old path in the same change.
- **Migrations:**
  - write the SQL by hand;
  - show it to the user and apply only after an explicit yes;
  - apply with psql inside a transaction and record the sha256 in `drizzle.__drizzle_migrations`;
  - add the journal entry and the schema in the same change (handover §8).
- **The local database is production.**
  - Read freely, but never create real invitations, moves, messages, reports or toggles to test.
  - Revert anything you change.
- **Next.js 16.3 with Cache Components.**
  - Any page reading the session, params or searchParams needs `export const instant = false;`.
  - Read `node_modules/next/dist/docs/` before changing framework behaviour.
- **Before committing:**
  - always run `npx tsc --noEmit -p .`, since one type error fails the Vercel deploy;
  - don't run the full test, lint or build suites unless asked;
  - run a focused vitest file for new pure logic.
- **Check the UI visually** at 375px with the in-app browser. Use the `/preview/**` pages when you can't sign in. Say plainly what you couldn't verify.
- **Mockups first** for big new structures (`/preview/dashboard-v3/<name>`, sample data, labelled). Build the real thing only after the user approves.
- **Optimistic updates** for anything a person saves: show it at once, roll back with a message.
- **Keep the docs current.**
  - Design corrections go in `DESIGN.md`.
  - Feature rules go in `AGENTS.md`.
  - Lasting preferences go here.
  - Major history goes in a new dated handover under `docs/handover/`.

## The user's standing preferences

- **Style:** Sen headings over Be Vietnam Pro body text; weight 500 at most (no bold); sentence case; UK English; calm, mobile-first.
- **Colour:** never light or mint green; no violet for Meetings.
- **Wording:**
  - "members", not "disciples";
  - "Leads your group", not "discipler";
  - no FCC branding inside the app;
  - "oversight structure", never "church structure".
- **Privacy:**
  - never tell members their leader can read their quiz answers or written work;
  - push and notification text carries names and counts only.
- **Search:** names only, never email; deduped; full matches first.
- **Layout:**
  - one level of nesting at most;
  - group things by relationship ("Groups you're under" / "Groups you lead");
  - name only what's missing;
  - let cards breathe.
- **Data:** no real member names in demo or training material, and no sample data in live screens.
- **Communication:**
  - act on clear next steps without asking;
  - send a one-line status during long work;
  - end with what's now true and what isn't verified.

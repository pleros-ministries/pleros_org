Read AGENTS.md and use the existing design token system already defined in app/globals.css.

Do not redesign the tokens.

Important font setup note:
I have the local Suisse Int’l font files here:

/Users/letroot/Documents/2-work/global-assets/fonts/suisse-intl

Please inspect that folder and wire the font properly into the Next.js app using next/font/local (preferred) or the best equivalent approach for a clean production-safe setup.

Important:
- one or more font filenames may contain an apostrophe or other awkward characters
- do not assume clean filenames
- read the folder contents first and handle the exact filenames correctly
- expose the font through a CSS variable so it integrates with the existing globals.css token system
- update the app layout accordingly

Task:
Set up the UI foundations for the Pleros website in this fresh Next.js + Tailwind v4 app.

Requirements:
- install and configure shadcn/ui primitives needed for this project
- build a branded primitive layer that consumes the existing tokens
- create reusable wrappers or variants for:
  - button
  - input
  - card
  - dialog
  - badge
  - sheet
  - accordion
- create a basic app shell with:
  - sticky navbar
  - simple footer
  - container utilities usage
- create a temporary style-demo page that showcases:
  - typography scale
  - buttons
  - inputs
  - card surfaces
  - questions/purpose/fulfil theme surfaces
  - radii in use

Constraints:
- mobile-first
- sentence case styling
- no stock shadcn look
- keep motion subtle
- preserve the token names in globals.css
- do not start building the full homepage yet

Deliverables:
- local Suisse Int’l font wired into the app properly
- shadcn installed
- branded primitives implemented
- app shell implemented
- style-demo page implemented
- brief summary of files added/changed

## Cursor Cloud specific instructions

### Services

| Service | Command | Notes |
|---------|---------|-------|
| Next.js dev server | `npm run dev` | Port 3000. No `.env` needed for UI-only work (homepage, style-demo). DB routes require `DATABASE_URL`. |

### Key commands

- **Lint**: `npm run lint` (ESLint 9, warnings expected for unused vars in PPC modules)
- **Test**: `npm test` (Vitest, 14 files / 59 pure-logic tests, no DB needed)
- **Dev**: `npm run dev` (Turbopack, hot reload)
- **Build**: `npm run build`

### Gotchas

- Both `package-lock.json` and `pnpm-lock.yaml` exist; use **npm** (`package-lock.json` is canonical).
- The Suisse Int'l font files live in `app/fonts/suisse-intl/`; they are committed to the repo.
- PPC platform routes (`/ppc/*`) require DB for most pages, but `/ppc/sign-in` works without it via demo auth (no `DEMO_AUTH` env var needed — defaults to enabled).
- The `(site)` route group (homepage, style-demo) is fully static and works without any env vars or DB.
- Drizzle query modules in `lib/db/queries/` import `db` via `@/lib/db` and schema via `import * as schema from "../schema"`. They use the relational query API (`db.query.*`) and require a Neon `DATABASE_URL` at runtime.
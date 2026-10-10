# Branch preview deployment

9 October 2026. Branch: `codex/authenticated-dashboard-demo` (local source snapshot, no commit or push).

Project: `plerosdev/pleros-org` (`prj_RAr0Q7PGWLoJkgjelnGhbrbKNHPV`), authenticated CLI account `fcc-pleros`. Target: Preview only. Production domain was not promoted or changed. No migration, real-role change or notification was executed.

Current deployment: `dpl_HRDsqymHUiDNT9VWHmSmpQg2WRAk`, https://pleros-9r71zhbtd-plerosdev.vercel.app/preview/pleros . Status: Ready. Full Vercel production-mode build, including TypeScript, passed (1m 38s). Vercel Authentication is retained.

## Upload correction

The initial CLI upload included local .env, credential and development files because Git ignore rules were not sufficient. Its task-created preview (`dpl_H67EhZj7bDMNH9oxbxtAYXuakkpM`) finished before cancellation and was removed successfully. No link to that attempt is the deliverable. An explicit `.vercelignore` now excludes those files and development directories, and a dry manifest check found zero unsafe inputs (1,239 files, 62,659,636 source bytes). The replacement uses Vercel-managed environment variables and an explicit `npm run build` command. No credentials were printed or placed in documentation.

## Checks

- 57 tests in seven files passed, including import isolation, scopes, reporting, fixture state and the canonical activity-form rules.
- Scoped ESLint passed without warnings.
- Authorized `vercel curl` requests returned HTTP 200 and expected content for Overview, Reports, Church oversight, My disciples/Contacts and SOGP; no application-error or protection-login content in those responses.
- Hosted browser interaction QA was blocked by the retained Vercel login screen; local browser interaction QA is documented in QA.md.

## Approved consolidation decisions

- Church unit leaders see assigned people’s daily/category submission status only: reported, explicit Nil or missing. No private notes/contact access follows from this.
- Devotional facts prefill from canonical sources and require one daily confirmation; persist that declaration separately, without copying facts.

See [Consolidation map](CONSOLIDATION.md) for remaining backend/layout clashes.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

import nextConfig from "../../next.config";

// Production runs on Railway (25 November 2026). The crons are Railway cron services,
// so their schedules live in the runbook rather than in a config file in this repo.
const runbook = () =>
  readFileSync(join(process.cwd(), "docs/handover/2026-11-25-railway-migration.md"), "utf8");

test("documents the daily SOGP cron and the five-minute reminder dispatcher", () => {
  const text = runbook();
  expect(text).toMatch(/`cron-reminders`[^\n]*`\*\/5 \* \* \* \*`[^\n]*\/api\/cron\/reminder-dispatch/);
  expect(text).toMatch(/`cron-daily`[^\n]*`20 4 \* \* \*`[^\n]*\/api\/cron\/sogp-reminders/);
});

test("caches the versioned self-hosted SOGP video assets", async () => {
  const rules = await nextConfig.headers!();
  const immutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

  expect(rules).toEqual([
    { source: "/site/sogp/sogp-welcome-WaXgk9zqi78.mp4", headers: immutable },
    { source: "/site/sogp/sogp-welcome-WaXgk9zqi78.jpg", headers: immutable },
    { source: "/site/sogp/sogp-welcome-square-20260831.mp4", headers: immutable },
    { source: "/site/sogp/sogp-welcome-square-20260831.jpg", headers: immutable },
  ]);
});

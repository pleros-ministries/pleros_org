import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

test("uses one Hobby-compatible daily SOGP cron", () => {
  const config = JSON.parse(
    readFileSync(join(process.cwd(), "vercel.json"), "utf8"),
  ) as { crons?: Array<{ path: string; schedule: string }> };

  expect(config.crons).toEqual([
    {
      path: "/api/cron/sogp-reminders",
      schedule: "0 5 * * *",
    },
  ]);
});

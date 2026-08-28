import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

test("keeps Prayer Watch mandatory and removes Podcast from SOGP", () => {
  const source = readFileSync(
    join(process.cwd(), "components", "sogp", "sogp-dashboard.tsx"),
    "utf8",
  );
  expect(source).toContain('href: "/dashboard/prayer-watch"');
  expect(source).toContain("Morning Prayer Watch");
  expect(source).not.toContain('href: "/dashboard/podcast"');
  expect(source).not.toContain("Daily Pleros Podcast");
  expect(source).not.toContain("podcastDaysLogged");
});

test("Prayer Watch mutations refresh SOGP progress", () => {
  const prayerActions = readFileSync(
    join(process.cwd(), "app", "_actions", "prayer-watch-actions.ts"),
    "utf8",
  );
  expect(prayerActions).toContain('revalidatePath("/dashboard/sogp")');
});

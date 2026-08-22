import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

test("links mandatory formation trackers from SOGP dashboard", () => {
  const source = readFileSync(
    join(process.cwd(), "components", "sogp", "sogp-dashboard.tsx"),
    "utf8",
  );
  expect(source).toContain('href: "/dashboard/prayer-watch"');
  expect(source).toContain('href: "/dashboard/podcast"');
  expect(source).toContain("Morning Prayer Watch");
  expect(source).toContain("Daily Pleros Podcast");
  expect(source).toContain("podcastDaysLogged");
});

test("tracker mutations refresh SOGP progress", () => {
  const prayerActions = readFileSync(
    join(process.cwd(), "app", "_actions", "prayer-watch-actions.ts"),
    "utf8",
  );
  const podcastActions = readFileSync(
    join(process.cwd(), "app", "_actions", "podcast-progress-actions.ts"),
    "utf8",
  );
  expect(prayerActions).toContain('revalidatePath("/dashboard/sogp")');
  expect(podcastActions).toContain('revalidatePath("/dashboard/sogp")');
});

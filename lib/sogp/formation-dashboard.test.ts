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

test("renders a calendar-led four-level SOGP journey with required reviews", () => {
  const source = readFileSync(
    join(process.cwd(), "components", "sogp", "sogp-journey-page.tsx"),
    "utf8",
  );
  const calendar = source.indexOf('data-sogp-section="calendar"');
  const dailyContent = source.indexOf('data-sogp-section="daily-content"');
  expect(calendar).toBeGreaterThan(-1);
  expect(dailyContent).toBeGreaterThan(calendar);
  expect(source).toContain("Assessment");
  expect(source).toContain("Required live review");
  expect(source).toContain("Watch recording");
  expect(source).toContain("Today’s activities");
  expect(source).toContain("Mark Prayer Watch complete");
  expect(source).not.toContain("Extras");
  expect(source).not.toContain("excluded from SOGP completion");
  expect(source).not.toContain("Daily Pleros Podcast");
});

test("the journey query applies assessment and date gates to all 24 tracks", () => {
  const source = readFileSync(
    join(process.cwd(), "lib", "db", "queries", "sogp-journey.ts"),
    "utf8",
  );

  expect(source).toContain("summarizeSogpLevels");
  expect(source).toContain("canAccessSogpTrack");
  expect(source).toContain("previousLevelComplete");
  expect(source).not.toContain("extras:");
});

test("uses the calendar journey for certificate eligibility", () => {
  const source = readFileSync(
    join(process.cwd(), "lib", "db", "queries", "sogp-completion.ts"),
    "utf8",
  );
  expect(source).toContain("getActiveSogpJourney");
  expect(source).not.toContain("summarizeSogpTrackCompletion");
  expect(source).not.toContain("podcast");
});

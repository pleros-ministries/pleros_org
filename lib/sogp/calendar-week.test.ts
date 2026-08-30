import { expect, test } from "vitest";

import { getSogpLearningWeek } from "./calendar";

const days = [
  "2026-09-07",
  "2026-09-08",
  "2026-09-09",
  "2026-09-10",
  "2026-09-11",
  "2026-09-12",
  "2026-09-13",
  "2026-09-14",
].map((dateKey) => ({ dateKey, state: "future" as const }));

test("shows the selected SOGP learning week from Monday through Sunday", () => {
  const week = getSogpLearningWeek(days, "2026-09-10");

  expect(week.map((day) => day?.dateKey ?? null)).toEqual([
    "2026-09-07",
    "2026-09-08",
    "2026-09-09",
    "2026-09-10",
    "2026-09-11",
    "2026-09-12",
    "2026-09-13",
  ]);
});

test("keeps seven stable slots when a cohort starts midweek", () => {
  const week = getSogpLearningWeek(days.slice(3), "2026-09-10");

  expect(week.map((day) => day?.dateKey ?? null)).toEqual([
    null,
    null,
    null,
    "2026-09-10",
    "2026-09-11",
    "2026-09-12",
    "2026-09-13",
  ]);
});

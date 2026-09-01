import { expect, test } from "vitest";

import { getSogpLearningWeek } from "./calendar";

const days = [
  "2026-09-14",
  "2026-09-15",
  "2026-09-16",
  "2026-09-17",
  "2026-09-18",
  "2026-09-19",
  "2026-09-20",
  "2026-09-21",
].map((dateKey) => ({ dateKey, state: "future" as const }));

test("shows the selected SOGP learning week from Monday through Sunday", () => {
  const week = getSogpLearningWeek(days, "2026-09-17");

  expect(week.map((day) => day?.dateKey ?? null)).toEqual([
    "2026-09-14",
    "2026-09-15",
    "2026-09-16",
    "2026-09-17",
    "2026-09-18",
    "2026-09-19",
    "2026-09-20",
  ]);
});

test("keeps seven stable slots when a cohort starts midweek", () => {
  const week = getSogpLearningWeek(days.slice(3), "2026-09-17");

  expect(week.map((day) => day?.dateKey ?? null)).toEqual([
    null,
    null,
    null,
    "2026-09-17",
    "2026-09-18",
    "2026-09-19",
    "2026-09-20",
  ]);
});

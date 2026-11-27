import { expect, test } from "vitest";
import { homeReportRows, homeSogpToday } from "./home";

test("canonical devotional facts never manufacture a confirmation", () => {
  const rows = homeReportRows({ devotionalCount: 3, ministryCount: 0, meetingCount: 1, declarations: [{ category: "ministry", declaration: "nil" }] });
  expect(rows.map(row => row.status)).toEqual(["Not confirmed", "Nil declared", "Reported"]);
  expect(rows.map(row => row.tone)).toEqual(["amber", "lilac", "green"]);
});
test("missing reports remain different from explicit Nil, including disabled declaration reads", () => {
  expect(homeReportRows({ devotionalCount: 0, ministryCount: 0, meetingCount: 0, declarations: [] }).map(row => row.status)).toEqual(["Not reported", "Not reported", "Not reported"]);
});
test("confirmation of an empty devotional day does not invent a Nil declaration", () => {
  const row = homeReportRows({ devotionalCount: 0, ministryCount: 0, meetingCount: 0, declarations: [{ category: "devotional", declaration: "confirmed" }] })[0];
  expect(row.status).toBe("Confirmed");
  expect(row.description).toBe("No activity logged");
});

test("after the cohort's last day, Today keeps Prayer Watch and the first teaching to catch up", () => {
  const day = (dateKey: string, dayNumber: number, done: boolean) => ({
    dateKey, kind: "weekday" as const, state: (done ? "complete" : "missed") as "complete" | "missed", prayerWatchComplete: done, review: null,
    track: { lessonId: dayNumber, dayNumber, title: `Teaching ${dayNumber}`, assessmentComplete: done, quizPassed: done, audioListened: done, accessible: true },
  });
  const days = [day("2026-10-08", 1, true), day("2026-10-09", 2, false), day("2026-10-10", 3, false)];
  const after = homeSogpToday(days, "2026-10-22");
  expect(after.teaching).toMatchObject({ dayNumber: 2, title: "Track 2 · Teaching 2", done: false });
  // The month runs on past the cohort (Pastor, 25 November 2026): Prayer Watch stays, ticked from the month's records.
  expect(after.prayerWatch).toEqual({ complete: false });
  expect([after.done, after.total]).toEqual([0, 3]);
  expect(homeSogpToday(days, "2026-10-22", undefined, true).prayerWatch).toEqual({ complete: true });
  // Before the cohort, Today still shows: Prayer Watch, nothing to teach yet.
  const before = homeSogpToday(days, "2026-10-01");
  expect(before.teaching).toBeNull();
  expect([before.done, before.total]).toEqual([0, 1]);
  expect(homeSogpToday(days, "2026-10-09").teaching).toMatchObject({ dayNumber: 2, title: "Teaching 2" });
});

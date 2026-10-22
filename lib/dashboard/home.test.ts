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

test("after the cohort's last day, Home keeps the SOGP days and the first teaching to catch up", () => {
  const day = (dateKey: string, dayNumber: number, done: boolean) => ({
    dateKey, kind: "weekday" as const, state: (done ? "complete" : "missed") as "complete" | "missed", prayerWatchComplete: done, review: null,
    track: { lessonId: dayNumber, dayNumber, title: `Teaching ${dayNumber}`, assessmentComplete: done, quizPassed: done, audioListened: done, accessible: true },
  });
  const days = [day("2026-10-08", 1, true), day("2026-10-09", 2, false), day("2026-10-10", 3, false)];
  const after = homeSogpToday(days, "2026-10-22")!;
  expect(after.ended).toEqual({ lastLabel: "Sat 10 October", toCatchUp: 2 });
  expect(after.sogpDays).toHaveLength(3);
  expect(after.teaching).toMatchObject({ dayNumber: 2, title: "Teaching 2", done: false });
  expect(after.prayerWatch).toBeNull();
  expect([after.done, after.total]).toEqual([0, 2]);
  expect(homeSogpToday(days, "2026-10-01")).toBeNull();
  expect(homeSogpToday(days, "2026-10-09")!.ended).toBeNull();
});

import { expect, it } from "vitest";
import { planDailyReportReminder } from "./daily-report-reminders";
const base = { subjectId: "worker", expected: true, authorized: true, statuses: { devotional: "reported", ministry: "nil", meetings: "missing" } as const, alreadyRemindedToday: false };
it("waits for 8 pm Lagos time, then uses a window rather than one exact minute", () => {
  expect(planDailyReportReminder({ ...base, source: "automatic", now: new Date("2026-10-09T18:59:00Z") })).toBeNull();
  expect(planDailyReportReminder({ ...base, source: "automatic", now: new Date("2026-10-09T19:05:00Z") })?.forDate).toBe("2026-10-09");
});
it("manual and automatic reminders share the same per-person Lagos-day cap", () => {
  const now = new Date("2026-10-09T19:05:00Z");
  const manual = planDailyReportReminder({ ...base, source: "manual", now });
  const automatic = planDailyReportReminder({ ...base, source: "automatic", now });
  expect(manual?.checkpointKey).toBe(automatic?.checkpointKey);
  expect(planDailyReportReminder({ ...base, source: "automatic", now, alreadyRemindedToday: true })).toBeNull();
});
it("does not remind unauthorized, non-required or complete/Nil reports", () => {
  const now = new Date("2026-10-09T19:05:00Z");
  expect(planDailyReportReminder({ ...base, source: "manual", now, authorized: false })).toBeNull();
  expect(planDailyReportReminder({ ...base, source: "manual", now, expected: false })).toBeNull();
  expect(planDailyReportReminder({ ...base, source: "automatic", now, statuses: { devotional: "nil", ministry: "nil", meetings: "nil" } })).toBeNull();
});

it("manual reminders can target editable history without creating another daily allowance", () => {
  const now = new Date("2026-10-09T19:05:00Z");
  const today = planDailyReportReminder({ ...base, source: "manual", now });
  const prior = planDailyReportReminder({ ...base, source: "manual", now, reportDate: "2026-10-02" });
  expect(prior?.forDate).toBe("2026-10-02");
  expect(prior?.checkpointKey).toBe(today?.checkpointKey);
  expect(planDailyReportReminder({ ...base, source: "manual", now, reportDate: "2026-10-01" })).toBeNull();
});

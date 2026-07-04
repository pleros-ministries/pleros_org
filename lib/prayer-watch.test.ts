import { describe, expect, it } from "vitest";

import {
  buildPrayerWatchCalendar,
  getMonthLabel,
  isValidPrayerWatchDateKey,
  toDateKey,
} from "./prayer-watch";

describe("toDateKey", () => {
  it("formats a date as YYYY-MM-DD", () => {
    expect(toDateKey(new Date(2026, 6, 3))).toBe("2026-07-03");
    expect(toDateKey(new Date(2026, 0, 9))).toBe("2026-01-09");
  });
});

describe("getMonthLabel", () => {
  it("formats a readable month/year label", () => {
    expect(getMonthLabel(2026, 6)).toBe("July 2026");
  });
});

describe("buildPrayerWatchCalendar", () => {
  it("returns complete weeks padded with adjacent-month days", () => {
    // July 2026 starts on a Wednesday and has 31 days.
    const weeks = buildPrayerWatchCalendar({
      year: 2026,
      month: 6,
      attendedDateKeys: [],
      todayKey: "2026-07-03",
    });

    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0][0].inCurrentMonth).toBe(false);
    expect(weeks[0][0].dateKey < "2026-07-01").toBe(true);

    const allDaysInMonth = weeks.flat().filter((cell) => cell.inCurrentMonth);
    expect(allDaysInMonth).toHaveLength(31);
    expect(allDaysInMonth[0].dateKey).toBe("2026-07-01");
    expect(allDaysInMonth.at(-1)?.dateKey).toBe("2026-07-31");
  });

  it("marks days after today as future and unattended past days as missed", () => {
    const weeks = buildPrayerWatchCalendar({
      year: 2026,
      month: 6,
      attendedDateKeys: ["2026-07-01"],
      todayKey: "2026-07-03",
    });

    const cells = weeks.flat();
    const july1 = cells.find((cell) => cell.dateKey === "2026-07-01");
    const july2 = cells.find((cell) => cell.dateKey === "2026-07-02");
    const july3 = cells.find((cell) => cell.dateKey === "2026-07-03");
    const july4 = cells.find((cell) => cell.dateKey === "2026-07-04");

    expect(july1?.state).toBe("attended");
    expect(july2?.state).toBe("missed");
    expect(july3?.state).toBe("missed");
    expect(july3?.isToday).toBe(true);
    expect(july4?.state).toBe("future");
  });
});

describe("isValidPrayerWatchDateKey", () => {
  const todayKey = "2026-07-03";

  it("accepts real calendar dates on or before today", () => {
    expect(isValidPrayerWatchDateKey("2026-07-03", todayKey)).toBe(true);
    expect(isValidPrayerWatchDateKey("2026-01-01", todayKey)).toBe(true);
  });

  it("rejects future dates", () => {
    expect(isValidPrayerWatchDateKey("2026-07-04", todayKey)).toBe(false);
  });

  it("rejects malformed or impossible dates", () => {
    expect(isValidPrayerWatchDateKey("not-a-date", todayKey)).toBe(false);
    expect(isValidPrayerWatchDateKey("2026-02-30", todayKey)).toBe(false);
    expect(isValidPrayerWatchDateKey("2026-7-3", todayKey)).toBe(false);
  });
});

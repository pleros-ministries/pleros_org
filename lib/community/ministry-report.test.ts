import { describe, expect, test } from "vitest";

import {
  MINISTRY_COUNT_MAX,
  MINISTRY_FIELDS,
  MINISTRY_NOTE_MAX,
  NO_DAY_ACTIVITY,
  activityCount,
  activityLines,
  canReportFor,
  daysInRange,
  emptyMinistryNumbers,
  isDateKey,
  ministryRangePresets,
  normaliseMinistryReport,
  reportableDateKeys,
  resolveMinistryRange,
  sumMinistryNumbers,
  totalReached,
  type DayActivity,
} from "./ministry-report";

describe("normaliseMinistryReport", () => {
  test("reads form strings and defaults the optional numbers to zero", () => {
    expect(
      normaliseMinistryReport({
        reachedOnline: " 12 ",
        reachedOffline: "0",
        saved: "3",
        filled: "",
        note: "  Street outreach in Ikeja.  ",
      }),
    ).toEqual({
      ok: true,
      value: {
        reachedOnline: 12,
        reachedOffline: 0,
        saved: 3,
        notSaved: 0,
        filled: 0,
        healed: 0,
        followUps: 0,
        note: "Street outreach in Ikeja.",
      },
    });
  });

  test("the two reached numbers must be given, though zero is fine", () => {
    expect(normaliseMinistryReport({ reachedOnline: "5" }).ok).toBe(false);
    expect(normaliseMinistryReport({ reachedOnline: "", reachedOffline: "2" }).ok).toBe(
      false,
    );
    expect(normaliseMinistryReport({ reachedOnline: 0, reachedOffline: 0 }).ok).toBe(
      true,
    );
  });

  test("rejects anything that is not a whole number in range", () => {
    const base = { reachedOnline: "1", reachedOffline: "1" };
    expect(normaliseMinistryReport({ ...base, saved: "-1" }).ok).toBe(false);
    expect(normaliseMinistryReport({ ...base, saved: "2.5" }).ok).toBe(false);
    expect(normaliseMinistryReport({ ...base, saved: "many" }).ok).toBe(false);
    expect(normaliseMinistryReport({ ...base, healed: 1.5 }).ok).toBe(false);
    expect(
      normaliseMinistryReport({ ...base, saved: String(MINISTRY_COUNT_MAX + 1) }).ok,
    ).toBe(false);
    expect(
      normaliseMinistryReport({ ...base, saved: String(MINISTRY_COUNT_MAX) }).ok,
    ).toBe(true);
  });

  test("an empty note is stored as none, and a long one is refused", () => {
    const base = { reachedOnline: "1", reachedOffline: "1" };
    const blank = normaliseMinistryReport({ ...base, note: "   " });
    expect(blank.ok && blank.value.note).toBeNull();
    expect(
      normaliseMinistryReport({ ...base, note: "x".repeat(MINISTRY_NOTE_MAX + 1) }).ok,
    ).toBe(false);
  });
});

describe("the reporting window", () => {
  test("covers today and the two days before it", () => {
    expect(reportableDateKeys("2026-10-05")).toEqual([
      "2026-10-05",
      "2026-10-04",
      "2026-10-03",
    ]);
  });

  test("crosses a month boundary", () => {
    expect(reportableDateKeys("2026-11-01")).toEqual([
      "2026-11-01",
      "2026-10-31",
      "2026-10-30",
    ]);
  });

  test("locks older days and refuses future ones", () => {
    expect(canReportFor("2026-10-05", "2026-10-05")).toBe(true);
    expect(canReportFor("2026-10-03", "2026-10-05")).toBe(true);
    expect(canReportFor("2026-10-02", "2026-10-05")).toBe(false);
    expect(canReportFor("2026-10-06", "2026-10-05")).toBe(false);
    expect(canReportFor("not-a-date", "2026-10-05")).toBe(false);
  });
});

describe("isDateKey", () => {
  test("accepts real dates only", () => {
    expect(isDateKey("2026-10-05")).toBe(true);
    expect(isDateKey("2028-02-29")).toBe(true);
    expect(isDateKey("2026-02-31")).toBe(false);
    expect(isDateKey("2026-13-01")).toBe(false);
    expect(isDateKey("5 Oct 2026")).toBe(false);
    expect(isDateKey(undefined)).toBe(false);
  });
});

describe("resolveMinistryRange", () => {
  const today = "2026-10-05";

  test("defaults to the last 30 days", () => {
    expect(resolveMinistryRange({}, today)).toEqual({
      from: "2026-09-06",
      to: "2026-10-05",
    });
    expect(daysInRange("2026-09-06", "2026-10-05")).toBe(30);
  });

  test("keeps a valid range and never runs past today", () => {
    expect(
      resolveMinistryRange({ from: "2026-01-01", to: "2026-03-31" }, today),
    ).toEqual({ from: "2026-01-01", to: "2026-03-31" });
    expect(
      resolveMinistryRange({ from: "2026-10-01", to: "2026-12-25" }, today),
    ).toEqual({ from: "2026-10-01", to: today });
  });

  test("straightens a back-to-front range and ignores junk", () => {
    expect(
      resolveMinistryRange({ from: "2026-09-20", to: "2026-09-10" }, today),
    ).toEqual({ from: "2026-09-10", to: "2026-09-10" });
    expect(resolveMinistryRange({ from: "soon", to: "2026-02-31" }, today)).toEqual({
      from: "2026-09-06",
      to: today,
    });
  });

  test("caps a very long range at a year", () => {
    const range = resolveMinistryRange({ from: "2020-01-01", to: today }, today);
    expect(range.to).toBe(today);
    expect(daysInRange(range.from, range.to)).toBe(366);
  });

  test("presets all end today and start on the right day", () => {
    const presets = ministryRangePresets(today);
    expect(presets.every((preset) => preset.to === today)).toBe(true);
    expect(presets.map((preset) => preset.from)).toEqual([
      "2026-09-29",
      "2026-09-06",
      "2026-07-08",
      "2026-10-01",
      "2026-01-01",
    ]);
  });
});

describe("totals", () => {
  test("adds every field across reports", () => {
    const one = { ...emptyMinistryNumbers(), reachedOnline: 4, reachedOffline: 1, saved: 2 };
    const two = { ...emptyMinistryNumbers(), reachedOnline: 6, healed: 1, followUps: 3 };
    const total = sumMinistryNumbers([one, two]);

    expect(total).toEqual({
      reachedOnline: 10,
      reachedOffline: 1,
      saved: 2,
      notSaved: 0,
      filled: 0,
      healed: 1,
      followUps: 3,
    });
    expect(totalReached(total)).toBe(11);
    expect(sumMinistryNumbers([])).toEqual(emptyMinistryNumbers());
  });

  test("the field list covers every stored number exactly once", () => {
    const keys = MINISTRY_FIELDS.map((field) => field.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect([...keys].sort()).toEqual(Object.keys(emptyMinistryNumbers()).sort());
  });
});

describe("activityLines", () => {
  const full: DayActivity = {
    bible: { chapters: 3, book: "John", chapter: 4 },
    prayerWatch: ["evening", "morning"],
    podcastEpisodes: 1,
    sogp: {
      listened: true,
      quizAttempted: true,
      writtenSubmitted: false,
      reviewAttended: true,
      preparationDone: false,
    },
  };

  test("describes what was done in each area", () => {
    expect(activityLines(full)).toEqual([
      { key: "bible", label: "Bible reading", detail: "3 chapters, now at John 4" },
      { key: "prayerWatch", label: "Prayer Watch", detail: "morning, evening" },
      { key: "sogp", label: "SOGP", detail: "teaching, quiz, review session" },
      { key: "podcast", label: "Podcast", detail: "1 episode" },
    ]);
    expect(activityCount(full)).toBe(4);
  });

  test("leaves SOGP out for someone not in a cohort and marks empty areas", () => {
    const lines = activityLines(NO_DAY_ACTIVITY);
    expect(lines.map((line) => line.key)).toEqual(["bible", "prayerWatch", "podcast"]);
    expect(lines.every((line) => line.detail === null)).toBe(true);
    expect(activityCount(NO_DAY_ACTIVITY)).toBe(0);
  });

  test("a cohort member with nothing done still shows an empty SOGP line", () => {
    const idle: DayActivity = {
      ...NO_DAY_ACTIVITY,
      sogp: {
        listened: null,
        quizAttempted: false,
        writtenSubmitted: false,
        reviewAttended: false,
        preparationDone: false,
      },
    };
    expect(activityLines(idle).find((line) => line.key === "sogp")?.detail).toBeNull();
  });

  test("an old Prayer Watch record with no session still counts as attended", () => {
    expect(
      activityLines({ ...NO_DAY_ACTIVITY, prayerWatch: ["unspecified"] })[1]?.detail,
    ).toBe("attended");
  });
});

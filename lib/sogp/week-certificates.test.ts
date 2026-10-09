import { describe, expect, test } from "vitest";

import { DEFAULT_SOGP_ASSESSMENT_POLICY } from "./types";
import {
  buildSogpWeekVerificationCode,
  describeSogpWeekCertificates,
  describeSogpWeekGap,
  formatSogpWeekList,
  minimumToMeetPercent,
  selectWeeksToAward,
  sogpWeekCertificatePushBody,
  summarizeSogpWeekAwards,
} from "./week-certificates";

// A Monday-start, four-week cohort: 14 Sept to 11 Oct 2026, plus the 29th
// date the seed can add.
function cohortDates(count = 29) {
  const start = Date.UTC(2026, 8, 14);
  return Array.from({ length: count }, (_, index) =>
    new Date(start + index * 86_400_000).toISOString().slice(0, 10),
  );
}

const dateKeys = cohortDates();
const week1 = dateKeys.slice(0, 7);

function sixTeachings(level: number, complete = 6) {
  return Array.from({ length: 6 }, (_, index) => ({
    curriculumLevel: level,
    assessmentComplete: index < complete,
  }));
}

function weekOne(input: {
  teachings?: Array<{ curriculumLevel: number; assessmentComplete: boolean }>;
  prayerDays?: number;
  reviewsDone?: number;
  reviewCount?: number;
  policy?: typeof DEFAULT_SOGP_ASSESSMENT_POLICY;
}) {
  const reviewCount = input.reviewCount ?? 7;
  return summarizeSogpWeekAwards({
    dateKeys,
    tracks: input.teachings ?? sixTeachings(1),
    prayerDateKeys: new Set(week1.slice(0, input.prayerDays ?? 7)),
    reviews: week1.slice(0, reviewCount).map((dateKey, index) => ({
      dateKey,
      complete: index < (input.reviewsDone ?? reviewCount),
    })),
    policy: input.policy ?? DEFAULT_SOGP_ASSESSMENT_POLICY,
  })[0]!;
}

describe("summarizeSogpWeekAwards", () => {
  test("a week of six teachings and six of seven Prayer Watch days and reviews earns its certificate", () => {
    const summary = weekOne({ prayerDays: 6, reviewsDone: 6 });
    expect(summary).toMatchObject({
      week: 1,
      startDateKey: "2026-09-14",
      endDateKey: "2026-09-20",
      eligible: true,
      unmet: [],
    });
    expect(summary.prayerWatch).toEqual({ completed: 6, total: 7, needed: 6, met: true });
    expect(summary.reviews).toEqual({ completed: 6, total: 7, needed: 6, met: true });
  });

  test("five of seven Prayer Watch days falls short of 80%", () => {
    const summary = weekOne({ prayerDays: 5 });
    expect(summary.eligible).toBe(false);
    expect(summary.unmet).toEqual(["prayer_watch"]);
  });

  test("a week with no required reviews does not hold the learner back", () => {
    const summary = weekOne({ reviewCount: 0 });
    expect(summary.reviews).toEqual({ completed: 0, total: 0, needed: 0, met: true });
    expect(summary.eligible).toBe(true);
  });

  test("teachings are always out of six, so a partly scheduled week cannot be awarded early", () => {
    const summary = weekOne({ teachings: sixTeachings(1).slice(0, 4) });
    expect(summary.teachings).toEqual({ completed: 4, total: 6, needed: 6, met: false });
    expect(summary.unmet).toEqual(["teachings"]);
  });

  test("only the week's own level counts towards its teachings", () => {
    const summary = weekOne({ teachings: [...sixTeachings(1, 5), ...sixTeachings(2)] });
    expect(summary.teachings.completed).toBe(5);
    expect(summary.eligible).toBe(false);
  });

  test("a lower teachings policy lets five of six pass", () => {
    const summary = weekOne({
      teachings: sixTeachings(1, 5),
      policy: { ...DEFAULT_SOGP_ASSESSMENT_POLICY, requiredTrackCompletionPercent: 80 },
    });
    expect(summary.teachings.met).toBe(true);
    expect(summary.eligible).toBe(true);
  });

  test("always returns four weeks and ignores a 29th date and any review on it", () => {
    const summaries = summarizeSogpWeekAwards({
      dateKeys,
      tracks: [],
      prayerDateKeys: new Set([dateKeys[28]!]),
      reviews: [{ dateKey: dateKeys[28]!, complete: true }],
      policy: DEFAULT_SOGP_ASSESSMENT_POLICY,
    });
    expect(summaries.map((summary) => summary.week)).toEqual([1, 2, 3, 4]);
    expect(summaries[3]!.endDateKey).toBe("2026-10-11");
    expect(summaries[3]!.prayerWatch.completed).toBe(0);
    expect(summaries[3]!.reviews.total).toBe(0);
  });

  test("a Sunday review counts for the week that ends that day, and Monday's for the next", () => {
    const summaries = summarizeSogpWeekAwards({
      dateKeys,
      tracks: [],
      prayerDateKeys: new Set(),
      reviews: [
        { dateKey: "2026-09-20", complete: true },
        { dateKey: "2026-09-21", complete: false },
      ],
      policy: DEFAULT_SOGP_ASSESSMENT_POLICY,
    });
    expect(summaries[0]!.reviews).toMatchObject({ completed: 1, total: 1 });
    expect(summaries[1]!.reviews).toMatchObject({ completed: 0, total: 1 });
  });

  test("a cohort without dates for a week never qualifies for it", () => {
    const summaries = summarizeSogpWeekAwards({
      dateKeys: cohortDates(7),
      tracks: sixTeachings(2),
      prayerDateKeys: new Set(),
      reviews: [],
      policy: DEFAULT_SOGP_ASSESSMENT_POLICY,
    });
    expect(summaries[1]!.startDateKey).toBeNull();
    expect(summaries[1]!.prayerWatch.met).toBe(false);
    expect(summaries[1]!.eligible).toBe(false);
  });
});

test("minimumToMeetPercent rounds as the certificate rules do", () => {
  expect(minimumToMeetPercent(7, 80)).toBe(6);
  expect(minimumToMeetPercent(5, 80)).toBe(4);
  expect(minimumToMeetPercent(3, 80)).toBe(3);
  expect(minimumToMeetPercent(6, 100)).toBe(6);
  expect(minimumToMeetPercent(0, 80)).toBe(0);
});

describe("selectWeeksToAward", () => {
  const summaries = summarizeSogpWeekAwards({
    dateKeys,
    tracks: [...sixTeachings(1), ...sixTeachings(2)],
    prayerDateKeys: new Set(dateKeys.slice(0, 14)),
    reviews: [],
    policy: DEFAULT_SOGP_ASSESSMENT_POLICY,
  });

  test("returns every eligible week without a certificate", () => {
    expect(
      selectWeeksToAward({ summaries, existingWeeks: new Set(), enrollmentStatus: "active" }),
    ).toEqual([1, 2]);
  });

  test("skips weeks that already have a row, revoked ones included", () => {
    expect(
      selectWeeksToAward({ summaries, existingWeeks: new Set([1]), enrollmentStatus: "active" }),
    ).toEqual([2]);
  });

  test("awards nothing to a withdrawn enrolment", () => {
    expect(
      selectWeeksToAward({ summaries, existingWeeks: new Set(), enrollmentStatus: "withdrawn" }),
    ).toEqual([]);
  });
});

test("week lists, labels and push text", () => {
  expect(formatSogpWeekList([1])).toBe("1");
  expect(formatSogpWeekList([2, 1])).toBe("1 and 2");
  expect(formatSogpWeekList([3, 1, 2])).toBe("1, 2 and 3");
  expect(describeSogpWeekCertificates([2])).toBe("Week 2 certificate");
  expect(describeSogpWeekCertificates([1, 2])).toBe("Week 1 and 2 certificates");
  expect(sogpWeekCertificatePushBody([2])).toBe("Your Week 2 certificate is ready.");
  expect(sogpWeekCertificatePushBody([1, 2])).toBe("Your Week 1 and 2 certificates are ready.");
});

test("the gap lists only what is still needed", () => {
  const summary = weekOne({ teachings: sixTeachings(1, 4), prayerDays: 5, reviewsDone: 5 });
  expect(describeSogpWeekGap(summary)).toBe(
    "2 teachings, 1 Prayer Watch day and 1 review to go",
  );
  expect(describeSogpWeekGap(weekOne({ prayerDays: 5 }))).toBe("1 Prayer Watch day to go");
  expect(describeSogpWeekGap(weekOne({}))).toBe("");
});

test("verification codes name their week", () => {
  expect(buildSogpWeekVerificationCode(3, "a1b2c3d4e5f6")).toBe("SOGP-W3-A1B2C3D4E5F6");
});

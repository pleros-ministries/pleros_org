import { describe, expect, test } from "vitest";

import { lagosDayRange, summarizeDailyByPastor, type DailyParticipationRow } from "./daily-participation";

function row(overrides: Partial<DailyParticipationRow>): DailyParticipationRow {
  return {
    enrollmentId: 1,
    name: "Test",
    email: "t@example.com",
    pastorId: "p1",
    pastorName: "Pastor One",
    prayerWatch: false,
    listened: false,
    quizAttempted: false,
    writtenSubmitted: false,
    writtenApproved: false,
    reviewAttended: false,
    ...overrides,
  };
}

describe("lagosDayRange", () => {
  test("starts at Lagos midnight, which is the previous UTC evening", () => {
    const { start, end } = lagosDayRange("2026-09-14");
    expect(start.toISOString()).toBe("2026-09-13T23:00:00.000Z");
    expect(end.toISOString()).toBe("2026-09-14T23:00:00.000Z");
  });
});

describe("summarizeDailyByPastor", () => {
  const rows = [
    row({ enrollmentId: 1, prayerWatch: true, listened: true, quizAttempted: true }),
    row({ enrollmentId: 2, prayerWatch: true, listened: false, writtenSubmitted: true, reviewAttended: true }),
    row({ enrollmentId: 3, pastorId: "p2", pastorName: "Pastor Two", writtenApproved: true, listened: true }),
    row({ enrollmentId: 4, pastorId: null, pastorName: null }),
  ];

  test("counts each column per pastor and sorts by enrollee count", () => {
    const { pastors } = summarizeDailyByPastor(rows);
    expect(pastors.map((p) => p.pastorName)).toEqual(["Pastor One", "Pastor Two", "Unassigned"]);
    expect(pastors[0]).toMatchObject({
      enrollees: 2,
      prayerWatch: 2,
      listened: 1,
      quizAttempted: 1,
      writtenSubmitted: 1,
      reviewAttended: 1,
    });
    expect(pastors[1]).toMatchObject({ enrollees: 1, writtenApproved: 1, listened: 1 });
  });

  test("puts enrollees without a pastor in an Unassigned bucket and totals everyone", () => {
    const { pastors, total } = summarizeDailyByPastor(rows);
    expect(pastors.find((p) => p.pastorId === null)).toMatchObject({ pastorName: "Unassigned", enrollees: 1 });
    expect(total).toMatchObject({ enrollees: 4, prayerWatch: 2, listened: 2, writtenApproved: 1 });
  });

  test("marks listened as not applicable on days with no released lesson", () => {
    const { pastors, total } = summarizeDailyByPastor([row({ listened: null }), row({ enrollmentId: 2, listened: null })]);
    expect(pastors[0]?.listenedApplicable).toBe(false);
    expect(total.listened).toBe(0);
    expect(total.listenedApplicable).toBe(false);
  });
});

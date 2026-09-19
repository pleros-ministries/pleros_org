import { describe, expect, test } from "vitest";

import { SOGP_TOTAL_WEEKS } from "./calendar";
import {
  buildLastActivityIndex,
  buildSogpReport,
  computeCohortWeekDateRanges,
  deriveTrackCompleted,
} from "./report";

import type { SogpReportRawData } from "@/lib/db/queries/sogp-report";

const DAY = 24 * 60 * 60 * 1000;

function makeCohort(overrides: Partial<SogpReportRawData["cohorts"][number]> = {}) {
  const startsAt = overrides.startsAt ?? new Date("2026-08-01T00:00:00.000Z");
  return {
    id: 1,
    slug: "cohort-1",
    title: "Cohort 1",
    status: "active" as const,
    enrollmentOpensAt: null,
    enrollmentClosesAt: null,
    preparationStartsAt: null,
    startsAt,
    endsAt: new Date(startsAt.getTime() + SOGP_TOTAL_WEEKS * 7 * DAY),
    telegramChannelUrl: null,
    telegramDiscussionUrl: null,
    telegramBotUsername: null,
    assessmentPolicy: {
      requiredTrackCompletionPercent: 100,
      requiredPrayerWatchPercent: 80,
      requiredLiveClassCount: 4,
    },
    createdAt: startsAt,
    updatedAt: startsAt,
    ...overrides,
  } as SogpReportRawData["cohorts"][number];
}

function makeEnrollment(overrides: Partial<SogpReportRawData["enrollments"][number]> = {}) {
  return {
    id: overrides.id ?? 1,
    cohortId: 1,
    userId: overrides.userId ?? "user-1",
    name: "Test User",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    phone: "+2340000000000",
    countryCode: "+234",
    country: "Nigeria",
    region: "Lagos",
    birthYear: null,
    referralSource: "friend",
    whatsappConsent: false,
    whatsappOptedInAt: null,
    reason: null,
    status: "active" as const,
    referralCode: null,
    referredByEnrollmentId: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
    telegramLinkTokenHash: null,
    telegramUserId: null,
    telegramChatId: null,
    telegramLinkedAt: null,
    createdAt: new Date("2026-07-25T00:00:00.000Z"),
    updatedAt: new Date("2026-07-25T00:00:00.000Z"),
    ...overrides,
  } as SogpReportRawData["enrollments"][number];
}

describe("deriveTrackCompleted", () => {
  test("requires a passed quiz", () => {
    expect(deriveTrackCompleted({ responsePrompt: null }, { quizPassed: false, writtenApproved: false })).toBe(
      false,
    );
    expect(deriveTrackCompleted({ responsePrompt: null }, { quizPassed: true, writtenApproved: false })).toBe(true);
  });

  test("also requires an approved written response when the lesson asks for one", () => {
    expect(
      deriveTrackCompleted({ responsePrompt: "Reflect" }, { quizPassed: true, writtenApproved: false }),
    ).toBe(false);
    expect(deriveTrackCompleted({ responsePrompt: "Reflect" }, { quizPassed: true, writtenApproved: true })).toBe(
      true,
    );
  });

  test("treats missing progress as not completed", () => {
    expect(deriveTrackCompleted({ responsePrompt: null }, undefined)).toBe(false);
  });
});

describe("computeCohortWeekDateRanges", () => {
  test("falls back to startsAt + 7*(week-1) when a week has no scheduled tracks", () => {
    const startsAt = new Date("2026-08-01T00:00:00.000Z");
    const ranges = computeCohortWeekDateRanges({ startsAt }, []);
    expect(ranges).toHaveLength(SOGP_TOTAL_WEEKS);
    expect(ranges[0]).toEqual({ week: 1, startsAt, endsAt: new Date(startsAt.getTime() + 7 * DAY) });
    expect(ranges[3]?.startsAt).toEqual(new Date(startsAt.getTime() + 21 * DAY));
  });

  test("derives ranges from actual release times when tracks are scheduled", () => {
    const startsAt = new Date("2026-08-01T00:00:00.000Z");
    const week1Release = new Date("2026-08-02T00:00:00.000Z");
    const week2Release = new Date("2026-08-10T00:00:00.000Z");
    const ranges = computeCohortWeekDateRanges({ startsAt }, [
      { weekNumber: 1, releaseAt: week1Release },
      { weekNumber: 2, releaseAt: week2Release },
    ]);
    expect(ranges[0]).toEqual({ week: 1, startsAt: week1Release, endsAt: week2Release });
  });
});

describe("buildLastActivityIndex", () => {
  test("picks the max timestamp per user across every activity source", () => {
    const index = buildLastActivityIndex({
      quizAttempts: [{ userId: "u1", lessonId: 1, createdAt: new Date("2026-08-01T00:00:00.000Z") }],
      writtenSubmissions: [],
      liveClassAttendance: [{ liveClassId: 1, userId: "u1", attendedAt: new Date("2026-08-05T00:00:00.000Z") }],
      prayerWatchAttendance: [{ userId: "u1", attendedDate: "2026-08-03" }],
    });
    expect(index.get("u1")).toEqual(new Date("2026-08-05T00:00:00.000Z"));
    expect(index.get("u2")).toBeUndefined();
  });
});

describe("buildSogpReport", () => {
  const startsAt = new Date("2026-08-01T00:00:00.000Z"); // cohort started 15 days before "now" below -> week 3
  const now = new Date(startsAt.getTime() + 15 * DAY);
  const cohort = makeCohort({ startsAt });

  // Two required tracks per week, for all four weeks; lessons have no
  // written-response requirement so quizPassed alone marks them complete.
  const tracks = Array.from({ length: SOGP_TOTAL_WEEKS * 2 }, (_, index) => {
    const week = Math.floor(index / 2) + 1;
    const lessonId = index + 1;
    return {
      track: {
        id: index + 1,
        cohortId: 1,
        lessonId,
        dayNumber: index + 1,
        weekNumber: week,
        curriculumLevel: 1,
        curriculumOrder: index + 1,
        isRequired: true,
        liveSessionNumber: null,
        releaseAt: new Date(startsAt.getTime() + (week - 1) * 7 * DAY),
        createdAt: startsAt,
      },
      lesson: { id: lessonId, responsePrompt: null },
    };
  });
  const requiredTracksThroughWeek3 = tracks.filter((row) => row.track.weekNumber <= 3).length; // 6

  const enrollmentCaughtUp = makeEnrollment({ id: 1, userId: "caught-up", status: "active" });
  const enrollmentBehindAndInactive = makeEnrollment({ id: 2, userId: "behind-inactive", status: "enrolled" });
  const enrollmentBehindButActive = makeEnrollment({ id: 3, userId: "behind-active", status: "preparing" });
  const enrollmentWithdrawn = makeEnrollment({ id: 4, userId: "withdrawn-user", status: "withdrawn" });
  const enrollmentCompleted = makeEnrollment({ id: 5, userId: "completed-user", status: "completed" });

  // caught-up: passed every track scheduled through week 3, active today.
  const progress = [
    ...tracks
      .filter((row) => row.track.weekNumber <= 3)
      .map((row) => ({ userId: "caught-up", lessonId: row.lesson.id, quizPassed: true, writtenApproved: false })),
    // behind-active: only week 1's two tracks done (2 of 6 -> below 50%).
    ...tracks
      .filter((row) => row.track.weekNumber === 1)
      .map((row) => ({ userId: "behind-active", lessonId: row.lesson.id, quizPassed: true, writtenApproved: false })),
  ];

  const raw: SogpReportRawData = {
    cohorts: [cohort],
    enrollments: [
      enrollmentCaughtUp,
      enrollmentBehindAndInactive,
      enrollmentBehindButActive,
      enrollmentWithdrawn,
      enrollmentCompleted,
    ],
    tracks,
    progress,
    quizAttempts: [
      { userId: "caught-up", lessonId: 1, createdAt: now },
      { userId: "behind-active", lessonId: 1, createdAt: now },
    ],
    writtenSubmissions: [],
    liveClasses: [],
    liveClassAttendance: [],
    prayerWatchAttendance: [],
    preparationDays: [],
    preparationCompletions: [],
    certificates: [{ enrollmentId: 5, issuedAt: now, revokedAt: null }],
  };

  const report = buildSogpReport(raw, now);
  const cohortReport = report.cohorts[0]!;

  test("counts every enrollment and buckets status correctly", () => {
    expect(cohortReport.totalEnrollments).toBe(5);
    expect(cohortReport.statusBreakdown).toMatchObject({
      active: 1,
      enrolled: 1,
      preparing: 1,
      withdrawn: 1,
      completed: 1,
    });
    expect(cohortReport.certificatesIssued).toBe(1);
  });

  test("produces one weekly bucket per SOGP week", () => {
    expect(cohortReport.weeklyParticipation).toHaveLength(SOGP_TOTAL_WEEKS);
    expect(cohortReport.weeklyParticipation.map((week) => week.week)).toEqual([1, 2, 3, 4]);
  });

  test("flags the fully-caught-up, active participant as not left behind", () => {
    expect(report.leftBehind.some((entry) => entry.enrollmentId === 1)).toBe(false);
  });

  test("flags an enrollment with no activity and low completion for both reasons", () => {
    const entry = report.leftBehind.find((entry) => entry.enrollmentId === 2);
    expect(entry).toBeDefined();
    expect(entry?.flags).toEqual(expect.arrayContaining(["behind_pace", "inactive_7_days"]));
    expect(entry?.completedTrackCount).toBe(0);
    expect(entry?.expectedTrackCount).toBe(requiredTracksThroughWeek3);
    expect(entry?.lastActivityAt).toBeNull();
  });

  test("flags a recently-active but under-paced enrollment for pace only", () => {
    const entry = report.leftBehind.find((entry) => entry.enrollmentId === 3);
    expect(entry).toBeDefined();
    expect(entry?.flags).toEqual(["behind_pace"]);
    expect(entry?.completedTrackCount).toBe(2);
  });

  test("never flags withdrawn or completed enrollments", () => {
    expect(report.leftBehind.some((entry) => entry.enrollmentId === 4)).toBe(false);
    expect(report.leftBehind.some((entry) => entry.enrollmentId === 5)).toBe(false);
  });

  test("includes a per-participant weekly matrix for every enrollment", () => {
    expect(report.participants).toHaveLength(5);
    const caughtUp = report.participants.find((participant) => participant.enrollmentId === 1);
    expect(caughtUp?.weeklyTrackCompletion.slice(0, 3)).toEqual([
      { week: 1, completed: 2, total: 2 },
      { week: 2, completed: 2, total: 2 },
      { week: 3, completed: 2, total: 2 },
    ]);
    expect(caughtUp?.weeklyTrackCompletion[3]).toEqual({ week: 4, completed: 0, total: 2 });
  });
});

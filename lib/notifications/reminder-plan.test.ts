import { describe, expect, test } from "vitest";

import type {
  PreSogpJourneyData,
  SogpJourneyData,
} from "../db/queries/sogp-journey";
import { PRAYER_WATCH_SESSIONS } from "../prayer-watch";

import {
  PRAYER_WATCH_WINDOW_MS,
  PRUNABLE_CHECKPOINT_PREFIXES,
  TEACHING_WINDOW_MS,
  buildNewContentPush,
  buildNudgePush,
  buildPrayerWatchPush,
  buildTeachingPush,
  buildWeeklySummary,
  buildWeeklySummaryPush,
  chooseReminderCohort,
  isActiveJourneyForCohort,
  isCohortRunning,
  isFreshContent,
  isMonday,
  isPreparationJourneyForCohort,
  isWeeklySummaryEligible,
  localSlots,
  nudgeDue,
  pickNudgeTarget,
  pickPreparationNudgeTarget,
  pickPreparationTarget,
  pickTeachingTarget,
  prayerWatchDue,
  reminderKeys,
  shouldSkipNudge,
  slotPhase,
  teachingDue,
  teachingReleaseInstant,
  wantsPrayerWatchReminder,
  weeklyDue,
  type ReminderCohort,
} from "./reminder-plan";
import { getZonedParts, isDue } from "./zoned-time";

type ActiveDay = SogpJourneyData["days"][number];
type PreparationDay = PreSogpJourneyData["days"][number];

const iso = (date: Date) => date.toISOString();
const at = (value: string) => new Date(value);

// A four-week cohort that starts on Monday 12 October 2026 at Lagos midnight
// and ends on the Sunday night of its fourth week.
const cohort: ReminderCohort = {
  id: 7,
  startsAt: at("2026-10-11T23:00:00.000Z"),
  endsAt: at("2026-11-08T22:59:59.999Z"),
  startDateKey: "2026-10-12",
};

function activeDay(
  dateKey: string,
  options: {
    title?: string;
    complete?: boolean;
    accessible?: boolean;
    track?: boolean;
    prayer?: boolean;
    review?: "none" | "open" | "done";
  } = {},
): ActiveDay {
  const hasTrack = options.track ?? true;
  const review = options.review ?? "none";
  return {
    dateKey,
    kind: hasTrack ? "weekday" : "weekend",
    state: "current",
    prayerWatchComplete: options.prayer ?? false,
    track: hasTrack
      ? {
          id: 1,
          dayNumber: 1,
          curriculumLevel: 1,
          levelPosition: 1,
          title: options.title ?? `Teaching ${dateKey}`,
          audioUrl: null,
          assessmentComplete: options.complete ?? false,
          quizPassed: options.complete ?? false,
          writtenResponseStatus: null,
          accessible: options.accessible ?? true,
          lockedReason: null,
        }
      : null,
    review:
      review === "none"
        ? null
        : {
            id: 1,
            title: "Daily review",
            startsAt: `${dateKey}T19:00:00.000Z`,
            endsAt: `${dateKey}T19:30:00.000Z`,
            liveUrl: null,
            recordingUrl: null,
            complete: review === "done",
            completionSource: review === "done" ? "live" : null,
          },
  };
}

function preparationDay(
  dateKey: string,
  options: { title?: string; complete?: boolean; lesson?: boolean } = {},
): PreparationDay {
  return {
    id: 1,
    dayNumber: 1,
    dateKey,
    state: "current",
    lessonComplete: options.complete ?? false,
    prayerWatchComplete: false,
    lesson:
      (options.lesson ?? true)
        ? {
            title: options.title ?? `Lesson ${dateKey}`,
            description: null,
            url: "https://example.com/lesson",
          }
        : null,
  };
}

describe("Prayer Watch reminders", () => {
  const [morning, afternoon, evening] = PRAYER_WATCH_SESSIONS;

  test("are due ten minutes before each session on Lagos time", () => {
    // Lagos is UTC+1: 5:20 am, 12:20 pm and 8:20 pm.
    expect(iso(prayerWatchDue(morning, "2026-10-12"))).toBe("2026-10-12T04:20:00.000Z");
    expect(iso(prayerWatchDue(afternoon, "2026-10-12"))).toBe("2026-10-12T11:20:00.000Z");
    expect(iso(prayerWatchDue(evening, "2026-10-12"))).toBe("2026-10-12T19:20:00.000Z");
  });

  test("can be sent from 5:20 until the session starts, and never after", () => {
    const due = prayerWatchDue(morning, "2026-10-12");
    const windowMs = PRAYER_WATCH_WINDOW_MS;

    expect(isDue(due, at("2026-10-12T04:19:00Z"), windowMs)).toBe(false);
    expect(isDue(due, at("2026-10-12T04:20:00Z"), windowMs)).toBe(true);
    // A cron run that arrives six minutes late still delivers.
    expect(isDue(due, at("2026-10-12T04:26:00Z"), windowMs)).toBe(true);
    expect(isDue(due, at("2026-10-12T04:29:59Z"), windowMs)).toBe(true);
    expect(isDue(due, at("2026-10-12T04:30:00Z"), windowMs)).toBe(false);
  });

  test("follow the learner's choice for each session", () => {
    const preferences = {
      prayerWatch: { morning: true, afternoon: false, evening: true },
    };
    expect(wantsPrayerWatchReminder(preferences, "morning")).toBe(true);
    expect(wantsPrayerWatchReminder(preferences, "afternoon")).toBe(false);
    expect(wantsPrayerWatchReminder(preferences, "evening")).toBe(true);
  });
});

describe("when a teaching can first be opened", () => {
  test("core teachings open a week at a time, at the Monday release", () => {
    expect(iso(teachingReleaseInstant("2026-10-12", "active"))).toBe("2026-10-12T05:00:00.000Z");
    expect(iso(teachingReleaseInstant("2026-10-15", "active"))).toBe("2026-10-12T05:00:00.000Z");
    // Sunday still belongs to the week that opened six days earlier.
    expect(iso(teachingReleaseInstant("2026-10-18", "active"))).toBe("2026-10-12T05:00:00.000Z");
    expect(iso(teachingReleaseInstant("2026-10-19", "active"))).toBe("2026-10-19T05:00:00.000Z");
  });

  test("preparation lessons open at Lagos midnight of their own date", () => {
    expect(iso(teachingReleaseInstant("2026-10-10", "preparing"))).toBe("2026-10-09T23:00:00.000Z");
  });
});

describe("the teaching reminder's due instant", () => {
  const due = (dateKey: string, minutes: number, timeZone: string) =>
    iso(teachingDue({ dateKey, minutes, timeZone, phase: "active" }));

  test("is the chosen local time once the week is open", () => {
    // 6:30 am Lagos on Monday is after the 6:00 am release.
    expect(due("2026-10-12", 390, "Africa/Lagos")).toBe("2026-10-12T05:30:00.000Z");
  });

  test("holds an early riser only on Monday", () => {
    // 5:00 am Lagos is 04:00 UTC, an hour before Monday's release…
    expect(due("2026-10-12", 300, "Africa/Lagos")).toBe("2026-10-12T05:00:00.000Z");
    // …but on Tuesday the week is already open, so it is exactly 5:00 am.
    expect(due("2026-10-13", 300, "Africa/Lagos")).toBe("2026-10-13T04:00:00.000Z");
  });

  test("holds a learner east of Lagos only on Monday", () => {
    // 6:00 am Monday in Tokyo is 21:00 UTC on Sunday, before the release.
    expect(due("2026-10-12", 360, "Asia/Tokyo")).toBe("2026-10-12T05:00:00.000Z");
    // 6:00 am Tuesday in Tokyo is 21:00 UTC on Monday: sent on time.
    expect(due("2026-10-13", 360, "Asia/Tokyo")).toBe("2026-10-12T21:00:00.000Z");
  });

  test("holds a preparation lesson until it opens in Lagos", () => {
    const tokyo = teachingDue({
      dateKey: "2026-10-10",
      minutes: 360,
      timeZone: "Asia/Tokyo",
      phase: "preparing",
    });
    expect(iso(tokyo)).toBe("2026-10-09T23:00:00.000Z");

    const lagos = teachingDue({
      dateKey: "2026-10-10",
      minutes: 360,
      timeZone: "Africa/Lagos",
      phase: "preparing",
    });
    expect(iso(lagos)).toBe("2026-10-10T05:00:00.000Z");
  });
});

describe("learners far from Lagos", () => {
  test("a Los Angeles evening is the learner's Monday while Lagos is on Tuesday", () => {
    const dueAt = teachingDue({
      dateKey: "2026-10-12",
      minutes: 19 * 60,
      timeZone: "America/Los_Angeles",
      phase: "active",
    });
    // 7:00 pm Pacific daylight time is 02:00 UTC the next day.
    expect(iso(dueAt)).toBe("2026-10-13T02:00:00.000Z");
    expect(getZonedParts(dueAt, "Africa/Lagos").dateKey).toBe("2026-10-13");
    expect(localSlots(dueAt, "America/Los_Angeles")).toEqual(["2026-10-12", "2026-10-11"]);

    const days = [
      activeDay("2026-10-12", { title: "The Word of Truth" }),
      activeDay("2026-10-13", { title: "Tuesday's teaching" }),
    ];
    const target = pickTeachingTarget(days, "2026-10-12");
    expect(target).toEqual({
      kind: "today",
      dateKey: "2026-10-12",
      title: "The Word of Truth",
    });
    // The link is pinned to the learner's Monday, not Lagos "today".
    expect(buildTeachingPush(target!, "active").url).toBe("/dashboard/sogp?date=2026-10-12");
  });

  test("their last preparation evening is still preparation after the cohort starts in Lagos", () => {
    // Sunday 7:00 pm in Los Angeles is three hours after the cohort began.
    const now = at("2026-10-12T02:00:00Z");
    expect(now.getTime()).toBeGreaterThan(cohort.startsAt.getTime());

    const [today] = localSlots(now, "America/Los_Angeles");
    expect(today).toBe("2026-10-11");
    expect(slotPhase(today!, cohort)).toBe("preparing");
  });
});

describe("local slots and phases", () => {
  test("offer the learner's today and yesterday", () => {
    expect(localSlots(at("2026-10-12T05:30:00Z"), "Africa/Lagos")).toEqual([
      "2026-10-12",
      "2026-10-11",
    ]);
  });

  test("still catch an 11:50 pm reminder just after local midnight", () => {
    // 12:05 am on Tuesday in Lagos; the 11:50 pm and 11:55 pm runs were missed.
    const now = at("2026-10-12T23:05:00Z");
    const slots = localSlots(now, "Africa/Lagos");
    expect(slots).toEqual(["2026-10-13", "2026-10-12"]);

    const dueFor = (dateKey: string) =>
      teachingDue({
        dateKey,
        minutes: 23 * 60 + 50,
        timeZone: "Africa/Lagos",
        phase: "active",
      });
    expect(isDue(dueFor("2026-10-13"), now, TEACHING_WINDOW_MS)).toBe(false);
    expect(isDue(dueFor("2026-10-12"), now, TEACHING_WINDOW_MS)).toBe(true);
  });

  test("a date before the cohort start is preparation, anything from it is active", () => {
    expect(slotPhase("2026-10-11", cohort)).toBe("preparing");
    expect(slotPhase("2026-10-12", cohort)).toBe("active");
    expect(slotPhase("2026-10-30", cohort)).toBe("active");
  });
});

describe("choosing the cohort reminders are about", () => {
  const now = at("2026-10-20T12:00:00Z");
  const upcoming = {
    id: 8,
    startsAt: at("2026-11-08T23:00:00Z"),
    endsAt: at("2026-12-06T22:59:59.999Z"),
  };

  test("a running cohort beats an upcoming one", () => {
    expect(chooseReminderCohort([upcoming, cohort], now)).toBe(cohort);
  });

  test("of two running cohorts, the most recently started wins", () => {
    const older = {
      id: 5,
      startsAt: at("2026-10-01T00:00:00Z"),
      endsAt: at("2026-10-30T00:00:00Z"),
    };
    expect(chooseReminderCohort([cohort, older], now)).toBe(cohort);
    expect(chooseReminderCohort([older, cohort], now)).toBe(cohort);
  });

  test("with nothing running, the next to start wins", () => {
    const later = {
      id: 9,
      startsAt: at("2026-12-06T23:00:00Z"),
      endsAt: at("2027-01-03T22:59:59.999Z"),
    };
    const beforeAny = at("2026-10-01T12:00:00Z");
    expect(chooseReminderCohort([later, upcoming], beforeAny)).toBe(upcoming);
  });

  test("a cohort that has just ended is kept briefly for its last weekly summary", () => {
    // The cohort ended on Sunday night; this is Monday 8:00 am in Lagos.
    const mondayAfter = at("2026-11-09T07:00:00Z");
    expect(chooseReminderCohort([cohort], mondayAfter)).toBe(cohort);
    // Two days later it is gone.
    expect(chooseReminderCohort([cohort], at("2026-11-10T23:00:00Z"))).toBeNull();

    // A cohort the learner is about to start matters more than one that ended.
    const nextMonth = {
      id: 9,
      startsAt: at("2026-11-15T23:00:00Z"),
      endsAt: at("2026-12-13T22:59:59.999Z"),
    };
    expect(chooseReminderCohort([cohort, nextMonth], mondayAfter)).toBe(nextMonth);
  });

  test("no enrolment means no cohort", () => {
    expect(chooseReminderCohort([], now)).toBeNull();
  });
});

describe("the end of a cohort", () => {
  test("daily reminders stop when it ends", () => {
    expect(isCohortRunning(cohort, at("2026-11-08T22:00:00Z"))).toBe(true);
    expect(isCohortRunning(cohort, at("2026-11-09T07:00:00Z"))).toBe(false);
  });

  test("the summary for the last week is still sent the next morning", () => {
    expect(isWeeklySummaryEligible(cohort, at("2026-10-11T22:00:00Z"))).toBe(false);
    expect(isWeeklySummaryEligible(cohort, at("2026-10-19T07:00:00Z"))).toBe(true);
    // The Monday after the cohort's last Sunday…
    expect(isWeeklySummaryEligible(cohort, at("2026-11-09T07:00:00Z"))).toBe(true);
    // …but not the Monday after that.
    expect(isWeeklySummaryEligible(cohort, at("2026-11-16T07:00:00Z"))).toBe(false);
  });
});

describe("which teaching to remind about", () => {
  test("today's teaching when it is unfinished", () => {
    const days = [
      activeDay("2026-10-12", { complete: true }),
      activeDay("2026-10-13", { title: "Tuesday's teaching" }),
    ];
    expect(pickTeachingTarget(days, "2026-10-13")).toEqual({
      kind: "today",
      dateKey: "2026-10-13",
      title: "Tuesday's teaching",
    });
  });

  test("otherwise the earliest unfinished earlier teaching", () => {
    const days = [
      activeDay("2026-10-13", { title: "Tuesday's teaching" }),
      activeDay("2026-10-12", { title: "Monday's teaching" }),
      activeDay("2026-10-14", { complete: true }),
    ];
    expect(pickTeachingTarget(days, "2026-10-14")).toEqual({
      kind: "catch_up",
      dateKey: "2026-10-12",
      title: "Monday's teaching",
    });
  });

  test("catches up on a Sunday, which has no teaching of its own", () => {
    const days = [
      activeDay("2026-10-17", { title: "Saturday's teaching" }),
      activeDay("2026-10-18", { track: false }),
    ];
    expect(pickTeachingTarget(days, "2026-10-18")).toEqual({
      kind: "catch_up",
      dateKey: "2026-10-17",
      title: "Saturday's teaching",
    });
  });

  test("never looks ahead, even though the rest of the week is open", () => {
    const days = [
      activeDay("2026-10-12", { complete: true }),
      activeDay("2026-10-13", { complete: true }),
      activeDay("2026-10-14"),
    ];
    expect(pickTeachingTarget(days, "2026-10-13")).toBeNull();
  });

  test("ignores a teaching that cannot be opened yet", () => {
    const days = [
      activeDay("2026-10-12", { accessible: false }),
      activeDay("2026-10-13", { accessible: false }),
    ];
    expect(pickTeachingTarget(days, "2026-10-13")).toBeNull();
  });

  test("stays silent when everything is done, or the journey is empty", () => {
    const days = [
      activeDay("2026-10-12", { complete: true }),
      activeDay("2026-10-13", { complete: true }),
    ];
    expect(pickTeachingTarget(days, "2026-10-13")).toBeNull();
    expect(pickTeachingTarget([], "2026-10-13")).toBeNull();
  });

  test("applies the same rule to preparation lessons", () => {
    const days = [
      preparationDay("2026-10-08", { title: "Lesson one" }),
      preparationDay("2026-10-09", { complete: true }),
      preparationDay("2026-10-10", { lesson: false }),
    ];
    expect(pickPreparationTarget(days, "2026-10-08")).toEqual({
      kind: "today",
      dateKey: "2026-10-08",
      title: "Lesson one",
    });
    expect(pickPreparationTarget(days, "2026-10-09")).toEqual({
      kind: "catch_up",
      dateKey: "2026-10-08",
      title: "Lesson one",
    });
    // A lesson that has not been exposed yet is not a target.
    expect(pickPreparationTarget([preparationDay("2026-10-10", { lesson: false })], "2026-10-10")).toBeNull();
  });
});

describe("the evening nudge", () => {
  test("is due at 7:00 pm in the learner's zone", () => {
    expect(iso(nudgeDue("2026-10-12", "Africa/Lagos"))).toBe("2026-10-12T18:00:00.000Z");
    expect(iso(nudgeDue("2026-10-12", "America/Los_Angeles"))).toBe("2026-10-13T02:00:00.000Z");
  });

  test("is only ever about the day's own teaching", () => {
    const days = [activeDay("2026-10-12"), activeDay("2026-10-13", { complete: true })];
    expect(pickNudgeTarget(days, "2026-10-12")?.kind).toBe("today");
    // Tuesday's is done; Monday's being unfinished is not a reason to nudge.
    expect(pickNudgeTarget(days, "2026-10-13")).toBeNull();

    const preparation = [
      preparationDay("2026-10-08"),
      preparationDay("2026-10-09", { complete: true }),
    ];
    expect(pickPreparationNudgeTarget(preparation, "2026-10-08")?.dateKey).toBe("2026-10-08");
    expect(pickPreparationNudgeTarget(preparation, "2026-10-09")).toBeNull();
  });

  test("is skipped when a late teaching reminder already covers the evening", () => {
    expect(shouldSkipNudge({ teachingReminderEnabled: true, teachingTimeMinutes: 16 * 60 + 59 })).toBe(false);
    expect(shouldSkipNudge({ teachingReminderEnabled: true, teachingTimeMinutes: 17 * 60 })).toBe(true);
    expect(shouldSkipNudge({ teachingReminderEnabled: false, teachingTimeMinutes: 19 * 60 })).toBe(false);
    expect(shouldSkipNudge({ teachingReminderEnabled: true, teachingTimeMinutes: null })).toBe(false);
  });
});

describe("journeys from another cohort", () => {
  test("an active journey is only used when it is for the chosen cohort", () => {
    const journey = (startsAt: string) => ({
      cohort: {
        title: "SOGP",
        startsAt,
        endsAt: "2026-11-08T22:59:59.999Z",
        telegramUrl: "https://t.me/pleros_sogp",
      },
    });
    expect(isActiveJourneyForCohort(journey("2026-10-11T23:00:00.000Z"), cohort)).toBe(true);
    expect(isActiveJourneyForCohort(journey("2026-09-13T23:00:00.000Z"), cohort)).toBe(false);
  });

  test("a preparation journey is only used when it is for the chosen cohort", () => {
    const journey = (id: number) => ({
      cohort: {
        id,
        title: "SOGP",
        startsAt: "2026-10-11T23:00:00.000Z",
        telegramUrl: "https://t.me/pleros_sogp",
      },
    });
    expect(isPreparationJourneyForCohort(journey(7), cohort)).toBe(true);
    expect(isPreparationJourneyForCohort(journey(3), cohort)).toBe(false);
  });
});

describe("the weekly summary", () => {
  test("is due on Monday at 8:00 am local time", () => {
    expect(isMonday("2026-10-19")).toBe(true);
    expect(isMonday("2026-10-18")).toBe(false);
    expect(iso(weeklyDue("2026-10-19", "Africa/Lagos"))).toBe("2026-10-19T07:00:00.000Z");
    expect(iso(weeklyDue("2026-10-19", "America/Los_Angeles"))).toBe("2026-10-19T15:00:00.000Z");
  });

  test("never goes out before Sunday 9:00 pm in Lagos", () => {
    // Monday 8:00 am in Auckland is Sunday 19:00 UTC, while the Sunday review
    // is still running in Lagos, so it waits until 20:00 UTC.
    expect(iso(weeklyDue("2026-10-19", "Pacific/Auckland"))).toBe("2026-10-18T20:00:00.000Z");
  });

  test("counts the seven days before the Monday and nothing else", () => {
    const days = [
      activeDay("2026-10-11", { complete: true, prayer: true, review: "done" }),
      activeDay("2026-10-12", { complete: true, prayer: true, review: "done" }),
      activeDay("2026-10-13", { complete: true, prayer: true, review: "done" }),
      activeDay("2026-10-14", { complete: true, prayer: true, review: "done" }),
      activeDay("2026-10-15", { complete: true, prayer: true, review: "open" }),
      activeDay("2026-10-16", { complete: true, review: "open" }),
      activeDay("2026-10-17", { review: "open" }),
      activeDay("2026-10-18", { track: false, review: "open" }),
      activeDay("2026-10-19", { complete: true, prayer: true, review: "done" }),
    ];

    const summary = buildWeeklySummary(days, "2026-10-19");
    expect(summary).toEqual({
      teachingsCompleted: 5,
      teachingsTotal: 6,
      prayerWatchDays: 4,
      prayerWatchTotal: 7,
      reviewsCompleted: 3,
      reviewsTotal: 7,
    });
    expect(buildWeeklySummaryPush(summary!)).toEqual({
      title: "Your week on Pleros",
      body: "Last week: 5 of 6 teachings, Prayer Watch on 4 of 7 days, 3 of 7 reviews.",
      url: "/dashboard/sogp",
    });
  });

  test("is skipped when the cohort has no days in that week", () => {
    // The cohort's first Monday: the week before was preparation.
    const days = [activeDay("2026-10-12"), activeDay("2026-10-13")];
    expect(buildWeeklySummary(days, "2026-10-12")).toBeNull();
    expect(buildWeeklySummary([], "2026-10-19")).toBeNull();
  });
});

describe("new content", () => {
  const now = at("2026-10-12T10:00:00Z");

  test("only announces something published in the last 48 hours", () => {
    expect(isFreshContent("2026-10-12T04:30:04+00:00", now)).toBe(true);
    expect(isFreshContent("Mon, 12 Oct 2026 04:30:00 GMT", now)).toBe(true);
    expect(isFreshContent("2026-10-10T10:00:00Z", now)).toBe(true);
    expect(isFreshContent("2026-10-10T09:59:00Z", now)).toBe(false);
    expect(isFreshContent("2026-10-12T13:00:00Z", now)).toBe(false);
    expect(isFreshContent("not a date", now)).toBe(false);
  });

  test("links a podcast episode to the podcast page and a video to the home page", () => {
    expect(buildNewContentPush("podcast", "Authority (Part 3)")).toEqual({
      title: "New podcast episode",
      body: "Authority (Part 3)",
      url: "/dashboard/podcast",
    });
    expect(buildNewContentPush("youtube", "Authority (Part 3)")).toEqual({
      title: "New from Pleros",
      body: "Authority (Part 3)",
      url: "/",
    });
  });
});

describe("checkpoint keys", () => {
  test("embed the date so a reminder is claimed once per day", () => {
    expect(reminderKeys.prayerWatch("morning", "2026-10-12", "user-1")).toBe("pw:morning:2026-10-12:user-1");
    expect(reminderKeys.teaching("user-1", "2026-10-12")).toBe("teach:user-1:2026-10-12");
    expect(reminderKeys.nudge("user-1", "2026-10-12")).toBe("nudge:user-1:2026-10-12");
    expect(reminderKeys.weekly("user-1", "2026-10-19")).toBe("weekly:user-1:2026-10-19");
    expect(reminderKeys.contentDay("2026-10-12")).toBe("content:2026-10-12");
    expect(reminderKeys.contentLast("podcast")).toBe("content-last:podcast");
  });

  test("only dated keys can be pruned; the last-seen content ids never are", () => {
    const prunable = (key: string) =>
      PRUNABLE_CHECKPOINT_PREFIXES.some((prefix) => key.startsWith(prefix));

    expect(prunable(reminderKeys.prayerWatch("evening", "2026-10-12", "user-1"))).toBe(true);
    expect(prunable(reminderKeys.teaching("user-1", "2026-10-12"))).toBe(true);
    expect(prunable(reminderKeys.nudge("user-1", "2026-10-12"))).toBe(true);
    expect(prunable(reminderKeys.weekly("user-1", "2026-10-19"))).toBe(true);
    expect(prunable(reminderKeys.contentDay("2026-10-12"))).toBe(true);
    expect(prunable(reminderKeys.contentLast("podcast"))).toBe(false);
    expect(prunable(reminderKeys.contentLast("youtube"))).toBe(false);
    // Discipleship checkpoints belong to another job and are left alone.
    expect(prunable("discipleship-digest:4:2026-10-12")).toBe(false);
  });
});

describe("push copy", () => {
  test("Prayer Watch opens the learner's own dashboard for that day", () => {
    const session = { time: "5:30 am" };
    expect(buildPrayerWatchPush(session, "2026-10-12", "active")).toEqual({
      title: "Prayer Watch begins soon",
      body: "Join the 5:30 am Prayer Watch on Pleros Live.",
      url: "/dashboard/sogp?date=2026-10-12",
    });
    expect(buildPrayerWatchPush(session, "2026-10-08", "preparing").url).toBe("/dashboard/pre-sogp?date=2026-10-08");
    // A learner with no current cohort goes to the Prayer Watch page.
    expect(buildPrayerWatchPush(session, "2026-10-12", null).url).toBe("/dashboard/prayer-watch");
  });

  test("teaching reminders name the teaching and pin its date", () => {
    const today = { kind: "today" as const, dateKey: "2026-10-13", title: "The Word of Truth" };
    const earlier = { kind: "catch_up" as const, dateKey: "2026-10-12", title: "Monday's teaching" };

    expect(buildTeachingPush(today, "active")).toEqual({
      title: "Time for today's teaching",
      body: "The Word of Truth",
      url: "/dashboard/sogp?date=2026-10-13",
    });
    expect(buildTeachingPush(earlier, "active")).toEqual({
      title: "Continue your SOGP teaching",
      body: "Monday's teaching",
      url: "/dashboard/sogp?date=2026-10-12",
    });
    expect(buildTeachingPush(today, "preparing")).toEqual({
      title: "Time for today's preparation",
      body: "The Word of Truth",
      url: "/dashboard/pre-sogp?date=2026-10-13",
    });
    expect(buildTeachingPush(earlier, "preparing").title).toBe("Continue your SOGP preparation");
  });

  test("the nudge names the teaching that is waiting", () => {
    const today = { kind: "today" as const, dateKey: "2026-10-13", title: "The Word of Truth" };

    expect(buildNudgePush(today, "active")).toEqual({
      title: "Still time for today's teaching",
      body: "The Word of Truth is waiting for you.",
      url: "/dashboard/sogp?date=2026-10-13",
    });
    expect(buildNudgePush(today, "preparing")).toEqual({
      title: "Still time for today's preparation",
      body: "The Word of Truth is waiting for you.",
      url: "/dashboard/pre-sogp?date=2026-10-13",
    });
  });
});

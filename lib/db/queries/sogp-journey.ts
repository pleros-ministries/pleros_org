import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  buildPreparationDateKeys,
  buildSogpDateKeys,
  deriveSogpCalendarState,
  getPreSogpCountdown,
  resolvePreparationStartsAt,
} from "@/lib/sogp/calendar";
import { toLagosDateKey } from "@/lib/sogp/formation-progress";
import { calculateSogpEligibility } from "@/lib/sogp/assessment";
import {
  getSogpLevel,
  type SogpCurriculumLevel,
} from "@/lib/sogp/curriculum";
import {
  getPreparationRequirements,
  getSogpDayRequirements,
  isDateWithinSogpWindow,
} from "@/lib/sogp/journey";
import {
  canAccessSogpTrack,
  summarizeSogpLevels,
  type SogpLevelStatus,
} from "@/lib/sogp/progression";
import { getSogpDashboardData } from "./sogp";

import * as schema from "../schema";

export type PreSogpJourneyData = {
  generatedAt: string;
  todayKey: string;
  cohort: {
    id: number;
    title: string;
    startsAt: string;
    telegramUrl: string;
  };
  countdown: ReturnType<typeof getPreSogpCountdown>;
  days: Array<{
    id: number | null;
    dayNumber: number;
    dateKey: string;
    state: ReturnType<typeof deriveSogpCalendarState>;
    lessonComplete: boolean;
    prayerWatchComplete: boolean;
    lesson: {
      title: string;
      description: string | null;
      url: string;
    } | null;
  }>;
};

async function getEnrollmentCohort(userId: string) {
  const [row] = await db
    .select({
      enrollment: schema.sogpEnrollments,
      cohort: schema.sogpCohorts,
    })
    .from(schema.sogpEnrollments)
    .innerJoin(
      schema.sogpCohorts,
      eq(schema.sogpEnrollments.cohortId, schema.sogpCohorts.id),
    )
    .where(eq(schema.sogpEnrollments.userId, userId))
    .orderBy(asc(schema.sogpCohorts.startsAt))
    .limit(1);
  return row ?? null;
}

export async function getSogpDashboardAccess(userId: string) {
  const row = await getEnrollmentCohort(userId);
  return row
    ? {
        isSogpEnrolled: true,
        startsAt: row.cohort.startsAt,
      }
    : {
        isSogpEnrolled: false,
        startsAt: null,
      };
}

export async function getPreSogpJourney(
  userId: string,
  now = new Date(),
): Promise<PreSogpJourneyData | null> {
  const row = await getEnrollmentCohort(userId);
  if (!row) return null;

  const preparationStartsAt = resolvePreparationStartsAt(
    row.cohort.startsAt,
    row.cohort.preparationStartsAt,
  );
  const dateKeys = buildPreparationDateKeys(preparationStartsAt);
  const todayKey = toLagosDateKey(now);
  const [dayRows, completionRows, prayerRows] = await Promise.all([
    db
      .select({
        day: schema.sogpPreparationDays,
        resource: schema.sogpPreparationResources,
      })
      .from(schema.sogpPreparationDays)
      .leftJoin(
        schema.sogpPreparationResources,
        eq(
          schema.sogpPreparationResources.preparationDayId,
          schema.sogpPreparationDays.id,
        ),
      )
      .where(
        and(
          eq(schema.sogpPreparationDays.cohortId, row.cohort.id),
          eq(schema.sogpPreparationDays.status, "published"),
          inArray(schema.sogpPreparationDays.publishDate, dateKeys),
        ),
      )
      .orderBy(
        asc(schema.sogpPreparationDays.publishDate),
        asc(schema.sogpPreparationResources.sortOrder),
      ),
    db
      .select({ preparationDayId: schema.sogpPreparationCompletions.preparationDayId })
      .from(schema.sogpPreparationCompletions)
      .where(eq(schema.sogpPreparationCompletions.enrollmentId, row.enrollment.id)),
    db
      .select({ dateKey: schema.prayerWatchAttendance.attendedDate })
      .from(schema.prayerWatchAttendance)
      .where(
        and(
          eq(schema.prayerWatchAttendance.userId, userId),
          eq(schema.prayerWatchAttendance.session, "morning"),
          gte(schema.prayerWatchAttendance.attendedDate, dateKeys[0]!),
          lte(schema.prayerWatchAttendance.attendedDate, dateKeys.at(-1)!),
        ),
      ),
  ]);

  const completedDayIds = new Set(
    completionRows.map((item) => item.preparationDayId),
  );
  const prayerDateKeys = new Set(prayerRows.map((item) => item.dateKey));
  const publishedDays = new Map<number, (typeof dayRows)[number]["day"]>();
  const resourcesByDay = new Map<number, (typeof dayRows)[number]["resource"][]>();

  for (const item of dayRows) {
    publishedDays.set(item.day.id, item.day);
    if (item.resource) {
      resourcesByDay.set(item.day.id, [
        ...(resourcesByDay.get(item.day.id) ?? []),
        item.resource,
      ]);
    }
  }

  const dayByDate = new Map(
    [...publishedDays.values()].map((day) => [day.publishDate, day]),
  );
  const telegramUrl =
    row.cohort.telegramDiscussionUrl ??
    row.cohort.telegramChannelUrl ??
    "https://t.me/pleros_sogp";

  return {
    generatedAt: now.toISOString(),
    todayKey,
    cohort: {
      id: row.cohort.id,
      title: row.cohort.title,
      startsAt: row.cohort.startsAt.toISOString(),
      telegramUrl,
    },
    countdown: getPreSogpCountdown(preparationStartsAt, now),
    days: dateKeys.map((dateKey, index) => {
      const day = dayByDate.get(dateKey) ?? null;
      const lessonComplete = day ? completedDayIds.has(day.id) : false;
      const prayerWatchComplete = prayerDateKeys.has(dateKey);
      const resources = day ? resourcesByDay.get(day.id) ?? [] : [];
      const resource = resources.find((item) =>
        item ? item.type === "video" || item.type === "teaching" : false,
      );
      const canExposeLesson = dateKey <= todayKey && day && resource;
      return {
        id: day?.id ?? null,
        dayNumber: index + 1,
        dateKey,
        state: deriveSogpCalendarState({
          dateKey,
          todayKey,
          requirements: getPreparationRequirements({
            lessonComplete,
            prayerWatchComplete,
          }),
        }),
        lessonComplete,
        prayerWatchComplete,
        lesson: canExposeLesson
          ? {
              title: resource.title,
              description: resource.description,
              url: resource.url,
            }
          : null,
      };
    }),
  };
}

export async function setPreparationLessonComplete(input: {
  userId: string;
  preparationDayId: number;
  complete: boolean;
}) {
  const [row] = await db
    .select({
      enrollmentId: schema.sogpEnrollments.id,
      publishDate: schema.sogpPreparationDays.publishDate,
      status: schema.sogpPreparationDays.status,
    })
    .from(schema.sogpEnrollments)
    .innerJoin(
      schema.sogpPreparationDays,
      eq(schema.sogpPreparationDays.cohortId, schema.sogpEnrollments.cohortId),
    )
    .where(
      and(
        eq(schema.sogpEnrollments.userId, input.userId),
        eq(schema.sogpPreparationDays.id, input.preparationDayId),
      ),
    )
    .limit(1);
  if (!row || row.status !== "published" || row.publishDate > toLagosDateKey(new Date())) {
    throw new Error("That Pre-SOGP lesson is unavailable.");
  }

  if (input.complete) {
    await db
      .insert(schema.sogpPreparationCompletions)
      .values({
        enrollmentId: row.enrollmentId,
        preparationDayId: input.preparationDayId,
      })
      .onConflictDoNothing();
  } else {
    await db
      .delete(schema.sogpPreparationCompletions)
      .where(
        and(
          eq(schema.sogpPreparationCompletions.enrollmentId, row.enrollmentId),
          eq(
            schema.sogpPreparationCompletions.preparationDayId,
            input.preparationDayId,
          ),
        ),
      );
  }
  return { complete: input.complete };
}

export async function setSogpMorningPrayerComplete(input: {
  userId: string;
  dateKey: string;
  complete: boolean;
}) {
  const row = await getEnrollmentCohort(input.userId);
  if (!row) throw new Error("SOGP enrolment not found.");
  const preparationDates = buildPreparationDateKeys(
    resolvePreparationStartsAt(
      row.cohort.startsAt,
      row.cohort.preparationStartsAt,
    ),
  );
  if (
    !isDateWithinSogpWindow({
      dateKey: input.dateKey,
      startDateKey: preparationDates[0]!,
      endDateKey: toLagosDateKey(row.cohort.endsAt),
      todayKey: toLagosDateKey(new Date()),
    })
  ) {
    throw new Error("That Prayer Watch date is unavailable.");
  }
  if (input.complete) {
    await db
      .insert(schema.prayerWatchAttendance)
      .values({ userId: input.userId, attendedDate: input.dateKey, session: "morning" })
      .onConflictDoNothing();
  } else {
    await db
      .delete(schema.prayerWatchAttendance)
      .where(
        and(
          eq(schema.prayerWatchAttendance.userId, input.userId),
          eq(schema.prayerWatchAttendance.attendedDate, input.dateKey),
          eq(schema.prayerWatchAttendance.session, "morning"),
        ),
      );
  }
  return { complete: input.complete };
}

export async function setSogpReviewComplete(input: {
  userId: string;
  liveClassId: number;
  complete: boolean;
  source: "live" | "recording";
}) {
  const [row] = await db
    .select({
      classId: schema.sogpLiveClasses.id,
      recordingUrl: schema.sogpLiveClasses.recordingUrl,
    })
    .from(schema.sogpEnrollments)
    .innerJoin(
      schema.sogpLiveClasses,
      eq(schema.sogpLiveClasses.cohortId, schema.sogpEnrollments.cohortId),
    )
    .where(
      and(
        eq(schema.sogpEnrollments.userId, input.userId),
        eq(schema.sogpLiveClasses.id, input.liveClassId),
        eq(schema.sogpLiveClasses.isRequired, true),
      ),
    )
    .limit(1);
  if (!row || (input.source === "recording" && !row.recordingUrl)) {
    throw new Error("That SOGP review is unavailable.");
  }
  if (input.complete) {
    await db
      .insert(schema.sogpLiveClassAttendance)
      .values({
        liveClassId: input.liveClassId,
        userId: input.userId,
        completionSource: input.source,
      })
      .onConflictDoUpdate({
        target: [
          schema.sogpLiveClassAttendance.liveClassId,
          schema.sogpLiveClassAttendance.userId,
        ],
        set: { completionSource: input.source, attendedAt: new Date() },
      });
  } else {
    await db
      .delete(schema.sogpLiveClassAttendance)
      .where(
        and(
          eq(schema.sogpLiveClassAttendance.liveClassId, input.liveClassId),
          eq(schema.sogpLiveClassAttendance.userId, input.userId),
        ),
      );
  }
  return { complete: input.complete, source: input.source };
}

export type SogpJourneyData = {
  generatedAt: string;
  todayKey: string;
  enrollment: { name: string };
  cohort: {
    title: string;
    startsAt: string;
    endsAt: string;
    telegramUrl: string;
  };
  levels: Array<{
    level: SogpCurriculumLevel;
    title: string;
    description: string;
    status: SogpLevelStatus;
    completed: number;
    total: number;
    unlocksAt: string;
  }>;
  days: Array<{
    dateKey: string;
    kind: "weekday" | "weekend" | "review";
    state: ReturnType<typeof deriveSogpCalendarState>;
    prayerWatchComplete: boolean;
    track: null | {
      id: number;
      dayNumber: number;
      curriculumLevel: SogpCurriculumLevel;
      levelPosition: number;
      title: string;
      audioUrl: string | null;
      assessmentComplete: boolean;
      assessmentHref: string;
      reviewState: string | null;
      accessible: boolean;
      lockedReason: string | null;
    };
    review: null | {
      id: number;
      title: string;
      startsAt: string;
      endsAt: string;
      liveUrl: string | null;
      recordingUrl: string | null;
      complete: boolean;
      completionSource: "live" | "recording" | null;
    };
  }>;
  progress: {
    coreCompleted: number;
    coreTotal: number;
    prayerCompleted: number;
    prayerTotal: number;
    prayerPercent: number;
    reviewsCompleted: number;
    reviewsTotal: number;
    eligible: boolean;
  };
};

export async function getActiveSogpJourney(
  userId: string,
  now = new Date(),
): Promise<SogpJourneyData | null> {
  const dashboard = await getSogpDashboardData(userId);
  if (!dashboard) return null;

  const dateKeys = buildSogpDateKeys(
    dashboard.cohort.startsAt,
    dashboard.cohort.endsAt,
  );
  const todayKey = toLagosDateKey(now);
  const lessonIds = dashboard.tracks.map((track) => track.lesson.id);
  const requiredReviewIds = dashboard.liveClasses
    .filter((item) => item.isRequired && item.status !== "cancelled")
    .map((item) => item.id);
  const [prayerRows, submissionRows, reviewRows] = await Promise.all([
    db
      .select({ dateKey: schema.prayerWatchAttendance.attendedDate })
      .from(schema.prayerWatchAttendance)
      .where(
        and(
          eq(schema.prayerWatchAttendance.userId, userId),
          eq(schema.prayerWatchAttendance.session, "morning"),
          gte(schema.prayerWatchAttendance.attendedDate, dateKeys[0]!),
          lte(schema.prayerWatchAttendance.attendedDate, dateKeys.at(-1)!),
        ),
      ),
    lessonIds.length
      ? db
          .select({
            lessonId: schema.writtenSubmissions.lessonId,
            status: schema.writtenSubmissions.status,
          })
          .from(schema.writtenSubmissions)
          .where(
            and(
              eq(schema.writtenSubmissions.userId, userId),
              inArray(schema.writtenSubmissions.lessonId, lessonIds),
            ),
          )
      : Promise.resolve([]),
    requiredReviewIds.length
      ? db
          .select({
            liveClassId: schema.sogpLiveClassAttendance.liveClassId,
            completionSource: schema.sogpLiveClassAttendance.completionSource,
          })
          .from(schema.sogpLiveClassAttendance)
          .where(
            and(
              eq(schema.sogpLiveClassAttendance.userId, userId),
              inArray(schema.sogpLiveClassAttendance.liveClassId, requiredReviewIds),
            ),
          )
      : Promise.resolve([]),
  ]);

  const prayerDates = new Set(prayerRows.map((row) => row.dateKey));
  const submissions = new Map(
    submissionRows.map((row) => [row.lessonId, row.status]),
  );
  const reviewCompletion = new Map(
    reviewRows.map((row) => [row.liveClassId, row.completionSource]),
  );
  const requiredTracks = dashboard.tracks.filter(
    (track) => track.isRequired && track.dayNumber !== null,
  );
  const assessmentCompleteByTrack = new Map(requiredTracks.map((track) => {
    const writtenStatus = submissions.get(track.lesson.id);
    const writtenComplete =
      !track.lesson.responsePrompt || (writtenStatus !== undefined && writtenStatus !== "draft");
    return [track.id, track.progress.quizPassed && writtenComplete] as const;
  }));
  const coreCompleted = [...assessmentCompleteByTrack.values()].filter(Boolean).length;
  const levelSummaries = summarizeSogpLevels({
    tracks: requiredTracks.map((track) => ({
      curriculumLevel: track.curriculumLevel,
      assessmentComplete: assessmentCompleteByTrack.get(track.id) ?? false,
    })),
    startsAt: dashboard.cohort.startsAt,
    now,
  });
  const requiredReviews = dashboard.liveClasses.filter(
    (item) => item.isRequired && item.status !== "cancelled",
  );
  const eligibility = calculateSogpEligibility({
    completedTracks: coreCompleted,
    totalTracks: requiredTracks.length,
    prayerDaysAttended: prayerDates.size,
    prayerDaysAvailable: dateKeys.length,
    liveClassesAttended: reviewCompletion.size,
    policy: dashboard.cohort.assessmentPolicy,
  });

  const days = dateKeys.map((dateKey) => {
    const track = requiredTracks.find(
      (item) => toLagosDateKey(item.releaseAt) === dateKey,
    );
    const review = requiredReviews.find(
      (item) => toLagosDateKey(item.startsAt) === dateKey,
    );
    const writtenStatus = track ? submissions.get(track.lesson.id) : undefined;
    const assessmentComplete = track
      ? assessmentCompleteByTrack.get(track.id) ?? false
      : false;
    const prayerWatchComplete = prayerDates.has(dateKey);
    const completedReviewSource = review
      ? reviewCompletion.get(review.id) ?? null
      : null;
    const kind = review
      ? ("review" as const)
      : track
        ? ("weekday" as const)
        : ("weekend" as const);
    const requirements =
      kind === "weekday"
        ? getSogpDayRequirements({ kind, prayerWatchComplete, assessmentComplete })
        : kind === "review"
          ? getSogpDayRequirements({
              kind,
              prayerWatchComplete,
              reviewComplete: Boolean(completedReviewSource),
            })
          : getSogpDayRequirements({ kind, prayerWatchComplete });
    const curriculumLevel = track
      ? (track.curriculumLevel as SogpCurriculumLevel)
      : null;
    const previousLevelComplete = curriculumLevel
      ? curriculumLevel === 1 ||
        levelSummaries[curriculumLevel - 2]?.status === "complete"
      : false;
    const accessible = track && curriculumLevel
      ? canAccessSogpTrack({
          releaseAt: track.releaseAt,
          curriculumLevel,
          previousLevelComplete,
          now,
        })
      : false;
    const lockedReason = !track || accessible
      ? null
      : track.releaseAt.getTime() > now.getTime()
        ? "This track opens on its scheduled day."
        : `Complete all six Level ${curriculumLevel! - 1} assessments first.`;

    return {
      dateKey,
      kind,
      state: deriveSogpCalendarState({ dateKey, todayKey, requirements }),
      prayerWatchComplete,
      track: track
        ? {
            id: track.id,
            dayNumber: track.dayNumber!,
            curriculumLevel: curriculumLevel!,
            levelPosition: ((track.curriculumOrder - 1) % 6) + 1,
            title: track.lesson.title,
            audioUrl: track.lesson.audioUrl,
            assessmentComplete,
            assessmentHref: track.progress.quizPassed
              ? `/dashboard/sogp/course/day/${track.dayNumber}/response`
              : `/dashboard/sogp/course/day/${track.dayNumber}/quiz`,
            reviewState: writtenStatus ?? null,
            accessible,
            lockedReason,
          }
        : null,
      review: review
        ? {
            id: review.id,
            title: review.title,
            startsAt: review.startsAt.toISOString(),
            endsAt: review.endsAt.toISOString(),
            liveUrl: review.youtubeLiveUrl,
            recordingUrl: review.recordingUrl,
            complete: Boolean(completedReviewSource),
            completionSource: completedReviewSource,
          }
        : null,
    };
  });

  return {
    generatedAt: now.toISOString(),
    todayKey,
    enrollment: { name: dashboard.enrollment.name },
    cohort: {
      title: dashboard.cohort.title,
      startsAt: dashboard.cohort.startsAt.toISOString(),
      endsAt: dashboard.cohort.endsAt.toISOString(),
      telegramUrl:
        dashboard.cohort.telegramDiscussionUrl ??
        dashboard.cohort.telegramChannelUrl ??
        "https://t.me/pleros_sogp",
    },
    levels: levelSummaries.map((summary) => {
      const definition = getSogpLevel(summary.level);
      return {
        ...summary,
        title: definition.title,
        description: definition.description,
        unlocksAt: summary.unlocksAt.toISOString(),
      };
    }),
    days,
    progress: {
      coreCompleted,
      coreTotal: requiredTracks.length,
      prayerCompleted: prayerDates.size,
      prayerTotal: dateKeys.length,
      prayerPercent: eligibility.prayerPercent,
      reviewsCompleted: reviewCompletion.size,
      reviewsTotal: requiredReviews.length,
      eligible: eligibility.eligible,
    },
  };
}

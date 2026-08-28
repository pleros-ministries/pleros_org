import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  buildPreparationDateKeys,
  deriveSogpCalendarState,
  getSogpCountdown,
} from "@/lib/sogp/calendar";
import { toLagosDateKey } from "@/lib/sogp/formation-progress";
import { getPreparationRequirements, isDateWithinSogpWindow } from "@/lib/sogp/journey";

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
  countdown: ReturnType<typeof getSogpCountdown>;
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

export async function getPreSogpJourney(
  userId: string,
  now = new Date(),
): Promise<PreSogpJourneyData | null> {
  const row = await getEnrollmentCohort(userId);
  if (!row) return null;

  const dateKeys = buildPreparationDateKeys(row.cohort.startsAt);
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
    countdown: getSogpCountdown(row.cohort.startsAt, now),
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
  const preparationDates = buildPreparationDateKeys(row.cohort.startsAt);
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

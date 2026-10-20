import { and, asc, eq, gte, lte } from "drizzle-orm";

import { db } from "@/lib/db";

import * as schema from "../schema";

function getMonthDateRange(year: number, month: number): { start: string; end: string } {
  const monthPart = `${month + 1}`.padStart(2, "0");
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return {
    start: `${year}-${monthPart}-01`,
    end: `${year}-${monthPart}-${`${daysInMonth}`.padStart(2, "0")}`,
  };
}

export async function getPrayerWatchAttendanceForMonth(
  userId: string,
  year: number,
  month: number,
): Promise<Array<{ dateKey: string; session: "unspecified" | "morning" | "afternoon" | "evening" }>> {
  const { start, end } = getMonthDateRange(year, month);

  const rows = await db
    .select({
      attendedDate: schema.prayerWatchAttendance.attendedDate,
      session: schema.prayerWatchAttendance.session,
    })
    .from(schema.prayerWatchAttendance)
    .where(
      and(
        eq(schema.prayerWatchAttendance.userId, userId),
        gte(schema.prayerWatchAttendance.attendedDate, start),
        lte(schema.prayerWatchAttendance.attendedDate, end),
      ),
    );

  return rows.map((row) => ({ dateKey: row.attendedDate, session: row.session }));
}

/** Dates with a logged 5:30 am watch, the session the daily dashboards tick. */
export async function getMorningPrayerWatchDateKeys(
  userId: string,
  startKey: string,
  endKey: string,
): Promise<string[]> {
  const rows = await db
    .select({ attendedDate: schema.prayerWatchAttendance.attendedDate })
    .from(schema.prayerWatchAttendance)
    .where(
      and(
        eq(schema.prayerWatchAttendance.userId, userId),
        eq(schema.prayerWatchAttendance.session, "morning"),
        gte(schema.prayerWatchAttendance.attendedDate, startKey),
        lte(schema.prayerWatchAttendance.attendedDate, endKey),
      ),
    );

  return rows.map((row) => row.attendedDate);
}

export async function logPrayerWatchAttendance(
  userId: string,
  dateKey: string,
  session: "morning" | "afternoon" | "evening" | "unspecified",
) {
  const [row] = await db
    .insert(schema.prayerWatchAttendance)
    .values({ userId, attendedDate: dateKey, session })
    .onConflictDoNothing({
      target: [
        schema.prayerWatchAttendance.userId,
        schema.prayerWatchAttendance.attendedDate,
        schema.prayerWatchAttendance.session,
      ],
    })
    .returning();

  return row ?? null;
}

export async function removePrayerWatchAttendance(
  userId: string,
  dateKey: string,
  session: "morning" | "afternoon" | "evening" | "unspecified",
) {
  await db
    .delete(schema.prayerWatchAttendance)
    .where(
      and(
        eq(schema.prayerWatchAttendance.userId, userId),
        eq(schema.prayerWatchAttendance.attendedDate, dateKey),
        eq(schema.prayerWatchAttendance.session, session),
      ),
    );
}

/**
 * The times someone actually prayed under "Another time" (migration 0071),
 * as "HH:MM", earliest first. The day's `unspecified` attendance row follows
 * them: it exists while at least one time does.
 */
export async function listPrayerOtherTimes(userId: string, dateKey: string): Promise<string[]> {
  const rows = await db
    .select({ prayedAt: schema.prayerWatchOtherTimes.prayedAt })
    .from(schema.prayerWatchOtherTimes)
    .where(and(eq(schema.prayerWatchOtherTimes.userId, userId), eq(schema.prayerWatchOtherTimes.prayedDate, dateKey)))
    .orderBy(asc(schema.prayerWatchOtherTimes.prayedAt));
  return rows.map(row => row.prayedAt.slice(0, 5));
}

export async function addPrayerOtherTime(userId: string, dateKey: string, prayedAt: string) {
  // Both writes are idempotent, so a retry after a partial failure lands in the same place.
  await db.insert(schema.prayerWatchOtherTimes).values({ userId, prayedDate: dateKey, prayedAt }).onConflictDoNothing();
  await logPrayerWatchAttendance(userId, dateKey, "unspecified");
}

export async function removePrayerOtherTime(userId: string, dateKey: string, prayedAt: string) {
  await db.delete(schema.prayerWatchOtherTimes).where(and(
    eq(schema.prayerWatchOtherTimes.userId, userId),
    eq(schema.prayerWatchOtherTimes.prayedDate, dateKey),
    eq(schema.prayerWatchOtherTimes.prayedAt, prayedAt),
  ));
  const [left] = await db.select({ id: schema.prayerWatchOtherTimes.id }).from(schema.prayerWatchOtherTimes)
    .where(and(eq(schema.prayerWatchOtherTimes.userId, userId), eq(schema.prayerWatchOtherTimes.prayedDate, dateKey))).limit(1);
  if (!left) await removePrayerWatchAttendance(userId, dateKey, "unspecified");
}

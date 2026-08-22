import { and, eq, gte, lte } from "drizzle-orm";

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
): Promise<string[]> {
  const { start, end } = getMonthDateRange(year, month);

  const rows = await db
    .select({ attendedDate: schema.prayerWatchAttendance.attendedDate })
    .from(schema.prayerWatchAttendance)
    .where(
      and(
        eq(schema.prayerWatchAttendance.userId, userId),
        gte(schema.prayerWatchAttendance.attendedDate, start),
        lte(schema.prayerWatchAttendance.attendedDate, end),
      ),
    );

  return rows.map((row) => row.attendedDate);
}

export async function logPrayerWatchAttendance(userId: string, dateKey: string) {
  const [row] = await db
    .insert(schema.prayerWatchAttendance)
    .values({ userId, attendedDate: dateKey })
    .onConflictDoNothing({
      target: [schema.prayerWatchAttendance.userId, schema.prayerWatchAttendance.attendedDate],
    })
    .returning();

  return row ?? null;
}

export async function removePrayerWatchAttendance(userId: string, dateKey: string) {
  await db
    .delete(schema.prayerWatchAttendance)
    .where(
      and(
        eq(schema.prayerWatchAttendance.userId, userId),
        eq(schema.prayerWatchAttendance.attendedDate, dateKey),
      ),
    );
}

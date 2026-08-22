import { and, eq, gte, lte } from "drizzle-orm";

import { db } from "@/lib/db";

import * as schema from "../schema";

export type BibleReadingLog = {
  dateKey: string;
  chaptersRead: number;
  currentBook: string;
  currentChapter: number;
};

function getMonthDateRange(year: number, month: number): { start: string; end: string } {
  const monthPart = `${month + 1}`.padStart(2, "0");
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return {
    start: `${year}-${monthPart}-01`,
    end: `${year}-${monthPart}-${`${daysInMonth}`.padStart(2, "0")}`,
  };
}

export async function getBibleReadingLogsForMonth(
  userId: string,
  year: number,
  month: number,
): Promise<BibleReadingLog[]> {
  const { start, end } = getMonthDateRange(year, month);

  const rows = await db
    .select({
      dateKey: schema.bibleReadingLogs.readingDate,
      chaptersRead: schema.bibleReadingLogs.chaptersRead,
      currentBook: schema.bibleReadingLogs.currentBook,
      currentChapter: schema.bibleReadingLogs.currentChapter,
    })
    .from(schema.bibleReadingLogs)
    .where(
      and(
        eq(schema.bibleReadingLogs.userId, userId),
        gte(schema.bibleReadingLogs.readingDate, start),
        lte(schema.bibleReadingLogs.readingDate, end),
      ),
    );

  return rows;
}

export async function upsertBibleReadingLog({
  userId,
  dateKey,
  chaptersRead,
  currentBook,
  currentChapter,
}: BibleReadingLog & { userId: string }) {
  const [row] = await db
    .insert(schema.bibleReadingLogs)
    .values({
      userId,
      readingDate: dateKey,
      chaptersRead,
      currentBook,
      currentChapter,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [schema.bibleReadingLogs.userId, schema.bibleReadingLogs.readingDate],
      set: {
        chaptersRead,
        currentBook,
        currentChapter,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row ?? null;
}

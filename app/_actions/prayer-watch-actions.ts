"use server";

import { revalidatePath } from "next/cache";

import { getBibleBook } from "@/lib/bible-reading";
import { getDashboardActionSession } from "@/lib/dashboard-action-session";
import { upsertBibleReadingLog } from "@/lib/db/queries/bible-reading";
import {
  addPrayerOtherTime,
  logPrayerWatchAttendance,
  removePrayerOtherTime,
  removePrayerWatchAttendance,
} from "@/lib/db/queries/prayer-watch";
import { isValidPrayerWatchDateKey, toDateKey } from "@/lib/prayer-watch";
import { isLoggablePrayerSession } from "@/lib/prayer-watch-session";

export type PrayerWatchActionState = {
  error: string | null;
};

export async function togglePrayerWatchAttendanceAction(
  _previousState: PrayerWatchActionState,
  formData: FormData,
): Promise<PrayerWatchActionState> {
  const session = await getDashboardActionSession();

  if (!session) {
    return { error: "You need to be signed in to log Prayer Watch attendance." };
  }

  const dateKey = String(formData.get("date") ?? "");
  const todayKey = toDateKey(new Date());

  if (!isValidPrayerWatchDateKey(dateKey, todayKey)) {
    return { error: "That date can't be logged." };
  }

  const wasAttended = formData.get("attended") === "true";
  const sessionId = String(formData.get("session") ?? "");

  if (!isLoggablePrayerSession(sessionId)) {
    return { error: "Choose the Prayer Watch session you attended." };
  }

  if (wasAttended) {
    await removePrayerWatchAttendance(session.user.id, dateKey, sessionId);
  } else {
    await logPrayerWatchAttendance(session.user.id, dateKey, sessionId);
  }

  revalidatePath("/dashboard/prayer-watch");
  revalidatePath("/dashboard/community/report");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/church");
  revalidatePath("/dashboard/sogp");
  revalidatePath("/dashboard/podcast");
  return { error: null };
}

export type BibleReadingActionState = {
  error: string | null;
};

export async function saveBibleReadingLogAction(
  _previousState: BibleReadingActionState,
  formData: FormData,
): Promise<BibleReadingActionState> {
  const session = await getDashboardActionSession();

  if (!session) {
    return { error: "You need to be signed in to log Bible reading." };
  }

  const dateKey = String(formData.get("date") ?? "");
  const todayKey = toDateKey(new Date());

  if (!isValidPrayerWatchDateKey(dateKey, todayKey)) {
    return { error: "That date can't be logged." };
  }

  const chaptersRead = Number(formData.get("chaptersRead"));
  const currentBook = String(formData.get("currentBook") ?? "");
  const currentChapter = Number(formData.get("currentChapter"));
  const book = getBibleBook(currentBook);

  if (!Number.isInteger(chaptersRead) || chaptersRead < 1 || chaptersRead > 150) {
    return { error: "Enter the number of chapters you read." };
  }

  if (!book) {
    return { error: "Choose the Bible book you are currently reading." };
  }

  if (
    !Number.isInteger(currentChapter) ||
    currentChapter < 1 ||
    currentChapter > book.chapters
  ) {
    return { error: `Enter a chapter from 1 to ${book.chapters} for ${book.name}.` };
  }

  await upsertBibleReadingLog({
    userId: session.user.id,
    dateKey,
    chaptersRead,
    currentBook: book.name,
    currentChapter,
  });

  revalidatePath("/dashboard/prayer-watch");
  revalidatePath("/dashboard/community/report");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/church");
  return { error: null };
}

/**
 * Adds or removes a time someone actually prayed under "Another time"
 * (user request, 20 October). Same dates as Prayer Watch; the time is HH:MM.
 */
export async function savePrayerOtherTimeAction(input: { date: string; time: string; remove?: boolean }): Promise<PrayerWatchActionState> {
  const session = await getDashboardActionSession();
  if (!session) return { error: "You need to be signed in to log prayer." };
  if (!isValidPrayerWatchDateKey(String(input.date ?? ""), toDateKey(new Date()))) return { error: "That date can't be logged." };
  const time = String(input.time ?? "");
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return { error: "Choose the time you prayed." };
  if (input.remove) await removePrayerOtherTime(session.user.id, input.date, time);
  else await addPrayerOtherTime(session.user.id, input.date, time);
  revalidatePath("/dashboard/prayer-watch");
  revalidatePath("/dashboard/community/report");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sogp");
  return { error: null };
}


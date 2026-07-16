"use server";

import { revalidatePath } from "next/cache";

import { getAppSession } from "@/lib/app-session";
import { getBibleBook } from "@/lib/bible-reading";
import { upsertBibleReadingLog } from "@/lib/db/queries/bible-reading";
import {
  logPrayerWatchAttendance,
  removePrayerWatchAttendance,
} from "@/lib/db/queries/prayer-watch";
import { isValidPrayerWatchDateKey, toDateKey } from "@/lib/prayer-watch";

export type PrayerWatchActionState = {
  error: string | null;
};

export async function togglePrayerWatchAttendanceAction(
  _previousState: PrayerWatchActionState,
  formData: FormData,
): Promise<PrayerWatchActionState> {
  const session = await getAppSession();

  if (!session) {
    return { error: "You need to be signed in to log Prayer Watch attendance." };
  }

  const dateKey = String(formData.get("date") ?? "");
  const todayKey = toDateKey(new Date());

  if (!isValidPrayerWatchDateKey(dateKey, todayKey)) {
    return { error: "That date can't be logged." };
  }

  const wasAttended = formData.get("attended") === "true";

  if (wasAttended) {
    await removePrayerWatchAttendance(session.user.id, dateKey);
  } else {
    await logPrayerWatchAttendance(session.user.id, dateKey);
  }

  revalidatePath("/dashboard/prayer-watch");
  return { error: null };
}

export type BibleReadingActionState = {
  error: string | null;
};

export async function saveBibleReadingLogAction(
  _previousState: BibleReadingActionState,
  formData: FormData,
): Promise<BibleReadingActionState> {
  const session = await getAppSession();

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
  return { error: null };
}

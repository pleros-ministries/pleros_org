"use server";

import { revalidatePath } from "next/cache";

import { getAppSession } from "@/lib/app-session";
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

import { getSogpDayData } from "@/lib/db/queries/sogp";
import { canAccessSogpDay } from "./day-access";

export async function requireSogpDayAccess(userId: string, dayNumber: number) {
  const data = await getSogpDayData(userId, dayNumber);
  if (
    !data ||
    data.track.lesson.status !== "published" ||
    !canAccessSogpDay({
      learnerState: data.dashboard.learnerState,
      now: new Date(),
      releaseAt: data.track.releaseAt,
    })
  ) {
    throw new Error("SOGP day is unavailable.");
  }
  return data;
}

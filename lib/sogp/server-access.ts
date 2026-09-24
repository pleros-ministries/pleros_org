import { getSogpDayData } from "@/lib/db/queries/sogp";

export async function requireSogpDayAccess(userId: string, dayNumber: number) {
  const data = await getSogpDayData(userId, dayNumber);
  if (
    !data ||
    data.track.lesson.status !== "published" ||
    data.dashboard.learnerState === "withdrawn" ||
    !data.track.accessible
  ) {
    throw new Error("SOGP day is unavailable.");
  }
  return data;
}

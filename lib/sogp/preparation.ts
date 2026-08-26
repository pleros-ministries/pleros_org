import { toLagosDateKey } from "./formation-progress";
import type { SogpPreparationDay } from "./types";

export function partitionSogpPreparationDays(
  days: SogpPreparationDay[],
  now: Date,
) {
  const todayKey = toLagosDateKey(now);
  const visible = days
    .filter(
      (day) => day.status === "published" && day.publishDate <= todayKey,
    )
    .sort((left, right) => right.publishDate.localeCompare(left.publishDate));

  return {
    today: visible.find((day) => day.publishDate === todayKey) ?? null,
    previous: visible.filter((day) => day.publishDate < todayKey),
  };
}

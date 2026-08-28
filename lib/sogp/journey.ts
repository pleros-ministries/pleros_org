export function getPreparationRequirements(input: {
  lessonComplete: boolean;
  prayerWatchComplete: boolean;
}) {
  return [input.lessonComplete, input.prayerWatchComplete];
}

type SogpDayRequirementInput =
  | {
      kind: "weekday";
      prayerWatchComplete: boolean;
      assessmentComplete: boolean;
    }
  | {
      kind: "weekend";
      prayerWatchComplete: boolean;
    }
  | {
      kind: "review";
      prayerWatchComplete: boolean;
      reviewComplete: boolean;
    };

export function getSogpDayRequirements(input: SogpDayRequirementInput) {
  if (input.kind === "weekday") {
    return [input.prayerWatchComplete, input.assessmentComplete];
  }
  if (input.kind === "review") {
    return [input.prayerWatchComplete, input.reviewComplete];
  }
  return [input.prayerWatchComplete];
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRealDateKey(value: string) {
  if (!DATE_KEY_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month! - 1 &&
    date.getUTCDate() === day
  );
}

export function isDateWithinSogpWindow({
  dateKey,
  startDateKey,
  endDateKey,
  todayKey,
}: {
  dateKey: string;
  startDateKey: string;
  endDateKey: string;
  todayKey: string;
}) {
  return (
    isRealDateKey(dateKey) &&
    dateKey >= startDateKey &&
    dateKey <= endDateKey &&
    dateKey <= todayKey
  );
}

export function isReviewCompletionSource(
  value: unknown,
): value is "live" | "recording" {
  return value === "live" || value === "recording";
}

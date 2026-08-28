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

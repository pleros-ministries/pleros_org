import type {
  SogpEligibilityInput,
  SogpEligibilityResult,
} from "./types";

function percent(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.round((Math.max(part, 0) / whole) * 100);
}

export function calculateSogpEligibility(
  input: SogpEligibilityInput,
): SogpEligibilityResult {
  const trackPercent = percent(input.completedTracks, input.totalTracks);
  const prayerPercent = percent(
    input.prayerDaysAttended,
    input.prayerDaysAvailable,
  );
  const unmet: SogpEligibilityResult["unmet"] = [];

  if (trackPercent < input.policy.requiredTrackCompletionPercent) {
    unmet.push("tracks");
  }

  if (prayerPercent < input.policy.requiredPrayerWatchPercent) {
    unmet.push("prayer_watch");
  }

  if (input.liveClassesAttended < input.policy.requiredLiveClassCount) {
    unmet.push("live_classes");
  }

  return {
    eligible: unmet.length === 0,
    trackPercent,
    prayerPercent,
    unmet,
  };
}

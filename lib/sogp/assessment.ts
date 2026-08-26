import type {
  SogpAssessmentPolicy,
  SogpEligibilityInput,
  SogpEligibilityResult,
} from "./types";
import { DEFAULT_SOGP_ASSESSMENT_POLICY } from "./types";

function percent(part: number, whole: number) {
  if (whole <= 0) return 0;
  return Math.round((Math.max(part, 0) / whole) * 100);
}

export function summarizeSogpTrackCompletion(
  tracks: Array<{ isRequired: boolean; completed: boolean }>,
) {
  const required = tracks.filter((track) => track.isRequired);
  const optional = tracks.filter((track) => !track.isRequired);
  return {
    requiredCompleted: required.filter((track) => track.completed).length,
    requiredTotal: required.length,
    optionalCompleted: optional.filter((track) => track.completed).length,
    optionalTotal: optional.length,
  };
}

export function calculateSogpEligibility(
  input: SogpEligibilityInput,
): SogpEligibilityResult {
  const trackPercent = percent(input.completedTracks, input.totalTracks);
  const prayerPercent = percent(
    input.prayerDaysAttended,
    input.prayerDaysAvailable,
  );
  const podcastPercent = percent(
    input.podcastDaysLogged,
    input.podcastDaysAvailable,
  );
  const unmet: SogpEligibilityResult["unmet"] = [];

  if (trackPercent < input.policy.requiredTrackCompletionPercent) {
    unmet.push("tracks");
  }

  if (prayerPercent < input.policy.requiredPrayerWatchPercent) {
    unmet.push("prayer_watch");
  }

  if (podcastPercent < input.policy.requiredPodcastDailyPercent) {
    unmet.push("podcast");
  }

  if (input.liveClassesAttended < input.policy.requiredLiveClassCount) {
    unmet.push("live_classes");
  }

  return {
    eligible: unmet.length === 0,
    trackPercent,
    prayerPercent,
    podcastPercent,
    unmet,
  };
}

export function normalizeSogpAssessmentPolicy(
  policy: Partial<SogpAssessmentPolicy> | null | undefined,
) {
  return { ...DEFAULT_SOGP_ASSESSMENT_POLICY, ...policy };
}

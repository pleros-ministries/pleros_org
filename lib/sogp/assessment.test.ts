import { describe, expect, test } from "vitest";

import {
  calculateSogpEligibility,
  summarizeSogpTrackCompletion,
} from "./assessment";

describe("calculateSogpEligibility", () => {
  test("passes when every configured requirement is met", () => {
    expect(
      calculateSogpEligibility({
        completedTracks: 20,
        totalTracks: 20,
        prayerDaysAttended: 23,
        prayerDaysAvailable: 28,
        podcastDaysLogged: 28,
        podcastDaysAvailable: 28,
        liveClassesAttended: 3,
        policy: {
          requiredTrackCompletionPercent: 100,
          requiredPrayerWatchPercent: 80,
          requiredPodcastDailyPercent: 100,
          requiredLiveClassCount: 3,
        },
      }),
    ).toEqual({
      eligible: true,
      trackPercent: 100,
      prayerPercent: 82,
      podcastPercent: 100,
      unmet: [],
    });
  });

  test("reports every unmet requirement in stable order", () => {
    expect(
      calculateSogpEligibility({
        completedTracks: 19,
        totalTracks: 20,
        prayerDaysAttended: 10,
        prayerDaysAvailable: 28,
        podcastDaysLogged: 20,
        podcastDaysAvailable: 28,
        liveClassesAttended: 1,
        policy: {
          requiredTrackCompletionPercent: 100,
          requiredPrayerWatchPercent: 80,
          requiredPodcastDailyPercent: 100,
          requiredLiveClassCount: 3,
        },
      }).unmet,
    ).toEqual(["tracks", "prayer_watch", "podcast", "live_classes"]);
  });

  test("handles an unavailable denominator", () => {
    const result = calculateSogpEligibility({
      completedTracks: 0,
      totalTracks: 0,
      prayerDaysAttended: 0,
      prayerDaysAvailable: 0,
      podcastDaysLogged: 0,
      podcastDaysAvailable: 0,
      liveClassesAttended: 0,
      policy: {
        requiredTrackCompletionPercent: 100,
        requiredPrayerWatchPercent: 80,
        requiredPodcastDailyPercent: 100,
        requiredLiveClassCount: 0,
      },
    });

    expect(result.trackPercent).toBe(0);
    expect(result.prayerPercent).toBe(0);
    expect(result.podcastPercent).toBe(0);
  });

  test("counts only required tracks towards certification", () => {
    expect(
      summarizeSogpTrackCompletion([
        { isRequired: true, completed: true },
        { isRequired: true, completed: false },
        { isRequired: false, completed: true },
        { isRequired: false, completed: false },
      ]),
    ).toEqual({
      requiredCompleted: 1,
      requiredTotal: 2,
      optionalCompleted: 1,
      optionalTotal: 2,
    });
  });
});

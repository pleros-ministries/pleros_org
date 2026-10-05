import { describe, expect, test } from "vitest";

import type { RssEpisode } from "./anchor-rss";
import {
  buildPodcastDays,
  episodeDateKey,
  getPodcastCalendarWindow,
  indexPodcastEpisodesByDay,
  summarisePodcastProgress,
} from "./podcast-journey";

function episode(guid: string, pubDate: string): RssEpisode {
  return {
    guid,
    title: `Episode ${guid}`,
    link: "https://example.com",
    audioUrl: "https://example.com/audio.mp3",
    duration: "00:15:00",
    pubDate,
    isoDate: new Date(pubDate).toISOString().slice(0, 10),
    imageUrl: "",
    description: "",
    episodeNumber: null,
  };
}

// 5 October 2026 is a Monday; the 4th is a Sunday with no release.
const episodes = [
  episode("mon", "Mon, 05 Oct 2026 05:00:00 GMT"),
  episode("sat", "Sat, 03 Oct 2026 06:55:49 GMT"),
  episode("fri", "Fri, 02 Oct 2026 04:00:00 GMT"),
  episode("sep", "Wed, 30 Sep 2026 05:19:10 GMT"),
];

describe("podcast daily view", () => {
  test("dates an episode by its Lagos release day", () => {
    expect(episodeDateKey(episode("late", "Fri, 02 Oct 2026 23:30:00 GMT"))).toBe(
      "2026-10-03",
    );
    expect(
      episodeDateKey({ pubDate: "not a date", isoDate: "2026-10-02" }),
    ).toBe("2026-10-02");
  });

  test("opens the calendar at the latest of last month, launch and join date", () => {
    expect(
      getPodcastCalendarWindow({ todayKey: "2026-10-20", launchKey: null }),
    ).toEqual({ startKey: "2026-09-01", endKey: "2026-10-31" });
    expect(
      getPodcastCalendarWindow({
        todayKey: "2026-10-20",
        launchKey: "2026-10-05",
        joinedKey: "2026-08-01",
      }).startKey,
    ).toBe("2026-10-05");
    expect(
      getPodcastCalendarWindow({
        todayKey: "2026-10-20",
        launchKey: "2026-10-05",
        joinedKey: "2026-10-12",
      }).startKey,
    ).toBe("2026-10-12");
    expect(
      getPodcastCalendarWindow({ todayKey: "2026-01-15", launchKey: null }),
    ).toEqual({ startKey: "2025-12-01", endKey: "2026-01-31" });
  });

  test("never opens the calendar after today", () => {
    expect(
      getPodcastCalendarWindow({
        todayKey: "2026-10-20",
        launchKey: null,
        joinedKey: "2026-10-21",
      }).startKey,
    ).toBe("2026-10-20");
  });

  test("keeps the later release when two episodes share a day", () => {
    const byDay = indexPodcastEpisodesByDay(
      [
        episode("early", "Mon, 05 Oct 2026 05:00:00 GMT"),
        episode("later", "Mon, 05 Oct 2026 09:00:00 GMT"),
      ],
      "2026-10-01",
      "2026-10-31",
    );

    expect(byDay.get("2026-10-05")?.guid).toBe("later");
    expect(byDay.size).toBe(1);
  });

  test("builds each day from the episode released then and the morning watch", () => {
    const days = buildPodcastDays({
      episodes,
      listenedGuids: new Set(["fri", "mon"]),
      prayerDateKeys: new Set(["2026-10-02", "2026-10-04"]),
      todayKey: "2026-10-05",
      startKey: "2026-10-02",
      endKey: "2026-10-06",
    });

    expect(days.map((day) => [day.dateKey, day.episode?.guid ?? null, day.state])).toEqual([
      ["2026-10-02", "fri", "complete"],
      ["2026-10-03", "sat", "missed"],
      // Sunday: Prayer Watch is the only requirement.
      ["2026-10-04", null, "complete"],
      ["2026-10-05", "mon", "current"],
      ["2026-10-06", null, "future"],
    ]);
    expect(days[3]).toMatchObject({
      episodeListened: true,
      prayerWatchComplete: false,
    });
  });

  test("summarises this month separately from the whole catalogue", () => {
    expect(
      summarisePodcastProgress({
        episodes,
        listenedGuids: new Set(["fri", "sep", "removed-from-feed"]),
        prayerDateKeys: new Set(["2026-09-30", "2026-10-02", "2026-10-04"]),
        todayKey: "2026-10-05",
      }),
    ).toEqual({
      monthEpisodesListened: 1,
      monthEpisodesTotal: 3,
      prayerDays: 2,
      prayerDaysAvailable: 5,
      prayerPercent: 40,
      episodesListened: 2,
      episodesTotal: 4,
    });
  });
});

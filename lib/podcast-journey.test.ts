import { describe, expect, test } from "vitest";

import type { RssEpisode } from "./anchor-rss";
import {
  buildFoundationsPlan,
  buildPodcastDays,
  buildPodcastJourneyDays,
  buildPodcastSeriesCatalogue,
  episodeDateKey,
  getPodcastCalendarWindow,
  indexPodcastEpisodesByDay,
  isPodcastTrackAvailable,
  parsePodcastTrack,
  PODCAST_FOUNDATIONS_DAYS,
  podcastSeriesTrack,
  resolvePodcastJourney,
  summarisePodcastJourney,
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

/** A series released one part a day from `firstDate`, listed newest first like the feed. */
function series(title: string, parts: number, firstDate: string): RssEpisode[] {
  return Array.from({ length: parts }, (_, index) => {
    const date = new Date(`${firstDate}T05:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + index);
    return {
      ...episode(`${title}-${index + 1}`, date.toUTCString()),
      title: `${title} (Part ${index + 1})`,
    };
  }).reverse();
}

const feed = [
  ...series("Faith Stand", 3, "2026-02-20"),
  ...series("How to Fulfill God's Purpose", 5, "2026-01-31").map((item) =>
    // The feed spells one part the UK way; it still belongs to the series.
    item.title.endsWith("(Part 3)")
      ? { ...item, title: "How to Fulfil God's Purpose (Part 3)" }
      : item,
  ),
  ...series("The Pursuit of God's Purpose", 12, "2026-01-24"),
  ...series("The Reality of God's Purpose", 12, "2026-01-17"),
  ...series("The Place of the Gospel in your Life", 4, "2026-01-15"),
];
const catalogue = buildPodcastSeriesCatalogue(feed);

describe("podcast journeys", () => {
  test("lists each series in teaching order, Part 1 first", () => {
    expect(catalogue.map((item) => item.title)).toEqual([
      "The Place of the Gospel in Your Life",
      "The Reality of God's Purpose",
      "The Pursuit of God's Purpose",
      "How to Fulfil God's Purpose",
      "Faith Stand",
    ]);
    const fulfil = catalogue.find((item) => item.title === "How to Fulfil God's Purpose")!;
    expect(fulfil.episodes.map((item) => item.title)).toEqual([
      "How to Fulfill God's Purpose (Part 1)",
      "How to Fulfill God's Purpose (Part 2)",
      "How to Fulfil God's Purpose (Part 3)",
      "How to Fulfill God's Purpose (Part 4)",
      "How to Fulfill God's Purpose (Part 5)",
    ]);
  });

  test("builds the 30-day Foundations plan in order", () => {
    const plan = buildFoundationsPlan(catalogue);

    expect(plan).toHaveLength(PODCAST_FOUNDATIONS_DAYS);
    expect(plan[0]!.title).toBe("The Place of the Gospel in your Life (Part 1)");
    expect(plan[4]!.title).toBe("The Reality of God's Purpose (Part 1)");
    expect(plan[16]!.title).toBe("The Pursuit of God's Purpose (Part 1)");
    expect(plan.slice(28).map((item) => item.title)).toEqual([
      "How to Fulfill God's Purpose (Part 1)",
      "How to Fulfill God's Purpose (Part 2)",
    ]);
  });

  test("keeps a short Foundations plan when the feed is missing a series", () => {
    const partial = buildPodcastSeriesCatalogue(
      series("The Reality of God's Purpose", 12, "2026-01-17"),
    );
    expect(buildFoundationsPlan(partial)).toHaveLength(12);
  });

  test("reads stored tracks and treats anything unknown as Foundations", () => {
    expect(parsePodcastTrack("latest")).toEqual({ kind: "latest" });
    expect(parsePodcastTrack("series:faith-stand")).toEqual({
      kind: "series",
      seriesId: "faith-stand",
    });
    expect(parsePodcastTrack("series:")).toEqual({ kind: "foundations" });
    expect(parsePodcastTrack("something-else")).toEqual({ kind: "foundations" });
    expect(parsePodcastTrack(null)).toEqual({ kind: "foundations" });
  });

  test("only lets a listener choose a series that is in the feed", () => {
    expect(isPodcastTrackAvailable("foundations", catalogue)).toBe(true);
    expect(isPodcastTrackAvailable("latest", catalogue)).toBe(true);
    expect(isPodcastTrackAvailable(podcastSeriesTrack("faith-stand"), catalogue)).toBe(true);
    expect(isPodcastTrackAvailable("series:not-a-series", catalogue)).toBe(false);
    expect(isPodcastTrackAvailable("anything", catalogue)).toBe(false);
  });

  test("resolves a series journey from Part 1", () => {
    const journey = resolvePodcastJourney({
      track: podcastSeriesTrack("faith-stand"),
      startedOn: "2026-10-05",
      catalogue,
    });

    expect(journey).toMatchObject({
      kind: "plan",
      track: "series:faith-stand",
      title: "Faith Stand",
      recommended: false,
      fellBack: false,
    });
    expect(journey.kind === "plan" && journey.episodes.map((item) => item.guid)).toEqual([
      "Faith Stand-1",
      "Faith Stand-2",
      "Faith Stand-3",
    ]);
  });

  test("falls back to Foundations, then to latest releases", () => {
    expect(
      resolvePodcastJourney({
        track: "series:gone-from-the-feed",
        startedOn: "2026-10-05",
        catalogue,
      }),
    ).toMatchObject({ kind: "plan", track: "foundations", fellBack: true });
    expect(
      resolvePodcastJourney({ track: "foundations", startedOn: "2026-10-05", catalogue }),
    ).toMatchObject({ kind: "plan", recommended: true, fellBack: false });
    expect(
      resolvePodcastJourney({ track: "foundations", startedOn: "2026-10-05", catalogue: [] }),
    ).toMatchObject({ kind: "latest", fellBack: true });
    expect(
      resolvePodcastJourney({ track: "latest", startedOn: "2026-10-05", catalogue }),
    ).toMatchObject({ kind: "latest", fellBack: false });
  });

  test("gives each journey day the next episode, from the start date", () => {
    const plan = buildFoundationsPlan(catalogue).slice(0, 4);
    const days = buildPodcastJourneyDays({
      planEpisodes: plan,
      startedOn: "2026-10-30",
      todayKey: "2026-11-01",
      listenedGuids: new Set([plan[0]!.guid, plan[1]!.guid]),
      prayerDateKeys: new Set(["2026-10-30"]),
    });

    expect(
      days.map((day) => [day.dayNumber, day.dateKey, day.episode?.guid, day.state]),
    ).toEqual([
      [1, "2026-10-30", plan[0]!.guid, "complete"],
      // Listened, but the morning Prayer Watch was missed: open to catch up.
      [2, "2026-10-31", plan[1]!.guid, "missed"],
      [3, "2026-11-01", plan[2]!.guid, "current"],
      [4, "2026-11-02", plan[3]!.guid, "future"],
    ]);
    expect(summarisePodcastJourney(days, "2026-11-01")).toEqual({
      dayNumber: 3,
      totalDays: 4,
      listened: 2,
      finished: false,
    });
  });

  test("marks a journey finished once its last day has passed", () => {
    const days = buildPodcastJourneyDays({
      planEpisodes: buildFoundationsPlan(catalogue).slice(0, 2),
      startedOn: "2026-10-01",
      todayKey: "2026-10-09",
      listenedGuids: new Set(),
      prayerDateKeys: new Set(),
    });

    expect(summarisePodcastJourney(days, "2026-10-09")).toEqual({
      dayNumber: 2,
      totalDays: 2,
      listened: 0,
      finished: true,
    });
  });
});

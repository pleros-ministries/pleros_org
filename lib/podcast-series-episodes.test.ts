import { describe, expect, test } from "vitest";

import type { RssEpisode } from "./anchor-rss";
import {
  extractPartNumber,
  groupPodcastSeriesEpisodes,
  normalizeSeriesTitle,
} from "./podcast-series-episodes";

function makeEpisode(overrides: Partial<RssEpisode> & { title: string }): RssEpisode {
  return {
    guid: overrides.title,
    link: "https://podcasters.spotify.com/pod/show/pleros-media/episodes/x",
    audioUrl: "https://anchor.fm/s/10db96b2c/podcast/play/1/https%3A%2F%2Fexample.mp3",
    duration: "00:15:00",
    pubDate: "Wed, 15 Jul 2026 05:15:49 GMT",
    isoDate: "2026-07-15",
    imageUrl: "https://example.com/image.jpg",
    description: "",
    episodeNumber: null,
    ...overrides,
  };
}

describe("normalizeSeriesTitle", () => {
  test("strips a trailing (Part N) suffix", () => {
    expect(normalizeSeriesTitle("Favour in the Newness of Life (Part 3)")).toBe(
      "favour in the newness of life",
    );
  });

  test("folds known spelling variants so titles match reliably", () => {
    expect(normalizeSeriesTitle("How to Fulfil God's Purpose (Part 2)")).toBe(
      normalizeSeriesTitle("How to Fulfill God's Purpose"),
    );
  });

  test("is case-insensitive and collapses whitespace", () => {
    expect(normalizeSeriesTitle("  The Mind of Man  ")).toBe(
      normalizeSeriesTitle("THE MIND OF MAN"),
    );
  });
});

describe("extractPartNumber", () => {
  test("reads the part number out of a title", () => {
    expect(extractPartNumber("Healing in the Newness of Life (Part 12)")).toBe(12);
  });

  test("defaults to 0 when there is no part suffix", () => {
    expect(extractPartNumber("Faith Stand")).toBe(0);
  });
});

describe("groupPodcastSeriesEpisodes", () => {
  const series = [
    { id: "faith-stand", title: "Faith Stand", description: "d", href: "https://youtube.com/watch?v=abc" },
    { id: "mind-of-man", title: "The Mind of Man", description: "d", href: undefined },
  ] as const;

  test("groups episodes under the matching series and sorts by part number ascending", () => {
    const episodes = [
      makeEpisode({ title: "Faith Stand (Part 3)" }),
      makeEpisode({ title: "Faith Stand (Part 1)" }),
      makeEpisode({ title: "Faith Stand (Part 2)" }),
      makeEpisode({ title: "The Mind of Man (Part 1)" }),
    ];

    const result = groupPodcastSeriesEpisodes(series, episodes);

    expect(result[0].episodes.map((ep) => ep.title)).toEqual([
      "Faith Stand (Part 1)",
      "Faith Stand (Part 2)",
      "Faith Stand (Part 3)",
    ]);
    expect(result[1].episodes.map((ep) => ep.title)).toEqual([
      "The Mind of Man (Part 1)",
    ]);
  });

  test("returns an empty episode list when nothing matches", () => {
    const result = groupPodcastSeriesEpisodes(series, [
      makeEpisode({ title: "Something Unrelated (Part 1)" }),
    ]);

    expect(result[0].episodes).toEqual([]);
    expect(result[1].episodes).toEqual([]);
  });
});

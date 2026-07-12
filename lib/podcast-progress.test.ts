import { describe, expect, test } from "vitest";

import type { RssEpisode } from "./anchor-rss";
import { getPodcastSeriesTitle, groupPodcastEpisodesBySeries } from "./podcast-progress";

function episode(title: string, guid = title): RssEpisode {
  return {
    guid,
    title,
    link: "https://example.com",
    audioUrl: "https://example.com/audio.mp3",
    duration: "00:15:00",
    pubDate: "Mon, 13 Jul 2026 00:00:00 GMT",
    isoDate: "2026-07-13",
    imageUrl: "",
    description: "",
    episodeNumber: null,
  };
}

describe("podcast progress grouping", () => {
  test("derives a series title from part-based episode titles", () => {
    expect(getPodcastSeriesTitle("Our Righteous Nature in Christ (Part 24)")).toBe(
      "Our Righteous Nature in Christ",
    );
    expect(getPodcastSeriesTitle("Faith Stand - Part 3")).toBe("Faith Stand");
  });

  test("groups episodes by derived series title", () => {
    const groups = groupPodcastEpisodesBySeries([
      episode("Our Righteous Nature in Christ (Part 24)", "a"),
      episode("Our Righteous Nature in Christ (Part 23)", "b"),
      episode("Faith Stand - Part 1", "c"),
    ]);

    expect(groups).toEqual([
      {
        id: "our-righteous-nature-in-christ",
        title: "Our Righteous Nature in Christ",
        episodes: [episode("Our Righteous Nature in Christ (Part 24)", "a"), episode("Our Righteous Nature in Christ (Part 23)", "b")],
      },
      {
        id: "faith-stand",
        title: "Faith Stand",
        episodes: [episode("Faith Stand - Part 1", "c")],
      },
    ]);
  });
});

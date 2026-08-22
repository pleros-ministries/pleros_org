import type { RssEpisode } from "./anchor-rss";

export type PodcastSeriesEntry = {
  id: string;
  title: string;
  description: string;
  href?: string;
};

export type PodcastSeriesWithEpisodes = PodcastSeriesEntry & {
  episodes: RssEpisode[];
};

const PART_SUFFIX_REGEX = /\s*\(part\s*\d+\)\s*$/i;
const PART_NUMBER_REGEX = /\(part\s*(\d+)\)/i;

export function normalizeSeriesTitle(title: string): string {
  return title
    .replace(PART_SUFFIX_REGEX, "")
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\bfulfil\b/g, "fulfill")
    .replace(/\s+/g, " ");
}

export function extractPartNumber(title: string): number {
  const match = title.match(PART_NUMBER_REGEX);
  return match ? parseInt(match[1], 10) : 0;
}

export function groupPodcastSeriesEpisodes(
  series: readonly PodcastSeriesEntry[],
  rssEpisodes: readonly RssEpisode[],
): PodcastSeriesWithEpisodes[] {
  return series.map((item) => {
    const target = normalizeSeriesTitle(item.title);
    const episodes = rssEpisodes
      .filter((episode) => normalizeSeriesTitle(episode.title) === target)
      .sort((a, b) => extractPartNumber(a.title) - extractPartNumber(b.title));

    return { ...item, episodes };
  });
}

import type { RssEpisode } from "./anchor-rss";
import { normalizeSeriesTitle } from "./podcast-series-episodes";

export type PodcastEpisodeGroup = {
  id: string;
  title: string;
  episodes: RssEpisode[];
};

export const STANDALONE_PODCAST_SERIES_ID = "standalone-episodes";

const PART_NUMBER_REGEX = /(?:\(|[-–—]\s*)(?:part|pt\.?)\s*(\d+)\)?\s*$/i;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getPodcastSeriesTitle(title: string): string {
  return title
    .replace(/\s*\((?:part|pt\.?)\s*\d+\)\s*$/i, "")
    .replace(/\s*[-–—]\s*(?:part|pt\.?)\s*\d+\s*$/i, "")
    .trim();
}

/** The part number in "(Part 3)" or "- Part 3"; 0 when the title has none. */
export function getPodcastPartNumber(title: string): number {
  const match = title.match(PART_NUMBER_REGEX);
  return match ? parseInt(match[1]!, 10) : 0;
}

/**
 * A series' stable id, from its title without the part number. Spelling and
 * case differences ("Fulfil"/"Fulfill") share one id.
 */
export function podcastSeriesId(seriesTitle: string): string {
  return slugify(normalizeSeriesTitle(seriesTitle)) || STANDALONE_PODCAST_SERIES_ID;
}

export function groupPodcastEpisodesBySeries(
  episodes: RssEpisode[],
): PodcastEpisodeGroup[] {
  const groups = new Map<string, PodcastEpisodeGroup>();

  for (const episode of episodes) {
    const title = getPodcastSeriesTitle(episode.title) || "Standalone episodes";
    const id = podcastSeriesId(title);
    const group = groups.get(id);

    if (group) {
      group.episodes.push(episode);
    } else {
      groups.set(id, {
        id,
        title,
        episodes: [episode],
      });
    }
  }

  return [...groups.values()];
}

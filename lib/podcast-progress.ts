import type { RssEpisode } from "./anchor-rss";

export type PodcastEpisodeGroup = {
  id: string;
  title: string;
  episodes: RssEpisode[];
};

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

export function groupPodcastEpisodesBySeries(
  episodes: RssEpisode[],
): PodcastEpisodeGroup[] {
  const groups = new Map<string, PodcastEpisodeGroup>();

  for (const episode of episodes) {
    const title = getPodcastSeriesTitle(episode.title) || "Standalone episodes";
    const id = slugify(title) || "standalone-episodes";
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

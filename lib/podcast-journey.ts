import type { RssEpisode } from "./anchor-rss";
import { deriveSogpCalendarState, type SogpCalendarState } from "./sogp/calendar";
import { toLagosDateKey } from "./sogp/formation-progress";

/**
 * The day the daily podcast view opened. The calendar never starts before it,
 * so nobody arrives to a run of days they could not have completed.
 */
export const PODCAST_DAILY_VIEW_START_KEY = "2026-10-05";

export type PodcastDay = {
  dateKey: string;
  state: SogpCalendarState;
  /** The episode released that day in Lagos time; Sundays have none. */
  episode: RssEpisode | null;
  episodeListened: boolean;
  prayerWatchComplete: boolean;
};

export type PodcastProgressSummary = {
  monthEpisodesListened: number;
  monthEpisodesTotal: number;
  prayerDays: number;
  prayerDaysAvailable: number;
  prayerPercent: number;
  episodesListened: number;
  episodesTotal: number;
};

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day));
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(dateKey: string, amount: number) {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + amount);
  return toDateKey(date);
}

function publishedTime(episode: Pick<RssEpisode, "pubDate">) {
  const time = new Date(episode.pubDate).getTime();
  return Number.isNaN(time) ? 0 : time;
}

/** The Lagos calendar day an episode was released on. */
export function episodeDateKey(
  episode: Pick<RssEpisode, "pubDate" | "isoDate">,
): string {
  const published = new Date(episode.pubDate);
  return Number.isNaN(published.getTime())
    ? episode.isoDate
    : toLagosDateKey(published);
}

export function getPodcastMonthStartKey(todayKey: string) {
  return `${todayKey.slice(0, 7)}-01`;
}

export function getPodcastPreviousMonthStartKey(todayKey: string) {
  const today = parseDateKey(todayKey);
  return toDateKey(
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)),
  );
}

/**
 * The calendar covers the previous month and the current one, but never opens
 * before the listener joined or before the daily view existed.
 */
export function getPodcastCalendarWindow({
  todayKey,
  joinedKey,
  launchKey = PODCAST_DAILY_VIEW_START_KEY,
}: {
  todayKey: string;
  joinedKey?: string | null;
  launchKey?: string | null;
}) {
  const today = parseDateKey(todayKey);
  const endKey = toDateKey(
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0)),
  );
  const earliest = [
    getPodcastPreviousMonthStartKey(todayKey),
    launchKey,
    joinedKey,
  ]
    .filter((key): key is string => Boolean(key))
    .sort()
    .at(-1)!;

  return { startKey: earliest > todayKey ? todayKey : earliest, endKey };
}

/**
 * One episode per Lagos day inside the range. When two land on the same day
 * the later release wins; the other stays reachable from the full list.
 */
export function indexPodcastEpisodesByDay(
  episodes: readonly RssEpisode[],
  startKey: string,
  endKey: string,
): Map<string, RssEpisode> {
  // `isoDate` is the UTC day, which is the Lagos day or the one before it, so
  // it cheaply rules out the back catalogue before any time-zone formatting.
  const earliestIsoDate = addDays(startKey, -1);
  const byDay = new Map<string, RssEpisode>();

  for (const episode of episodes) {
    if (
      episode.isoDate &&
      (episode.isoDate < earliestIsoDate || episode.isoDate > endKey)
    ) {
      continue;
    }

    const dateKey = episodeDateKey(episode);
    if (!dateKey || dateKey < startKey || dateKey > endKey) continue;

    const existing = byDay.get(dateKey);
    if (!existing || publishedTime(episode) > publishedTime(existing)) {
      byDay.set(dateKey, episode);
    }
  }

  return byDay;
}

export function buildPodcastDays({
  episodes,
  listenedGuids,
  prayerDateKeys,
  todayKey,
  startKey,
  endKey,
}: {
  episodes: readonly RssEpisode[];
  listenedGuids: ReadonlySet<string>;
  prayerDateKeys: ReadonlySet<string>;
  todayKey: string;
  startKey: string;
  endKey: string;
}): PodcastDay[] {
  const lastReleaseKey = endKey < todayKey ? endKey : todayKey;
  const episodesByDay = indexPodcastEpisodesByDay(
    episodes,
    startKey,
    lastReleaseKey,
  );
  const days: PodcastDay[] = [];

  for (let dateKey = startKey; dateKey <= endKey; dateKey = addDays(dateKey, 1)) {
    const episode = episodesByDay.get(dateKey) ?? null;
    const episodeListened = episode ? listenedGuids.has(episode.guid) : false;
    const prayerWatchComplete = prayerDateKeys.has(dateKey);

    days.push({
      dateKey,
      episode,
      episodeListened,
      prayerWatchComplete,
      state: deriveSogpCalendarState({
        dateKey,
        todayKey,
        requirements: episode
          ? [episodeListened, prayerWatchComplete]
          : [prayerWatchComplete],
      }),
    });
  }

  return days;
}

export function summarisePodcastProgress({
  episodes,
  listenedGuids,
  prayerDateKeys,
  todayKey,
}: {
  episodes: readonly RssEpisode[];
  listenedGuids: ReadonlySet<string>;
  prayerDateKeys: ReadonlySet<string>;
  todayKey: string;
}): PodcastProgressSummary {
  const monthStartKey = getPodcastMonthStartKey(todayKey);
  const monthEpisodes = [
    ...indexPodcastEpisodesByDay(episodes, monthStartKey, todayKey).values(),
  ];
  const prayerDaysAvailable = Number(todayKey.slice(-2));
  const prayerDays = [...prayerDateKeys].filter(
    (dateKey) => dateKey >= monthStartKey && dateKey <= todayKey,
  ).length;

  return {
    monthEpisodesListened: monthEpisodes.filter((episode) =>
      listenedGuids.has(episode.guid),
    ).length,
    monthEpisodesTotal: monthEpisodes.length,
    prayerDays,
    prayerDaysAvailable,
    prayerPercent: prayerDaysAvailable
      ? Math.round((prayerDays / prayerDaysAvailable) * 100)
      : 0,
    episodesListened: episodes.filter((episode) =>
      listenedGuids.has(episode.guid),
    ).length,
    episodesTotal: episodes.length,
  };
}

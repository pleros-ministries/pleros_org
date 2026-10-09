import type { RssEpisode } from "./anchor-rss";
import { podcastSeries } from "./podcast-page-content";
import {
  getPodcastPartNumber,
  groupPodcastEpisodesBySeries,
  podcastSeriesId,
  STANDALONE_PODCAST_SERIES_ID,
} from "./podcast-progress";
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
  /** Day N of a journey; absent on the latest-releases calendar. */
  dayNumber?: number;
  /**
   * A journey day's episode, or on the latest-releases calendar the episode
   * released that day in Lagos time (Sundays have none).
   */
  episode: RssEpisode | null;
  episodeListened: boolean;
  prayerWatchComplete: boolean;
};

/**
 * What a listener follows day by day, stored in `podcast_journeys.track`:
 * the recommended Foundations plan, each new release on its day, or one
 * series from Part 1.
 */
export type PodcastTrack =
  | { kind: "foundations" }
  | { kind: "latest" }
  | { kind: "series"; seriesId: string };

export const PODCAST_FOUNDATIONS_TRACK = "foundations";
export const PODCAST_LATEST_TRACK = "latest";
const PODCAST_SERIES_TRACK_PREFIX = "series:";

export const PODCAST_FOUNDATIONS_TITLE = "30-day Foundations";
export const PODCAST_LATEST_TITLE = "Latest releases";
export const PODCAST_FOUNDATIONS_DAYS = 30;

/**
 * The recommended first journey: the Gospel, God's purpose and its pursuit,
 * then the opening of How to Fulfil God's Purpose, one episode a day.
 */
export const PODCAST_FOUNDATIONS_PLAN: ReadonlyArray<{
  title: string;
  parts?: number;
}> = [
  { title: "The Place of the Gospel in Your Life" },
  { title: "The Reality of God's Purpose" },
  { title: "The Pursuit of God's Purpose" },
  { title: "How to Fulfil God's Purpose", parts: 2 },
];

export type PodcastSeriesOption = {
  id: string;
  title: string;
  description: string | null;
  /** Part 1 first. */
  episodes: RssEpisode[];
};

export type ResolvedPodcastJourney = (
  | {
      kind: "plan";
      track: string;
      title: string;
      recommended: boolean;
      /** Day 1 in Lagos time. */
      startedOn: string;
      episodes: RssEpisode[];
    }
  | { kind: "latest"; track: string; title: string }
) & {
  /** The stored choice was unavailable, so this is the next best journey. */
  fellBack: boolean;
};

export type PodcastJourneySummary = {
  /** Today's day number, held at the first or last day outside the journey. */
  dayNumber: number;
  totalDays: number;
  listened: number;
  /** Today is past the journey's last day. */
  finished: boolean;
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

export function podcastSeriesTrack(seriesId: string) {
  return `${PODCAST_SERIES_TRACK_PREFIX}${seriesId}`;
}

/** Unknown values read as the recommended plan. */
export function parsePodcastTrack(value: string | null | undefined): PodcastTrack {
  if (value === PODCAST_LATEST_TRACK) return { kind: "latest" };
  if (value?.startsWith(PODCAST_SERIES_TRACK_PREFIX)) {
    const seriesId = value.slice(PODCAST_SERIES_TRACK_PREFIX.length);
    if (seriesId) return { kind: "series", seriesId };
  }
  return { kind: "foundations" };
}

const curatedSeries = new Map<string, { title: string; description: string }>(
  podcastSeries.map(
    (series) =>
      [
        podcastSeriesId(series.title),
        { title: series.title, description: series.description },
      ] as const,
  ),
);

function releaseOrder(a: RssEpisode, b: RssEpisode) {
  return (
    getPodcastPartNumber(a.title) - getPodcastPartNumber(b.title) ||
    publishedTime(a) - publishedTime(b)
  );
}

/**
 * Every series in the feed in the order it was taught, each from Part 1.
 * Curated titles and descriptions replace the feed's where they exist.
 */
export function buildPodcastSeriesCatalogue(
  episodes: readonly RssEpisode[],
): PodcastSeriesOption[] {
  return groupPodcastEpisodesBySeries([...episodes])
    .filter((group) => group.id !== STANDALONE_PODCAST_SERIES_ID)
    .map((group) => {
      const curated = curatedSeries.get(group.id);
      return {
        id: group.id,
        title: curated?.title ?? group.title,
        description: curated?.description ?? null,
        episodes: [...group.episodes].sort(releaseOrder),
      };
    })
    .sort(
      (a, b) =>
        Math.min(...a.episodes.map(publishedTime)) -
        Math.min(...b.episodes.map(publishedTime)),
    );
}

/** Up to 30 episodes; shorter, never broken, if the feed is missing some. */
export function buildFoundationsPlan(
  catalogue: readonly PodcastSeriesOption[],
): RssEpisode[] {
  const byId = new Map(catalogue.map((series) => [series.id, series] as const));

  return PODCAST_FOUNDATIONS_PLAN.flatMap((entry) => {
    const episodes = byId.get(podcastSeriesId(entry.title))?.episodes ?? [];
    return entry.parts ? episodes.slice(0, entry.parts) : episodes;
  }).slice(0, PODCAST_FOUNDATIONS_DAYS);
}

/** Whether a listener may choose this track now; used before saving it. */
export function isPodcastTrackAvailable(
  value: string,
  catalogue: readonly PodcastSeriesOption[],
) {
  if (value === PODCAST_FOUNDATIONS_TRACK || value === PODCAST_LATEST_TRACK) {
    return true;
  }
  const track = parsePodcastTrack(value);
  return (
    track.kind === "series" &&
    value === podcastSeriesTrack(track.seriesId) &&
    catalogue.some(
      (series) => series.id === track.seriesId && series.episodes.length > 0,
    )
  );
}

/**
 * Turns the stored choice into the journey to show. A series that has left
 * the feed falls back to Foundations, and an empty Foundations (the feed is
 * down) falls back to latest releases, whose calendar is never empty.
 */
export function resolvePodcastJourney({
  track,
  startedOn,
  catalogue,
}: {
  track: string;
  startedOn: string;
  catalogue: readonly PodcastSeriesOption[];
}): ResolvedPodcastJourney {
  const parsed = parsePodcastTrack(track);
  const latest = {
    kind: "latest" as const,
    track: PODCAST_LATEST_TRACK,
    title: PODCAST_LATEST_TITLE,
  };

  if (parsed.kind === "latest") return { ...latest, fellBack: false };

  if (parsed.kind === "series") {
    const series = catalogue.find((item) => item.id === parsed.seriesId);
    if (series?.episodes.length) {
      return {
        kind: "plan",
        track: podcastSeriesTrack(series.id),
        title: series.title,
        recommended: false,
        startedOn,
        episodes: series.episodes,
        fellBack: false,
      };
    }
  }

  const foundations = buildFoundationsPlan(catalogue);
  if (foundations.length === 0) return { ...latest, fellBack: true };

  return {
    kind: "plan",
    track: PODCAST_FOUNDATIONS_TRACK,
    title: PODCAST_FOUNDATIONS_TITLE,
    recommended: true,
    startedOn,
    episodes: foundations,
    fellBack: parsed.kind !== "foundations",
  };
}

/**
 * One episode a day from the start date. Day N opens on its date; missed days
 * stay open to catch up, and a day is complete with its episode and the
 * morning Prayer Watch.
 */
export function buildPodcastJourneyDays({
  planEpisodes,
  startedOn,
  todayKey,
  listenedGuids,
  prayerDateKeys,
}: {
  planEpisodes: readonly RssEpisode[];
  startedOn: string;
  todayKey: string;
  listenedGuids: ReadonlySet<string>;
  prayerDateKeys: ReadonlySet<string>;
}): PodcastDay[] {
  return planEpisodes.map((episode, index) => {
    const dateKey = addDays(startedOn, index);
    const episodeListened = listenedGuids.has(episode.guid);
    const prayerWatchComplete = prayerDateKeys.has(dateKey);

    return {
      dateKey,
      dayNumber: index + 1,
      episode,
      episodeListened,
      prayerWatchComplete,
      state: deriveSogpCalendarState({
        dateKey,
        todayKey,
        requirements: [episodeListened, prayerWatchComplete],
      }),
    };
  });
}

export function summarisePodcastJourney(
  days: readonly PodcastDay[],
  todayKey: string,
): PodcastJourneySummary {
  const lastDay = days.at(-1);
  const finished = lastDay ? todayKey > lastDay.dateKey : false;
  const todayIndex = days.findIndex((day) => day.dateKey === todayKey);

  return {
    dayNumber: todayIndex >= 0 ? todayIndex + 1 : finished ? days.length : 1,
    totalDays: days.length,
    listened: days.filter((day) => day.episodeListened).length,
    finished,
  };
}

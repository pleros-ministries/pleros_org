"use client";

import { useActionState, useRef, useState, type MouseEvent } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CheckIcon,
  ChevronDownIcon,
  PlayIcon,
  SearchIcon,
} from "lucide-react";

import {
  markSelectedPodcastEpisodesListenedAction,
  togglePodcastEpisodeProgressAction,
} from "@/app/_actions/podcast-progress-actions";
import { SogpCalendar } from "@/components/sogp/sogp-calendar";
import type { RssEpisode } from "@/lib/anchor-rss";
import {
  buildPodcastDays,
  buildPodcastJourneyDays,
  buildPodcastSeriesCatalogue,
  podcastSeriesTrack,
  resolvePodcastJourney,
  summarisePodcastJourney,
  summarisePodcastProgress,
} from "@/lib/podcast-journey";
import type { PodcastLeaderboardData } from "@/lib/podcast-leaderboard";
import {
  groupPodcastEpisodesBySeries,
  STANDALONE_PODCAST_SERIES_ID,
  type PodcastEpisodeGroup,
} from "@/lib/podcast-progress";
import { cn } from "@/lib/utils";

import styles from "./podcast.module.css";
import { durationLabel, PodcastDailyTasks } from "./podcast-daily-tasks";
import { PodcastJourneyCard } from "./podcast-journey-card";
import { PodcastOtherDetails, PodcastProgressStrip } from "./podcast-other-details";
import { PodcastTrackPicker } from "./podcast-track-picker";

const INITIAL_STATE = { error: null as string | null };

function formatDate(isoDate: string): string {
  if (!isoDate) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoDate));
}

function MarkAllAsListenedButton({
  allEpisodesListened,
  disabled,
}: {
  allEpisodesListened: boolean;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={styles.btn}
      data-small=""
    >
      {pending
        ? "Saving..."
        : allEpisodesListened
          ? "Mark all as unlistened"
          : "Mark all as listened"}
    </button>
  );
}

function EpisodeProgressCheckbox({
  episode,
  listened,
  onToggleListened,
  previewMode,
}: {
  episode: RssEpisode;
  listened: boolean;
  onToggleListened: (episodeGuid: string, listened: boolean) => void;
  previewMode: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <input
      type="checkbox"
      checked={listened}
      disabled={pending}
      onChange={(event) => {
        onToggleListened(episode.guid, event.currentTarget.checked);

        if (!previewMode) {
          event.currentTarget.form?.requestSubmit();
        }
      }}
    />
  );
}

function EpisodeRow({
  episode,
  listened,
  onToggleListened,
  previewMode,
}: {
  episode: RssEpisode;
  listened: boolean;
  onToggleListened: (episodeGuid: string, listened: boolean) => void;
  previewMode: boolean;
}) {
  const [state, formAction] = useActionState(
    togglePodcastEpisodeProgressAction,
    INITIAL_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const meta = [formatDate(episode.isoDate), durationLabel(episode.duration)]
    .filter(Boolean)
    .join(" · ");

  function handleEpisodeRowClick(event: MouseEvent<HTMLElement>) {
    const target = event.target;

    if (
      !(target instanceof Element) ||
      target.closest("a,button,input,label")
    ) {
      return;
    }

    onToggleListened(episode.guid, !listened);

    if (!previewMode) {
      formRef.current?.requestSubmit();
    }
  }

  return (
    <article onClick={handleEpisodeRowClick} className={styles.epRow}>
      <form ref={formRef} action={formAction}>
        <input type="hidden" name="episodeGuid" value={episode.guid} />
        <input type="hidden" name="listened" value={listened ? "true" : "false"} />
        {/* The number chip is the listened checkbox: blue with a tick once listened. */}
        <label className={styles.epCheck} data-done={listened || undefined}>
          <span className="sr-only">Mark {episode.title} as listened</span>
          {listened ? (
            <CheckIcon className="size-4" strokeWidth={2.4} aria-hidden="true" />
          ) : episode.episodeNumber ? (
            <span aria-hidden="true">{episode.episodeNumber}</span>
          ) : (
            <PlayIcon className="size-3.5" fill="currentColor" strokeWidth={0} aria-hidden="true" />
          )}
          <EpisodeProgressCheckbox
            episode={episode}
            listened={listened}
            onToggleListened={onToggleListened}
            previewMode={previewMode}
          />
        </label>
      </form>

      <div className={styles.rowCopy}>
        <h4 className={styles.rowTitleWrap}>
          <a
            href={episode.link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.epTitle}
          >
            {episode.title}
          </a>
        </h4>
        {meta ? <span className={styles.rowMeta}>{meta}</span> : null}
        {!previewMode && state.error ? (
          <p className={styles.error}>{state.error}</p>
        ) : null}
      </div>

      {listened ? (
        <span className={styles.epEnd}>
          <span className={styles.pill} data-tone="done">
            Listened
          </span>
        </span>
      ) : null}
    </article>
  );
}

function PodcastSeriesGroup({
  group,
  listened,
  onToggleListened,
  onSetListened,
  previewMode,
  defaultCollapsed,
  onStartJourney,
}: {
  group: PodcastEpisodeGroup;
  listened: Set<string>;
  onToggleListened: (episodeGuid: string, listened: boolean) => void;
  onSetListened: (episodeGuids: string[], listened: boolean) => void;
  previewMode: boolean;
  defaultCollapsed: boolean;
  /** Opens the journey picker on this series; absent for standalone episodes. */
  onStartJourney?: () => void;
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [state, formAction] = useActionState(
    markSelectedPodcastEpisodesListenedAction,
    INITIAL_STATE,
  );
  const listenedCount = group.episodes.filter((episode) =>
    listened.has(episode.guid),
  ).length;
  const seriesEpisodeGuids = group.episodes.map((episode) => episode.guid);
  const allEpisodesListened = group.episodes.length > 0 && listenedCount === group.episodes.length;
  const nextListened = !allEpisodesListened;
  const contentId = `podcast-series-${group.id}-episodes`;

  return (
    <section className={styles.panel}>
      <div
        className={cn(
          styles.seriesHead,
          "transition-[padding] duration-200 ease-out",
          isCollapsed ? "px-3.5 py-3" : "px-3.5 pb-0 pt-3",
        )}
      >
        <button
          type="button"
          aria-expanded={!isCollapsed}
          aria-controls={contentId}
          onClick={() => setIsCollapsed((current) => !current)}
          className={styles.seriesToggle}
        >
          <span className={styles.rowCopy}>
            <h3>{group.title}</h3>
            <span className={styles.rowMeta}>
              {listenedCount} of {group.episodes.length} listened
            </span>
          </span>
          <ChevronDownIcon
            className={cn(
              "size-4 shrink-0 text-[#a6abb2] transition-transform",
              !isCollapsed && "rotate-180",
            )}
          />
        </button>

        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
            isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
          )}
          aria-hidden={isCollapsed}
        >
          <div
            className={cn(
              "grid min-h-0 gap-2 overflow-hidden",
              isCollapsed && "invisible pointer-events-none",
            )}
          >
            <div className={cn(styles.actions, "pb-3")}>
              {previewMode ? (
                <button
                  type="button"
                  disabled={!seriesEpisodeGuids.length || isCollapsed}
                  onClick={() => onSetListened(seriesEpisodeGuids, nextListened)}
                  className={styles.btn}
                  data-small=""
                >
                  {allEpisodesListened ? "Mark all as unlistened" : "Mark all as listened"}
                </button>
              ) : (
                <form
                  action={formAction}
                  onSubmit={() => onSetListened(seriesEpisodeGuids, nextListened)}
                >
                  <input type="hidden" name="listened" value={nextListened ? "true" : "false"} />
                  {seriesEpisodeGuids.map((episodeGuid) => (
                    <input key={episodeGuid} type="hidden" name="episodeGuid" value={episodeGuid} />
                  ))}
                  <MarkAllAsListenedButton
                    allEpisodesListened={allEpisodesListened}
                    disabled={!seriesEpisodeGuids.length || isCollapsed}
                  />
                </form>
              )}
              {onStartJourney ? (
                <button
                  type="button"
                  disabled={isCollapsed}
                  onClick={onStartJourney}
                  className={styles.btn}
                  data-quiet=""
                  data-small=""
                >
                  Listen as a daily journey
                </button>
              ) : null}
            </div>
            {!previewMode && state.error ? (
              <p className={cn(styles.error, "pb-2")}>{state.error}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div
        id={contentId}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
        )}
        aria-hidden={isCollapsed}
      >
        <div
          className={cn(
            "min-h-0 overflow-hidden",
            isCollapsed && "invisible pointer-events-none",
          )}
        >
          {group.episodes.map((episode) => (
            <EpisodeRow
              key={episode.guid}
              episode={episode}
              listened={listened.has(episode.guid)}
              onToggleListened={onToggleListened}
              previewMode={previewMode}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function PodcastProgressPage({
  episodes,
  listenedEpisodeGuids,
  previewMode = false,
  initialDateKey,
  todayKey,
  calendarStartKey,
  calendarEndKey,
  prayerDateKeys,
  listenerName,
  leaderboard,
  track,
  startedOn,
}: {
  episodes: RssEpisode[];
  listenedEpisodeGuids: string[];
  previewMode?: boolean;
  initialDateKey?: string;
  todayKey: string;
  calendarStartKey: string;
  calendarEndKey: string;
  prayerDateKeys: string[];
  listenerName: string;
  leaderboard: PodcastLeaderboardData | null;
  /** The stored journey choice (`podcast_journeys.track`). */
  track: string;
  /** Day 1 of that journey in Lagos time. */
  startedOn: string;
}) {
  const [query, setQuery] = useState("");
  const [localListenedGuids, setLocalListenedGuids] = useState(listenedEpisodeGuids);
  const [localPrayerDateKeys, setLocalPrayerDateKeys] = useState(prayerDateKeys);
  const [localTrack, setLocalTrack] = useState(track);
  const [localStartedOn, setLocalStartedOn] = useState(startedOn);
  const [selectedDateKey, setSelectedDateKey] = useState(initialDateKey && /^\d{4}-\d{2}-\d{2}$/.test(initialDateKey) && initialDateKey >= calendarStartKey && initialDateKey <= calendarEndKey && initialDateKey <= todayKey ? initialDateKey : todayKey);
  const [picker, setPicker] = useState<{ open: boolean; initialTrack: string }>({
    open: false,
    initialTrack: track,
  });
  const listened = new Set(localListenedGuids);
  const prayed = new Set(localPrayerDateKeys);
  const filteredEpisodes = query.trim()
    ? episodes.filter((episode) =>
        episode.title.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : episodes;
  const episodeGroups = groupPodcastEpisodesBySeries(filteredEpisodes);
  const catalogue = buildPodcastSeriesCatalogue(episodes);
  const journey = resolvePodcastJourney({
    track: localTrack,
    startedOn: localStartedOn,
    catalogue,
  });
  // One local state feeds the calendar, the day's tasks and the full list, so
  // a tick in any of them shows in the others at once.
  const days =
    journey.kind === "plan"
      ? buildPodcastJourneyDays({
          planEpisodes: journey.episodes,
          startedOn: journey.startedOn,
          todayKey,
          listenedGuids: listened,
          prayerDateKeys: prayed,
        })
      : buildPodcastDays({
          episodes,
          listenedGuids: listened,
          prayerDateKeys: prayed,
          todayKey,
          startKey: calendarStartKey,
          endKey: calendarEndKey,
        });
  const journeySummary =
    journey.kind === "plan" ? summarisePodcastJourney(days, todayKey) : null;
  // Today when it is in the calendar; otherwise a finished journey opens on
  // its last day.
  const defaultDay =
    days.find((day) => day.dateKey === todayKey) ??
    (journeySummary?.finished ? days.at(-1) : days[0])!;
  const selectedDay =
    days.find((day) => day.dateKey === selectedDateKey) ?? defaultDay;
  const summary = summarisePodcastProgress({
    episodes,
    listenedGuids: listened,
    prayerDateKeys: prayed,
    todayKey,
  });

  function toggleLocalListened(episodeGuid: string, nextListened: boolean) {
    setLocalListenedGuids((current) => {
      if (nextListened) {
        return current.includes(episodeGuid) ? current : [...current, episodeGuid];
      }

      return current.filter((guid) => guid !== episodeGuid);
    });
  }

  function setLocalSeriesListened(episodeGuids: string[], nextListened: boolean) {
    setLocalListenedGuids((current) => {
      if (nextListened) {
        return [...new Set([...current, ...episodeGuids])];
      }

      return current.filter((guid) => !episodeGuids.includes(guid));
    });
  }

  function openPicker(initialTrack = journey.track) {
    setPicker({ open: true, initialTrack });
  }

  function handleTrackChosen(nextTrack: string) {
    setLocalTrack(nextTrack);
    setLocalStartedOn(todayKey);
    setSelectedDateKey(todayKey);
  }

  function setLocalPrayerComplete(dateKey: string, complete: boolean) {
    setLocalPrayerDateKeys((current) => {
      if (complete) {
        return current.includes(dateKey) ? current : [...current, dateKey];
      }

      return current.filter((key) => key !== dateKey);
    });
  }

  const firstName = listenerName.trim().split(/\s+/)[0] || "there";
  const subtitle = journeySummary
    ? journeySummary.finished
      ? `${journey.title} · finished`
      : `${journey.title} · day ${journeySummary.dayNumber} of ${journeySummary.totalDays}`
    : `Hi ${firstName}, new episodes Monday to Saturday`;

  return (
    <div className={styles.page}>
      {/* The live dashboard shell carries navigation; the preview has no shell. */}
      {previewMode ? (
        <Link href="/preview/dashboard" className={styles.back}>
          <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> Dashboard
        </Link>
      ) : null}

      <div className={styles.heading}>
        <div>
          <h1>Podcast</h1>
          <p className={styles.sub}>{subtitle}</p>
        </div>
      </div>

      <PodcastProgressStrip summary={summary} journeySummary={journeySummary} />

      <section data-podcast-section="calendar" className={cn(styles.panel, "p-3")}>
        <SogpCalendar
          days={days}
          selectedDateKey={selectedDay.dateKey}
          todayKey={todayKey}
          onSelect={setSelectedDateKey}
        />
      </section>

      <div data-podcast-section="daily-content" className="grid min-w-0 gap-3">
        <PodcastDailyTasks
          // A save error belongs to the day it happened on.
          key={selectedDay.dateKey}
          day={selectedDay}
          todayKey={todayKey}
          previewMode={previewMode}
          onSetEpisodeListened={toggleLocalListened}
          onSetPrayerComplete={setLocalPrayerComplete}
        />
        <PodcastJourneyCard
          journey={journey}
          summary={journeySummary}
          onChangeJourney={() => openPicker()}
        />
      </div>

      <section data-podcast-section="all-episodes" className="grid min-w-0 gap-3">
        <div className={styles.sectionTitle}>
          <h2>All episodes</h2>
          <Link href="/podcast" className={styles.link}>
            Open podcast
            <ArrowUpRightIcon className="size-3.5" strokeWidth={2} />
          </Link>
        </div>

        <label className={styles.search}>
          <SearchIcon className="size-4 shrink-0" aria-hidden="true" />
          <span className="sr-only">Search episodes</span>
          <input
            type="search"
            placeholder="Search episodes"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        {episodeGroups.length ? (
          episodeGroups.map((group, index) => (
            <PodcastSeriesGroup
              key={group.id}
              group={group}
              listened={listened}
              onToggleListened={toggleLocalListened}
              onSetListened={setLocalSeriesListened}
              previewMode={previewMode}
              defaultCollapsed={index > 0}
              onStartJourney={
                group.id === STANDALONE_PODCAST_SERIES_ID
                  ? undefined
                  : () => openPicker(podcastSeriesTrack(group.id))
              }
            />
          ))
        ) : (
          <div className={styles.panel}>
            <p className={styles.empty}>No podcast episodes match your search.</p>
          </div>
        )}
      </section>

      <PodcastOtherDetails leaderboard={leaderboard} previewMode={previewMode} />

      <PodcastTrackPicker
        open={picker.open}
        onOpenChange={(open) => setPicker((current) => ({ ...current, open }))}
        currentTrack={journey.track}
        initialTrack={picker.initialTrack}
        catalogue={catalogue}
        listened={listened}
        previewMode={previewMode}
        onChosen={handleTrackChosen}
      />
    </div>
  );
}

"use client";

import { useActionState, useRef, useState, type MouseEvent } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  ArrowUpRightIcon,
  SearchIcon,
} from "lucide-react";

import {
  markSelectedPodcastEpisodesListenedAction,
  togglePodcastEpisodeProgressAction,
} from "@/app/_actions/podcast-progress-actions";
import { SogpCalendar } from "@/components/sogp/sogp-calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  getPodcastSeriesTitle,
  groupPodcastEpisodesBySeries,
  STANDALONE_PODCAST_SERIES_ID,
  type PodcastEpisodeGroup,
} from "@/lib/podcast-progress";
import { getSogpLearningWeek } from "@/lib/sogp/calendar";
import { cn } from "@/lib/utils";

import { PodcastDailyTasks } from "./podcast-daily-tasks";
import { PodcastJourneyCard } from "./podcast-journey-card";
import { PodcastOtherDetails } from "./podcast-other-details";
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
    <Button
      type="submit"
      variant="primary"
      size="sm"
      disabled={pending || disabled}
      className="w-fit rounded-full px-4"
    >
      {pending
        ? "Saving..."
        : allEpisodesListened
          ? "Mark all as unlistened"
          : "Mark all as listened"}
    </Button>
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
      className="mt-1 size-5 rounded-[var(--radius-xs)] border-[rgba(6,16,86,0.24)] accent-[var(--color-brand-blue)] disabled:opacity-50"
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
    <article
      onClick={handleEpisodeRowClick}
      className={cn(
        "grid cursor-pointer gap-4 border-b border-[rgba(6,16,86,0.1)] px-4 py-5 transition-colors last:border-b-0 hover:bg-[rgba(6,16,86,0.03)] sm:px-5",
        listened && "bg-[rgba(40,170,80,0.06)]",
      )}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
        <form ref={formRef} action={formAction}>
          <input type="hidden" name="episodeGuid" value={episode.guid} />
          <input type="hidden" name="listened" value={listened ? "true" : "false"} />
          <label className="flex min-h-11 min-w-11 items-start justify-center pt-0.5">
            <span className="sr-only">Mark {episode.title} as listened</span>
            <EpisodeProgressCheckbox
              episode={episode}
              listened={listened}
              onToggleListened={onToggleListened}
              previewMode={previewMode}
            />
          </label>
        </form>

        <div className="grid gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {episode.episodeNumber ? (
              <span className="font-[var(--font-be-vietnam-pro)] text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--color-brand-blue)] opacity-55">
                Ep. {episode.episodeNumber}
              </span>
            ) : null}
            {listened ? (
              <span className="inline-flex items-center gap-1 rounded-[var(--radius-xs)] bg-[rgba(40,170,80,0.14)] px-2 py-1 font-[var(--font-be-vietnam-pro)] text-[0.68rem] font-semibold text-[var(--color-brand-green)]">
                <CheckIcon className="size-3" />
                Listened
              </span>
            ) : null}
          </div>

          <h2 className="site-pathway-title text-[1rem] leading-[1.15] sm:text-[1.15rem]">
            <a
              href={episode.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-brand-blue)] transition-opacity hover:opacity-75"
            >
              {episode.title}
            </a>
          </h2>

          <div className="font-[var(--font-be-vietnam-pro)] text-[0.75rem] text-[var(--color-text-muted)]">
            {episode.isoDate ? <span>{formatDate(episode.isoDate)}</span> : null}
          </div>
        </div>
      </div>

      {!previewMode && state.error ? (
        <p className="text-[0.75rem] text-[var(--destructive)]">{state.error}</p>
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
    <section className="overflow-hidden rounded-[var(--radius-md)] border border-[rgba(6,16,86,0.1)] bg-white">
      <div
        className={cn(
          "grid gap-3 bg-[rgba(6,16,86,0.035)] transition-[padding] duration-200 ease-out",
          isCollapsed ? "px-4 py-3 sm:px-5" : "px-4 py-4 sm:px-5",
        )}
      >
        <button
          type="button"
          aria-expanded={!isCollapsed}
          aria-controls={contentId}
          onClick={() => setIsCollapsed((current) => !current)}
          className="flex w-full items-start justify-between gap-3 text-left"
        >
          <div className="grid gap-1">
            <h2 className="site-pathway-title text-[1.05rem] leading-[1.1] text-[var(--color-brand-blue)] sm:text-[1.25rem]">
              {group.title}
            </h2>
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.75rem] text-[var(--color-text-muted)]">
              {listenedCount} of {group.episodes.length} listened
            </p>
          </div>
          <ChevronDownIcon
            className={cn(
              "mt-0.5 size-5 shrink-0 text-[var(--color-brand-blue)] transition-transform",
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
              "grid min-h-0 gap-3 overflow-hidden",
              isCollapsed && "invisible pointer-events-none",
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              {previewMode ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!seriesEpisodeGuids.length || isCollapsed}
                  onClick={() => onSetListened(seriesEpisodeGuids, nextListened)}
                  className="w-fit rounded-full px-4"
                >
                  {allEpisodesListened ? "Mark all as unlistened" : "Mark all as listened"}
                </Button>
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCollapsed}
                  onClick={onStartJourney}
                  className="w-fit rounded-full px-4"
                >
                  Listen as a daily journey
                </Button>
              ) : null}
            </div>
            {!previewMode && state.error ? (
              <p className="text-[0.75rem] text-[var(--destructive)]">{state.error}</p>
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

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

const weekdayFormatter = new Intl.DateTimeFormat("en-NG", {
  weekday: "short",
  timeZone: "UTC",
});

export function PodcastProgressPage({
  episodes,
  listenedEpisodeGuids,
  previewMode = false,
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
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
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
  const weekEpisodeDays = getSogpLearningWeek(days, selectedDay.dateKey).filter(
    (day) => day !== null && day.episode !== null,
  );

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

  return (
    <section className="site-font-theme min-h-screen bg-[var(--color-surface-muted)] pb-16 text-zinc-900">
      <header className="bg-[var(--color-brand-blue)] text-white">
        <div className="site-shell-page sogp-shell-page flex items-center justify-between gap-4 py-2.5">
          <Link
            href={previewMode ? "/preview/dashboard" : "/dashboard"}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-sm px-1 text-xs font-medium text-white/85 transition-colors duration-150 hover:text-white focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98]"
          >
            <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> Dashboard
          </Link>
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-lime)]">
            Podcast
          </span>
        </div>
        <div className="site-shell-page sogp-shell-page grid gap-1 pb-4 pt-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white/75">
            Pleros Podcast
          </p>
          <h1 className="ppc-heading text-2xl font-semibold tracking-[-0.02em] text-white md:text-3xl">
            Welcome, {firstName(listenerName)}
          </h1>
          {selectedDay.dayNumber ? (
            <p className="text-xs font-medium text-white/75">
              Day {selectedDay.dayNumber} of {days.length} · {journey.title}
            </p>
          ) : selectedDay.episode ? (
            <p className="text-xs font-medium text-white/75">
              {selectedDay.episode.episodeNumber
                ? `Ep. ${selectedDay.episode.episodeNumber} · `
                : null}
              {getPodcastSeriesTitle(selectedDay.episode.title)}
            </p>
          ) : null}
        </div>
      </header>

      <div className="site-shell-page sogp-shell-page grid gap-4 pb-6 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start lg:pt-4 xl:grid-cols-[15.5rem_minmax(0,1fr)_15.5rem]">
        <aside
          data-podcast-section="calendar"
          className="grid gap-4 lg:sticky lg:top-4 lg:row-span-3 xl:row-span-2"
        >
          <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen rounded-none bg-[var(--color-brand-sky)] p-3 lg:static lg:left-auto lg:right-auto lg:mx-0 lg:w-auto lg:rounded-sm">
            <SogpCalendar
              days={days}
              selectedDateKey={selectedDay.dateKey}
              todayKey={todayKey}
              onSelect={setSelectedDateKey}
              tinted
            />
          </section>

          {weekEpisodeDays.length ? (
            <section className="hidden rounded-sm border border-zinc-200 bg-white lg:block">
              <div className="border-b border-zinc-100 px-4 py-3">
                <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
                  This week’s episodes
                </h2>
              </div>
              <ul className="grid gap-0.5 p-2">
                {weekEpisodeDays.map((day) =>
                  day?.episode ? (
                    <li key={day.dateKey}>
                      <button
                        type="button"
                        onClick={() => setSelectedDateKey(day.dateKey)}
                        aria-pressed={day.dateKey === selectedDay.dateKey}
                        className={cn(
                          "grid w-full cursor-pointer grid-cols-[1rem_minmax(0,1fr)] items-start gap-2 rounded-[0.45rem] px-2 py-2 text-left transition-colors hover:bg-[var(--color-brand-sky-soft)]",
                          day.dateKey === selectedDay.dateKey &&
                            "bg-[var(--color-brand-sky-soft)]",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid size-4 place-items-center rounded-full",
                            day.episodeListened
                              ? "bg-[var(--color-brand-lime)] text-[var(--color-brand-blue)]"
                              : "border border-zinc-300",
                          )}
                        >
                          {day.episodeListened ? (
                            <CheckIcon className="size-3" strokeWidth={2.5} />
                          ) : null}
                        </span>
                        <span className="grid min-w-0 gap-0.5">
                          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                            {weekdayFormatter.format(
                              new Date(`${day.dateKey}T00:00:00.000Z`),
                            )}
                          </span>
                          <span className="truncate text-xs text-zinc-700">
                            {day.episode.title}
                          </span>
                        </span>
                      </button>
                    </li>
                  ) : null,
                )}
              </ul>
            </section>
          ) : null}
        </aside>

        <div data-podcast-section="daily-content" className="grid min-w-0 gap-4">
          <PodcastJourneyCard
            journey={journey}
            summary={journeySummary}
            onChangeJourney={() => openPicker()}
          />
          <PodcastDailyTasks
            // A save error belongs to the day it happened on.
            key={selectedDay.dateKey}
            day={selectedDay}
            todayKey={todayKey}
            previewMode={previewMode}
            onSetEpisodeListened={toggleLocalListened}
            onSetPrayerComplete={setLocalPrayerComplete}
          />
        </div>

        <div className="grid content-start gap-4 lg:col-start-2 xl:sticky xl:top-4 xl:col-start-auto xl:row-span-2">
          <PodcastOtherDetails
            summary={summary}
            journeySummary={journeySummary}
            leaderboard={leaderboard}
            previewMode={previewMode}
          />
        </div>

        <section
          data-podcast-section="all-episodes"
          className="grid min-w-0 gap-4 rounded-[var(--radius-md)] border border-zinc-200 bg-white p-4 md:p-5 lg:col-start-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="ppc-heading text-lg font-semibold text-zinc-900">
              All episodes
            </h2>
            <span className="rounded-[var(--radius-xs)] bg-[var(--color-brand-sky-soft)] px-3 py-1 text-[0.75rem] font-medium text-[var(--color-brand-blue)]">
              {summary.episodesListened} of {summary.episodesTotal} listened
            </span>
          </div>

          <Link
            href="/podcast"
            className="site-button-text group inline-flex w-fit items-center gap-1 text-[0.75rem] font-semibold tracking-[0.12em] text-[var(--color-brand-blue)] uppercase"
          >
            Open podcast
            <ArrowUpRightIcon className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <Input
              type="search"
              placeholder="Search episodes"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 pl-9"
            />
          </div>

          <div className="grid gap-4">
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
              <p className="rounded-[var(--radius-md)] border border-[rgba(6,16,86,0.1)] bg-white px-4 py-5 font-[var(--font-be-vietnam-pro)] text-[0.875rem] text-[var(--color-text-muted)]">
                No podcast episodes match your search.
              </p>
            )}
          </div>
        </section>
      </div>

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
    </section>
  );
}

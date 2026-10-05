"use client";

import { useState, useTransition, type ReactNode } from "react";
import { CheckIcon, ExternalLinkIcon } from "lucide-react";

import { togglePodcastEpisodeProgressAction } from "@/app/_actions/podcast-progress-actions";
import { togglePrayerWatchAttendanceAction } from "@/app/_actions/prayer-watch-actions";
import {
  SOGP_TASK_PRIMARY_BUTTON,
  SOGP_TASK_SECONDARY_BUTTON,
  TaskCard,
} from "@/components/sogp/sogp-daily-tasks";
import type { PodcastDay } from "@/lib/podcast-journey";
import { PRAYER_WATCH_YOUTUBE_URL } from "@/lib/prayer-watch";

const SAVE_ERROR = "Progress could not be saved. Try again.";

function DoneMark({ complete }: { complete: boolean }) {
  return complete ? (
    <CheckIcon
      className="size-4 rounded-[4px] bg-(--color-brand-blue) p-0.5 text-white"
      strokeWidth={2.5}
    />
  ) : (
    <span className="grid size-4 place-items-center rounded-[4px] border border-zinc-300" />
  );
}

export function PodcastDailyTasks({
  day,
  todayKey,
  previewMode,
  onSetEpisodeListened,
  onSetPrayerComplete,
}: {
  day: PodcastDay;
  todayKey: string;
  previewMode: boolean;
  onSetEpisodeListened: (episodeGuid: string, listened: boolean) => void;
  onSetPrayerComplete: (dateKey: string, complete: boolean) => void;
}) {
  const [episodePending, startEpisodeTransition] = useTransition();
  const [prayerPending, startPrayerTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isToday = day.dateKey === todayKey;
  const isFuture = day.dateKey > todayKey;
  const episode = day.episode;

  function toggleEpisode() {
    if (!episode) return;
    const episodeGuid = episode.guid;
    const wasListened = day.episodeListened;
    onSetEpisodeListened(episodeGuid, !wasListened);
    setError(null);
    if (previewMode) return;

    startEpisodeTransition(async () => {
      const formData = new FormData();
      formData.set("episodeGuid", episodeGuid);
      // The action reads the state before the tap and flips it.
      formData.set("listened", wasListened ? "true" : "false");
      const result = await togglePodcastEpisodeProgressAction(
        { error: null },
        formData,
      ).catch(() => ({ error: SAVE_ERROR }));
      if (result.error) {
        onSetEpisodeListened(episodeGuid, wasListened);
        setError(result.error);
      }
    });
  }

  function togglePrayer() {
    const dateKey = day.dateKey;
    const wasComplete = day.prayerWatchComplete;
    onSetPrayerComplete(dateKey, !wasComplete);
    setError(null);
    if (previewMode) return;

    startPrayerTransition(async () => {
      const formData = new FormData();
      formData.set("date", dateKey);
      formData.set("session", "morning");
      formData.set("attended", wasComplete ? "true" : "false");
      const result = await togglePrayerWatchAttendanceAction(
        { error: null },
        formData,
      ).catch(() => ({ error: SAVE_ERROR }));
      if (result.error) {
        onSetPrayerComplete(dateKey, wasComplete);
        setError(result.error);
      }
    });
  }

  const tasks: Array<{ key: string; complete: boolean; node: ReactNode }> = [];

  if (episode) {
    tasks.push({
      key: "episode",
      complete: day.episodeListened,
      node: (
        <TaskCard
          key="episode"
          number={1}
          title="Episode"
          description={episode.title}
          complete={day.episodeListened}
        >
          {episode.audioUrl ? (
            <audio
              key={episode.guid}
              controls
              preload="none"
              src={episode.audioUrl}
              className="w-full"
            >
              Your browser does not support the audio element.
            </audio>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {episode.link ? (
              <a
                href={episode.link}
                target="_blank"
                rel="noopener noreferrer"
                className={SOGP_TASK_PRIMARY_BUTTON}
              >
                Listen on Spotify{" "}
                <ExternalLinkIcon className="size-3.5" strokeWidth={2} />
              </a>
            ) : null}
            <button
              type="button"
              disabled={episodePending}
              onClick={toggleEpisode}
              aria-pressed={day.episodeListened}
              className={SOGP_TASK_SECONDARY_BUTTON}
            >
              <DoneMark complete={day.episodeListened} />
              Done
            </button>
          </div>
        </TaskCard>
      ),
    });
  }

  tasks.push({
    key: "prayer",
    complete: day.prayerWatchComplete,
    node: (
      <TaskCard
        key="prayer"
        number={tasks.length + 1}
        title="5:30 am Prayer Watch"
        description="Join live or watch the replay, then mark it done."
        complete={day.prayerWatchComplete}
      >
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={PRAYER_WATCH_YOUTUBE_URL}
            target="_blank"
            rel="noreferrer"
            className={SOGP_TASK_PRIMARY_BUTTON}
          >
            Open Pleros Live{" "}
            <ExternalLinkIcon className="size-3.5" strokeWidth={2} />
          </a>
          <button
            type="button"
            disabled={isFuture || prayerPending}
            onClick={togglePrayer}
            aria-pressed={day.prayerWatchComplete}
            className={SOGP_TASK_SECONDARY_BUTTON}
          >
            <DoneMark complete={day.prayerWatchComplete} />
            Done
          </button>
        </div>
      </TaskCard>
    ),
  });

  const doneCount = tasks.filter((task) => task.complete).length;
  const weekdayDayLabel = new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day.dateKey}T00:00:00.000Z`));
  const heading = isToday ? `Today, ${weekdayDayLabel}` : weekdayDayLabel;
  // The podcast releases Monday to Saturday.
  const isSunday = new Date(`${day.dateKey}T00:00:00.000Z`).getUTCDay() === 0;
  const noEpisodeNote = isSunday
    ? "There is no new episode on Sundays. Catch up on any you missed in all episodes below."
    : isFuture
      ? "This episode opens on its date."
      : isToday
        ? "Today’s episode is on its way. Check back shortly."
        : "No new episode was released on this day. Catch up on any you missed in all episodes below.";

  return (
    <section className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="ppc-heading text-lg font-semibold text-zinc-900">{heading}</h2>
        <span className="text-xs font-semibold text-(--color-brand-blue)">
          {doneCount} of {tasks.length} done
        </span>
      </div>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-zinc-400">
        Your {tasks.length} task{tasks.length === 1 ? "" : "s"} for{" "}
        {isToday ? "today" : weekdayDayLabel}
      </p>
      {episode ? null : (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-xs leading-normal text-zinc-500">
          {noEpisodeNote}
        </p>
      )}
      <ol className="grid gap-3">{tasks.map((task) => task.node)}</ol>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}

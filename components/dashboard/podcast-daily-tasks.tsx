"use client";

import { useRef, useState, useTransition } from "react";
import {
  ArrowUpRightIcon,
  CheckIcon,
  LockKeyholeIcon,
  PauseIcon,
  PlayIcon,
  SunIcon,
} from "lucide-react";

import { togglePodcastEpisodeProgressAction } from "@/app/_actions/podcast-progress-actions";
import { togglePrayerWatchAttendanceAction } from "@/app/_actions/prayer-watch-actions";
import type { PodcastDay } from "@/lib/podcast-journey";
import { getPodcastSeriesTitle } from "@/lib/podcast-progress";
import { PRAYER_WATCH_YOUTUBE_URL } from "@/lib/prayer-watch";

import styles from "./podcast.module.css";

const SAVE_ERROR = "Progress could not be saved. Try again.";

/** "00:17:08" or "17:08" or seconds → "17 min". Empty when unknown. */
export function durationLabel(duration: string | undefined): string {
  if (!duration) return "";
  const parts = duration.trim().split(":").map(Number);
  if (parts.some((part) => Number.isNaN(part))) return "";
  const seconds =
    parts.length === 1
      ? parts[0]!
      : parts.reduce((total, part) => total * 60 + part, 0);
  if (!seconds) return "";
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return rest ? `${Math.floor(minutes / 60)} hr ${rest} min` : `${minutes / 60} hr`;
}

function DoneButton({
  complete,
  disabled,
  onClick,
}: {
  complete: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={complete}
      className={`${styles.btn} ${styles.done}`}
      data-quiet=""
      data-small=""
    >
      {complete ? <CheckIcon className="size-3.5" strokeWidth={2.4} /> : null}
      {complete ? "Done" : "Mark done"}
    </button>
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
  const [, startPrayerTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
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

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      setStarted(true);
      void audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }

  const weekdayDayLabel = new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${day.dateKey}T00:00:00.000Z`));
  const taskCount = episode ? 2 : 1;
  const doneCount =
    (episode && !isFuture && day.episodeListened ? 1 : 0) + (day.prayerWatchComplete ? 1 : 0);
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
  const episodeMeta = episode
    ? [
        day.dayNumber ? `Day ${day.dayNumber}` : null,
        getPodcastSeriesTitle(episode.title),
        durationLabel(episode.duration),
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <>
      <div className={styles.sectionTitle}>
        <h2>{heading}</h2>
        <span>
          {doneCount} of {taskCount} done
        </span>
      </div>

      {episode ? (
        <section className={styles.panel} aria-label="Episode">
          <div className={styles.episode}>
            <div className={styles.episodeHead}>
              {isFuture ? (
                <span className={styles.play} data-locked="" aria-hidden="true">
                  <LockKeyholeIcon className="size-4" strokeWidth={2} />
                </span>
              ) : (
                <button
                  type="button"
                  className={styles.play}
                  onClick={togglePlay}
                  disabled={!episode.audioUrl}
                  aria-label={playing ? `Pause ${episode.title}` : `Play ${episode.title}`}
                >
                  {playing ? (
                    <PauseIcon className="size-[18px]" fill="currentColor" strokeWidth={0} />
                  ) : (
                    <PlayIcon className="ml-0.5 size-[18px]" fill="currentColor" strokeWidth={0} />
                  )}
                </button>
              )}
              <span className={styles.rowCopy}>
                <span className={styles.rowTitleWrap}>{episode.title}</span>
                <span className={styles.rowMeta}>{episodeMeta}</span>
              </span>
              {!isFuture && day.episodeListened ? (
                <span className={styles.pill} data-tone="done">
                  Listened
                </span>
              ) : null}
            </div>

            {isFuture ? (
              <p className={styles.helper}>Opens on {weekdayDayLabel}.</p>
            ) : (
              <>
                {episode.audioUrl ? (
                  <audio
                    key={episode.guid}
                    ref={audioRef}
                    controls={started}
                    hidden={!started}
                    preload="none"
                    src={episode.audioUrl}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={() => setPlaying(false)}
                    className={styles.audio}
                  >
                    Your browser does not support the audio element.
                  </audio>
                ) : null}
                <div className={styles.actions}>
                  <DoneButton
                    complete={day.episodeListened}
                    disabled={episodePending}
                    onClick={toggleEpisode}
                  />
                  {episode.link ? (
                    <a
                      href={episode.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      Listen on Spotify
                      <ArrowUpRightIcon className="size-3.5" strokeWidth={2} />
                    </a>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </section>
      ) : (
        <p className={styles.note}>{noEpisodeNote}</p>
      )}

      <section className={styles.panel} aria-label="Prayer Watch">
        <div className={styles.row}>
          <span className={styles.chip} data-tone="amber" aria-hidden="true">
            <SunIcon className="size-4" strokeWidth={2} />
          </span>
          <span className={styles.rowCopy}>
            <span className={styles.rowTitle}>5:30 am Prayer Watch</span>
            <a
              href={PRAYER_WATCH_YOUTUBE_URL}
              target="_blank"
              rel="noreferrer"
              className={`${styles.rowMeta} text-[var(--color-community-blue,#2056d6)]`}
            >
              Open Pleros Live
            </a>
          </span>
          <DoneButton
            complete={day.prayerWatchComplete}
            disabled={isFuture}
            onClick={togglePrayer}
          />
        </div>
      </section>

      {error ? (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
    </>
  );
}

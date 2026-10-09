"use client";

import { useState, useTransition } from "react";

import { choosePodcastTrackAction } from "@/app/_actions/podcast-journey-actions";
import { SOGP_TASK_PRIMARY_BUTTON } from "@/components/sogp/sogp-daily-tasks";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RssEpisode } from "@/lib/anchor-rss";
import {
  buildFoundationsPlan,
  PODCAST_FOUNDATIONS_TITLE,
  PODCAST_FOUNDATIONS_TRACK,
  PODCAST_LATEST_TITLE,
  PODCAST_LATEST_TRACK,
  podcastSeriesTrack,
  type PodcastSeriesOption,
} from "@/lib/podcast-journey";

const SAVE_ERROR = "Your journey could not be changed. Try again.";

type TrackOption = {
  track: string;
  title: string;
  description: string | null;
  meta: string | null;
  recommended?: boolean;
};

function listenedMeta(episodes: readonly RssEpisode[], listened: ReadonlySet<string>) {
  const count = episodes.filter((episode) => listened.has(episode.guid)).length;
  return `${episodes.length} episode${episodes.length === 1 ? "" : "s"} · ${count} listened`;
}

function TrackOptionRow({
  option,
  checked,
  current,
  onSelect,
}: {
  option: TrackOption;
  checked: boolean;
  current: boolean;
  onSelect: (track: string) => void;
}) {
  return (
    <label className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-md border border-zinc-200 bg-white px-3 py-3 transition-colors hover:bg-zinc-50 has-checked:border-(--color-brand-blue) has-checked:bg-(--color-brand-sky-soft)">
      <input
        type="radio"
        name="podcast-track"
        value={option.track}
        checked={checked}
        onChange={() => onSelect(option.track)}
        className="mt-0.5 size-4 accent-(--color-brand-blue)"
      />
      <span className="grid min-w-0 gap-0.5">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="ppc-heading text-sm font-semibold text-zinc-900">
            {option.title}
          </span>
          {option.recommended ? (
            <span className="rounded-full bg-(--color-brand-lime) px-2 py-0.5 text-[0.62rem] font-semibold text-(--color-brand-blue)">
              Recommended
            </span>
          ) : null}
          {current ? (
            <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[0.62rem] font-semibold text-zinc-500">
              Current
            </span>
          ) : null}
        </span>
        {option.description ? (
          <span className="text-xs leading-[1.45] text-zinc-500">{option.description}</span>
        ) : null}
        {option.meta ? (
          <span className="text-[0.7rem] font-medium text-zinc-400">{option.meta}</span>
        ) : null}
      </span>
    </label>
  );
}

function PickerBody({
  currentTrack,
  initialTrack,
  catalogue,
  listened,
  previewMode,
  onChosen,
  onClose,
}: {
  currentTrack: string;
  initialTrack: string;
  catalogue: readonly PodcastSeriesOption[];
  listened: ReadonlySet<string>;
  previewMode: boolean;
  onChosen: (track: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(initialTrack);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const foundations = buildFoundationsPlan(catalogue);

  const mainOptions: TrackOption[] = [
    ...(foundations.length
      ? [
          {
            track: PODCAST_FOUNDATIONS_TRACK,
            title: PODCAST_FOUNDATIONS_TITLE,
            description:
              "The Gospel, God’s purpose and how to pursue it, one episode a day.",
            meta: listenedMeta(foundations, listened),
            recommended: true,
          },
        ]
      : []),
    {
      track: PODCAST_LATEST_TRACK,
      title: PODCAST_LATEST_TITLE,
      description: "Each new episode on the day it comes out, Monday to Saturday.",
      meta: null,
    },
  ];
  const seriesOptions: TrackOption[] = catalogue.map((series) => ({
    track: podcastSeriesTrack(series.id),
    title: series.title,
    description: series.description,
    meta: listenedMeta(series.episodes, listened),
  }));

  const isCurrent = selected === currentTrack;
  const isLatest = selected === PODCAST_LATEST_TRACK;
  const actionLabel = isLatest
    ? isCurrent
      ? "You’re following this"
      : "Follow latest releases"
    : isCurrent
      ? "Restart from Day 1"
      : "Start journey";

  function choose() {
    setError(null);
    if (previewMode) {
      onChosen(selected);
      onClose();
      return;
    }

    startTransition(async () => {
      const result = await choosePodcastTrackAction(selected).catch(() => ({
        ok: false as const,
        error: SAVE_ERROR,
      }));
      if (result.ok) {
        onChosen(selected);
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="ppc-heading text-lg font-semibold text-zinc-900">
          Choose your journey
        </DialogTitle>
        <DialogDescription className="text-xs leading-[1.5] text-zinc-500">
          Listen to one episode a day. Missed days stay open so you can catch up.
        </DialogDescription>
      </DialogHeader>

      <fieldset className="grid min-h-0 gap-2 overflow-y-auto pr-1">
        <legend className="sr-only">Podcast journey</legend>
        {mainOptions.map((option) => (
          <TrackOptionRow
            key={option.track}
            option={option}
            checked={selected === option.track}
            current={currentTrack === option.track}
            onSelect={setSelected}
          />
        ))}
        {seriesOptions.length ? (
          <p className="pt-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Or follow one series
          </p>
        ) : null}
        {seriesOptions.map((option) => (
          <TrackOptionRow
            key={option.track}
            option={option}
            checked={selected === option.track}
            current={currentTrack === option.track}
            onSelect={setSelected}
          />
        ))}
      </fieldset>

      <div className="grid gap-2 border-t border-zinc-100 pt-3">
        <p className="text-xs leading-[1.5] text-zinc-500">
          {isLatest
            ? "Episodes you’ve already listened to stay ticked."
            : "Day 1 starts today. Episodes you’ve already listened to stay ticked."}
        </p>
        <button
          type="button"
          onClick={choose}
          disabled={pending || (isLatest && isCurrent)}
          className={`${SOGP_TASK_PRIMARY_BUTTON} w-fit`}
        >
          {pending ? "Saving…" : actionLabel}
        </button>
        {error ? (
          <p role="alert" className="text-xs text-red-700">
            {error}
          </p>
        ) : null}
      </div>
    </>
  );
}

export function PodcastTrackPicker({
  open,
  onOpenChange,
  currentTrack,
  initialTrack,
  catalogue,
  listened,
  previewMode,
  onChosen,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTrack: string;
  /** The option selected when the picker opens. */
  initialTrack: string;
  catalogue: readonly PodcastSeriesOption[];
  listened: ReadonlySet<string>;
  previewMode: boolean;
  /** Runs once the choice is saved, or straight away in preview. */
  onChosen: (track: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="site-font-theme grid max-h-[85vh] grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden rounded-md border-zinc-200 bg-white p-5 text-zinc-900 sm:p-6">
        {/* The popup unmounts when closed, so each opening starts afresh. */}
        <PickerBody
          currentTrack={currentTrack}
          initialTrack={initialTrack}
          catalogue={catalogue}
          listened={listened}
          previewMode={previewMode}
          onChosen={onChosen}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useTransition } from "react";

import { choosePodcastTrackAction } from "@/app/_actions/podcast-journey-actions";
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
    <label className="grid min-w-0 cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-[10px] border border-[#e2e5ea] bg-white px-3.5 py-3 transition-colors hover:bg-[#f8f9fb] has-checked:border-[#2056d6] has-checked:bg-[#f4f7fe]">
      <input
        type="radio"
        name="podcast-track"
        value={option.track}
        checked={checked}
        onChange={() => onSelect(option.track)}
        className="mt-0.5 size-4 accent-[#2056d6]"
      />
      <span className="grid min-w-0 gap-0.5">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-[13.5px] font-medium leading-[18px] text-(--color-text-strong)">
            {option.title}
          </span>
          {option.recommended ? (
            <span className="h-5 rounded-full bg-[#e4ebfd] px-2 text-[11px] font-medium leading-5 text-[#2331ae]">
              Recommended
            </span>
          ) : null}
          {current ? (
            <span className="h-5 rounded-full bg-[#eceef2] px-2 text-[11px] font-medium leading-5 text-(--color-text-muted)">
              Current
            </span>
          ) : null}
        </span>
        {option.description ? (
          <span className="text-[12px] leading-4 text-(--color-text-muted)">{option.description}</span>
        ) : null}
        {option.meta ? (
          <span className="text-[12px] leading-4 text-(--color-text-muted)">{option.meta}</span>
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
        <DialogTitle className="font-[family-name:var(--font-dashboard-heading)] text-[17px] font-medium leading-6 text-(--color-text-strong)">
          Choose your journey
        </DialogTitle>
        <DialogDescription className="text-[12.5px] leading-[18px] text-(--color-text-muted)">
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
          <p className="pt-2 text-[12.5px] leading-[18px] text-(--color-text-muted)">
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

      <div className="grid gap-2 border-t border-[#e7e9ec] pt-3">
        <p className="text-[12px] leading-4 text-(--color-text-muted)">
          {isLatest
            ? "Episodes you’ve already listened to stay ticked."
            : "Day 1 starts today. Episodes you’ve already listened to stay ticked."}
        </p>
        <button
          type="button"
          onClick={choose}
          disabled={pending || (isLatest && isCurrent)}
          className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-[11px] bg-[#2056d6] px-4 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-fit"
        >
          {pending ? "Saving…" : actionLabel}
        </button>
        {error ? (
          <p role="alert" className="text-[12px] text-red-700">
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
      <DialogContent className="site-font-theme grid max-h-[85vh] grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden rounded-[12px] border-[#e2e5ea] bg-white p-4 text-(--color-text-strong) sm:p-5">
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

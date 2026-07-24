"use client";

import {
  ArrowUpRightIcon,
  ClockIcon,
  DownloadIcon,
  ExternalLinkIcon,
  PauseIcon,
  PlayIcon,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { extractPartNumber, type PodcastSeriesWithEpisodes } from "@/lib/podcast-series-episodes";

import { formatDate, formatDuration, getDownloadHref } from "./podcast-rss-list";

type PodcastSeriesGalleryProps = {
  series: PodcastSeriesWithEpisodes[];
  podLinkHref: string;
  youtubeChannelHref: string;
  platformIconLinks: {
    label: string;
    iconSrc: string;
    href: string;
  }[];
};

export function PodcastSeriesGallery({
  series,
  podLinkHref,
  youtubeChannelHref,
  platformIconLinks,
}: PodcastSeriesGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playingGuid, setPlayingGuid] = useState<string | null>(null);

  const selected = useMemo(
    () => series.find((item) => item.id === selectedId) ?? null,
    [selectedId, series],
  );

  if (!series.length) {
    return null;
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setSelectedId(null);
      setPlayingGuid(null);
    }
  }

  const platformLinks = selected
    ? platformIconLinks.map((platform) => ({
        ...platform,
        href:
          platform.label === "YouTube"
            ? (selected.href ?? youtubeChannelHref)
            : platform.href,
      }))
    : [];

  return (
    <div className="mt-8 grid gap-4 md:mt-10">
      <div className="grid gap-2">
        <p className="site-hero-eyebrow">Series</p>
        <h3 className="site-section-heading max-w-[28rem]">
          Start from any of the series
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {series.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setPlayingGuid(null);
              setSelectedId(item.id);
            }}
            className="group grid cursor-pointer overflow-hidden rounded-[1.25rem] bg-white text-left shadow-[0_10px_24px_rgba(6,16,86,0.06)] ring-1 ring-[rgba(6,16,86,0.08)] transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_14px_30px_rgba(6,16,86,0.08)]"
          >
            <div className="grid min-h-[10.5rem] content-between gap-5 bg-[var(--color-brand-sky-soft)] px-5 py-5 md:min-h-[11.5rem] md:px-6">
              <div className="flex items-start">
                <span className="rounded-full bg-white px-2 py-0.5 font-[var(--font-be-vietnam-pro)] text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-brand-blue)] shadow-[inset_0_0_0_1px_rgba(6,16,86,0.08)]">
                  Series {index + 1}
                </span>
              </div>

              <h3 className="font-[var(--font-sen)] text-[1.45rem] font-semibold leading-[0.98] tracking-[-0.045em] text-[var(--color-brand-blue)] md:text-[1.6rem]">
                {item.title}
              </h3>
            </div>

            <div className="grid gap-4 px-5 py-4 md:px-6 md:py-5">
              {item.description ? (
                <p className="font-[var(--font-sans)] text-[0.95rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-muted)]">
                  {item.description}
                </p>
              ) : null}

              <span className="inline-flex w-fit items-center gap-0.5 font-[var(--font-be-vietnam-pro)] text-[0.66rem] font-semibold uppercase tracking-[0.065em] text-[var(--color-brand-blue)]">
                See episodes
                <ArrowUpRightIcon className="size-3.5 stroke-[2.4] transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={handleOpenChange}>
        <DialogContent
          tone="default"
          className="site-font-theme grid max-h-[85vh] w-[min(100%-1.5rem,38rem)] gap-5 overflow-y-auto rounded-[1.25rem] border-[rgba(6,16,86,0.12)] bg-white p-5 text-[var(--color-text)] shadow-[0_24px_64px_rgba(6,16,86,0.18)] sm:p-6"
        >
          <DialogHeader className="gap-2">
            <DialogTitle className="font-[var(--font-sen)] text-[1.55rem] font-semibold leading-[0.98] tracking-[-0.045em] text-[var(--color-brand-blue)] md:text-[1.9rem]">
              {selected?.title ?? ""}
            </DialogTitle>
            <DialogDescription className="font-[var(--font-sans)] text-[1rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-muted)]">
              {selected?.description ?? ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
            {platformLinks.map((platform) => (
              <a
                key={platform.label}
                href={platform.href}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center gap-1.5 text-center transition-transform duration-150 hover:-translate-y-px"
              >
                <span className="flex h-8 items-center justify-center">
                  <Image
                    src={platform.iconSrc}
                    alt=""
                    width={24}
                    height={24}
                    className="size-6"
                  />
                </span>
                <span className="font-[var(--font-be-vietnam-pro)] text-[0.72rem] font-medium text-[var(--color-text-strong)]">
                  {platform.label}
                </span>
              </a>
            ))}

            <a
              href={podLinkHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 self-end pb-1 font-[var(--font-be-vietnam-pro)] text-[0.72rem] font-semibold text-[var(--color-brand-blue)] transition-colors duration-150 hover:text-[var(--color-brand-blue-hover)]"
            >
              and more
              <ArrowUpRightIcon className="size-3.5 stroke-[2.4]" />
            </a>
          </div>

          {selected && selected.episodes.length ? (
            <div className="grid gap-2">
              <p className="font-[var(--font-be-vietnam-pro)] text-[0.66rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                Episodes ({selected.episodes.length})
              </p>

              <div className="overflow-hidden rounded-[0.75rem] border border-[rgba(6,16,86,0.12)] bg-white">
                <div className="divide-y divide-[rgba(6,16,86,0.10)]">
                  {selected.episodes.map((ep) => {
                    const isPlaying = playingGuid === ep.guid;
                    const partNumber = extractPartNumber(ep.title);

                    return (
                      <div key={ep.guid} className="grid gap-2 px-4 py-3.5">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                          <div className="grid gap-0.5">
                            <p className="font-[var(--font-sen)] text-[0.9rem] font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--color-brand-indigo)]">
                              {partNumber ? `Part ${partNumber}` : ep.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                              {ep.isoDate ? (
                                <span className="font-[var(--font-be-vietnam-pro)] text-[0.72rem] text-[var(--color-text-muted)]">
                                  {formatDate(ep.isoDate)}
                                </span>
                              ) : null}
                              {ep.duration ? (
                                <span className="flex items-center gap-1 font-[var(--font-be-vietnam-pro)] text-[0.72rem] text-[var(--color-text-muted)]">
                                  <ClockIcon className="size-3 shrink-0" />
                                  {formatDuration(ep.duration)}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setPlayingGuid(isPlaying ? null : ep.guid)
                              }
                              aria-label={`${isPlaying ? "Pause" : "Play"} ${ep.title}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-blue)] text-white transition-transform duration-150 hover:-translate-y-px"
                            >
                              {isPlaying ? (
                                <PauseIcon className="size-3.5 fill-current" />
                              ) : (
                                <PlayIcon className="size-3.5 fill-current" />
                              )}
                            </button>

                            <a
                              href={getDownloadHref(ep)}
                              aria-label={`Download ${ep.title}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(6,16,86,0.14)] bg-[var(--color-surface-muted)] text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px"
                            >
                              <DownloadIcon className="size-3.5 stroke-[2]" />
                            </a>

                            <a
                              href={ep.link}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Open ${ep.title} on Spotify`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(6,16,86,0.14)] bg-[var(--color-surface-muted)] text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px"
                            >
                              <ExternalLinkIcon className="size-3.5 stroke-[2]" />
                            </a>
                          </div>
                        </div>

                        {isPlaying ? (
                          <audio
                            src={ep.audioUrl}
                            controls
                            autoPlay
                            className="w-full rounded-lg"
                            onEnded={() => setPlayingGuid(null)}
                          >
                            Your browser does not support the audio element.
                          </audio>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

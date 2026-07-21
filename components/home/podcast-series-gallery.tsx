"use client";

import {
  ClockIcon,
  DownloadIcon,
  ExternalLinkIcon,
  Music2Icon,
  PauseIcon,
  PlayIcon,
  SendIcon,
  AppleIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
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
};

function episodeCountLabel(count: number) {
  return `${count} episode${count === 1 ? "" : "s"}`;
}

export function PodcastSeriesGallery({
  series,
  podLinkHref,
  youtubeChannelHref,
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
    ? [
        {
          label: "YouTube",
          href: selected.href ?? youtubeChannelHref,
          Icon: null,
          iconSrc: "/site/home/assets/social-media-icons/youtube-icon.svg",
        },
        { label: "Spotify", href: podLinkHref, Icon: Music2Icon, iconSrc: null },
        { label: "Telegram", href: podLinkHref, Icon: SendIcon, iconSrc: null },
        { label: "Apple Podcasts", href: podLinkHref, Icon: AppleIcon, iconSrc: null },
        { label: "More platforms", href: podLinkHref, Icon: ExternalLinkIcon, iconSrc: null },
      ]
    : [];

  return (
    <div className="mt-8 grid gap-4 md:mt-10">
      <div className="grid gap-2">
        <p className="site-hero-eyebrow">Series</p>
        <h3 className="site-section-heading max-w-[28rem]">
          Jump to any of the series on the podcast
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {series.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setPlayingGuid(null);
              setSelectedId(item.id);
            }}
            className="grid cursor-pointer gap-3 rounded-[1.25rem] border border-[rgba(6,16,86,0.12)] bg-white p-5 text-left shadow-[0_12px_30px_rgba(6,16,86,0.06)] transition-transform duration-150 hover:-translate-y-px md:p-6"
          >
            <div className="grid gap-2">
              <h3 className="font-[var(--font-sen)] text-[1.2rem] font-semibold leading-[1.04] tracking-[-0.035em] text-[var(--color-brand-indigo)] md:text-[1.35rem]">
                {item.title}
              </h3>
              {item.description ? (
                <p className="font-[var(--font-sans)] text-[0.95rem] leading-[1.45] tracking-[-0.02em] text-[var(--color-text-muted)]">
                  {item.description}
                </p>
              ) : null}
            </div>

            <Badge variant="outline" className="w-fit border-[rgba(6,16,86,0.14)]">
              {episodeCountLabel(item.episodes.length)}
            </Badge>
          </button>
        ))}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={handleOpenChange}>
        <DialogContent
          tone="muted"
          className="grid max-h-[85vh] w-[min(100%-1.5rem,38rem)] gap-4 overflow-y-auto"
        >
          <DialogHeader className="gap-2">
            <DialogTitle>{selected?.title ?? ""}</DialogTitle>
            <DialogDescription>{selected?.description ?? ""}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap gap-2">
            {platformLinks.map((platform) => (
              <a
                key={platform.label}
                href={platform.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(6,16,86,0.14)] bg-white px-3.5 py-2 text-[0.8125rem] font-medium text-[var(--color-brand-indigo)] transition-transform duration-150 hover:-translate-y-px"
              >
                {platform.iconSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={platform.iconSrc} alt="" className="size-4" />
                ) : platform.Icon ? (
                  <platform.Icon className="size-4" />
                ) : null}
                {platform.label}
              </a>
            ))}
          </div>

          {selected && selected.episodes.length ? (
            <div className="grid gap-2">
              <p className="font-[var(--font-be-vietnam-pro)] text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
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

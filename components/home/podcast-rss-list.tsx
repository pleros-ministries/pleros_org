"use client";

import { useState } from "react";
import {
  DownloadIcon,
  ExternalLinkIcon,
  PlayIcon,
  PauseIcon,
  ClockIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import type { RssEpisode } from "@/lib/anchor-rss";
import { Input } from "@/components/ui/input";

type Props = {
  episodes: RssEpisode[];
};

const PAGE_SIZE = 10;

function formatDate(isoDate: string): string {
  if (!isoDate) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

function formatDuration(raw: string): string {
  if (!raw) return "";
  // raw is "HH:MM:SS" or "MM:SS"
  const parts = raw.split(":");
  if (parts.length === 3) {
    const [h, m, s] = parts;
    if (h === "00") return `${parseInt(m)}:${s}`;
    return `${parseInt(h)}h ${parseInt(m)}m`;
  }
  return raw;
}

function getDownloadHref(episode: RssEpisode) {
  const params = new URLSearchParams({
    url: episode.audioUrl,
    title: episode.title,
  });

  return `/api/podcast/download?${params.toString()}`;
}

export function PodcastRssList({ episodes }: Props) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  if (!episodes.length) {
    return (
      <p className="font-[var(--font-sans)] text-[0.9rem] text-[var(--color-text-muted)]">
        No episodes found.
      </p>
    );
  }

  const filteredEpisodes = searchQuery.trim()
    ? episodes.filter((ep) =>
        ep.title.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      )
    : episodes;

  const totalPages = Math.max(1, Math.ceil(filteredEpisodes.length / PAGE_SIZE));

  const paginatedEpisodes = filteredEpisodes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="grid gap-4">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]" />
        <Input
          type="search"
          placeholder="Search episodes…"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
            setPlayingId(null);
          }}
          className="pl-9"
        />
      </div>

      {/* Result count */}
      {searchQuery.trim() ? (
        <p className="font-[var(--font-be-vietnam-pro)] text-[0.78rem] text-[var(--color-text-muted)]">
          {filteredEpisodes.length === 0
            ? "No episodes match your search."
            : `${filteredEpisodes.length} episode${filteredEpisodes.length === 1 ? "" : "s"} found`}
        </p>
      ) : null}

      {/* Episode list */}
      <div className="overflow-hidden rounded-[0.75rem] border border-[var(--color-line)] bg-white">
        <div className="divide-y divide-[rgba(6,16,86,0.10)]">
          {paginatedEpisodes.map((ep) => {
            const isPlaying = playingId === ep.guid;

            return (
              <div key={ep.guid} className="grid gap-3 px-5 py-5 md:px-6 md:py-5">
                {/* Top row: meta + actions */}
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                  {/* Episode info */}
                  <div className="grid gap-1">
                    {ep.episodeNumber ? (
                      <p className="font-[var(--font-be-vietnam-pro)] text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-blue)] opacity-50">
                        Ep. {ep.episodeNumber}
                      </p>
                    ) : null}
                    <h3 className="font-[var(--font-sen)] text-[0.95rem] font-semibold leading-[1.18] tracking-[-0.025em] text-[var(--color-brand-indigo)] md:text-[1.05rem]">
                      {ep.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {ep.isoDate ? (
                        <span className="font-[var(--font-be-vietnam-pro)] text-[0.78rem] text-[var(--color-text-muted)]">
                          {formatDate(ep.isoDate)}
                        </span>
                      ) : null}
                      {ep.duration ? (
                        <span className="flex items-center gap-1 font-[var(--font-be-vietnam-pro)] text-[0.78rem] text-[var(--color-text-muted)]">
                          <ClockIcon className="size-3 shrink-0" />
                          {formatDuration(ep.duration)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex shrink-0 items-center gap-2 pt-0.5">
                    {/* Play / Pause inline audio */}
                    <button
                      type="button"
                      onClick={() => setPlayingId(isPlaying ? null : ep.guid)}
                      aria-label={`${isPlaying ? "Pause" : "Play"} ${ep.title}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-blue)] text-white shadow-[0_6px_18px_rgba(5,20,128,0.22)] transition-transform duration-150 hover:-translate-y-px"
                    >
                      {isPlaying ? (
                        <PauseIcon className="size-4 fill-current" />
                      ) : (
                        <PlayIcon className="size-4 fill-current" />
                      )}
                    </button>

                    {/* Download */}
                    <a
                      href={getDownloadHref(ep)}
                      aria-label={`Download ${ep.title}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(6,16,86,0.14)] bg-[var(--color-surface-muted)] text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px"
                    >
                      <DownloadIcon className="size-4 stroke-[2]" />
                    </a>

                    {/* Open on Spotify / Anchor */}
                    <a
                      href={ep.link}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${ep.title} on Spotify`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(6,16,86,0.14)] bg-[var(--color-surface-muted)] text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px"
                    >
                      <ExternalLinkIcon className="size-4 stroke-[2]" />
                    </a>
                  </div>
                </div>

                {/* Inline audio player — visible when playing */}
                {isPlaying ? (
                  <audio
                    src={ep.audioUrl}
                    controls
                    autoPlay
                    className="w-full rounded-lg"
                    onEnded={() => setPlayingId(null)}
                  >
                    Your browser does not support the audio element.
                  </audio>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              setCurrentPage((p) => p - 1);
              setPlayingId(null);
            }}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(6,16,86,0.14)] bg-[var(--color-surface-muted)] text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <ChevronLeftIcon className="size-4 stroke-[2]" />
          </button>

          <span className="font-[var(--font-be-vietnam-pro)] text-[0.78rem] text-[var(--color-text-muted)]">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => {
              setCurrentPage((p) => p + 1);
              setPlayingId(null);
            }}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(6,16,86,0.14)] bg-[var(--color-surface-muted)] text-[var(--color-brand-blue)] transition-transform duration-150 hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <ChevronRightIcon className="size-4 stroke-[2]" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

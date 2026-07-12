"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  ExternalLinkIcon,
  SearchIcon,
} from "lucide-react";

import {
  markSelectedPodcastEpisodesListenedAction,
  togglePodcastEpisodeProgressAction,
} from "@/app/_actions/podcast-progress-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RssEpisode } from "@/lib/anchor-rss";
import {
  groupPodcastEpisodesBySeries,
  type PodcastEpisodeGroup,
} from "@/lib/podcast-progress";
import { cn } from "@/lib/utils";

const INITIAL_STATE = { error: null as string | null };

function formatDuration(raw: string): string {
  if (!raw) {
    return "";
  }

  const parts = raw.split(":");

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours === "00"
      ? `${Number(minutes)}:${seconds}`
      : `${Number(hours)}h ${Number(minutes)}m`;
  }

  return raw;
}

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

function EpisodeProgressButton({ listened }: { listened: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={listened ? "secondary" : "primary"}
      disabled={pending}
      className="w-full sm:w-auto"
    >
      {pending ? "Saving..." : listened ? "Listened" : "Mark listened"}
    </Button>
  );
}

function BulkMarkListenedButton({ selectedCount }: { selectedCount: number }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="primary"
      disabled={pending || selectedCount === 0}
      className="w-full sm:w-auto"
    >
      {pending ? "Saving..." : "Mark selected as listened"}
    </Button>
  );
}

function EpisodeRow({
  episode,
  listened,
  selected,
  onSelect,
}: {
  episode: RssEpisode;
  listened: boolean;
  selected: boolean;
  onSelect: (episodeGuid: string, checked: boolean) => void;
}) {
  const [state, formAction] = useActionState(
    togglePodcastEpisodeProgressAction,
    INITIAL_STATE,
  );

  return (
    <article
      className={cn(
        "grid gap-4 border-b border-[rgba(6,16,86,0.1)] px-4 py-5 last:border-b-0 sm:px-5",
        listened && "bg-[rgba(40,170,80,0.06)]",
      )}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
        <label className="flex min-h-11 min-w-11 items-start justify-center pt-0.5">
          <span className="sr-only">Select {episode.title}</span>
          <input
            type="checkbox"
            checked={selected || listened}
            disabled={listened}
            onChange={(event) => onSelect(episode.guid, event.target.checked)}
            className="mt-1 size-5 rounded-[var(--radius-xs)] border-[rgba(6,16,86,0.24)] accent-[var(--color-brand-blue)] disabled:opacity-50"
          />
        </label>

        <div className="grid gap-2">
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

          <h2 className="site-pathway-title text-[1rem] leading-[1.15] text-[var(--color-brand-blue)] sm:text-[1.15rem]">
            {episode.title}
          </h2>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-[var(--font-be-vietnam-pro)] text-[0.75rem] text-[var(--color-text-muted)]">
            {episode.isoDate ? <span>{formatDate(episode.isoDate)}</span> : null}
            {episode.duration ? (
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="size-3" />
                {formatDuration(episode.duration)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
        <form action={formAction} className="grid sm:block">
          <input type="hidden" name="episodeGuid" value={episode.guid} />
          <input type="hidden" name="listened" value={listened ? "true" : "false"} />
          <EpisodeProgressButton listened={listened} />
        </form>
        <Button
          variant="secondary"
          render={
            <a href={episode.link} target="_blank" rel="noopener noreferrer" />
          }
          className="w-full sm:w-auto"
        >
          <ExternalLinkIcon className="size-4" />
          Open episode
        </Button>
      </div>

      {state.error ? (
        <p className="text-[0.75rem] text-[var(--destructive)]">{state.error}</p>
      ) : null}
    </article>
  );
}

function PodcastSeriesGroup({
  group,
  listened,
}: {
  group: PodcastEpisodeGroup;
  listened: Set<string>;
}) {
  const [selectedGuids, setSelectedGuids] = useState<string[]>([]);
  const [state, formAction] = useActionState(
    markSelectedPodcastEpisodesListenedAction,
    INITIAL_STATE,
  );
  const listenedCount = group.episodes.filter((episode) =>
    listened.has(episode.guid),
  ).length;

  function handleSelect(episodeGuid: string, checked: boolean) {
    setSelectedGuids((current) => {
      if (checked) {
        return current.includes(episodeGuid) ? current : [...current, episodeGuid];
      }

      return current.filter((guid) => guid !== episodeGuid);
    });
  }

  function selectAllUnlistened() {
    setSelectedGuids(
      group.episodes
        .filter((episode) => !listened.has(episode.guid))
        .map((episode) => episode.guid),
    );
  }

  return (
    <section className="overflow-hidden rounded-[var(--radius-md)] border border-[rgba(6,16,86,0.1)] bg-white">
      <div className="grid gap-3 bg-[rgba(6,16,86,0.035)] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="site-pathway-title text-[1.05rem] leading-[1.1] text-[var(--color-brand-blue)] sm:text-[1.25rem]">
              {group.title}
            </h2>
            <p className="font-[var(--font-be-vietnam-pro)] text-[0.75rem] text-[var(--color-text-muted)]">
              {listenedCount} of {group.episodes.length} listened
            </p>
          </div>
          <button
            type="button"
            onClick={selectAllUnlistened}
            className="min-h-10 w-full rounded-[var(--radius-xs)] border border-[rgba(6,16,86,0.14)] bg-white px-3 py-1.5 font-[var(--font-be-vietnam-pro)] text-[0.75rem] font-semibold text-[var(--color-brand-blue)] disabled:opacity-45 sm:w-auto"
            disabled={listenedCount === group.episodes.length}
          >
            Select unlistened
          </button>
        </div>

        <form action={formAction} className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
          {selectedGuids.map((episodeGuid) => (
            <input
              key={episodeGuid}
              type="hidden"
              name="episodeGuid"
              value={episodeGuid}
            />
          ))}
          <BulkMarkListenedButton selectedCount={selectedGuids.length} />
          {selectedGuids.length ? (
            <span className="font-[var(--font-be-vietnam-pro)] text-[0.75rem] text-[var(--color-text-muted)]">
              {selectedGuids.length} selected
            </span>
          ) : null}
        </form>
        {state.error ? (
          <p className="text-[0.75rem] text-[var(--destructive)]">{state.error}</p>
        ) : null}
      </div>

      <div>
        {group.episodes.map((episode) => (
          <EpisodeRow
            key={episode.guid}
            episode={episode}
            listened={listened.has(episode.guid)}
            selected={selectedGuids.includes(episode.guid)}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </section>
  );
}

export function PodcastProgressPage({
  episodes,
  listenedEpisodeGuids,
}: {
  episodes: RssEpisode[];
  listenedEpisodeGuids: string[];
}) {
  const [query, setQuery] = useState("");
  const listened = new Set(listenedEpisodeGuids);
  const filteredEpisodes = query.trim()
    ? episodes.filter((episode) =>
        episode.title.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : episodes;
  const episodeGroups = groupPodcastEpisodesBySeries(filteredEpisodes);

  return (
    <section className="site-font-theme bg-[var(--color-surface)] pb-16 pt-5 sm:pb-20 sm:pt-6">
      <div className="container-pleros grid max-w-[36rem] gap-8">
        <Link
          href="/dashboard"
          className="inline-flex w-fit items-center gap-1 font-[var(--font-be-vietnam-pro)] text-[0.8125rem] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand-blue)]"
        >
          <ChevronLeftIcon className="size-4" />
          Back to dashboard
        </Link>

        <div className="grid gap-2">
          <h1 className="site-hero-heading max-w-[12ch] text-[clamp(2.4rem,6.2vw,3.45rem)] text-[var(--color-brand-blue)]">
            Podcast progress
          </h1>
          <p className="max-w-[34ch] font-[var(--font-be-vietnam-pro)] text-[0.95rem] leading-[1.42] tracking-[-0.02em] text-[var(--color-text-muted)]">
            Mark the Pleros Podcast episodes you have listened to and keep moving
            through the teachings.
          </p>
        </div>

        <div className="grid gap-4 rounded-[1.25rem] border border-[var(--color-line)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="site-pathway-title text-[1.15rem] text-[var(--color-brand-blue)] sm:text-[1.3rem]">
              Episodes
            </p>
            <span className="rounded-[var(--radius-xs)] bg-[var(--page-accent-soft)] px-3 py-1 text-[0.75rem] font-medium text-[var(--color-brand-blue)]">
              {listened.size} of {episodes.length} listened
            </span>
          </div>

          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <Input
              type="search"
              placeholder="Search episodes"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid gap-4">
            {episodeGroups.length ? (
              episodeGroups.map((group) => (
                <PodcastSeriesGroup
                  key={group.id}
                  group={group}
                  listened={listened}
                />
              ))
            ) : (
              <p className="rounded-[var(--radius-md)] border border-[rgba(6,16,86,0.1)] bg-white px-4 py-5 font-[var(--font-be-vietnam-pro)] text-[0.875rem] text-[var(--color-text-muted)]">
                No podcast episodes match your search.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

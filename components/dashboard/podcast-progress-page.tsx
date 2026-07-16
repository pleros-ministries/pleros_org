"use client";

import { useActionState, useRef, useState, type MouseEvent } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
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
}: {
  group: PodcastEpisodeGroup;
  listened: Set<string>;
  onToggleListened: (episodeGuid: string, listened: boolean) => void;
  onSetListened: (episodeGuids: string[], listened: boolean) => void;
  previewMode: boolean;
  defaultCollapsed: boolean;
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

export function PodcastProgressPage({
  episodes,
  listenedEpisodeGuids,
  previewMode = false,
}: {
  episodes: RssEpisode[];
  listenedEpisodeGuids: string[];
  previewMode?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [localListenedGuids, setLocalListenedGuids] = useState(listenedEpisodeGuids);
  const listened = new Set(localListenedGuids);
  const filteredEpisodes = query.trim()
    ? episodes.filter((episode) =>
        episode.title.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : episodes;
  const episodeGroups = groupPodcastEpisodesBySeries(filteredEpisodes);

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

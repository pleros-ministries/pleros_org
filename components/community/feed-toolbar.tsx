"use client";

import { Popover } from "@base-ui/react/popover";
import { ArrowDownUpIcon, CheckIcon, ChevronDownIcon, ClockIcon, MessageCircleQuestionIcon, TrendingUpIcon, type LucideIcon } from "lucide-react";
import {
  FEED_FILTERS,
  FEED_FILTER_LABELS,
  FEED_SORTS,
  FEED_SORT_LABELS,
  parseFeedView,
  type FeedView,
} from "@/lib/community/feed-view";

const SORT_ICONS: Record<string, LucideIcon> = { latest: ClockIcon, top: TrendingUpIcon, unanswered: MessageCircleQuestionIcon };

/** Sort as a chip (⇅ Latest ▾) that opens a short checked menu, matching the filter chips. */
function SortMenu({ view, onChange }: { view: FeedView; onChange: (view: FeedView) => void }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`Sort posts: ${FEED_SORT_LABELS[view.sort]}`}
        className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white pr-1.5 pl-2 text-[12px] font-medium text-[var(--color-community-ink)] transition-colors hover:border-[var(--color-community-edge-strong)] data-[popup-open]:border-[var(--color-community-blue)]"
      >
        <ArrowDownUpIcon className="size-3 text-[var(--color-community-muted)]" strokeWidth={2} />
        {FEED_SORT_LABELS[view.sort]}
        <ChevronDownIcon className="size-3 text-[var(--color-community-muted)]" strokeWidth={2.2} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="end">
          <Popover.Popup className="z-50 w-48 rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white p-1 shadow-[0_8px_24px_rgb(37_43_51/12%)] outline-none">
            <p className="m-0 px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-[0.04em] text-[var(--color-community-muted)] uppercase">Sort by</p>
            {FEED_SORTS.map((sort) => {
              const Icon = SORT_ICONS[sort] ?? ClockIcon;
              const active = view.sort === sort;
              return (
                <Popover.Close
                  key={sort}
                  onClick={() => onChange(parseFeedView({ sort, filter: view.filter }))}
                  aria-pressed={active}
                  className={`flex h-9 w-full items-center gap-2.5 rounded-[7px] px-2.5 text-left text-[13px] transition-colors hover:bg-[var(--color-community-canvas)] ${active ? "font-semibold text-[var(--color-community-ink)]" : "text-[var(--color-community-ink)]"}`}
                >
                  <Icon className="size-4 text-[var(--color-community-muted)]" strokeWidth={1.9} />
                  <span className="flex-1">{FEED_SORT_LABELS[sort]}</span>
                  {active ? <CheckIcon className="size-4 text-[var(--color-community-blue)]" strokeWidth={2.2} /> : null}
                </Popover.Close>
              );
            })}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

/** One post-type filter rail, with the sort chip at the end of the same line. */
export function FeedToolbar({
  view,
  onChange,
}: {
  view: FeedView;
  onChange: (view: FeedView) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <div
        role="group"
        aria-label="Filter posts"
        className="ml-px flex items-center gap-1.5"
      >
        {FEED_FILTERS.map((filter) => {
          const active = view.filter === filter;
          return (
            <button
              key={filter}
              type="button"
              aria-pressed={active}
              onClick={() =>
                onChange(
                  parseFeedView({
                    // "Unanswered" has no official posts, so fall back to Latest.
                    sort:
                      filter === "official" && view.sort === "unanswered"
                        ? "latest"
                        : view.sort,
                    filter,
                  }),
                )
              }
              className={`inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium transition-colors ${
                active
                  ? "bg-[var(--color-community-blue)] text-white"
                  : "bg-[var(--color-community-sky-soft)] text-[var(--color-community-sky-ink)] hover:bg-[#d6e1fb]"
              }`}
            >
              {FEED_FILTER_LABELS[filter]}
            </button>
          );
        })}
      </div>

      <SortMenu view={view} onChange={onChange} />
    </div>
  );
}

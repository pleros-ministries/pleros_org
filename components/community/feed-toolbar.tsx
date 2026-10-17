"use client";

import {
  FEED_FILTERS,
  FEED_FILTER_LABELS,
  FEED_SORTS,
  FEED_SORT_LABELS,
  parseFeedView,
  type FeedView,
} from "@/lib/community/feed-view";

/** One post-type filter rail, with sorting in a compact native dropdown. */
export function FeedToolbar({
  view,
  onChange,
}: {
  view: FeedView;
  onChange: (view: FeedView) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div
        role="group"
        aria-label="Filter posts"
        className="flex items-center gap-1.5"
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

      <select
        aria-label="Sort posts"
        value={view.sort}
        onChange={(event) =>
          onChange(parseFeedView({ sort: event.target.value, filter: view.filter }))
        }
        className="inline-flex h-7 max-w-[130px] items-center rounded-md border-0 bg-transparent pl-1 text-[12.5px] font-medium text-[var(--color-community-muted)]"
      >
        {FEED_SORTS.map((sort) => (
          <option key={sort} value={sort}>{FEED_SORT_LABELS[sort]}</option>
        ))}
      </select>
    </div>
  );
}

/** Sort and filter choices for the community and group feeds. Pure and shared by the API, queries and UI. */

export const FEED_SORTS = ["latest", "top", "unanswered"] as const;
export const FEED_FILTERS = ["all", "official", "discussions"] as const;

export type FeedSort = (typeof FEED_SORTS)[number];
export type FeedFilter = (typeof FEED_FILTERS)[number];
export type FeedView = { sort: FeedSort; filter: FeedFilter };

export const DEFAULT_FEED_VIEW: FeedView = { sort: "latest", filter: "all" };

/** "Top" ranks posts published within this many days. */
export const FEED_TOP_WINDOW_DAYS = 30;

export const FEED_SORT_LABELS: Record<FeedSort, string> = {
  latest: "Latest",
  top: "Top",
  unanswered: "Unanswered",
};

export const FEED_FILTER_LABELS: Record<FeedFilter, string> = {
  all: "All",
  official: "Official",
  discussions: "Discussions",
};

/**
 * Reads untrusted sort/filter values. "Unanswered" only makes sense for
 * discussions, so it never pairs with the official filter.
 */
export function parseFeedView(input: {
  sort?: string | null;
  filter?: string | null;
}): FeedView {
  const sort = FEED_SORTS.find((value) => value === input.sort) ?? "latest";
  let filter = FEED_FILTERS.find((value) => value === input.filter) ?? "all";
  if (sort === "unanswered" && filter === "official") filter = "discussions";
  return { sort, filter };
}

export function isDefaultFeedView(view: FeedView): boolean {
  return (
    view.sort === DEFAULT_FEED_VIEW.sort &&
    view.filter === DEFAULT_FEED_VIEW.filter
  );
}

export function feedViewParams(view: FeedView): string {
  return `sort=${view.sort}&filter=${view.filter}`;
}

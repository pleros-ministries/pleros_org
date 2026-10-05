import { describe, expect, test } from "vitest";

import {
  DEFAULT_FEED_VIEW,
  feedViewParams,
  isDefaultFeedView,
  parseFeedView,
} from "./feed-view";

describe("feed view", () => {
  test("defaults to the latest posts of every kind", () => {
    expect(parseFeedView({})).toEqual(DEFAULT_FEED_VIEW);
    expect(parseFeedView({ sort: null, filter: null })).toEqual({
      sort: "latest",
      filter: "all",
    });
  });

  test("reads valid values and ignores anything else", () => {
    expect(parseFeedView({ sort: "top", filter: "discussions" })).toEqual({
      sort: "top",
      filter: "discussions",
    });
    expect(parseFeedView({ sort: "hot", filter: "drafts" })).toEqual(
      DEFAULT_FEED_VIEW,
    );
  });

  test("unanswered never pairs with the official filter", () => {
    expect(parseFeedView({ sort: "unanswered", filter: "official" })).toEqual({
      sort: "unanswered",
      filter: "discussions",
    });
    expect(parseFeedView({ sort: "unanswered", filter: "all" })).toEqual({
      sort: "unanswered",
      filter: "all",
    });
  });

  test("isDefaultFeedView only matches latest + all", () => {
    expect(isDefaultFeedView(DEFAULT_FEED_VIEW)).toBe(true);
    expect(isDefaultFeedView({ sort: "top", filter: "all" })).toBe(false);
    expect(isDefaultFeedView({ sort: "latest", filter: "official" })).toBe(
      false,
    );
  });

  test("feedViewParams round-trips through parseFeedView", () => {
    const view = { sort: "top", filter: "official" } as const;
    const params = new URLSearchParams(feedViewParams(view));
    expect(
      parseFeedView({ sort: params.get("sort"), filter: params.get("filter") }),
    ).toEqual(view);
  });
});

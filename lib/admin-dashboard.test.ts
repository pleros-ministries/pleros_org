import { describe, expect, test } from "vitest";

import {
  formatDashboardAge,
  getAssignmentOwnershipSummary,
  getContentWatchlistSummary,
  prioritizeOwnershipRows,
  getQueuePressureSummary,
} from "./admin-dashboard";

describe("admin dashboard helpers", () => {
  test("formats dashboard age labels from iso dates", () => {
    expect(
      formatDashboardAge("2026-03-26T08:00:00.000Z", "2026-03-26T13:00:00.000Z"),
    ).toBe("Today");

    expect(
      formatDashboardAge("2026-03-24T08:00:00.000Z", "2026-03-26T13:00:00.000Z"),
    ).toBe("2d ago");
  });

  test("summarizes queue pressure including oldest item age", () => {
    expect(
      getQueuePressureSummary(
        [
          { submittedAt: "2026-03-24T08:00:00.000Z" },
          { submittedAt: "2026-03-26T07:00:00.000Z" },
        ],
        "submittedAt",
        "2026-03-26T13:00:00.000Z",
      ),
    ).toEqual({
      total: 2,
      oldestAgeLabel: "2d ago",
      hint: "Oldest item is 2d ago",
    });
  });

  test("returns calm queue pressure when there are no items", () => {
    expect(
      getQueuePressureSummary([], "submittedAt", "2026-03-26T13:00:00.000Z"),
    ).toEqual({
      total: 0,
      oldestAgeLabel: null,
      hint: "Nothing waiting right now",
    });
  });

  test("summarizes content watchlist by draft pressure", () => {
    expect(
      getContentWatchlistSummary([
        {
          id: 1,
          title: "Foundations",
          draftCount: 2,
          publishedCount: 0,
          totalLessons: 2,
        },
        {
          id: 2,
          title: "Practice",
          draftCount: 1,
          publishedCount: 3,
          totalLessons: 4,
        },
      ]),
    ).toEqual({
      draftLessons: 3,
      levelsWithDrafts: 2,
      emptyPublishedLevels: 1,
      watchItems: [
        {
          id: 1,
          title: "Foundations",
          detail: "2 drafts · nothing published yet",
          tone: "warning",
        },
        {
          id: 2,
          title: "Practice",
          detail: "1 draft · 3 published",
          tone: "default",
        },
      ],
    });
  });

  test("summarizes ownership pressure for current staff and unassigned work", () => {
    expect(
      getAssignmentOwnershipSummary(
        [
          {
            assignedToId: "staff-1",
            submittedAt: "2026-03-24T08:00:00.000Z",
          },
          {
            assignedToId: null,
            submittedAt: "2026-03-25T08:00:00.000Z",
          },
          {
            assignedToId: "staff-2",
            submittedAt: "2026-03-26T08:00:00.000Z",
          },
        ],
        "staff-1",
        "submittedAt",
        "2026-03-26T13:00:00.000Z",
      ),
    ).toEqual({
      mine: 1,
      unassigned: 1,
      oldestMineAgeLabel: "2d ago",
      oldestUnassignedAgeLabel: "1d ago",
      mineHint: "Oldest assigned item is 2d ago",
      unassignedHint: "Oldest unassigned item is 1d ago",
    });
  });

  test("returns calm ownership pressure when nothing is assigned or unassigned", () => {
    expect(
      getAssignmentOwnershipSummary(
        [
          {
            assignedToId: "staff-2",
            createdAt: "2026-03-26T08:00:00.000Z",
          },
        ],
        "staff-1",
        "createdAt",
        "2026-03-26T13:00:00.000Z",
      ),
    ).toEqual({
      mine: 0,
      unassigned: 0,
      oldestMineAgeLabel: null,
      oldestUnassignedAgeLabel: null,
      mineHint: "Nothing assigned to you",
      unassignedHint: "No unassigned work",
    });
  });

  test("prioritizes mine first, then unassigned, then everyone else", () => {
    expect(
      prioritizeOwnershipRows(
        [
          { id: 1, assignedToId: "staff-2" },
          { id: 2, assignedToId: null },
          { id: 3, assignedToId: "staff-1" },
          { id: 4, assignedToId: null },
        ],
        "staff-1",
      ).map((item) => item.id),
    ).toEqual([3, 2, 4, 1]);
  });
});

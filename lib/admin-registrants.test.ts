import { describe, expect, test } from "vitest";

import { buildAdminRegistrantSummaries } from "./admin-registrants";

describe("admin registrants", () => {
  test("dedupes welcome leads and PPC users by normalized email", () => {
    const registrants = buildAdminRegistrantSummaries({
      users: [
        {
          id: "user-1",
          name: "Ada Student",
          email: "ADA@example.com",
          createdAt: "2026-07-01T00:00:00.000Z",
          currentLevel: 2,
          progressPercent: 40,
          currentLesson: "L2.3",
          graduationStatus: "in_progress",
        },
      ],
      leads: [
        {
          id: 7,
          name: "Ada Lead",
          email: "ada@example.com",
          createdAt: "2026-06-20T00:00:00.000Z",
          updatedAt: "2026-06-21T00:00:00.000Z",
        },
      ],
      prayerWatchRows: [
        { userId: "user-1", attendedDate: "2026-07-02" },
        { userId: "user-1", attendedDate: "2026-07-05" },
      ],
      podcastRows: [
        { userId: "user-1", listenedAt: "2026-07-03T00:00:00.000Z" },
        { userId: "user-1", listenedAt: "2026-07-06T00:00:00.000Z" },
      ],
    });

    expect(registrants).toHaveLength(1);
    expect(registrants[0]).toMatchObject({
      id: "user-1",
      userId: "user-1",
      leadId: 7,
      name: "Ada Student",
      email: "ada@example.com",
      sourceLabel: "PPC + welcome",
      accountStatus: "ppc_account",
      ppc: {
        currentLevel: 2,
        progressPercent: 40,
        currentLesson: "L2.3",
      },
      prayerWatch: {
        attendedDays: 2,
        lastAttendedDate: "2026-07-05",
      },
      bibleReadingStatus: "not_tracked",
      podcastStatus: "tracked",
      podcast: {
        listenedEpisodes: 2,
        lastListenedAt: "2026-07-06T00:00:00.000Z",
      },
    });
  });

  test("keeps welcome-only leads visible without PPC progress", () => {
    const registrants = buildAdminRegistrantSummaries({
      users: [],
      leads: [
        {
          id: 3,
          name: null,
          email: "lead@example.com",
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      prayerWatchRows: [],
      podcastRows: [],
    });

    expect(registrants).toEqual([
      expect.objectContaining({
        id: "welcome-lead-3",
        userId: null,
        leadId: 3,
        name: "Not provided",
        email: "lead@example.com",
        sourceLabel: "Welcome",
        accountStatus: "welcome_only",
        ppc: null,
        podcastStatus: "not_tracked",
        podcast: {
          listenedEpisodes: 0,
          lastListenedAt: null,
        },
      }),
    ]);
  });
});

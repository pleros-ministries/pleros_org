import { expect, test } from "vitest";

import {
  buildSogpChannelReminderCandidates,
  buildSogpPrayerWatchPushCandidate,
} from "./notifications";

test("builds a released-track and upcoming-live-class message", () => {
  const events = buildSogpChannelReminderCandidates({
    now: new Date("2026-09-07T05:10:00Z"),
    cohort: {
      id: 1,
      title: "SOGP September 2026",
      status: "active",
      startsAt: new Date("2026-09-14T00:00:00Z"),
    },
    tracks: [
      {
        id: 10,
        dayNumber: 1,
        releaseAt: new Date("2026-09-14T05:00:00Z"),
        title: "The Word of Truth",
      },
    ],
    liveClasses: [
      {
        id: 20,
        title: "Week 1 live class",
        startsAt: new Date("2026-09-15T05:00:00Z"),
        youtubeLiveUrl: "https://youtube.com/live/example",
      },
    ],
  });

  expect(events.map((event) => event.key)).toEqual([
    "sogp:1:track:10:released",
    "sogp:1:live:20:24h",
  ]);
});

test("builds an enrolled 5:20 am Lagos Prayer Watch push", () => {
  expect(
    buildSogpPrayerWatchPushCandidate({
      now: new Date("2026-09-07T04:20:00.000Z"),
      userId: "user-1",
      cohortId: 4,
      cohortStatus: "preparing",
    }),
  ).toEqual({
    key: "sogp:4:prayer:user-1:2026-09-07",
    title: "Prayer Watch begins in 10 minutes",
    body: "Join the 5:30 am Prayer Watch on Pleros Live.",
    url: "/dashboard/pre-sogp?date=2026-09-14",
  });
});

test("uses the active calendar link and rejects other dispatch times", () => {
  expect(
    buildSogpPrayerWatchPushCandidate({
      now: new Date("2026-09-14T04:20:00.000Z"),
      userId: "user-1",
      cohortId: 4,
      cohortStatus: "active",
    })?.url,
  ).toBe("/dashboard/sogp?date=2026-09-14");
  expect(
    buildSogpPrayerWatchPushCandidate({
      now: new Date("2026-09-07T04:40:00.000Z"),
      userId: "user-1",
      cohortId: 4,
      cohortStatus: "active",
    }),
  ).toBeNull();
});

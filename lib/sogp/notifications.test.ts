import { expect, test } from "vitest";

import { buildSogpChannelReminderCandidates } from "./notifications";

test("builds a released-track and upcoming-live-class message", () => {
  const events = buildSogpChannelReminderCandidates({
    now: new Date("2026-09-07T05:10:00Z"),
    cohort: {
      id: 1,
      title: "SOGP September 2026",
      status: "active",
      startsAt: new Date("2026-09-07T00:00:00Z"),
    },
    tracks: [
      {
        id: 10,
        dayNumber: 1,
        releaseAt: new Date("2026-09-07T05:00:00Z"),
        title: "The Word of Truth",
      },
    ],
    liveClasses: [
      {
        id: 20,
        title: "Week 1 live class",
        startsAt: new Date("2026-09-08T05:00:00Z"),
        youtubeLiveUrl: "https://youtube.com/live/example",
      },
    ],
  });

  expect(events.map((event) => event.key)).toEqual([
    "sogp:1:track:10:released",
    "sogp:1:live:20:24h",
  ]);
});

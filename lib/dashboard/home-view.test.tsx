import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { DashboardHomeView } from "@/components/dashboard/v3/home-view";
import type { DashboardHomeData } from "./home";

const data: DashboardHomeData = {
  day: "2026-10-16",
  reports: [
    { category: "devotional", title: "Devotional", description: "2 activities logged", status: "Not confirmed", tone: "amber" },
    { category: "ministry", title: "Ministry", description: "No activity logged", status: "Not reported", tone: "neutral" },
    { category: "meetings", title: "Meetings", description: "No activity declared", status: "Nil declared", tone: "lilac" },
  ],
  card: {
    kind: "podcast",
    pace: 2,
    href: "/dashboard/sogp/listen?day=4",
    series: "The Reality of God’s Purpose",
    dayNumber: 4,
    episodes: [
      { part: "Part 7", duration: "15:00", durationSeconds: 900, positionSeconds: 900, listened: true },
      { part: "Part 8", duration: "14:00", durationSeconds: 840, positionSeconds: 0, listened: false },
    ],
  },
  learning: {
    title: "Day 4 is waiting for you",
    href: "/dashboard/sogp/listen?day=4",
    action: "Resume listening",
    completed: 7,
    total: 30,
    enrolled: true,
    unit: "episodes",
    pathLabel: "30 min/day · Podcast path",
  },
};

test("the You home renders only My learning and My reports as primary destinations", () => {
  const html = renderToStaticMarkup(<DashboardHomeView name="Ada" greeting="Good evening" data={data} />);

  expect(html).toContain("My learning");
  expect(html).toContain("<h2>My reports</h2>");
  expect(html).not.toContain("My support");
  expect(html).not.toContain("Today’s two episodes");
});

test("the learning destination uses the approved background with dynamic progress and separate hub and resume links", () => {
  const html = renderToStaticMarkup(<DashboardHomeView name="Ada" greeting="Good evening" data={data} />);

  expect(html).toContain("my-learning-background-v5.webp");
  expect(html).toContain('href="/dashboard/sogp"');
  expect(html).toContain('href="/dashboard/sogp/listen?day=4"');
  expect(html).toContain("Day 4 is waiting for you");
  expect(html).toContain("1 of 2 episodes marked listened");
  expect(html).toContain('aria-valuenow="1"');
  expect(html).toContain('aria-valuemax="2"');
});

test("the reports destination is date-pinned and keeps the approved category summary", () => {
  const html = renderToStaticMarkup(<DashboardHomeView name="Ada" greeting="Good evening" data={data} />);

  expect(html).toContain('href="/dashboard/community/report?day=2026-10-16"');
  expect(html).toContain("Friday 16 October");
  expect(html).toContain("1 of 3 categories reported");
  expect(html).toContain("Not confirmed");
  expect(html).toContain("Not reported");
  expect(html).toContain("Nil declared");
});

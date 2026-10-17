import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

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

test("the You home leads with My learning and keeps reports as a compact summary", () => {
  const html = renderToStaticMarkup(<DashboardHomeView name="Ada" greeting="Good evening" data={data} />);

  expect(html).toContain("My learning");
  expect(html).toContain(">My reports</h2>");
  expect(html).toContain("More from Pleros");
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
  expect(html).toContain("1 of 3 reported");
  expect(html).toContain("Not confirmed");
  expect(html).toContain("Not reported");
  expect(html).toContain("Nil declared");
});

const sogp: NonNullable<DashboardHomeData["sogp"]> = {
  cohortTitle: "SOGP October 2026",
  weekLabel: "Week 2 of 4",
  today: {
    dateKey: "2026-10-16", dateLabel: "Friday 16 October", done: 1, total: 2,
    week: [{ dateKey: "2026-10-15", weekday: "Thu", dayOfMonth: 15, state: "missed", isToday: false, hasReview: false }, { dateKey: "2026-10-16", weekday: "Fri", dayOfMonth: 16, state: "current", isToday: true, hasReview: false }],
    prayerWatch: { complete: true },
    review: { title: "Level 2 group review", when: "Sunday 18 October", href: null, complete: false },
  },
  progress: { learningLabel: "Episodes", learningDone: 7, learningTotal: 30, prayerPercent: 83, prayerRequired: 80, reviewsSatisfied: 1, reviewsOwed: 4, checksPassed: 1 },
  leaderboard: { rank: 7, points: 240 },
  group: { kind: "member", groupName: "SOGP Discipleship Group", leaderFirstName: "Tolu" },
  shareDayNumber: 4,
};

test("the SOGP sections bring the old dashboard's day, checklist, progress and tiles onto the home", () => {
  const html = renderToStaticMarkup(<DashboardHomeView name="Ada" greeting="Good evening" data={{ ...data, sogp }} />);

  expect(html).toContain("SOGP October 2026 · Week 2 of 4");
  expect(html).toContain("Friday 16 October");
  expect(html).toContain("1 of 2 done");
  expect(html).toContain("5:30 am Prayer Watch");
  expect(html).toContain('aria-pressed="true"');
  expect(html).toContain("7 of 30");
  expect(html).toContain("1 of 3 checks");
  expect(html).toContain('href="/dashboard/sogp/leaderboard"');
  expect(html).toContain("#7");
  expect(html).toContain("Tolu&#x27;s group");
  expect(html).toContain('href="/partner"');
});

test("the learning card uses the current track's level art and falls back to the staircase", () => {
  const level3 = renderToStaticMarkup(<DashboardHomeView greeting="Hello" data={{ ...data, card: { kind: "traditional", title: "The Walk of Faith", href: "#", completed: 15, total: 24, level: 3 } }} />);
  const podcast = renderToStaticMarkup(<DashboardHomeView greeting="Hello" data={data} />);

  expect(level3).toContain("my-learning-level-3.webp");
  expect(podcast).toContain("my-learning-background-v5.webp");
});

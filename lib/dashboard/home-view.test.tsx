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
  // Podcast, Welcome Pack, Pre-SOGP and Partner each have a You tab now.
  expect(html).not.toContain("More from Pleros");
  expect(html).not.toContain("My support");
  expect(html).not.toContain("Today’s two episodes");
});

test("the learning destination uses the approved background with dynamic progress and separate hub and resume links", () => {
  const html = renderToStaticMarkup(<DashboardHomeView name="Ada" greeting="Good evening" data={data} />);

  expect(html).toContain("my-learning-background-v5.webp");
  expect(html).toContain('href="/dashboard/sogp"');
  expect(html).toContain('href="/dashboard/sogp/listen?day=4"');
  // Days belong to the month now (Pastor, 25 November 2026): the card names the series and today's parts.
  expect(html).toContain("The Reality of God’s Purpose");
  expect(html).toContain("Part 7 and Part 8 · 1 of 2 episodes listened");
  expect(html).not.toContain("Day 4 is waiting");
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
    teaching: { title: "Walk of Faith · Part 5", href: "/dashboard/sogp/listen?day=5", done: false, dayNumber: null, podcast: true, questionGuid: null },
    prayerWatch: { complete: true },
    assessment: null,
    review: { title: "Level 2 group review", when: "Sunday 18 October", href: null, complete: false },
  },
  month: { key: "2026-10", name: "October", todayKey: "2026-10-16", daysLeft: 16, daysSoFar: 16, podcast: true, days: {
    "2026-10-15": { dateKey: "2026-10-15", learning: { title: "Walk of Faith", meta: "Part 4", done: true }, prayer: 2, bible: true },
    "2026-10-16": { dateKey: "2026-10-16", learning: { title: "Walk of Faith", meta: "Part 5", done: false }, prayer: 1, bible: false },
  } },
  progress: { teaching: { done: 7, total: 30, unit: "episodes" }, prayer: { percent: 83, required: 80 }, assessment: null },
  group: { kind: "member", groupName: "SOGP Discipleship Group", leaderFirstName: "Tolu" },
  shareDayNumber: 4,
};

test("the SOGP sections bring the old dashboard's day, checklist, progress and tiles onto the home", () => {
  const html = renderToStaticMarkup(<DashboardHomeView name="Ada" greeting="Good evening" data={{ ...data, sogp, leaderboard: { month: "October", top: [], me: null, total: 0, points: 0 } }} />);

  expect(html).toContain("SOGP October 2026 · Week 2 of 4");
  expect(html).toContain("Friday 16 October");
  expect(html).toContain("1 of 2 done");
  expect(html).toContain("5:30 am Prayer Watch");
  expect(html).toContain('aria-pressed="true"');
  // Today is the shared month and the ticks (Pastor, 25 November 2026); podcast learners have no assessment.
  expect(html).toContain("16 days left");
  expect(html).toContain("See all of October");
  expect(html).toContain("Thursday 15 October: learnt, Prayer Watch 2 times, Bible read");
  expect(html).not.toContain("Day 5 of");
  expect(html).toContain("Teaching");
  expect(html).not.toContain("Assessment");
  expect(html).toContain("Share what you learnt");
  expect(html).toContain("of 30 episodes");
  // Before anyone has points this month, the board is a quiet row.
  expect(html).toContain('href="/dashboard/leaderboard"');
  expect(html).toContain("See who’s growing this month");
  expect(html).toContain("Tolu&#x27;s group");
  // Partner moved to its own You tab; Grow together is rows with buttons.
  expect(html).not.toContain('href="/partner"');
  expect(html).toContain(">Share link<");
});

test("Home previews this month’s board for everyone, with you after the top three", () => {
  const leaderboard = { month: "November", top: [
    { rank: 1, name: "Ada", points: 214, isMe: false },
    { rank: 2, name: "Tolu", points: 198, isMe: false },
    { rank: 3, name: "Kemi", points: 151, isMe: false },
    { rank: 4, name: "Sam", points: 120, isMe: true },
  ], me: { rank: 4, points: 120 }, total: 19, points: 120 };
  const html = renderToStaticMarkup(<DashboardHomeView greeting="Hello" data={{ ...data, leaderboard }} />);

  expect(html).toContain("You’re #4 of 19 in November · 120 pts");
  expect(html).toContain('href="/dashboard/leaderboard"');
  expect(html).not.toContain("cohort");
  expect(html).toContain(">You<");
});

test("the learning card uses the current track's level art and falls back to the staircase", () => {
  const level3 = renderToStaticMarkup(<DashboardHomeView greeting="Hello" data={{ ...data, card: { kind: "traditional", title: "The Walk of Faith", href: "#", completed: 15, total: 24, level: 3 } }} />);
  const podcast = renderToStaticMarkup(<DashboardHomeView greeting="Hello" data={data} />);

  expect(level3).toContain("my-learning-level-3.webp");
  expect(podcast).toContain("my-learning-background-v5.webp");
});

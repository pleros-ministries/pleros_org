import Link from "next/link";

import { MonthlyLeaderboard } from "@/components/dashboard/leaderboard/monthly-leaderboard";
import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { LeaderboardPreview } from "@/components/sogp/learning/leaderboard-preview";
import hub from "@/components/sogp/learning/learning-hub.module.css";
import {
  EMPTY_MONTHLY_COUNTS,
  denseRankFor,
  monthWindow,
  previewMonthlyLeaderboard,
  rankByPoints,
  scoreMonth,
  type MonthlyCounts,
  type MonthlyLeaderboardData,
} from "@/lib/leaderboard/monthly";

export const metadata = { title: "Monthly leaderboard preview", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

/**
 * The monthly leaderboard (Pastor, 25 November 2026; live at
 * /dashboard/leaderboard): the real page components on sample data, for
 * checking without signing in. Nothing saved.
 */
const SCREENS = {
  page: "1 This month",
  hidden: "2 Hidden",
  "new-month": "3 New month",
  home: "4 Home",
} as const;
type Screen = keyof typeof SCREENS;

const NOTES: Record<Screen, string[]> = {
  page: [
    "One board for everyone, whatever their path, for the calendar month. It starts afresh on the 1st.",
    "Points come from four things only: learning days, Prayer Watch, Bible reading and people who join. Sharing is left out for now; streaks are gone.",
    "Learning counts once a day, however much you finish, so marking a whole series at once earns one day.",
    "Try the switch and the leaderboard name: they change the board at once, as they will when saved.",
  ],
  hidden: ["Hidden: you’re off the board, but you still see your rank and points. Everyone else keeps their place."],
  "new-month": ["1 December: the board is empty until someone does something. Last month’s points stay in last month."],
  home: [
    "Home keeps its dense preview: the top three, then you. It now shows for everyone signed in, not only SOGP enrolees, and “See all” opens the one board.",
    "On the 1st, before anyone has points, Home shows its quiet Leaderboard row instead.",
  ],
};

/** Sample first names only: no real members. */
const PEOPLE: Array<[string, number]> = [
  ["Ada", 214], ["Tolu", 198], ["Kemi", 151], ["Chidi", 151], ["Funmi", 137], ["Ife", 120], ["Zara", 96],
  ["Bayo", 88], ["Nneka", 72], ["Dami", 64], ["Femi", 51], ["Lara", 40], ["Uche", 33], ["Yemi", 25],
  ["Bisi", 18], ["Ope", 12], ["Kunle", 9], ["Seyi", 5], ["Tobi", 5],
];
const SAM: MonthlyCounts = { learningDays: 18, prayerSessions: 23, bibleDays: 10, invitations: 1 };

function sample(screen: Screen): MonthlyLeaderboardData {
  if (screen === "new-month") {
    return {
      month: monthWindow("2026-12-01"),
      top: [],
      total: 0,
      me: { rank: null, points: 0, counts: EMPTY_MONTHLY_COUNTS, breakdown: scoreMonth(EMPTY_MONTHLY_COUNTS), firstName: "Sam", alias: null, hidden: false },
    };
  }
  const hidden = screen === "hidden";
  const breakdown = scoreMonth(SAM);
  const others = PEOPLE.map(([name, points]) => ({ name, points, isMe: false }));
  const top = rankByPoints(hidden ? others : [...others, { name: "Sam", points: breakdown.total, isMe: true }]);
  return {
    month: monthWindow("2026-11-25"),
    top,
    total: top.length,
    me: {
      rank: hidden ? denseRankFor(breakdown.total, others.map(row => row.points)) : top.find(row => row.isMe)!.rank,
      points: breakdown.total,
      counts: SAM,
      breakdown,
      firstName: "Sam",
      alias: null,
      hidden,
    },
  };
}

export default async function MonthlyLeaderboardPreview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const query = await searchParams;
  const screen: Screen = query.screen && query.screen in SCREENS ? query.screen as Screen : "page";
  const data = sample(screen);

  const view = screen === "home"
    ? <div className={hub.page}><div className={hub.column}>
      <h1>Good morning, Sam</h1>
      <LeaderboardPreview
        id="preview-home-leaderboard"
        dense
        month={data.month.name}
        board={previewMonthlyLeaderboard(data)}
        href="?screen=page"
      />
    </div></div>
    // Keyed so each screen starts from its own sample state.
    : <MonthlyLeaderboard key={screen} data={data} />;

  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)] [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium`} data-dashboard-v3>
    <div className="mx-auto grid max-w-[640px] gap-2 px-4 pt-3 text-xs text-(--color-text-muted)">
      <span>Preview · monthly leaderboard · sample data · nothing saved</span>
      <span className="flex flex-wrap gap-x-3 gap-y-1">{(Object.keys(SCREENS) as Screen[]).map(key => <Link key={key} href={`?screen=${key}`} className={key === screen ? "font-medium text-(--color-community-ink)" : "underline"}>{SCREENS[key]}</Link>)}</span>
      <ul className="grid gap-1 rounded-[10px] bg-white p-3 text-[12.5px] leading-[18px] text-(--color-text-strong) shadow-[inset_0_0_0_1px_var(--dashboard-panel-edge,#e2e5ea)]">
        {NOTES[screen].map(note => <li key={note} className="flex gap-2"><span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-[#2056d6]" />{note}</li>)}
      </ul>
    </div>
    {view}
  </div>;
}

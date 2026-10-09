import { ArrowLeftIcon, InfoIcon, TrophyIcon } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/community/avatar";
import { StreakBadge } from "@/components/sogp/leaderboard-page";
import { SogpActivitySection } from "@/components/sogp/sogp-activity-section";
import {
  PODCAST_LEADERBOARD_POINTS,
  type PodcastLeaderboardData,
} from "@/lib/podcast-leaderboard";
import { LEADERBOARD_STREAK_MILESTONE_DAYS } from "@/lib/sogp/leaderboard-scoring";

import { PodcastLeaderboardToggle } from "./podcast-leaderboard-toggle";

const POINT_RULES: Array<{ label: string; value: string }> = [
  {
    label: "Each day you listen to an episode",
    value: `${PODCAST_LEADERBOARD_POINTS.listeningDay}`,
  },
  {
    label: "5:30 am Prayer Watch",
    value: `${PODCAST_LEADERBOARD_POINTS.prayerWatch}`,
  },
  {
    label: `Streak bonus every ${LEADERBOARD_STREAK_MILESTONE_DAYS} days in a row`,
    value: `${PODCAST_LEADERBOARD_POINTS.streakMilestone}`,
  },
];

export function PodcastLeaderboardPage({ data }: { data: PodcastLeaderboardData }) {
  const me = data.me;
  const breakdown = me
    ? [
        { label: "Listening", value: me.breakdown.listening },
        { label: "Prayer Watch", value: me.breakdown.prayer },
        { label: "Streak bonus", value: me.breakdown.streak },
      ]
    : [];

  return (
    <section className="site-font-theme min-h-screen bg-[#f6f5f1] pb-16 text-zinc-900">
      <nav
        aria-label="Podcast dashboard navigation"
        className="sticky top-0 z-30 border-b border-(--color-brand-blue) bg-(--color-brand-blue) shadow-sm"
      >
        <div className="site-shell-page sogp-shell-page flex min-h-12 items-center justify-between gap-4">
          <Link
            href="/dashboard/podcast"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-1 text-xs font-medium text-white/85 transition-colors duration-150 hover:text-white focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98]"
          >
            <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> Podcast
          </Link>
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-(--color-brand-lime)">
            Podcast
          </span>
        </div>
      </nav>

      <div className="site-shell-page sogp-shell-page grid gap-4 pb-6 pt-5">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="ppc-heading text-lg font-semibold text-zinc-900">Leaderboard</h1>
          <p className="text-[0.62rem] font-semibold uppercase tracking-widest text-zinc-400">
            {data.monthLabel} · {data.total} {data.total === 1 ? "listener" : "listeners"}
          </p>
        </header>

        <SogpActivitySection
          title="Your standing"
          icon={<TrophyIcon className="size-4 text-(--color-brand-blue)" strokeWidth={2} />}
        >
          {me ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="ppc-heading text-2xl font-semibold text-zinc-900">
                  #{me.rank}
                  <span className="ml-2 text-sm font-medium text-zinc-500">
                    {me.points} points
                  </span>
                </p>
                <StreakBadge days={me.currentStreak} />
              </div>
              {me.visible ? null : (
                <p className="text-xs leading-normal text-zinc-500">
                  Only you can see this. Turn on the switch below to appear on the board.
                </p>
              )}
              <dl className="grid grid-cols-3 gap-2">
                {breakdown.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-2"
                  >
                    <dt className="text-[0.7rem] text-zinc-500">{item.label}</dt>
                    <dd className="ppc-heading text-sm font-semibold text-zinc-900">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p className="text-xs leading-normal text-zinc-500">
              Mark an episode as listened this month to earn points.
            </p>
          )}
          <PodcastLeaderboardToggle
            visible={data.viewerVisible}
            className="border-t border-zinc-100 pt-3"
          />
        </SogpActivitySection>

        <SogpActivitySection
          title="This month’s ranking"
          icon={<TrophyIcon className="size-4 text-(--color-brand-blue)" strokeWidth={2} />}
        >
          {data.top.length === 0 ? (
            <p className="text-xs text-zinc-500">No one is on the leaderboard yet.</p>
          ) : (
            <ol className="grid gap-2">
              {data.top.map((entry, index) => (
                <li
                  key={`${entry.rank}-${index}`}
                  aria-current={entry.isMe ? "true" : undefined}
                  className={`flex items-center gap-3 rounded-sm border px-3 py-2 ${
                    entry.isMe
                      ? "border-(--color-brand-blue) bg-sky-50"
                      : "border-zinc-200 bg-white"
                  }`}
                >
                  <span className="ppc-heading w-6 shrink-0 text-center text-sm font-semibold text-zinc-500">
                    {entry.rank}
                  </span>
                  <Avatar name={entry.name} size={32} />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate text-sm font-semibold text-zinc-900">
                      {entry.name}
                      {entry.isMe ? (
                        <span className="ml-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-(--color-brand-blue)">
                          You
                        </span>
                      ) : null}
                    </span>
                    <StreakBadge days={entry.currentStreak} />
                  </span>
                  <span className="ppc-heading shrink-0 text-sm font-semibold text-zinc-900">
                    {entry.points}
                    <span className="ml-1 text-[0.65rem] font-medium text-zinc-400">pts</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </SogpActivitySection>

        <SogpActivitySection
          title="How points work"
          description="Points are worked out from what you mark as done, so they update as you go."
          icon={<InfoIcon className="size-4 text-(--color-brand-blue)" strokeWidth={2} />}
        >
          <ul className="grid gap-1.5">
            {POINT_RULES.map((rule) => (
              <li
                key={rule.label}
                className="flex items-center justify-between gap-3 text-xs text-zinc-600"
              >
                <span>{rule.label}</span>
                <strong className="ppc-heading font-semibold text-zinc-900">
                  +{rule.value}
                </strong>
              </li>
            ))}
          </ul>
          <p className="text-[0.7rem] leading-[1.45] text-zinc-400">
            The leaderboard starts afresh each month and lists only listeners who choose to
            appear, by first name. A day counts once however many episodes you mark, on any
            journey.
          </p>
        </SogpActivitySection>
      </div>
    </section>
  );
}

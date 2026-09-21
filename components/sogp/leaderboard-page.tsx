"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { ArrowLeftIcon, FlameIcon, InfoIcon, TrophyIcon } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/community/avatar";
import type { LeaderboardData } from "@/lib/db/queries/sogp-leaderboard";
import {
  LEADERBOARD_POINTS,
  LEADERBOARD_SHARE_CAP,
  LEADERBOARD_STREAK_MILESTONE_DAYS,
} from "@/lib/sogp/leaderboard-scoring";

import { SogpActivitySection } from "./sogp-activity-section";

export const LEADERBOARD_QUERY_KEY = ["sogp", "leaderboard"] as const;

export async function fetchLeaderboard() {
  const response = await fetch("/api/sogp/leaderboard", {
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("The leaderboard could not load.");
  return response.json() as Promise<LeaderboardData>;
}

const POINT_RULES: Array<{ label: string; value: string }> = [
  { label: "Passing a quiz", value: `${LEADERBOARD_POINTS.quizPassed}` },
  {
    label: "Written response approved",
    value: `${LEADERBOARD_POINTS.writtenApproved}`,
  },
  { label: "Completing a day", value: `${LEADERBOARD_POINTS.dayCompleted}` },
  {
    label: "Prayer Watch session",
    value: `${LEADERBOARD_POINTS.prayerWatch}`,
  },
  { label: "Sunday review", value: `${LEADERBOARD_POINTS.review}` },
  {
    label: "Pre-SOGP preparation day",
    value: `${LEADERBOARD_POINTS.preparationDay}`,
  },
  {
    label: `Sharing your progress (up to ${LEADERBOARD_SHARE_CAP} shares)`,
    value: `${LEADERBOARD_POINTS.share}`,
  },
  {
    label: "Each friend who enrols through your link",
    value: `${LEADERBOARD_POINTS.referral}`,
  },
  {
    label: `Streak bonus every ${LEADERBOARD_STREAK_MILESTONE_DAYS} days in a row`,
    value: `${LEADERBOARD_POINTS.streakMilestone}`,
  },
];

function StreakBadge({ days }: { days: number }) {
  if (days < 1) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-orange-600">
      <FlameIcon className="size-3" strokeWidth={2} aria-hidden />
      {days}-day streak
    </span>
  );
}

export function LeaderboardPage({
  initialData,
}: {
  initialData?: LeaderboardData;
} = {}) {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery({
    queryKey: LEADERBOARD_QUERY_KEY,
    queryFn: fetchLeaderboard,
    initialData,
  });

  const visibility = useMutation({
    mutationFn: async (hidden: boolean) => {
      const response = await fetch("/api/sogp/leaderboard/visibility", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden }),
      });
      if (!response.ok) throw new Error("Your visibility could not be saved.");
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: LEADERBOARD_QUERY_KEY }),
  });

  const me = data.me;
  const breakdown = me
    ? [
        { label: "Course work", value: me.breakdown.course },
        { label: "Attendance", value: me.breakdown.attendance },
        { label: "Sharing and referrals", value: me.breakdown.sharing },
        { label: "Streak bonus", value: me.breakdown.streak },
      ]
    : [];

  return (
    <section className="site-font-theme min-h-screen bg-[#f6f5f1] pb-16 text-zinc-900">
      <nav
        aria-label="SOGP dashboard navigation"
        className="sticky top-0 z-30 border-b border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)] shadow-sm"
      >
        <div className="site-shell-page sogp-shell-page flex min-h-12 items-center justify-between gap-4">
          <Link
            href="/dashboard/sogp"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-1 text-xs font-medium text-white/85 transition-colors duration-150 hover:text-white focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98]"
          >
            <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> Dashboard
          </Link>
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-lime)]">
            SOGP
          </span>
        </div>
      </nav>

      <div className="site-shell-page sogp-shell-page grid gap-4 pb-6 pt-5">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
            Leaderboard
          </h1>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-zinc-400">
            {data.cohortTitle} · {data.total}{" "}
            {data.total === 1 ? "participant" : "participants"}
          </p>
        </header>

        {me ? (
          <SogpActivitySection
            title="Your standing"
            description={
              me.hidden
                ? "You are hidden from the leaderboard. Only you can see this."
                : undefined
            }
            icon={
              <TrophyIcon
                className="size-4 text-[var(--color-brand-blue)]"
                strokeWidth={2}
              />
            }
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <p className="ppc-heading text-2xl font-semibold text-zinc-900">
                #{me.rank}
                <span className="ml-2 text-sm font-medium text-zinc-500">
                  {me.points} points
                </span>
              </p>
              <StreakBadge days={me.currentStreak} />
            </div>
            <dl className="grid grid-cols-2 gap-2">
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
          </SogpActivitySection>
        ) : null}

        <SogpActivitySection
          title="Cohort ranking"
          icon={
            <TrophyIcon
              className="size-4 text-[var(--color-brand-blue)]"
              strokeWidth={2}
            />
          }
        >
          {data.top.length === 0 ? (
            <p className="text-xs text-zinc-500">
              No one is on the leaderboard yet.
            </p>
          ) : (
            <ol className="grid gap-2">
              {data.top.map((entry, index) => (
                <li
                  key={`${entry.rank}-${index}`}
                  aria-current={entry.isMe ? "true" : undefined}
                  className={`flex items-center gap-3 rounded-sm border px-3 py-2 ${
                    entry.isMe
                      ? "border-[var(--color-brand-blue)] bg-sky-50"
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
                        <span className="ml-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-brand-blue)]">
                          You
                        </span>
                      ) : null}
                    </span>
                    <StreakBadge days={entry.currentStreak} />
                  </span>
                  <span className="ppc-heading shrink-0 text-sm font-semibold text-zinc-900">
                    {entry.points}
                    <span className="ml-1 text-[0.65rem] font-medium text-zinc-400">
                      pts
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </SogpActivitySection>

        <SogpActivitySection
          title="How points work"
          description="Points are worked out from your activity, so they update as you go."
          icon={
            <InfoIcon
              className="size-4 text-[var(--color-brand-blue)]"
              strokeWidth={2}
            />
          }
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
            Withdrawn participants are not ranked. Scoring may be adjusted over
            time, which can change everyone&apos;s total.
          </p>
        </SogpActivitySection>

        {me ? (
          <SogpActivitySection
            title="Visibility"
            description="Your full name is shown to your cohort. You can hide yourself and still see your own rank."
            icon={
              <InfoIcon
                className="size-4 text-[var(--color-brand-blue)]"
                strokeWidth={2}
              />
            }
          >
            <label className="flex items-start gap-2.5 text-sm text-zinc-700">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-[var(--color-brand-blue)]"
                checked={me.hidden}
                disabled={visibility.isPending}
                onChange={(event) => visibility.mutate(event.target.checked)}
              />
              <span>Hide me from the leaderboard</span>
            </label>
            {visibility.isError ? (
              <p role="alert" className="text-xs text-red-600">
                {visibility.error.message}
              </p>
            ) : null}
          </SogpActivitySection>
        ) : null}
      </div>
    </section>
  );
}

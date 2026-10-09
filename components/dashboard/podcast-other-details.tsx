import { ChevronRightIcon, TrophyIcon } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/community/avatar";
import type {
  PodcastJourneySummary,
  PodcastProgressSummary,
} from "@/lib/podcast-journey";
import type { PodcastLeaderboardData } from "@/lib/podcast-leaderboard";

import { PodcastLeaderboardToggle } from "./podcast-leaderboard-toggle";

function progressPercent(completed: number, total: number) {
  return total ? Math.round((completed / total) * 100) : 0;
}

function PodcastLeaderboardWidget({
  data,
  previewMode,
}: {
  data: PodcastLeaderboardData;
  previewMode: boolean;
}) {
  const top = data.top.slice(0, 5);

  return (
    <section className="grid gap-3 rounded-md bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrophyIcon className="size-4 text-(--color-brand-blue)" strokeWidth={2} />
          <h3 className="ppc-heading text-sm font-semibold text-zinc-900">Leaderboard</h3>
        </div>
        <span className="text-[0.62rem] font-semibold uppercase tracking-widest text-zinc-400">
          {data.monthLabel}
        </span>
      </div>
      <div className="grid gap-3">
        {data.me?.visible ? (
          <p className="text-xs text-zinc-600">
            You&apos;re{" "}
            <strong className="ppc-heading font-semibold text-zinc-900">
              #{data.me.rank}
            </strong>{" "}
            with {data.me.points} points.
          </p>
        ) : data.me ? (
          <p className="text-xs leading-normal text-zinc-600">
            Only you can see your {data.me.points} points, which would place you{" "}
            <strong className="ppc-heading font-semibold text-zinc-900">
              #{data.me.rank}
            </strong>
            .
          </p>
        ) : (
          <p className="text-xs leading-normal text-zinc-500">
            Mark an episode as listened this month to earn points.
          </p>
        )}
        <PodcastLeaderboardToggle
          visible={data.viewerVisible}
          previewMode={previewMode}
          className="border-y border-zinc-100 py-3"
        />
        {top.length > 0 ? (
          <ol className="grid gap-2">
            {top.map((entry, index) => (
              <li
                key={`${entry.rank}-${index}`}
                className="flex items-center gap-2.5 text-xs"
              >
                <span className="ppc-heading w-4 shrink-0 text-center font-semibold text-zinc-500">
                  {entry.rank}
                </span>
                <Avatar name={entry.name} size={24} />
                <span
                  className={`min-w-0 flex-1 truncate ${
                    entry.isMe ? "font-semibold text-zinc-900" : "text-zinc-700"
                  }`}
                >
                  {entry.name}
                </span>
                <span className="ppc-heading shrink-0 font-semibold text-zinc-900">
                  {entry.points}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-zinc-500">No one is on the leaderboard yet.</p>
        )}
        {previewMode ? null : (
          <Link
            href="/dashboard/podcast/leaderboard"
            className="inline-flex h-9 w-fit items-center rounded-full bg-(--color-brand-blue) px-4 text-xs font-semibold text-white"
          >
            View leaderboard
          </Link>
        )}
      </div>
    </section>
  );
}

export function PodcastOtherDetails({
  summary,
  journeySummary,
  leaderboard,
  previewMode,
}: {
  summary: PodcastProgressSummary;
  /** Present while the listener follows a journey rather than new releases. */
  journeySummary: PodcastJourneySummary | null;
  leaderboard: PodcastLeaderboardData | null;
  previewMode: boolean;
}) {
  const metrics = [
    journeySummary
      ? {
          label: "Journey episodes",
          value: `${journeySummary.listened}/${journeySummary.totalDays}`,
          percent: progressPercent(
            journeySummary.listened,
            journeySummary.totalDays,
          ),
        }
      : {
          label: "This month’s episodes",
          value: `${summary.monthEpisodesListened}/${summary.monthEpisodesTotal}`,
          percent: progressPercent(
            summary.monthEpisodesListened,
            summary.monthEpisodesTotal,
          ),
        },
    {
      label: "Prayer Watch this month",
      value: `${summary.prayerPercent}%`,
      percent: summary.prayerPercent,
    },
    {
      label: "All episodes",
      value: `${summary.episodesListened}/${summary.episodesTotal}`,
      percent: progressPercent(summary.episodesListened, summary.episodesTotal),
    },
  ];

  return (
    <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen rounded-none bg-(--color-brand-sky-soft) p-4 md:p-5 lg:static lg:left-auto lg:right-auto lg:mx-0 lg:w-auto lg:rounded-md">
      <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-(--color-brand-blue)">
        Other details
      </p>
      <div className="grid gap-3">
        <div className="grid gap-3.5 rounded-md bg-white p-4 shadow-sm">
          <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
            Podcast progress
          </h3>
          {metrics.map((metric) => (
            <div key={metric.label} className="grid gap-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-zinc-500">{metric.label}</span>
                <strong className="ppc-heading font-semibold text-zinc-900">
                  {metric.value}
                </strong>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-(--color-brand-blue)"
                  style={{ width: `${Math.min(100, metric.percent)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {leaderboard ? (
          <PodcastLeaderboardWidget data={leaderboard} previewMode={previewMode} />
        ) : null}

        <Link
          href={previewMode ? "/preview/dashboard/prayer-watch" : "/dashboard/prayer-watch"}
          className="flex items-center justify-between gap-3 rounded-md bg-white p-4 text-left shadow-sm transition-[filter] hover:brightness-95"
        >
          <span className="grid min-w-0 gap-0.5">
            <span className="ppc-heading text-sm font-semibold text-zinc-900">
              Prayer Watch
            </span>
            <span className="text-xs leading-[1.45] text-zinc-500">
              Log the afternoon and evening watches and your Bible reading.
            </span>
          </span>
          <ChevronRightIcon className="size-4 shrink-0 text-(--color-brand-blue)" />
        </Link>
      </div>
    </section>
  );
}

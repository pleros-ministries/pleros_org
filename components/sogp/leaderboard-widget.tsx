"use client";

import { useQuery } from "@tanstack/react-query";
import { TrophyIcon } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/community/avatar";

import { fetchLeaderboard, LEADERBOARD_QUERY_KEY } from "./leaderboard-page";

export function LeaderboardWidget() {
  const { data } = useQuery({
    queryKey: LEADERBOARD_QUERY_KEY,
    queryFn: fetchLeaderboard,
  });

  if (!data) return null;

  const top = data.top.slice(0, 5);

  return (
    <section className="grid gap-3 rounded-[var(--radius-md)] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <TrophyIcon
          className="size-4 text-[var(--color-brand-blue)]"
          strokeWidth={2}
        />
        <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
          Leaderboard
        </h3>
      </div>
      <div className="grid gap-3">
        {data.me ? (
          <p className="text-xs text-zinc-600">
            You&apos;re{" "}
            <strong className="ppc-heading font-semibold text-zinc-900">
              #{data.me.rank}
            </strong>{" "}
            with {data.me.points} points.
          </p>
        ) : null}
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
                    entry.isMe
                      ? "font-semibold text-zinc-900"
                      : "text-zinc-700"
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
          <p className="text-xs text-zinc-500">
            No one is on the leaderboard yet.
          </p>
        )}
        <Link
          href="/dashboard/sogp/leaderboard"
          className="inline-flex h-9 w-fit items-center rounded-full bg-[var(--color-brand-blue)] px-4 text-xs font-semibold text-white"
        >
          View leaderboard
        </Link>
      </div>
    </section>
  );
}

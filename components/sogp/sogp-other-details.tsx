"use client";

import { useState, type ReactNode } from "react";
import { ChevronRightIcon, PenLineIcon, UserPlusIcon, UsersRoundIcon } from "lucide-react";
import Link from "next/link";

import type { SogpJourneyData } from "@/lib/db/queries/sogp-journey";

import { LeaderboardWidget } from "./leaderboard-widget";
import { ShareLearningProgressDialog } from "./share-learning-progress-dialog";

function progressPercent(completed: number, total: number) {
  return total ? Math.round((completed / total) * 100) : 0;
}

function DetailRow({
  title,
  description,
  href,
  onClick,
  icon,
  tone,
}: {
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  icon: ReactNode;
  tone: [string, string];
}) {
  const content = (
    <>
      <span
        className="grid size-9 shrink-0 place-items-center rounded-[10px]"
        style={{ background: tone[0], color: tone[1] }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="grid min-w-0 flex-1">
        <span className="truncate text-[13.5px] font-medium leading-[18px] text-(--color-text-strong)">{title}</span>
        <span className="text-xs leading-4 text-(--color-text-muted)">{description}</span>
      </span>
      <ChevronRightIcon className="size-4 shrink-0 text-[#a6abb2]" />
    </>
  );
  const className =
    "relative flex w-full min-w-0 items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-[#f8f9fb] [li+li>&]:before:absolute [li+li>&]:before:inset-x-3.5 [li+li>&]:before:top-0 [li+li>&]:before:h-px [li+li>&]:before:bg-[var(--color-line,#e7e9ec)] [li+li>&]:before:content-['']";
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={`${className} cursor-pointer`}>
      {content}
    </button>
  );
}

export function SogpOtherDetails({
  data,
  dayNumber,
  preview = false,
}: {
  data: SogpJourneyData;
  dayNumber?: number;
  preview?: boolean;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const metrics = [
    {
      label: "Teachings",
      value: `${data.progress.coreCompleted}/${data.progress.coreTotal}`,
      percent: progressPercent(data.progress.coreCompleted, data.progress.coreTotal),
    },
    {
      label: "Prayer Watch",
      value: `${data.progress.prayerPercent}%`,
      percent: data.progress.prayerPercent,
    },
    {
      label: "Reviews",
      value: `${data.progress.reviewsCompleted}/${data.progress.reviewsTotal}`,
      percent: progressPercent(data.progress.reviewsCompleted, data.progress.reviewsTotal),
    },
  ];

  return (
    <section className="grid min-w-0 gap-3">
      <div className="mx-px -mb-1 flex items-center justify-between gap-3">
        <h2 className="m-0 font-[family-name:var(--font-dashboard-heading)] text-[15px] font-medium leading-[22px] text-(--color-text-strong)">Other details</h2>
      </div>
      <div className="grid gap-3">
        <div className="grid gap-3 rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white px-3.5 py-3">
          <h3 className="m-0 text-[13.5px] font-medium leading-[18px] text-(--color-text-strong)">Course progress</h3>
          {metrics.map((metric) => (
            <div key={metric.label} className="grid gap-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-(--color-text-muted)">{metric.label}</span>
                <strong className="font-[family-name:var(--font-dashboard-heading)] text-[13px] font-medium tabular-nums text-(--color-text-strong)">{metric.value}</strong>
              </div>
              <div className="h-[5px] overflow-hidden rounded-full bg-[#e9edf5]">
                <div
                  className="h-full rounded-full bg-[var(--color-community-blue,#2056d6)]"
                  style={{ width: `${Math.min(100, metric.percent)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <ul className="m-0 list-none overflow-hidden rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white p-0">
          <li>
            <DetailRow
              title="Invite friends"
              description="Share your referral link and follow their progress."
              href="/dashboard/sogp/referrals"
              icon={<UserPlusIcon className="size-4" strokeWidth={2.2} />}
              tone={["#e4ebfd", "#2331ae"]}
            />
          </li>
          <li>
            <DetailRow
              title="Discipleship"
              description="Invite people to your group, follow their progress and check in."
              href={preview ? "/preview/dashboard/sogp/discipleship" : "/dashboard/sogp/discipleship"}
              icon={<UsersRoundIcon className="size-4" strokeWidth={2.2} />}
              tone={["#fde3cf", "#7a3a10"]}
            />
          </li>
          <li>
            <DetailRow
              title="Share what you learnt today"
              description="Turn a reflection into a card and invite others to SOGP."
              onClick={() => setShareOpen(true)}
              icon={<PenLineIcon className="size-4" strokeWidth={2.2} />}
              tone={["#cfe6fb", "#0e3f73"]}
            />
          </li>
        </ul>

        {preview ? null : <LeaderboardWidget />}

      </div>

      <ShareLearningProgressDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        track="sogp"
        dayNumber={dayNumber}
      />
    </section>
  );
}

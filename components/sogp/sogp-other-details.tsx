"use client";

import { useState, type ReactNode } from "react";
import { BellIcon, BellOffIcon, ChevronRightIcon, PenLineIcon, UserPlusIcon, UsersRoundIcon } from "lucide-react";
import Link from "next/link";

import type { SogpJourneyData } from "@/lib/db/queries/sogp-journey";
import { usePushSubscription } from "@/lib/push/use-push";

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

function PrayerWatchReminderCard() {
  const { isSupported, isSubscribed, isPending, subscribe } = usePushSubscription();
  const isConfigured = Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  // Which reminders arrive, and when, is the learner's own choice on the
  // Welcome Pack setup page, so this card describes them in general terms.
  const summary =
    "A notification shortly before each Prayer Watch session you choose, and at your teaching time.";

  return (
    <div className="grid gap-2.5 rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white px-3.5 py-3">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#cfe6fb] text-[#0e3f73]" aria-hidden="true">
          <BellIcon className="size-4" strokeWidth={2.2} />
        </span>
        <h3 className="m-0 text-[13.5px] font-medium leading-[18px] text-(--color-text-strong)">Prayer Watch reminder</h3>
      </div>
      {isSubscribed ? (
        <p className="text-xs leading-[17px] text-(--color-text-muted)">{summary} Reminders are on.</p>
      ) : !isConfigured || !isSupported ? (
        <p className="inline-flex items-center gap-2 text-xs leading-[17px] text-(--color-text-muted)">
          <BellOffIcon className="size-4 shrink-0" />
          {summary} Reminders are being set up.
        </p>
      ) : (
        <>
          <p className="text-xs leading-[17px] text-(--color-text-muted)">{summary}</p>
          <button
            type="button"
            onClick={subscribe}
            disabled={isPending}
            className="inline-flex h-[38px] w-fit max-w-full cursor-pointer items-center rounded-[11px] bg-[var(--color-community-blue,#2056d6)] px-3.5 text-[13.5px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isPending ? "Enabling…" : "Enable Prayer Watch reminders"}
          </button>
        </>
      )}
      <Link
        href="/dashboard/welcomepack/setup"
        className="w-fit text-[12.5px] font-medium text-[var(--color-community-blue,#2056d6)]"
      >
        Manage reminders
      </Link>
    </div>
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

        {preview ? (
          <p className="rounded-[10px] bg-[var(--color-surface-muted,#f4f5f7)] px-3.5 py-3 text-xs text-(--color-text-muted)">
            Preview mode · Prayer Watch reminders are unavailable in this preview.
          </p>
        ) : (
          <PrayerWatchReminderCard />
        )}
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

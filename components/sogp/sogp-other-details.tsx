"use client";

import { useState } from "react";
import { ChevronRightIcon, BellIcon, BellOffIcon } from "lucide-react";
import Link from "next/link";

import type { SogpJourneyData } from "@/lib/db/queries/sogp-journey";
import { usePushSubscription } from "@/lib/push/use-push";

import { LeaderboardWidget } from "./leaderboard-widget";
import { SogpCertificatesCard } from "./sogp-certificates-card";
import { ShareLearningProgressDialog } from "./share-learning-progress-dialog";

function progressPercent(completed: number, total: number) {
  return total ? Math.round((completed / total) * 100) : 0;
}

function DetailRow({
  title,
  description,
  href,
  onClick,
}: {
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="grid min-w-0 gap-0.5">
        <span className="ppc-heading text-sm font-semibold text-zinc-900">{title}</span>
        <span className="text-xs leading-[1.45] text-zinc-500">{description}</span>
      </span>
      <ChevronRightIcon className="size-4 shrink-0 text-[var(--color-brand-blue)]" />
    </>
  );
  const className =
    "flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-white p-4 text-left shadow-sm transition-[filter] hover:brightness-95";
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
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
    <div className="grid gap-3 rounded-[var(--radius-md)] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <BellIcon className="size-4 text-[var(--color-brand-blue)]" />
        <h3 className="ppc-heading text-sm font-semibold text-zinc-900">Prayer Watch reminder</h3>
      </div>
      {isSubscribed ? (
        <p className="text-xs leading-[1.5] text-zinc-500">{summary} Reminders are on.</p>
      ) : !isConfigured || !isSupported ? (
        <p className="inline-flex items-center gap-2 text-xs leading-[1.5] text-zinc-500">
          <BellOffIcon className="size-4 shrink-0" />
          {summary} Reminders are being set up.
        </p>
      ) : (
        <>
          <p className="text-xs leading-[1.5] text-zinc-500">{summary}</p>
          <button
            type="button"
            onClick={subscribe}
            disabled={isPending}
            className="inline-flex h-9 w-fit cursor-pointer items-center rounded-full bg-[var(--color-brand-blue)] px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isPending ? "Enabling…" : "Enable Prayer Watch reminders"}
          </button>
        </>
      )}
      <Link
        href="/dashboard/welcomepack/setup"
        className="w-fit text-xs font-semibold text-[var(--color-brand-blue)] underline underline-offset-4"
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
    <section className="relative left-1/2 right-1/2 w-screen -mx-[50vw] rounded-none bg-[var(--color-brand-sky-soft)] p-4 md:p-5 lg:static lg:left-auto lg:right-auto lg:mx-0 lg:w-auto lg:rounded-[var(--radius-md)]">
      <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">
        Other details
      </p>
      <div className="grid gap-3">
        <div className="grid gap-3.5 rounded-[var(--radius-md)] bg-white p-4 shadow-sm">
          <h3 className="ppc-heading text-sm font-semibold text-zinc-900">Course progress</h3>
          {metrics.map((metric) => (
            <div key={metric.label} className="grid gap-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-zinc-500">{metric.label}</span>
                <strong className="ppc-heading font-semibold text-zinc-900">{metric.value}</strong>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-[var(--color-brand-blue)]"
                  style={{ width: `${Math.min(100, metric.percent)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <SogpCertificatesCard data={data} preview={preview} />

        <DetailRow
          title="Invite friends"
          description="Share your referral link and follow their progress."
          href="/dashboard/sogp/referrals"
        />

        <DetailRow
          title="Discipleship"
          description="Invite people to your group, follow their progress and check in."
          href={preview ? "/preview/dashboard/sogp/discipleship" : "/dashboard/sogp/discipleship"}
        />

        {preview ? null : <LeaderboardWidget />}

        <DetailRow
          title="Share what you learnt today"
          description="Turn a reflection into a card and invite others to SOGP."
          onClick={() => setShareOpen(true)}
        />

        {preview ? (
          <p className="rounded-[var(--radius-md)] bg-white p-4 text-xs text-zinc-500 shadow-sm">
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

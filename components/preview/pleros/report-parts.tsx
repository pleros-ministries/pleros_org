"use client";

import Link from "next/link";
import { BookOpenIcon, ChevronRightIcon, HandHeartIcon, HeadphonesIcon, SunriseIcon, UsersRoundIcon, GraduationCapIcon, MegaphoneIcon, SproutIcon } from "lucide-react";

import { activityKeyNumbers, activityTitle } from "@/lib/community/activity-form";
import { activityWhere } from "@/lib/community/ministry-activities";
import { totalReached, type ActivityLine } from "@/lib/community/ministry-report";
import { cn } from "@/lib/utils";
import {
  REPORT_CATEGORIES,
  meetingRoleLabel,
  type DayReport,
} from "@/lib/preview/pleros/daily-report";
import type { DemoActivity, ReportCategory } from "@/lib/preview/pleros/types";

import { useDemo } from "./demo-context";
import { OverallPill, StatusPill, focusRing, panel, relativeDay } from "./ui";

export const CATEGORY_ICONS: Record<ReportCategory, typeof SunriseIcon> = {
  devotional: SunriseIcon,
  ministry: MegaphoneIcon,
  meetings: UsersRoundIcon,
};

export const SOURCE_ICONS: Record<ActivityLine["key"], typeof SunriseIcon> = {
  prayerWatch: HandHeartIcon,
  bible: BookOpenIcon,
  podcast: HeadphonesIcon,
  sogp: GraduationCapIcon,
};

export const SOURCE_NAMES: Record<ActivityLine["key"], string> = {
  prayerWatch: "Prayer Watch",
  bible: "Bible reading plan",
  podcast: "Podcast journey",
  sogp: "SOGP",
};

/** The fixed source order for devotion: prayer, Bible, podcast, then SOGP. */
export function orderedLines(lines: ActivityLine[]): ActivityLine[] {
  const order: ActivityLine["key"][] = ["prayerWatch", "bible", "podcast", "sogp"];
  return order.map((key) => lines.find((line) => line.key === key)).filter((line): line is ActivityLine => Boolean(line));
}

/** One of the three primary report choices. */
export function CategoryChoice({
  category,
  report,
  summary,
}: {
  category: ReportCategory;
  report: DayReport;
  summary: string;
}) {
  const { href } = useDemo();
  const config = REPORT_CATEGORIES.find((item) => item.key === category)!;
  const Icon = CATEGORY_ICONS[category];
  const status = report.statuses[category];
  return (
    <li>
      <Link
        href={href(`reports/${category}`)}
        className={cn(
          "group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-(--color-surface-muted)/70 sm:px-5",
          focusRing,
          "focus-visible:ring-inset",
        )}
      >
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-2xl transition-colors",
            status === "missing"
              ? "bg-(--color-surface-muted) text-(--color-text-muted)"
              : "bg-(--color-brand-sky) text-(--color-brand-blue)",
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <span className="grid min-w-0 flex-1 gap-0.5">
          <span className="text-[15.5px] font-medium tracking-[-0.01em] text-(--color-text-strong)">
            {config.label}
          </span>
          {summary ? <span className="truncate text-[13px] text-(--color-text-muted)">{summary}</span> : null}
        </span>
        <StatusPill status={status} />
        <ChevronRightIcon
          className="size-4 shrink-0 text-(--color-text-muted) transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </li>
  );
}

export function activityLine(activity: DemoActivity): { title: string; detail: string } {
  const where = activityWhere(activity);
  const role = activity.meetingRole ? `${meetingRoleLabel(activity.meetingRole)}` : null;
  return {
    title: activityTitle(activity),
    detail: [role, where, activityKeyNumbers(activity)].filter(Boolean).join(" · "),
  };
}

/**
 * The full report for one day, under the three choices. It reads the same
 * state as every summary, so it is never a second copy.
 */
export function FullDayReport({ report, owner = true }: { report: DayReport; owner?: boolean }) {
  const { today } = useDemo();
  const recordedReach = report.numbers.reachedOnline + report.numbers.reachedOffline;
  return (
    <details key={report.dateKey} className={cn(panel, "group/full-report overflow-hidden")}>
      <summary className={cn("flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 sm:px-5 [&::-webkit-details-marker]:hidden", focusRing, "focus-visible:ring-inset")}>
        <div className="grid gap-0.5">
          <h2 id="full-report" className="text-[15px] font-medium tracking-[-0.01em] text-(--color-text-strong)">
            Full report · {relativeDay(report.dateKey, today)}
          </h2>
          <p className="text-[12.5px] text-(--color-text-muted)">
            {report.reportedCount} of 3 parts reported
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          <OverallPill status={report.overall} />
          <ChevronRightIcon className="size-4 text-(--color-text-muted) transition-transform duration-200 group-open/full-report:rotate-90 motion-reduce:transition-none" aria-hidden />
        </span>
      </summary>

      <dl className="divide-y divide-(--color-line) border-t border-(--color-line)">
        <ReportSection category="devotional" status={report.statuses.devotional}>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {orderedLines(report.devotionLines).map((line) => {
              const Icon = SOURCE_ICONS[line.key];
              return (
                <li key={line.key} className="flex items-start gap-2 text-[13.5px]">
                  <Icon className="mt-0.5 size-4 shrink-0 text-(--color-text-muted)" strokeWidth={1.75} aria-hidden />
                  <span className={line.detail ? "text-(--color-text)" : "text-(--color-text-muted)"}>
                    <span className="font-medium">{line.label}</span>
                    {owner ? ` · ${line.detail ?? "not recorded"}` : ` · ${line.detail ? "recorded" : "not recorded"}`}
                  </span>
                </li>
              );
            })}
          </ul>
          {report.statuses.devotional === "missing" ? null : null}
        </ReportSection>

        {(["ministry", "meetings"] as const).map((category) => {
          const rows = category === "ministry" ? report.ministry : report.meetings;
          const status = report.statuses[category];
          return (
            <ReportSection key={category} category={category} status={status}>
              {rows.length > 0 ? (
                <ul className="grid gap-2">
                  {rows.map((activity) => {
                    const line = activityLine(activity);
                    return (
                      <li key={activity.id} className="grid gap-0.5">
                        <span className="text-[13.5px] font-medium text-(--color-text-strong)">{line.title}</span>
                        <span className="text-[12.5px] text-(--color-text-muted)">{line.detail}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : status === "nil" ? (
                <p className="text-[13.5px] text-(--color-text)">
                  {category === "meetings" ? "No meeting" : "No ministry activity"}
                </p>
              ) : (
                <p className="text-[13.5px] text-(--color-text-muted)">—</p>
              )}
            </ReportSection>
          );
        })}
      </dl>

      <div className="grid gap-1 border-t border-(--color-line) bg-(--color-surface-muted)/60 px-4 py-3 text-[12.5px] text-(--color-text-muted) sm:px-5">
        <p className="tabular-nums">
          Recorded reach {recordedReach} · Present at meetings {report.numbers.attendance} · Follow-ups{" "}
          {report.numbers.followUps} · Saved {report.numbers.saved}
        </p>
        
        {totalReached(report.numbers) === 0 && report.overall === "complete" ? null : null}
      </div>
    </details>
  );
}

function ReportSection({
  category,
  status,
  children,
}: {
  category: ReportCategory;
  status: DayReport["statuses"][ReportCategory];
  children: React.ReactNode;
}) {
  const config = REPORT_CATEGORIES.find((item) => item.key === category)!;
  return (
    <div className="grid gap-2 px-4 py-4 sm:grid-cols-[180px_1fr] sm:gap-6 sm:px-5">
      <dt className="flex items-center justify-between gap-2 sm:grid sm:content-start sm:justify-start sm:gap-2">
        <span className="text-[13.5px] font-medium text-(--color-text-strong)">{config.short}</span>
        <StatusPill status={status} />
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

export const MINISTRY_ICONS = { outreach: MegaphoneIcon, follow_up: SproutIcon } as const;

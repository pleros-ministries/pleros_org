import Link from "next/link";
import type { DailyReportCategory, DailyReportStatus } from "@/lib/community/daily-report";

import { activityKindLabel } from "@/lib/community/ministry-activities";
import { sumMinistryNumbers, totalReached, type MinistryNumbers } from "@/lib/community/ministry-report";
import type {
  DayActivitySummary,
  MemberActivity,
} from "@/lib/db/queries/ministry-activities";

import { dayHref } from "./day-picker";

export type HistoryDay = {
  dateKey: string;
  activities: MemberActivity[];
  activity: DayActivitySummary;
  statuses?: Record<DailyReportCategory, DailyReportStatus>;
};

type Period = { count: number; totals: MinistryNumbers };



/** The kinds logged that day, e.g. "evangelism, prayer meeting". */
function kindsOf(activities: MemberActivity[]): string {
  const seen = new Set<string>();
  for (const activity of activities) seen.add(activityKindLabel(activity.kind).toLowerCase());
  return [...seen].join(", ");
}

const rangeDay = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const weekdayShort = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });

function dayState(day: HistoryDay): "complete" | "partial" | "missing" {
  const done = day.statuses ? Object.values(day.statuses).filter(status => status !== "missing").length : 0;
  return done === 3 ? "complete" : done ? "partial" : "missing";
}

/**
 * Report history as week cards (mockup C, 17 October): each block of seven
 * days shows which were complete and the week's totals, and opens to its days.
 * The first card is the last 7 days; This month sums the calendar month.
 */
export function ReportHistoryView({
  today,
  reportable,
  days,
  month,
}: {
  today: string;
  /** Days still open for changes; these link back to the day screen. */
  reportable: string[];
  days: HistoryDay[];
  week: Period;
  month: Period;
}) {
  const weeks: HistoryDay[][] = [];
  for (let index = 0; index < days.length; index += 7) weeks.push(days.slice(index, index + 7));
  const label = (chunk: HistoryDay[], index: number) => index === 0 ? "Last 7 days"
    : `${rangeDay.format(new Date(`${chunk.at(-1)!.dateKey}T00:00:00Z`))} – ${rangeDay.format(new Date(`${chunk[0]!.dateKey}T00:00:00Z`))}`;
  return (
    <div className="mx-auto grid w-full max-w-[640px] gap-3">
      <header className="grid gap-0.5">
        <h1 className="m-0">Report history</h1>
        <p className="m-0 text-[12.5px] text-(--color-text-muted)">Your last {weeks.length} weeks</p>
      </header>
      {weeks.map((chunk, index) => {
        const activities = chunk.flatMap(day => day.activities);
        const totals = sumMinistryNumbers(activities);
        const complete = chunk.filter(day => dayState(day) === "complete").length;
        return <details key={chunk[0]!.dateKey} open={index === 0} className="overflow-hidden rounded-[12px] border border-(--dashboard-panel-edge,#e2e5ea) bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3">
            <span className="grid min-w-0"><span className="text-[13.5px] font-semibold">{label(chunk, index)}</span><span className="text-[12px] text-(--color-text-muted)">{complete} of {chunk.length} days complete · {activities.length} {activities.length === 1 ? "activity" : "activities"}</span></span>
            <span className="flex gap-1" aria-hidden="true">{[...chunk].reverse().map(day => {
              const state = dayState(day);
              return <i key={day.dateKey} className="size-2 rounded-[3px]" style={{ background: state === "complete" ? "var(--color-brand-blue)" : state === "partial" ? "#d98a1f" : "#e2e5ea" }} />;
            })}</span>
          </summary>
          <dl className="m-0 grid grid-cols-3 border-t border-(--color-line)">
            {([["Reached", totalReached(totals)], ["Saved", totals.saved], ["Follow-ups", totals.followUps]] as const).map(([name, value], position) => <div key={name} className={`grid gap-px px-3.5 py-2.5 ${position ? "border-l border-(--color-line)" : ""}`}>
              <dd className="m-0 font-[family-name:var(--font-dashboard-heading)] text-[17px] font-medium">{value}</dd>
              <dt className="text-[11px] text-(--color-text-muted)">{name}</dt>
            </div>)}
          </dl>
          <ul className="m-0 list-none border-t border-(--color-line) p-0">
            {chunk.map(day => {
              const state = dayState(day);
              const date = new Date(`${day.dateKey}T00:00:00Z`);
              const kinds = kindsOf(day.activities);
              const body = <>
                <span className="w-9 shrink-0 text-[12px] text-(--color-text-muted)">{weekdayShort.format(date)}</span>
                <span className="min-w-0 flex-1 truncate text-[13px]">{rangeDay.format(date)}{kinds ? <span className="text-(--color-text-muted)"> · {kinds}</span> : null}</span>
                <span className="shrink-0 rounded-full px-2 text-[11px] font-medium leading-5" style={{ background: state === "complete" ? "#e4ebfd" : state === "partial" ? "#f7e4cd" : "#eceef2", color: state === "complete" ? "#2331ae" : state === "partial" ? "#92400e" : "var(--color-text-muted)" }}>{state === "complete" ? "Complete" : state === "partial" ? "Partly" : day.dateKey === today ? "Not yet" : "Missed"}</span>
              </>;
              return <li key={day.dateKey} className="border-t border-(--color-line) first:border-t-0">{reportable.includes(day.dateKey)
                ? <Link href={dayHref(day.dateKey, today)} className="flex items-center gap-2 px-3.5 py-2.5 text-inherit no-underline hover:bg-[#f8f9fb]">{body}</Link>
                : <div className="flex items-center gap-2 px-3.5 py-2.5">{body}</div>}</li>;
            })}
          </ul>
        </details>;
      })}
      <div className="flex items-center justify-between rounded-[10px] bg-[#f6f7f9] px-3.5 py-3 text-[13px]">
        <span>This month</span>
        <span className="text-(--color-text-muted)">{month.count} {month.count === 1 ? "activity" : "activities"} · {totalReached(month.totals)} reached · {month.totals.saved} saved</span>
      </div>
    </div>
  );
}

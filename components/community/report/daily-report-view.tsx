"use client";

import Link from "next/link";
import { clearDailyReportDeclaration, declareDailyReport } from "@/app/(site)/dashboard/community/_actions/daily-report-actions";
import { dailyCategoryStatus, type DailyReportCategory, type DailyReportDeclaration, type DailyReportStatus } from "@/lib/community/daily-report";
import type { ActivityLine } from "@/lib/community/ministry-report";
import type { MemberActivity } from "@/lib/db/queries/ministry-activities";
import { DashboardIcon, StatusPill, type StatusTone } from "@/components/dashboard/v3/primitives";
import { ActivityCard } from "./activity-card";
import { dayHref } from "./day-picker";
import { useReportAction } from "./use-report-action";
import styles from "./daily-report.module.css";

type IconName = Parameters<typeof DashboardIcon>[0]["name"];
const categories: { key: DailyReportCategory; label: string; icon: IconName }[] = [
  { key: "devotional", label: "Devotion", icon: "book" },
  { key: "ministry", label: "Ministry", icon: "heart" },
  { key: "meetings", label: "Meetings", icon: "people" },
];
const devotionalRoutes: Record<ActivityLine["key"], string> = {
  prayerWatch: "/dashboard/prayer-watch", bible: "/dashboard/prayer-watch",
  podcast: "/dashboard/podcast", sogp: "/dashboard/sogp",
};
const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" });
const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
const longDate = (date: Date) => `${weekday.format(date)}, ${dayMonth.format(date)}`;

/** Semantic state per the contract: amber pending, green reported, neutral Nil/not reported. */
function pill(category: DailyReportCategory, status: DailyReportStatus): { label: string; tone: StatusTone } {
  if (status === "reported") return { label: category === "devotional" ? "Confirmed" : "Reported", tone: "green" };
  if (status === "nil") return { label: category === "devotional" ? "Confirmed · nothing logged" : "Nil declared", tone: "neutral" };
  return category === "devotional" ? { label: "Not confirmed", tone: "amber" } : { label: "Not reported", tone: "neutral" };
}

function plural(n: number, one: string, many: string) { return `${n} ${n === 1 ? one : many}`; }


/** Authenticated reporting presentation; every fact comes from the existing owner-scoped loaders. */
export function DailyReportView({ today, days, selected, activities, pleros, declarations, meetingDetails, enabled, flash, week = null }: {
  today: string; days: string[]; selected: string; activities: MemberActivity[]; pleros: ActivityLine[];
  declarations: { category: string; declaration: string }[];
  meetingDetails: { activityId: number; reportingRole: string; taught: string | null; shared?: boolean; attended?: boolean; peopleBrought?: number; totalAttendance?: number | null }[]; enabled: boolean;
  flash: "saved" | "removed" | null;
  /** Each recent day's state for the week strip. */
  week?: Record<string, "complete" | "partial" | "missing"> | null;
}) {
  const { run, pending, error } = useReportAction();
  const writable = days.includes(selected);
  const ministry = activities.filter((activity) => activity.kind === "outreach" || activity.kind === "follow_up");
  const meetings = activities.filter((activity) => activity.kind !== "outreach" && activity.kind !== "follow_up");
  const recorded = pleros.filter((line) => Boolean(line.detail)).length;
  const statuses = Object.fromEntries(categories.map(({ key }) => [key, dailyCategoryStatus({
    category: key, declaration: (declarations.find((row) => row.category === key)?.declaration ?? null) as DailyReportDeclaration | null,
    activityCount: key === "ministry" ? ministry.length : key === "meetings" ? meetings.length : 0,
    hasDevotionalActivity: recorded > 0,
  })])) as Record<DailyReportCategory, DailyReportStatus>;
  const reported = Object.values(statuses).filter((status) => status !== "missing").length;
  const addHref = `/dashboard/community/report/new?day=${encodeURIComponent(selected)}`;
  const declare = (category: DailyReportCategory) => run(() => declareDailyReport({ dateKey: selected, category, declaration: category === "devotional" ? "confirmed" : "nil" }));
  const undo = (category: DailyReportCategory) => run(() => clearDailyReportDeclaration({ dateKey: selected, category }));
  const subtitle = (key: DailyReportCategory) => key === "devotional"
    ? `${plural(recorded, "activity", "activities")} logged for ${selected === today ? "today" : "this day"}`
    : statuses[key] === "nil" ? "No activity declared"
      : key === "ministry" ? (ministry.length ? `${plural(ministry.length, "activity", "activities")} recorded` : "Nothing recorded yet")
        : meetings.length ? `${plural(meetings.length, "meeting", "meetings")} recorded` : "Nothing recorded yet";

  // Mockup A (17 October): the week at a glance, one bar for the day, and each
  // category ends with its two choices: log it, or say there was nothing.
  const reportedCount = reported;
  return <div className={styles.page}>
    <header className={styles.dayHeader}>
      <div><h1>My reports</h1><p className={styles.meta}>{longDate(new Date(`${selected}T00:00:00Z`))}</p></div>
      <Link href="/dashboard/community/report/history" className={styles.secondary} style={{ minHeight: 32, padding: "0 12px", fontSize: 12.5 }}>History</Link>
    </header>
    {week ? <nav aria-label="Choose a day" className="grid grid-cols-7 gap-1 rounded-[10px] border border-(--color-line) bg-white p-1.5">
      {days.slice().reverse().slice(-7).map(dateKey => {
        const date = new Date(`${dateKey}T00:00:00Z`);
        const state = week[dateKey];
        const tone = state === "complete" ? "var(--color-brand-blue)" : state === "partial" ? "#d98a1f" : dateKey === today ? "#e2e5ea" : "#c94a4a";
        return <Link key={dateKey} href={dayHref(dateKey, today)} aria-current={dateKey === selected ? "page" : undefined} aria-label={`${longDate(date)}: ${state ?? "not reported"}`}
          className="grid justify-items-center gap-0.5 rounded-[10px] py-1.5 text-[11px] text-(--color-text-muted) no-underline aria-[current=page]:bg-[#e4ebfd] aria-[current=page]:font-semibold aria-[current=page]:text-(--color-brand-blue)">
          <span>{weekday.format(date).slice(0, 1)}</span>
          <b className="font-[family-name:var(--font-dashboard-heading)] text-[14px] font-medium text-(--color-text-strong)">{date.getUTCDate()}</b>
          <i className="size-1.5 rounded-full" style={{ background: tone }} aria-hidden="true" />
        </Link>;
      })}
    </nav> : null}
    {!writable ? <p className={styles.meta}>This day is view only. Reports can be changed for today and the previous seven days.</p> : null}

    <section aria-label="Report progress" className="flex items-center gap-2.5 rounded-[10px] border border-(--color-line) bg-white px-3.5 py-3 text-[13px]">
      <span><b className="font-semibold">{reportedCount} of 3</b> reported {selected === today ? "today" : "this day"}</span>
      <span className="ml-auto flex gap-1" aria-hidden="true">{[0, 1, 2].map(index => <i key={index} className="h-1.5 w-[22px] rounded-full" style={{ background: index < reportedCount ? "var(--color-brand-blue)" : "#e2e5ea" }} />)}</span>
    </section>

    {flash ? <p role="status" className={styles.status}>{flash === "saved" ? "Activity saved." : "Activity removed."}</p> : null}
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}

    {categories.map(({ key, label, icon }) => {
      const state = pill(key, statuses[key]);
      const items = key === "ministry" ? ministry : meetings;
      const declared = declarations.some((row) => row.category === key);
      return <section key={`${selected}:${key}`} className={styles.card}>
        <div className={styles.cardHead}>
          <DashboardIcon name={icon} />
          <span className={styles.cardTitle}><strong>{label}</strong>{key === "devotional" ? null : <span className={styles.meta}>{subtitle(key)}</span>}</span>
          <StatusPill tone={state.tone}>{state.label}</StatusPill>
        </div>
        <div className={styles.cardBody} data-plain={key === "devotional" ? undefined : ""}>
          {key === "devotional" ? <>
            <ul className={styles.lines}>{pleros.map((line) => <li key={line.key}><Link className={styles.line} href={`${devotionalRoutes[line.key]}?date=${encodeURIComponent(selected)}${line.key === "bible" ? "&tab=bible" : ""}`}>
              <span className={line.detail ? styles.done : styles.notDone}><DashboardIcon name={line.detail ? "circlecheck" : "clock"} size={16} /></span>
              <span><strong>{line.label}</strong><span className={styles.meta}>{line.detail ?? "Not recorded"}</span></span>
              <DashboardIcon name="right" size={16} />
            </Link></li>)}</ul>
            {enabled && writable && statuses.devotional === "missing" ? <button type="button" className={styles.primary} disabled={pending} onClick={() => declare("devotional")}>Confirm devotion report<DashboardIcon name="check" /></button> : null}
          </> : <>
            {items.length ? <ul className={styles.activities}>{items.map((activity) => <ActivityCard key={activity.id} activity={activity} meetingDetails={meetingDetails.find((row) => row.activityId === activity.id)} today={today} canChange={writable} />)}</ul> : null}
            {writable ? <div className="flex flex-wrap justify-end gap-2">
              {enabled && statuses[key] === "missing" ? <button type="button" className={styles.secondary} style={{ minHeight: 32, padding: "0 12px", fontSize: 12.5 }} disabled={pending} onClick={() => declare(key)}>Nothing {selected === today ? "today" : "this day"}</button> : null}
              <Link href={`${addHref}&category=${key}`} className={styles.primary} style={{ minHeight: 32, padding: "0 12px", fontSize: 12.5, width: "auto" }}>+ {key === "ministry" ? "Log ministry" : "Log a meeting"}</Link>
            </div> : null}
          </>}
          {enabled && writable && declared ? <button type="button" className={styles.quiet} disabled={pending} onClick={() => undo(key)}>Undo {key === "devotional" ? "confirmation" : "“nothing”"}</button> : null}
        </div>
      </section>;
    })}

    {writable ? <p className={styles.meta}>You can report for today and the past 7 days. We’ll remind you at 8 pm if anything’s missing.</p> : null}
  </div>;
}

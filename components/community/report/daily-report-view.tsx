"use client";

import Link from "next/link";
import { useState } from "react";
import { clearDailyReportDeclaration, declareDailyReport } from "@/app/(site)/dashboard/community/_actions/daily-report-actions";
import { dailyCategoryStatus, type DailyReportCategory, type DailyReportDeclaration, type DailyReportStatus } from "@/lib/community/daily-report";
import type { ActivityLine } from "@/lib/community/ministry-report";
import type { MemberActivity } from "@/lib/db/queries/ministry-activities";
import { DashboardIcon, StatusPill, type StatusTone } from "@/components/dashboard/v3/primitives";
import { ActivityCard } from "./activity-card";
import { dayHref, dayName } from "./day-picker";
import { useReportAction } from "./use-report-action";
import styles from "./daily-report.module.css";

type IconName = Parameters<typeof DashboardIcon>[0]["name"];
const categories: { key: DailyReportCategory; label: string; icon: IconName }[] = [
  { key: "devotional", label: "Devotional", icon: "book" },
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

function Ring({ value, total }: { value: number; total: number }) {
  const r = 19, c = 2 * Math.PI * r;
  return <span className={styles.ring} aria-hidden="true"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r={r} fill="none" stroke="var(--color-line)" strokeWidth="3" /><circle cx="22" cy="22" r={r} fill="none" stroke="var(--color-brand-blue)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${c * value / total} ${c}`} /></svg><span>{value}/{total}</span></span>;
}

/** Authenticated reporting presentation; every fact comes from the existing owner-scoped loaders. */
export function DailyReportView({ today, days, selected, activities, pleros, declarations, meetingDetails, enabled, flash }: {
  today: string; days: string[]; selected: string; activities: MemberActivity[]; pleros: ActivityLine[];
  declarations: { category: string; declaration: string }[];
  meetingDetails: { activityId: number; reportingRole: string; taught: string | null; shared?: boolean; attended?: boolean; peopleBrought?: number; totalAttendance?: number | null }[]; enabled: boolean;
  flash: "saved" | "removed" | null;
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
  const [open, setOpen] = useState<Record<DailyReportCategory, boolean>>({ devotional: statuses.devotional === "missing", ministry: false, meetings: false });
  const [choosingDay, setChoosingDay] = useState(false);
  const addHref = `/dashboard/community/report/new?day=${encodeURIComponent(selected)}`;
  const declare = (category: DailyReportCategory) => run(() => declareDailyReport({ dateKey: selected, category, declaration: category === "devotional" ? "confirmed" : "nil" }));
  const undo = (category: DailyReportCategory) => run(() => clearDailyReportDeclaration({ dateKey: selected, category }));
  const subtitle = (key: DailyReportCategory) => key === "devotional"
    ? `${plural(recorded, "activity", "activities")} logged for ${selected === today ? "today" : "this day"}`
    : statuses[key] === "nil" ? "No activity declared"
      : key === "ministry" ? (ministry.length ? `${plural(ministry.length, "activity", "activities")} recorded` : "Nothing recorded yet")
        : meetings.length ? `${plural(meetings.length, "meeting", "meetings")} recorded` : "Nothing recorded yet";

  return <div className={styles.page}>
    <header className={styles.dayHeader}>
      <div><p className={styles.meta}>Selected day · Lagos time</p><h1>{longDate(new Date(`${selected}T00:00:00Z`))}</h1></div>
      <button type="button" className={styles.iconButton} aria-label="Choose a day" aria-expanded={choosingDay} onClick={() => setChoosingDay((value) => !value)}><DashboardIcon name="calendar" /></button>
    </header>
    {choosingDay ? <nav aria-label="Choose a day" className={styles.days}>
      {days.map((dateKey) => <Link key={dateKey} href={dayHref(dateKey, today)} aria-current={dateKey === selected ? "page" : undefined}>{dayName(dateKey, today)}</Link>)}
      <Link href="/dashboard/community/report/history">Older days</Link>
    </nav> : null}
    {!writable ? <p className={styles.meta}>This day is view only. Reports can be changed for today and the previous seven days.</p> : null}

    <section className={styles.summary} aria-label="Report progress">
      <Ring value={reported} total={3} />
      <div><strong>{reported} of 3 categories reported</strong><p className={styles.meta}>Nil: saved no-activity declaration.</p><p className={styles.meta}>Missing: no report submitted.</p></div>
    </section>

    {flash ? <p role="status" className={styles.status}>{flash === "saved" ? "Activity saved." : "Activity removed."}</p> : null}
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}

    {categories.map(({ key, label, icon }) => {
      const state = pill(key, statuses[key]);
      const items = key === "ministry" ? ministry : meetings;
      const declared = declarations.some((row) => row.category === key);
      return <section key={`${selected}:${key}`} className={styles.card}>
        <button type="button" className={styles.cardHead} aria-expanded={open[key]} onClick={() => setOpen((value) => ({ ...value, [key]: !value[key] }))}>
          <DashboardIcon name={icon} />
          <span className={styles.cardTitle}><strong>{label}</strong><span className={styles.meta}>{subtitle(key)}</span></span>
          <StatusPill tone={state.tone}>{state.label}</StatusPill>
        </button>
        {open[key] ? <div className={styles.cardBody}>
          {key === "devotional" ? <>
            <ul className={styles.lines}>{pleros.map((line) => <li key={line.key}><Link className={styles.line} href={`${devotionalRoutes[line.key]}?date=${encodeURIComponent(selected)}${line.key === "bible" ? "&tab=bible" : ""}`}>
              <span className={line.detail ? styles.done : styles.notDone}><DashboardIcon name={line.detail ? "circlecheck" : "clock"} size={16} /></span>
              <span><strong>{line.label}</strong><span className={styles.meta}>{line.detail ?? "Not recorded"}</span></span>
              <DashboardIcon name="right" size={16} />
            </Link></li>)}</ul>
            {enabled && writable && statuses.devotional === "missing" ? <><p>Confirm this day’s activities.</p><button type="button" className={styles.primary} disabled={pending} onClick={() => declare("devotional")}>Confirm devotional report<DashboardIcon name="check" /></button></> : null}
          </> : <>
            {items.length ? <ul className={styles.activities}>{items.map((activity) => <ActivityCard key={activity.id} activity={activity} meetingDetails={meetingDetails.find((row) => row.activityId === activity.id)} today={today} canChange={writable} />)}</ul> : null}
            {writable ? <div className={styles.actions}>
              <Link href={`${addHref}&category=${key}`} className={styles.secondary}>{key === "ministry" ? "Add activity" : "Add meeting report"}</Link>
              {enabled && statuses[key] === "missing" ? <button type="button" className={styles.secondary} disabled={pending} onClick={() => declare(key)}>Declare Nil</button> : null}
            </div> : null}
          </>}
          {enabled && writable && declared ? <button type="button" className={styles.quiet} disabled={pending} onClick={() => undo(key)}>Undo {key === "devotional" ? "confirmation" : "Nil"}</button> : null}
        </div> : null}
      </section>;
    })}

    <Link className={styles.history} href="/dashboard/community/report/history">View report history →</Link>
  </div>;
}

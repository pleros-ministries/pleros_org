"use client";

import Link from "next/link";
import { ChevronDownIcon, SunriseIcon, MegaphoneIcon, UsersRoundIcon } from "lucide-react";
import { clearDailyReportDeclaration, declareDailyReport } from "@/app/(site)/dashboard/community/_actions/daily-report-actions";
import { dailyCategoryStatus, type DailyReportCategory, type DailyReportDeclaration, type DailyReportStatus } from "@/lib/community/daily-report";
import type { ActivityLine } from "@/lib/community/ministry-report";
import type { MemberActivity } from "@/lib/db/queries/ministry-activities";
import { dateKeyLabel } from "@/lib/community/time";
import { compactButton, focusRing, primaryButton } from "@/components/dashboard/shell/styles";
import { ActivityCard } from "./activity-card";
import { DayPicker } from "./day-picker";
import { ReportTabs } from "./report-tabs";
import { useReportAction } from "./use-report-action";

const categories = [
  { key: "devotional", label: "Devotional reports", icon: SunriseIcon },
  { key: "ministry", label: "Ministry reports", icon: MegaphoneIcon },
  { key: "meetings", label: "Meetings reports", icon: UsersRoundIcon },
] as const;
const statusLabel: Record<DailyReportStatus, string> = { reported: "Reported", nil: "Nil", missing: "Not yet" };
const devotionalRoutes: Record<ActivityLine["key"], string> = {
  prayerWatch: "/dashboard/prayer-watch", bible: "/dashboard/prayer-watch",
  podcast: "/dashboard/podcast", sogp: "/dashboard/sogp",
};

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
  const addHref = `/dashboard/community/report/new?day=${encodeURIComponent(selected)}`;
  function declare(category: DailyReportCategory) {
    run(() => declareDailyReport({ dateKey: selected, category, declaration: category === "devotional" ? "confirmed" : "nil" }));
  }
  return <div className="grid gap-6 text-(--color-text)">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="grid gap-1"><p className="text-[10px] uppercase tracking-wider text-(--color-text-muted)">{dateKeyLabel(selected)}</p><h1 className="font-medium text-(--color-text-strong)">Daily reports</h1></div>
      <span className="rounded-md bg-(--color-brand-sky) px-2 py-1 text-[12px] text-(--color-brand-blue)">{reported === 3 ? "Complete" : reported ? "In progress" : "Not started"}</span>
    </header>
    <ReportTabs active="report" />
    <div className="overflow-x-auto pb-1"><DayPicker today={today} days={days} selected={selected} /></div>
    {flash ? <p role="status" className="text-[13px] text-(--color-brand-blue)">{flash === "saved" ? "Activity saved." : "Activity removed."}</p> : null}
    {error ? <p role="alert" className="text-[13px] text-red-700">{error}</p> : null}
    <section className="overflow-hidden rounded-xl border border-(--color-line) bg-white">
      {categories.map(({ key, label, icon: Icon }) => <details key={`${selected}:${key}`} className="group border-b border-(--color-line) last:border-b-0">
        <summary className={`flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden ${focusRing}`}>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-(--color-brand-sky) text-(--color-brand-blue)"><Icon className="size-5" aria-hidden /></span>
          <span className="min-w-0 flex-1 text-[15px] font-medium text-(--color-text-strong)">{label}</span>
          <span className="text-[12px] text-(--color-text-muted)">{statusLabel[statuses[key]]}</span>
          <ChevronDownIcon className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
        </summary>
        <div className="grid gap-3 border-t border-(--color-line) p-4">
          {key === "devotional" ? <>
            <ul className="grid gap-3">{pleros.map((line) => <li key={line.key} className="flex items-start justify-between gap-3 text-[13px]"><span><span className="font-medium">{line.label}</span><span className="block text-(--color-text-muted)">{line.detail ?? "Not recorded"}</span></span><Link href={`${devotionalRoutes[line.key]}?date=${encodeURIComponent(selected)}${line.key === "bible" ? "&tab=bible" : ""}`} className={compactButton}>Open</Link></li>)}</ul>
            {enabled && writable && statuses.devotional === "missing" ? <button type="button" className={`${primaryButton} w-fit`} disabled={pending} onClick={() => declare(key)}>Confirm devotional report</button> : null}
          </> : <>
            <ul className="grid gap-3">{(key === "ministry" ? ministry : meetings).map((activity) => <ActivityCard key={activity.id} activity={activity} meetingDetails={meetingDetails.find((row) => row.activityId === activity.id)} today={today} canChange={writable} />)}</ul>
            {!(key === "ministry" ? ministry : meetings).length ? <p className="text-[13px] text-(--color-text-muted)">{key === "ministry" ? "No ministry activity" : "No meeting"}</p> : null}
            {writable ? <div className="flex flex-wrap gap-2"><Link href={`${addHref}&category=${key}`} className={primaryButton}>Add {key === "ministry" ? "activity" : "meeting"}</Link>{enabled && statuses[key] === "missing" ? <button type="button" disabled={pending} onClick={() => declare(key)} className={compactButton}>Record Nil</button> : null}</div> : null}
          </>}
          {enabled && writable && declarations.some((row) => row.category === key) ? <button type="button" disabled={pending} className={`${compactButton} w-fit`} onClick={() => run(() => clearDailyReportDeclaration({ dateKey: selected, category: key }))}>Undo {key === "devotional" ? "confirmation" : "Nil"}</button> : null}
        </div>
      </details>)}
    </section>
    <details key={selected} className="group rounded-xl border border-(--color-line) bg-white">
      <summary className={`flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden ${focusRing}`}><span><span className="block text-[15px] font-medium">Full report · {selected === today ? "Today" : dateKeyLabel(selected)}</span><span className="text-[12.5px] text-(--color-text-muted)">{reported} of 3 parts reported</span></span><ChevronDownIcon className="size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden /></summary>
      <div className="grid gap-4 border-t border-(--color-line) p-4">{categories.map(({ key, label }) => <section key={key} className="grid gap-2"><h2 className="flex items-center justify-between gap-2 font-medium">{label}<span className="text-[12px] font-normal text-(--color-text-muted)">{statusLabel[statuses[key]]}</span></h2>{key === "devotional" ? <ul className="grid gap-1 text-[13px]">{pleros.map((line) => <li key={line.key}>{line.label} · {line.detail ?? "not recorded"}</li>)}</ul> : <ul className="grid gap-3">{(key === "ministry" ? ministry : meetings).map((activity) => <ActivityCard key={activity.id} activity={activity} meetingDetails={meetingDetails.find((row) => row.activityId === activity.id)} today={today} canChange={false} />)}</ul>}</section>)}</div>
    </details>
  </div>;
}

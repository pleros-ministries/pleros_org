import Link from "next/link";
import { connection } from "next/server";

import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { DailyReportSections } from "@/components/community/report/daily-report-sections";
import { emptyMinistryNumbers, reportableDateKeys } from "@/lib/community/ministry-report";
import type { MemberActivity } from "@/lib/db/queries/ministry-activities";
import { lagosToday } from "@/lib/sogp/daily-date";

export const metadata = { title: "My reports preview", robots: { index: false, follow: false } };

// Reads the clock and searchParams on every request (Cache Components).
export const instant = false;

/** Venues someone has saved before (`?venues=1`); without it, it's their first meeting. */
const SAMPLE_VENUES = ["Church hall", "Online (Zoom)", "Yaba campus"];

/**
 * The real My reports on sample data, in preview mode: answers and meetings
 * show on screen only and nothing is saved. `?state=answered` shows a day
 * with evangelism done, discipleship No and a meeting led.
 */
export default async function ReportYesNoPreview({ searchParams }: { searchParams: Promise<{ venues?: string; state?: string }> }) {
  await connection();
  const params = await searchParams;
  const used = params.venues === "1", answered = params.state === "answered";
  const today = lagosToday();
  const activity = (id: number, kind: MemberActivity["kind"], extra: Partial<MemberActivity>): MemberActivity => ({ ...emptyMinistryNumbers(), id, activityDate: today, kind, title: null, mode: null, platform: null, location: null, note: null, peopleCount: 0, ...extra });
  const activities = answered ? [
    activity(1, "outreach", { mode: "offline", location: "Yaba market", reachedOffline: 3, saved: 1, peopleCount: 3 }),
    activity(2, "teaching_meeting", { title: "Faith that works", location: "Church hall", attendance: 23 }),
  ] : [];
  const link = (label: string, href: string, on: boolean) => <Link href={href} className={on ? "font-medium text-(--color-community-ink)" : "underline"}>{label}</Link>;
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)]`} data-dashboard-v3>
    <div className="grid gap-1 px-4 py-2 text-xs text-(--color-text-muted)">
      <span>Preview · My reports · sample data · nothing saved</span>
      <span className="flex flex-wrap gap-x-3">{link("A new day", `?venues=${used ? 1 : 0}`, !answered)}{link("Answered", `?state=answered&venues=${used ? 1 : 0}`, answered)}</span>
      <span className="flex flex-wrap gap-x-3">{link("No venues yet", `?state=${answered ? "answered" : ""}&venues=0`, !used)}{link("Has used venues", `?state=${answered ? "answered" : ""}&venues=1`, used)}</span>
    </div>
    <div className="mx-auto w-full max-w-[640px] px-4 pt-[18px] pb-7 [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium">
      <DailyReportSections key={`${answered}-${used}`} preview inline enabled={false} today={today} days={reportableDateKeys(today)} selected={today}
        activities={activities} declarations={[]} meetingDetails={[]} pleros={[]}
        noReasons={answered ? { discipleship: "I was travelling" } : {}}
        meetingReports={answered ? [{ activityId: 2, role: "led", startsAt: "18:00", endsAt: "19:30", workers: 3, members: 20, peopleBrought: 0 }] : []}
        venues={used ? SAMPLE_VENUES : []} />
    </div>
  </div>;
}

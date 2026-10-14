import { dashboardFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { DailyReportView } from "@/components/community/report/daily-report-view";
import { emptyMinistryNumbers, reportableDateKeys } from "@/lib/community/ministry-report";
import { lagosToday } from "@/lib/sogp/daily-date";

export const metadata = { title: "Daily report visual preview", robots: { index: false, follow: false } };

/** Labelled sample data. Buttons call live actions, which refuse without a session. */
export default function DailyReportPreview() {
  const today = lagosToday();
  return <div className={`${dashboardFont.className} ${styles.root}`} data-dashboard-v3><p className="px-4 py-2 text-xs text-(--color-text-muted)">Visual preview · sample data · nothing saved</p><div className="px-4 pb-8">
    <DailyReportView today={today} days={reportableDateKeys(today)} selected={today} enabled flash={null}
      pleros={[{ key: "prayerWatch", label: "Prayer Watch", detail: "6 am session · 30 minutes" }, { key: "bible", label: "Bible reading", detail: "Romans 8 · 15 minutes" }, { key: "podcast", label: "Podcast", detail: "Walking in love · 22 minutes" }]}
      declarations={[{ category: "ministry", declaration: "nil" }]}
      activities={[{ ...emptyMinistryNumbers(), id: 1, activityDate: today, kind: "teaching_meeting", title: "Sunday teaching", mode: null, platform: null, location: "Ikeja branch", note: null, peopleCount: 0, attendance: 24 }]}
      meetingDetails={[{ activityId: 1, reportingRole: "worker", taught: null, shared: true, attended: true, peopleBrought: 2, totalAttendance: null }]} />
  </div></div>;
}

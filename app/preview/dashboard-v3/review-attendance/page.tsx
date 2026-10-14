import Link from "next/link";
import { GroupReviewAttendance } from "@/components/sogp/group-review-attendance";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import { dashboardFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
export const metadata = { title: "Review attendance visual preview", robots: { index: false, follow: false } };
export default function AttendancePreviewPage() {
  return <div className={`${dashboardFont.className} ${styles.root}`} data-dashboard-v3>
    <p className="px-4 py-2 text-xs text-(--color-text-muted)">Visual preview · sample data · no attendance saved</p>
    <header className={styles.header}><Link className={styles.iconButton} href="/preview/dashboard-v3" aria-label="Back to preview"><DashboardIcon name="left" /></Link><span>Confirm attendance</span><span className={styles.iconButton} aria-hidden="true"><DashboardIcon name="more" /></span></header>
    <GroupReviewAttendance preview data={{ id: 1, groupId: 1, title: "Week 2 · The life of faith", groupName: "Tolu’s discipleship group", startsAt: "2026-10-10T16:00:00Z", endsAt: "2026-10-10T17:00:00Z", venue: "Yaba fellowship hall", leaderName: "Tolu", learners: [{ enrollmentId: 1, name: "Amara", path: "traditional", status: null }, { enrollmentId: 2, name: "Kemi", path: "podcast_one", status: null }, { enrollmentId: 3, name: "David", path: "podcast_two", status: null }] }} />
  </div>;
}

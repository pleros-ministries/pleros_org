import Link from "next/link";
import { FollowUpRequest } from "@/components/sogp/follow-up-request";
import { SogpQueryProvider } from "@/components/sogp/sogp-query-provider";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import { dashboardFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";

export const metadata = { title: "Follow-up request visual preview", robots: { index: false, follow: false } };
export default function FollowUpPreviewPage() {
  return <div className={`${dashboardFont.className} ${styles.root}`} data-dashboard-v3>
    <p className="px-4 py-2 text-xs text-(--color-text-muted)">Visual preview · sample data · no requests sent</p>
    <header className={styles.header}><Link className={styles.iconButton} href="/preview/dashboard-v3" aria-label="Back to preview"><DashboardIcon name="left" /></Link><span>Follow-up request</span><span className={styles.iconButton} aria-hidden="true"><DashboardIcon name="more" /></span></header>
    <SogpQueryProvider><FollowUpRequest preview data={{ currentName: "Efe Daniels", assignedBy: "Assigned by location · Lagos", canRequest: false, request: { reason: "I’d prefer someone in my time zone.", status: "pending", createdAt: "2026-10-14T07:45:00.000Z" } }} /></SogpQueryProvider>
  </div>;
}

import Link from "next/link";
import { MakeUpPreview } from "@/components/sogp/group-review-make-up-preview";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import { dashboardFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
export const metadata={title:"Make-up review visual preview",robots:{index:false,follow:false}};
export default function MakeUpPreviewPage() {
  return <div className={`${dashboardFont.className} ${styles.root}`} data-dashboard-v3><p className="px-4 py-2 text-xs text-(--color-text-muted)">Visual preview · sample data · no choice or attendance saved</p><header className={styles.header}><Link className={styles.iconButton} href="/preview/dashboard-v3" aria-label="Back to preview"><DashboardIcon name="left" /></Link><span>Make up a review</span><span className={styles.iconButton} aria-hidden="true"><DashboardIcon name="more" /></span></header><MakeUpPreview /></div>;
}

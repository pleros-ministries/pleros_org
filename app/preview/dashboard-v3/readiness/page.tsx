import Link from "next/link";
import { CertificationReadiness } from "@/components/sogp/certification-readiness";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import { dashboardFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import type { CertificationFacts } from "@/lib/db/queries/sogp-certification-facts";

export const metadata={title:"Readiness visual preview",robots:{index:false,follow:false}};

const sample:CertificationFacts={
  pathLabel:"One podcast a day",podcast:true,learningDone:12,learningTotal:30,learningPass:false,learningLabel:"Episodes listened in your saved plan",
  resumeHref:"/preview/dashboard-v3/readiness",reviews:{attended:2,missed:1,madeUp:0,outstandingMakeups:1,owed:3,outstanding:1,reviewPass:false},
  prayer:{present:20,total:28,percent:71,required:80,pass:false},meetsRequirements:false,certificateAvailable:false,
};

export default function ReadinessPreviewPage() {
  return <div className={`${dashboardFont.className} ${styles.root}`} data-dashboard-v3><p className="px-4 py-2 text-xs text-(--color-text-muted)">Visual preview · sample data · nothing saved</p><header className={styles.header}><Link className={styles.iconButton} href="/preview/dashboard-v3" aria-label="Back to preview"><DashboardIcon name="left" /></Link><span>Your readiness</span><span className={styles.iconButton} aria-hidden="true"><DashboardIcon name="more" /></span></header><CertificationReadiness data={sample} name="Sample learner" /></div>;
}

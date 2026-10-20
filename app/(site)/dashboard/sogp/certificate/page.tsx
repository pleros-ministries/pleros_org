import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, Download } from "lucide-react";

import { getAppSession } from "@/lib/app-session";
import { getSogpDashboardData } from "@/lib/db/queries/sogp";
import styles from "@/components/sogp/learning-tools.module.css";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function SogpCertificatePage() {
  const session = await getAppSession();
  if (!session) redirect("/sogp/enrol");
  const data = await getSogpDashboardData(session.user.id);
  if (!data?.certificate || data.certificate.revokedAt) redirect("/dashboard/sogp");
  return <section className={styles.page}>
    <header className={styles.heading}>
      <h1>Your certificate is ready</h1>
      <p className={styles.sub}>School of God&apos;s Purpose · celebrate your completion and keep your digital certificate.</p>
    </header>
    <div className={styles.panel}>
      <div className={styles.row}>
        <span className={styles.chip} data-tone="amber"><Award className="size-4" strokeWidth={2.2} aria-hidden /></span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>SOGP certificate</span><span className={styles.rowMeta}>Verification code {data.certificate.verificationCode}</span></span>
        <span className={styles.pill} data-tone="done">Issued</span>
      </div>
      <div className={styles.panelBody} style={{ paddingTop: 0 }}>
        <a href={`/api/sogp/certificate/${data.certificate.verificationCode}`} className={styles.btn} data-block=""><Download className="size-4" aria-hidden /> Download certificate</a>
      </div>
    </div>
    <Link href="/dashboard/sogp" className={styles.textBtn}>Back to Learning</Link>
  </section>;
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DashboardHomeData } from "@/lib/dashboard/home";
import { DashboardIcon, LearningCard, ReportRow } from "./primitives";
import styles from "./dashboard.module.css";

export function DashboardHomeView({ name, greeting, data }: { name?: string; greeting: string; data: DashboardHomeData }) {
  const router = useRouter();
  const dayHref = `/dashboard/community/report?day=${encodeURIComponent(data.day)}`;
  const planHref = data.learning.enrolled ? "/dashboard/sogp" : "/sogp";
  const unit = data.learning.unit ?? "tracks";
  return <div className={styles.content}>
    <h1 className={styles.greeting} data-dashboard-greeting>{name ? `${greeting}, ${name}` : greeting}</h1>
    <section className={styles.learning} aria-label="Continue learning">
      <div className={styles.sectionHeader}><h2>{data.learning.enrolled ? "Continue learning" : "Start learning"}</h2><Link className={styles.textAction} href={planHref}>{data.learning.enrolled ? "View plan" : "About SOGP"}</Link></div>
      <LearningCard onContinue={() => router.push(data.learning.href)} actionLabel={data.learning.action} lesson={{
        title: data.learning.title, pathLabel: data.learning.pathLabel ?? "SOGP", elapsedSeconds: data.learning.completed, durationSeconds: data.learning.total,
        elapsedLabel: String(data.learning.completed), durationLabel: String(data.learning.total), progressLabel: "SOGP progress",
        leftLabel: data.learning.total > 0 ? `${data.learning.completed} complete` : "Your learning journey",
        rightLabel: data.learning.total > 0 ? `${data.learning.total} ${unit}` : "",
      }} />
      <Link className={styles.planRow} href={planHref}><span className={styles.rowIcon}><DashboardIcon name="book" /></span><span className={styles.rowCopy}><span className={styles.rowTitle}>My SOGP</span><span className={styles.metadata}>{data.learning.total > 0 ? `${data.learning.completed} of ${data.learning.total} ${unit} complete` : "Your learning and reviews"}</span></span><span className={styles.rowIcon}><DashboardIcon name="right" size={16} /></span></Link>
    </section>
    {data.reports ? <section className={styles.reports} aria-label="My reports">
      <div className={styles.sectionHeader}><h2>My reports</h2><Link href={dayHref} className={styles.textAction}>View day</Link></div>
      <div className={styles.reportList}>{data.reports.map(row => <ReportRow key={row.category} icon={row.category === "devotional" ? "book" : row.category === "ministry" ? "heart" : "people"} title={row.title} description={row.description} status={row.status} tone={row.tone} onClick={() => router.push(dayHref)} />)}</div>
    </section> : null}
    <section className={styles.support} aria-label="My support"><h2>My support</h2>
      {data.support ? <div className={styles.person}><span className={styles.avatar}>{data.support.firstName.slice(0,2).toUpperCase()}</span><span className={styles.rowCopy}><span className={styles.rowTitle}>{data.support.firstName}</span><span className={styles.metadata}>Your discipler · Connected</span></span>{data.support.canMessage ? <Link href="/dashboard/community/messages" className={styles.textAction}>Message</Link> : null}</div> : <div className={styles.supportEmpty}><p className={styles.metadata}>You’re not connected to a discipler yet.</p>{data.community ? <Link href="/dashboard/community/ask" className={styles.textAction}>Ask Pleros</Link> : <Link href="/contact" className={styles.textAction}>Contact Pleros</Link>}</div>}
    </section>
    <nav aria-label="Dashboard essentials" className={styles.essentials}>
      <Link href="/dashboard/welcomepack">Welcome Pack</Link><Link href="/dashboard/prayer-watch">Prayer Watch</Link><Link href="/dashboard/podcast">Podcast</Link>
      {data.learning.enrolled ? <Link href="/dashboard/pre-sogp">Pre-SOGP lessons</Link> : null}
    </nav>
  </div>;
}

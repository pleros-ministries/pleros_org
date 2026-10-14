import Link from "next/link";
import { DashboardIcon,StatusPill } from "@/components/dashboard/v3/primitives";
import type { CertificationFacts } from "@/lib/db/queries/sogp-certification-facts";
import styles from "./group-reviews.module.css";

export function CertificationReadiness({data,name}:{data:CertificationFacts;name:string}) {
  const learningRecorded=data.learningTotal>0&&data.learningDone===data.learningTotal;
  return <section className={styles.page}>
    <header className={styles.heading}><h1>Your readiness</h1><p className={styles.meta}>{name} · {data.pathLabel}</p></header>
    <div className={styles.info}><p>Certification requires review attendance alongside your learning requirements.</p></div>
    <section className={styles.section}><h2>Learning</h2><article className={styles.reviewCard}><h3>Your selected learning path</h3><StatusPill tone="blue">{learningRecorded?"Plan progress recorded":"In progress"}</StatusPill><p className={styles.meta}>{data.learningDone} of {data.learningTotal} · {data.learningLabel}</p><p className={styles.meta}>Continue from your next unfinished lesson. Progress is not transferred between traditional and podcast content.</p></article></section>
    <section className={styles.section}><h2>Weekly group reviews</h2><article className={styles.reviewCard}><h3>Attendance required</h3><StatusPill tone={data.reviews.outstandingMakeups?"amber":"neutral"}>{data.reviews.outstandingMakeups?"Make-up pending":"Review history"}</StatusPill><p>{data.reviews.attended} attended · {data.reviews.missed} recorded missed · {data.reviews.madeUp} explicitly made up</p><p className={styles.meta}>These are your recorded review facts, not a certificate quota. Your group lead confirms attendance; original Missed records are retained.</p></article><Link href="/dashboard/sogp/reviews" className={styles.rowLink}>View reviews and make-up options<DashboardIcon name="right" size={16} /></Link></section>
    <div className={styles.info}><p>Your learning stays available while review attendance is pending.</p></div>
    <section className={styles.section}><h2>Certificate status</h2>{data.certificateAvailable?<article className={styles.reviewCard}><StatusPill tone="green">Existing certificate available</StatusPill><Link href="/dashboard/sogp/certificate" className={styles.rowLink}>View your issued certificate<DashboardIcon name="right" size={16} /></Link></article>:<article className={styles.reviewCard}><StatusPill tone="neutral">Eligibility not determined</StatusPill><p className={styles.meta}>The weekly-review requirement and podcast certification criteria still need confirmation. No new percentage, session count or cross-path credit has been applied.</p></article>}</section>
    <footer className={styles.footer}><Link href={data.resumeHref} className={styles.primary}>Continue learning<DashboardIcon name="arrow" /></Link></footer>
  </section>;
}

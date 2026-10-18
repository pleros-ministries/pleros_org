import Link from "next/link";
import { AwardIcon, BookOpenIcon, CalendarCheckIcon, ChevronRightIcon, SunriseIcon } from "lucide-react";
import type { CertificationFacts } from "@/lib/db/queries/sogp-certification-facts";
import { ClaimCertificateButton } from "./claim-certificate-button";
import styles from "./learning-tools.module.css";

export function CertificationReadiness({data,name}:{data:CertificationFacts;name:string}) {
  return <section className={styles.page}>
    <header className={styles.heading}><h1>Your readiness</h1><p className={styles.sub}>{name} · {data.pathLabel}</p></header>
    <div className={styles.strip}>
      <div><span>Learning</span><strong>{data.learningDone}/{data.learningTotal}</strong></div>
      <div><span>Reviews attended</span><strong>{data.reviews.attended}</strong></div>
      <div><span>Prayer Watch</span><strong>{data.prayer.present}/{data.prayer.total}</strong></div>
    </div>
    <p className={styles.note}>Weekly group reviews are required for certification on every learning path. Your learning stays available while review attendance is pending.</p>

    <div className={styles.sectionTitle}><h2>Requirements</h2></div>
    <div className={styles.panel}><ul className={styles.list}>
      <li className={styles.row} style={{ alignItems: "flex-start" }}>
        <span className={styles.chip}><BookOpenIcon className="size-4" strokeWidth={2.2} /></span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>Your selected learning path</span><span className={styles.rowMeta}>{data.learningDone} of {data.learningTotal} · {data.learningLabel}</span><span className={styles.rowMeta}>Continue from your next unfinished lesson. Progress is not transferred between traditional and podcast content.</span></span>
        <span className={styles.pill} data-tone={data.learningPass?"done":"todo"}>{data.learningPass?"Complete":"In progress"}</span>
      </li>
      <li className={styles.row} style={{ alignItems: "flex-start" }}>
        <span className={styles.chip} data-tone="peach"><CalendarCheckIcon className="size-4" strokeWidth={2.2} /></span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>Weekly group reviews</span><span className={styles.rowMeta}>{data.reviews.attended} attended · {data.reviews.missed} recorded missed · {data.reviews.madeUp} made up{data.reviews.owed?` · ${data.reviews.owed - data.reviews.outstanding} of ${data.reviews.owed} settled`:""}</span><span className={styles.rowMeta}>Every review in your groups must be attended or made up. Your group lead confirms attendance; original Missed records are kept.</span></span>
        <span className={styles.pill} data-tone={data.reviews.reviewPass?"done":data.reviews.outstandingMakeups?"todo":undefined}>{data.reviews.reviewPass?"All settled":data.reviews.outstandingMakeups?"Make-up pending":"Review history"}</span>
      </li>
      <li><Link href="/dashboard/sogp/reviews" className={styles.row}>
        <span className={styles.rowCopy}><span className={styles.rowTitle} style={{ color: "var(--color-community-blue, #2056d6)" }}>View reviews and make-up options</span></span>
        <ChevronRightIcon className={`size-4 ${styles.chev}`} strokeWidth={2} />
      </Link></li>
      <li className={styles.row} style={{ alignItems: "flex-start" }}>
        <span className={styles.chip} data-tone="sky"><SunriseIcon className="size-4" strokeWidth={2.2} /></span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>Morning Prayer Watch</span><span className={styles.rowMeta}>{data.prayer.required}% of cohort mornings · only morning sessions count toward certification.</span></span>
        <span className={styles.pill} data-tone={data.prayer.pass?"done":"todo"}>{data.prayer.pass?"Met":`${data.prayer.present} of ${data.prayer.total}`}</span>
      </li>
    </ul></div>

    <div className={styles.sectionTitle}><h2>Certificate</h2></div>
    <div className={styles.panel}>
      {data.certificateAvailable
        ? <Link href="/dashboard/sogp/certificate" className={styles.row}>
          <span className={styles.chip} data-tone="amber"><AwardIcon className="size-4" strokeWidth={2.2} /></span>
          <span className={styles.rowCopy}><span className={styles.rowTitle}>View your issued certificate</span><span className={styles.rowMeta}>Your certificate is available</span></span>
          <span className={styles.pill} data-tone="done">Issued</span>
          <ChevronRightIcon className={`size-4 ${styles.chev}`} strokeWidth={2} />
        </Link>
        : <div className={styles.row} style={{ alignItems: "flex-start" }}>
          <span className={styles.chip} data-tone="amber"><AwardIcon className="size-4" strokeWidth={2.2} /></span>
          <span className={styles.rowCopy}><span className={styles.rowTitle}>{data.meetsRequirements?"Requirements met":"Not yet"}</span><span className={styles.rowMeta}>{data.meetsRequirements?"You meet the certificate requirements. Claim it below.":"Complete your learning, settle every group review and reach the Prayer Watch requirement."}</span></span>
          <span className={styles.pill} data-tone={data.meetsRequirements?"done":undefined}>{data.meetsRequirements?"Ready":"Not yet"}</span>
        </div>}
      {data.meetsRequirements&&!data.certificateAvailable?<div className={styles.panelBody} style={{ paddingTop: 0 }}><ClaimCertificateButton /></div>:null}
    </div>
    <Link href={data.resumeHref} className={styles.btn} data-block="">Continue learning</Link>
  </section>;
}

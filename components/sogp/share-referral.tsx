"use client";
import Link from "next/link";
import { useState } from "react";
import { CheckIcon, ChevronRightIcon, CopyIcon, Share2Icon } from "lucide-react";

import type { ReferralsDashboardData } from "@/lib/db/queries/sogp-referrals";
import { buildReferralShareMessage, referralStageLabel } from "@/lib/sogp/referral";
import styles from "./learning-tools.module.css";

const PREVIEW_COUNT = 5;

/** Invite someone (18 October retouch): link and code rows with inline Copy, a Share button, and who has joined. Sharing never assigns or invites by itself. */
export function ShareReferral({ code, url, referredCount, referred = [] }: { code: string; url: string; referredCount: number; referred?: ReferralsDashboardData["referred"] }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  async function copy(kind: "code" | "link") {
    try { await navigator.clipboard.writeText(kind === "code" ? code : url); setCopied(kind); window.setTimeout(() => setCopied(null), 2000); } catch { setCopied(null); }
  }
  async function share() {
    const text = `${buildReferralShareMessage()} ${url}`;
    try {
      if (navigator.share) { await navigator.share({ title: "Join me in SOGP", text, url }); return; }
    } catch { return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }
  const copyButton = (kind: "code" | "link") => <button type="button" className={styles.inlineAction} onClick={() => copy(kind)} aria-label={kind === "link" ? "Copy your link" : "Copy your code"}>{copied === kind ? <><CheckIcon className="size-3.5" strokeWidth={2.4} aria-hidden /> Copied</> : <><CopyIcon className="size-3.5" strokeWidth={2.2} aria-hidden /> Copy</>}</button>;
  const recent = [...referred].reverse().slice(0, PREVIEW_COUNT);

  return <section className={styles.page}>
    <header className={styles.heading}><h1>Invite someone</h1><p className={styles.sub}>Those who join with your link or code become your enrollees.</p></header>

    <div className={styles.panel}><ul className={styles.list}>
      <li className={styles.row}>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{url.replace(/^https?:\/\//, "")}</span><span className={styles.rowMeta}>Link · they confirm you after joining</span></span>
        {copyButton("link")}
      </li>
      <li className={styles.row}>
        <span className={styles.rowCopy}><span className={`${styles.rowTitle} ${styles.code}`}>{code}</span><span className={styles.rowMeta}>Code · added to you straight away</span></span>
        {copyButton("code")}
      </li>
    </ul></div>
    <button type="button" className={styles.btn} data-block="" onClick={share}><Share2Icon className="size-4" strokeWidth={2.2} aria-hidden /> Share your link</button>

    <div className={styles.sectionTitle}><h2>Joined with you</h2>{referredCount ? <Link href="/dashboard/community/enrollees">See all {referredCount}</Link> : null}</div>
    {recent.length ? <div className={styles.panel}><ul className={styles.list}>
      {recent.map(person => <li key={`${person.firstName}-${person.joinedAt}`}><Link className={styles.row} href="/dashboard/community/enrollees">
        <span className={styles.avatar} aria-hidden="true">{person.firstName.slice(0, 1).toUpperCase()}</span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{person.firstName}</span><span className={styles.rowMeta}>Joined {new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short" }).format(new Date(person.joinedAt))} · {referralStageLabel(person.stage)}</span></span>
        <ChevronRightIcon className={`size-4 ${styles.chev}`} strokeWidth={2} />
      </Link></li>)}
    </ul></div> : <p className={styles.empty}>No one has joined with your link yet. When they do, they show here and in My enrollees.</p>}
    <p className={styles.note}>They join your discipleship group only if you invite them and they accept.</p>
  </section>;
}

"use client";

import { useState, type CSSProperties } from "react";
import { BanknoteIcon, CreditCardIcon, MessageCircleHeartIcon } from "lucide-react";

import { partnerBankAccount, partnerImpactItems } from "@/lib/partner-page-content";

import styles from "./library.module.css";

/**
 * Partner (Pastor review, 18 October): its own You tab. Giving goes through
 * the public Partner page's existing channels; no new payment flow here.
 */
export function PartnerHome() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(partnerBankAccount.accountNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* The number stays visible to copy by hand. */ }
  };
  return <div className={styles.page}>
    <header className={styles.heading}>
      <h1>Partner with us</h1>
      <p>Give towards the Gospel</p>
    </header>

    <section className={styles.dest} data-art style={{ "--dest-field": "#b84f35", "--dest-ink": "#a8432c", "--dest-art": "url(\"/assets/dashboard/learning-card/my-learning-level-3.webp\")", minHeight: 170 } as CSSProperties}>
      <span style={{ fontSize: 12, opacity: .92 }}>Pleros Ministries &amp; Missions</span>
      <div><h2 style={{ fontSize: 20, lineHeight: "26px" }}>Help more people find God’s purpose</h2><p style={{ opacity: .92 }}>Every gift funds SOGP, the podcast and outreach.</p></div>
      <a href="/partner#partner" className={styles.give}>Give now</a>
    </section>

    <div className={styles.section}><h2>Ways to give</h2></div>
    <div className={styles.panel}>
      <a href="/partner#partner" className={styles.row}>
        <span className={styles.icon} style={{ background: "#e4ebfd", color: "#2331ae" }} aria-hidden="true"><CreditCardIcon className="size-4" strokeWidth={2} /></span>
        <span className={styles.copy}><b>Pay online</b><span>Card in Naira or US Dollars</span></span>
      </a>
      <div className={styles.row}>
        <span className={styles.icon} style={{ background: "#fde3cf", color: "#7a3a10" }} aria-hidden="true"><BanknoteIcon className="size-4" strokeWidth={2} /></span>
        <span className={styles.copy}><b>Bank transfer</b><span>{partnerBankAccount.bankName} · {partnerBankAccount.accountNumber}</span><span>{partnerBankAccount.accountName}</span></span>
        <button type="button" className={styles.copyBtn} onClick={copy} aria-live="polite">{copied ? "Copied" : "Copy"}</button>
      </div>
    </div>

    <div className={styles.section}><h2>What your gift does</h2></div>
    <div className={styles.panel}>
      {partnerImpactItems.map(item => <div key={item} className={styles.row}>
        <span className={styles.icon} style={{ background: "#efe7fb", color: "#56209c" }} aria-hidden="true"><MessageCircleHeartIcon className="size-4" strokeWidth={2} /></span>
        <span className={styles.copy}><b>{item}</b></span>
      </div>)}
    </div>
  </div>;
}

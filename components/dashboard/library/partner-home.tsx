"use client";

import { useState, type CSSProperties } from "react";
import { BanknoteIcon, CreditCardIcon, MessageCircleHeartIcon } from "lucide-react";

import { partnerBankAccount, partnerGiveCard, partnerImpactItems, partnerImpactTitle, partnerReasons } from "@/lib/partner-page-content";

import styles from "./library.module.css";
import { ReportGiving } from "./partner-gifts";
import { PartnerPaySheet } from "./partner-pay-sheet";

/**
 * Partner (Pastor review, 18 October): its own You tab. Giving uses the public
 * Partner page's channels; Pay online and Give now open its Paystack form in a
 * bottom sheet rather than leaving the dashboard (user, 10 November). Why
 * partner with Pleros carries the public page's reasons, and Report giving
 * tells Pleros about a gift; only admins see the reports (user, 10 November).
 * Order (user, 12 November): Give now, Ways to give, Report giving, Why partner
 * with Pleros, then What your gift does.
 */
export function PartnerHome({ name, email, preview = false }: { name: string; email: string; preview?: boolean }) {
  return <div className={styles.page}>
    <header className={styles.heading}>
      <h1>Partner with us</h1>
      <p>Give towards the Gospel</p>
    </header>
    <PartnerGiving name={name} email={email} preview={preview} />
  </div>;
}

/**
 * Give now down, shared with the public Partner page (user, 13 November: the
 * same design there). Without `signedIn`, Report giving links to this tab,
 * whose guard asks visitors to log in.
 */
export function PartnerGiving({ name, email, preview = false, signedIn = true }: { name: string; email: string; preview?: boolean; signedIn?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [paying, setPaying] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(partnerBankAccount.accountNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* The number stays visible to copy by hand. */ }
  };
  return <>
    <section className={styles.dest} data-art style={{ "--dest-field": "#b84f35", "--dest-ink": "#a8432c", "--dest-art": `url("${partnerGiveCard.art}")`, minHeight: 170 } as CSSProperties}>
      <span style={{ fontSize: 12, opacity: .92 }}>{partnerGiveCard.tag}</span>
      <div><h2 style={{ fontSize: 20, lineHeight: "26px" }}>{partnerGiveCard.title}</h2><p style={{ opacity: .92 }}>{partnerGiveCard.line}</p></div>
      <button type="button" className={styles.give} onClick={() => setPaying(true)}>Give now</button>
    </section>

    <div className={styles.section}><h2>Ways to give</h2></div>
    <div className={styles.panel}>
      <button type="button" className={styles.row} onClick={() => setPaying(true)}>
        <span className={styles.icon} style={{ background: "#e4ebfd", color: "#2331ae" }} aria-hidden="true"><CreditCardIcon className="size-4" strokeWidth={2} /></span>
        <span className={styles.copy}><b>Pay online</b><span>Card in Naira or US Dollars</span></span>
      </button>
      <div className={styles.row}>
        <span className={styles.icon} style={{ background: "#fde3cf", color: "#7a3a10" }} aria-hidden="true"><BanknoteIcon className="size-4" strokeWidth={2} /></span>
        <span className={styles.copy}><b>Bank transfer</b><span>{partnerBankAccount.bankName} · {partnerBankAccount.accountNumber}</span><span>{partnerBankAccount.accountName}</span></span>
        <button type="button" className={styles.copyBtn} onClick={copy} aria-live="polite">{copied ? "Copied" : "Copy"}</button>
      </div>
    </div>

    <ReportGiving preview={preview} loginHref={signedIn ? undefined : "/dashboard/partner"} />

    <div className={styles.section}><h2>Why partner with Pleros</h2></div>
    <div className={styles.panel}>
      {partnerReasons.map(reason => <div key={reason.step} className={`${styles.row} ${styles.reason}`}>
        <span className={styles.step} aria-hidden="true">{reason.step}</span>
        <span className={styles.copy}><b>{reason.dashboardTitle}</b><span>{reason.description}</span></span>
      </div>)}
    </div>

    <div className={styles.section}><h2>{partnerImpactTitle}</h2></div>
    <div className={styles.panel}>
      {partnerImpactItems.map(item => <div key={item} className={styles.row}>
        <span className={styles.icon} style={{ background: "#efe7fb", color: "#56209c" }} aria-hidden="true"><MessageCircleHeartIcon className="size-4" strokeWidth={2} /></span>
        <span className={styles.copy}><b>{item}</b></span>
      </div>)}
    </div>

    {paying ? <PartnerPaySheet name={name} email={email} onClose={() => setPaying(false)} /> : null}
  </>;
}

"use client";

import { useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { BanknoteIcon, ChevronDownIcon, CreditCardIcon, LockIcon, MessageCircleHeartIcon } from "lucide-react";

import {
  partnerBankAccount, partnerGiveCard, partnerImpactItems, partnerImpactTitle, partnerReasons,
} from "@/lib/partner-page-content";

import { CopyToClipboardButton } from "./copy-to-clipboard-button";
import { PaystackDonateForm } from "./paystack-donate-form";
import styles from "./partner-giving-sections.module.css";

/**
 * The public Partner page from giving downward follows the dashboard Partner
 * tab (user, 12 November): Give now, Ways to give, Report giving, Why partner
 * with Pleros, What your gift does, at public-site sizes. Report giving links to
 * the dashboard tab, which asks visitors to log in first; this page reads no session.
 */
export function PartnerGivingSections() {
  const [paying, setPaying] = useState(false);
  const payRow = useRef<HTMLDivElement>(null);
  const giveNow = () => {
    setPaying(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => payRow.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
  };

  return <section id="partner" className={styles.band}>
    <div className={styles.column}>
      <div className={styles.card} style={{ "--give-art": `url("${partnerGiveCard.art}")` } as CSSProperties}>
        <span className={styles.tag}>{partnerGiveCard.tag}</span>
        <div>
          <h2>{partnerGiveCard.title}</h2>
          <p>{partnerGiveCard.line}</p>
        </div>
        <button type="button" className={styles.give} onClick={giveNow}>Give now</button>
      </div>

      <h2 className={styles.heading}>Ways to give</h2>
      <div className={styles.panel}>
        <div ref={payRow} className={styles.pay}>
          <button type="button" className={styles.row} aria-expanded={paying} aria-controls={paying ? "partner-pay-online" : undefined} onClick={() => setPaying(open => !open)}>
            <span className={styles.icon} style={{ background: "#e4ebfd", color: "#2331ae" }} aria-hidden="true"><CreditCardIcon className="size-5" strokeWidth={2} /></span>
            <span className={styles.copy}><b>Pay online</b><span>Card in Naira or US Dollars</span></span>
            <ChevronDownIcon className={styles.chevron} data-open={paying || undefined} aria-hidden="true" />
          </button>
          {paying ? <div id="partner-pay-online" className={styles.form}><PaystackDonateForm /></div> : null}
        </div>
        <div className={styles.row}>
          <span className={styles.icon} style={{ background: "#fde3cf", color: "#7a3a10" }} aria-hidden="true"><BanknoteIcon className="size-5" strokeWidth={2} /></span>
          <span className={styles.copy}><b>Bank transfer</b><span>{partnerBankAccount.bankName} · {partnerBankAccount.accountNumber}</span><span>{partnerBankAccount.accountName}</span></span>
          <CopyToClipboardButton value={partnerBankAccount.accountNumber} label="Copy account number" />
        </div>
      </div>

      <h2 className={styles.heading}>Report giving</h2>
      <div className={styles.panel}>
        <div className={styles.row}>
          <span className={styles.copy}><b>Given by transfer or cash?</b><span>Log in to let Pleros know so your gift can be recognised.</span></span>
          <Link href="/dashboard/partner" className={styles.action}>Report giving</Link>
        </div>
      </div>
      <p className={styles.note}><LockIcon className="mr-1 inline size-3.5 align-[-2px]" aria-hidden="true" />Only Pleros admins see what you report.</p>

      <h2 className={styles.heading}>Why partner with Pleros</h2>
      <div className={styles.panel}>
        {partnerReasons.map(reason => <div key={reason.step} className={`${styles.row} ${styles.reason}`}>
          <span className={styles.step} aria-hidden="true">{reason.step}</span>
          <span className={styles.copy}><b>{reason.dashboardTitle}</b><span>{reason.description}</span></span>
        </div>)}
      </div>

      <h2 className={styles.heading}>{partnerImpactTitle}</h2>
      <div className={styles.panel}>
        {partnerImpactItems.map(item => <div key={item} className={styles.row}>
          <span className={styles.icon} style={{ background: "#efe7fb", color: "#56209c" }} aria-hidden="true"><MessageCircleHeartIcon className="size-5" strokeWidth={2} /></span>
          <span className={styles.copy}><b>{item}</b></span>
        </div>)}
      </div>
    </div>
  </section>;
}

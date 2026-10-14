"use client";
import Link from "next/link";
import { useState } from "react";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import styles from "./follow-up-invitations.module.css";

/** Paper: Pleros-share-referral. Every enrollee's own code and link; sharing never assigns or invites by itself. */
export function ShareReferral({ code, url, referredCount }: { code: string; url: string; referredCount: number }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  async function copy(kind: "code" | "link") {
    try { await navigator.clipboard.writeText(kind === "code" ? code : url); setCopied(kind); } catch { setCopied(null); }
  }
  async function share() {
    const text = `Join me in the School of God’s Purpose. Use my link: ${url}`;
    try {
      if (navigator.share) { await navigator.share({ title: "Join SOGP", text, url }); return; }
    } catch { return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }
  return <section className={styles.page}>
    <div className={styles.heading}><h1>Grow with someone</h1><p>Your own code and link, ready to share.</p></div>
    <div className={styles.section}><h2>Your referral code</h2>
      <div className={styles.panel}><strong style={{ fontSize: 24, lineHeight: "32px", fontWeight: 500 }}>{code}</strong><button type="button" className={styles.copyRow} onClick={() => copy("code")}>{copied === "code" ? "Code copied" : "Copy code"}<DashboardIcon name="right" size={16} /></button></div>
      <p>Code joins are assigned to you.</p></div>
    <div className={styles.section}><h2>Your referral link</h2>
      <div className={styles.card}><strong>Your personal invitation link</strong><button type="button" className={styles.copyRow} onClick={() => copy("link")}>{copied === "link" ? "Link copied" : "Copy link"}<DashboardIcon name="right" size={16} /></button></div>
      <p>Link joins are assigned to you, then asked to accept you or request someone else.</p></div>
    <div className={styles.info}><DashboardIcon name="people" size={16} /><p>Following up and group membership are separate. Group invitations need the person’s acceptance.</p></div>
    <Link className={styles.textLink} href="/dashboard/sogp/enrollees">{referredCount ? `${referredCount} ${referredCount === 1 ? "person has" : "people have"} joined with your referral` : "See the people you follow up"}</Link>
    <footer className={styles.footer}><p className={`${styles.meta}`} style={{ textAlign: "center" }}>Available to every SOGP enrollee.</p><button type="button" className={styles.primary} onClick={share}>Share referral link<DashboardIcon name="arrow" /></button></footer>
  </section>;
}

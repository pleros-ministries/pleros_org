"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronRightIcon, CopyIcon, LinkIcon, Share2Icon, UsersRoundIcon } from "lucide-react";
import styles from "./learning-tools.module.css";

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
    <header className={styles.heading}><h1>Grow with someone</h1><p className={styles.sub}>Your own code and link, ready to share.</p></header>
    <div className={styles.strip} style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
      <div><span>Joined with you</span><strong>{referredCount}</strong></div>
      <div><span>Your code</span><strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{code}</strong></div>
    </div>

    <div className={styles.sectionTitle}><h2>Share</h2></div>
    <div className={styles.panel}><ul className={styles.list}>
      <li><button type="button" className={styles.row} onClick={() => copy("code")}>
        <span className={styles.chip}><CopyIcon className="size-4" strokeWidth={2.2} /></span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{copied === "code" ? "Code copied" : "Copy code"}</span><span className={styles.rowMeta}>Code joins are assigned to you.</span></span>
        {copied === "code" ? <span className={styles.pill} data-tone="done">Copied</span> : null}
      </button></li>
      <li><button type="button" className={styles.row} onClick={() => copy("link")}>
        <span className={styles.chip} data-tone="sky"><LinkIcon className="size-4" strokeWidth={2.2} /></span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{copied === "link" ? "Link copied" : "Copy your personal link"}</span><span className={styles.rowMeta}>Link joins are assigned to you, then asked to accept you or request someone else.</span></span>
        {copied === "link" ? <span className={styles.pill} data-tone="done">Copied</span> : null}
      </button></li>
      <li><Link className={styles.row} href="/dashboard/community/enrollees">
        <span className={styles.chip} data-tone="peach"><UsersRoundIcon className="size-4" strokeWidth={2.2} /></span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{referredCount ? `${referredCount} ${referredCount === 1 ? "person has" : "people have"} joined with your referral` : "See the people you follow up"}</span><span className={styles.rowMeta}>My enrollees</span></span>
        <ChevronRightIcon className={`size-4 ${styles.chev}`} strokeWidth={2} />
      </Link></li>
    </ul></div>
    <p className={styles.note}>Following up and group membership are separate. Group invitations need the person’s acceptance. Available to every SOGP enrollee.</p>
    <button type="button" className={styles.btn} data-block="" onClick={share}><Share2Icon className="size-4" strokeWidth={2.2} aria-hidden /> Share referral link</button>
  </section>;
}

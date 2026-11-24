"use client";
import Link from "next/link";
import { useState } from "react";
import { BookOpenIcon, HeadphonesIcon } from "lucide-react";

import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import styles from "@/components/sogp/learning/learning.module.css";

type Pick = "" | "traditional" | "podcast";

/**
 * Mockup of the corrected first-time chooser. Both paths say how they count
 * toward the certificate; Podcast asks for a pace instead of picking one; the
 * choice is saved on Continue for both paths. Nothing saves in the preview.
 */
export function ChooserMock() {
  const [pick, setPick] = useState<Pick>("");
  const [pace, setPace] = useState<"" | "two" | "one">("");
  const ready = pick === "traditional" || (pick === "podcast" && pace !== "");
  const next = pick === "traditional" ? "?screen=done-traditional" : `?screen=tracklist&pace=${pace || "two"}`;
  return <section className={`${styles.page} ${styles.choicePage}`}>
    <header className={styles.header}><h1>How you learn SOGP</h1><p className={styles.muted}>Choose the time you can set aside each day</p></header>
    <div role="radiogroup" aria-label="Learning path" className={styles.pathOptions}>
      <button type="button" role="radio" aria-checked={pick === "traditional"} onClick={() => setPick("traditional")} className={styles.pathOption}>
        <span className={styles.pathOptionHead}><span className={styles.pathOptionTitle}><span className={styles.pathOptionIcon} style={{ background: "#e4ebfd", color: "#2331ae" }} aria-hidden="true"><BookOpenIcon className="size-4" strokeWidth={2} /></span><strong>Traditional · 1 hr/day</strong></span></span>
        <span className={styles.meta}>A teaching a day with a quiz and a written response, and a weekly group review.</span>
        <span className={styles.meta}>Counts toward your certificate: finish each teaching’s quiz and written response.</span>
      </button>
      <div role="radio" aria-checked={pick === "podcast"} tabIndex={0} onClick={() => setPick("podcast")} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setPick("podcast"); } }} className={styles.pathOption}>
        <span className={styles.pathOptionHead}><span className={styles.pathOptionTitle}><span className={styles.pathOptionIcon} style={{ background: "#cfe6fb", color: "#0e3f73" }} aria-hidden="true"><HeadphonesIcon className="size-4" strokeWidth={2} /></span><strong>Podcast · 15 or 30 min/day</strong></span></span>
        <span className={styles.meta}>Short episodes you choose and order yourself, and a weekly group review.</span>
        <span className={styles.meta}>Counts toward your certificate: listen to every episode in your 30-day plan.</span>
        {pick === "podcast" ? <>
          <span className={styles.meta} style={{ marginTop: 4, color: "var(--color-text-strong)" }}>How much time each day?</span>
          <span className={styles.paceChips} style={{ marginTop: 0 }} role="group" aria-label="Podcast pace">
            {([["two", "30 min · 2 episodes"], ["one", "15 min · 1 episode"]] as const).map(([key, label]) => <button key={key} type="button" aria-pressed={pace === key} onClick={event => { event.stopPropagation(); setPace(key); }}>{label}</button>)}
          </span>
        </> : null}
      </div>
    </div>
    <p className={styles.meta}>You can change your path or pace later from the SOGP page. You keep everything you’ve done.</p>
    <div className={styles.footer}>
      <p className={`${styles.meta} ${styles.centre}`}>{pick === "podcast" && !pace ? "Choose a pace to continue" : "Your choice is saved when you continue"}</p>
      {ready
        ? <Link href={next} className={styles.primary}>{pick === "traditional" ? "Start Traditional" : "Continue"}<DashboardIcon name="right" size={16} /></Link>
        : <button type="button" className={styles.primary} disabled>Continue<DashboardIcon name="right" size={16} /></button>}
    </div>
  </section>;
}

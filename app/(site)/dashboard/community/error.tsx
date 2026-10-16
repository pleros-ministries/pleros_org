"use client";

import Link from "next/link";
import styles from "@/components/community/community-home-v3.module.css";

export default function CommunityError({ retry }: { retry: () => void }) {
  return <section className={styles.home}>
    <div className={styles.heading}><h1>Community unavailable</h1><p role="alert">We couldn’t load this page. Please try again.</p></div>
    <button type="button" onClick={retry} className="mt-6 min-h-12 rounded-[11px] bg-[var(--color-community-blue)] px-4 text-sm font-medium text-white">Try again</button>
    <nav className={styles.contextLinks}><Link href="/dashboard">Back to You</Link></nav>
  </section>;
}

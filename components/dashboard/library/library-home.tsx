import Link from "next/link";
import type { CSSProperties } from "react";

import { HomeArt } from "@/components/dashboard/v3/home-art";

import { AdvancedSogpNotify } from "./advanced-sogp-notify";

import styles from "./library.module.css";

const tone = (field: string, ink: string) => ({ "--dest-field": field, "--dest-ink": ink }) as CSSProperties;

/**
 * Library (Pastor review, 18 October): three destinations, the Teachings
 * Library (the public library, inside the app), the podcast and Advanced
 * SOGP, then the teaching series as shortcuts into the library.
 */
export function LibraryHome({ series, advancedInterest }: { series: Array<{ series: string; count: number }>; advancedInterest: boolean }) {
  const total = series.reduce((sum, row) => sum + row.count, 0);
  return <div className={styles.page}>
    <header className={styles.heading}>
      <h1>Library</h1>
      <p>Teachings, the podcast and what comes after SOGP</p>
    </header>

    <Link href="/dashboard/library/teachings" className={styles.dest} style={tone("#cfe6fb", "#0e3f73")}>
      <span className={styles.tag}>{total ? `${total} teachings · ${series.length} series` : "Teachings"}</span>
      <div><h2>Teachings Library</h2><p>Faith, purpose, redemption and the new creation</p></div>
      <HomeArt name="preSogp" className={styles.art} />
    </Link>

    <Link href="/dashboard/podcast" className={styles.dest} style={tone("#fde3cf", "#6b3410")}>
      <span className={styles.tag}>Daily episodes</span>
      <div><h2>Pleros Podcast</h2><p>Daily devotional teaching to listen to anywhere</p></div>
      <HomeArt name="podcast" className={styles.art} />
    </Link>

    <section className={styles.dest} data-art style={{ ...tone("#56298a", "#4a2275"), "--dest-art": "url(\"/assets/dashboard/learning-card/my-learning-level-4.webp\")" } as CSSProperties} aria-label="Advanced SOGP, coming soon">
      <span className={styles.tag}>Coming soon</span>
      <div><h2>Advanced SOGP</h2><p>Deeper formation for those who’ve finished SOGP</p></div>
      <AdvancedSogpNotify initialRegistered={advancedInterest} variant="card" />
    </section>

    {series.length ? <>
      <div className={styles.section}><h2>Browse teachings</h2><Link href="/dashboard/library/teachings">All {total}</Link></div>
      <div className={styles.chips}>
        {series.map(row => <Link key={row.series} href={`/dashboard/library/teachings?series=${encodeURIComponent(row.series)}`} className={styles.chip}>
          {row.series} <span>{row.count}</span>
        </Link>)}
      </div>
    </> : null}
  </div>;
}

import styles from "@/components/community/community-home-v3.module.css";

/* Mirrors the Community home: heading, counts strip, group cards. */
export default function CommunityLoading() {
  return <section className={styles.home} aria-busy="true" aria-label="Loading community">
    <div className={styles.heading}><h1>Your Pleros Community</h1></div>
    <div className={`${styles.counts} h-[66px]`} aria-hidden="true" />
    <div className={styles.block} aria-hidden="true">
      <div className={styles.blockHeading}><span className="h-4 w-24 rounded bg-(--color-line)" /></div>
      <div className={styles.groupGrid}>{[0, 1, 2, 3].map(i => <div key={i} className="h-[132px] rounded-2xl bg-(--color-surface-muted)" />)}</div>
    </div>
  </section>;
}

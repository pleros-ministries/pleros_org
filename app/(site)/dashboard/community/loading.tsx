import styles from "@/components/community/community-home-v3.module.css";

export default function CommunityLoading() {
  return <section className={styles.home} aria-busy="true" aria-label="Loading community">
    <div className={styles.heading}><h1>Community</h1><p>Loading your people and conversations…</p></div>
    <div className={styles.messages} aria-hidden="true"><span className="h-5 w-40 rounded bg-(--color-line)" /></div>
    <div className={`${styles.section} ${styles.empty}`} aria-hidden="true"><div className="h-20 rounded bg-(--color-surface-muted)" /></div>
  </section>;
}

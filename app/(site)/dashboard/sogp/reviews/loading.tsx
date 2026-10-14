import styles from "@/components/sogp/group-reviews.module.css";
export default function ReviewsLoading() {
  return <section className={styles.page} aria-busy="true"><header className={styles.heading}><h1>Group reviews</h1><p role="status" className={styles.meta}>Loading your group’s reviews…</p></header><div className={styles.info} aria-hidden="true"><div className="h-20 rounded bg-(--color-line)" /></div></section>;
}

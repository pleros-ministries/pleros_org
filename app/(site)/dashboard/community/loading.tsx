import styles from "@/components/community/community-home-v3.module.css";

/* Shared by every Community page (feed, groups, inbox…), so it names none of
   them: a neutral title bar, a slim panel and a few card shapes. */
export default function CommunityLoading() {
  return <section className={styles.home} aria-busy="true" aria-label="Loading">
    <div className="h-7 w-40 rounded-md bg-(--color-line)" aria-hidden="true" />
    <div className="mt-4 h-[62px] rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white" aria-hidden="true" />
    <div className="mt-6 grid gap-3" aria-hidden="true">
      {[0, 1, 2].map(i => <div key={i} className="h-28 rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white" />)}
    </div>
  </section>;
}

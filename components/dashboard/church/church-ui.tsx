import type { ReactNode } from "react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";

/** Church pages share Oversight's frame: one readable column on the white dashboard canvas. */
export function ChurchPage({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  // Inside Community the layout's grid already frames the page.
  if (bare) return <div className={styles.page}>{children}</div>;
  return <div className="mx-auto w-full max-w-[640px] px-4 pt-[18px] pb-7"><div className={styles.page}>{children}</div></div>;
}

export function ChurchHeading({ title, sub, tag }: { title: string; sub: string; tag?: string }) {
  return <div className={styles.heading}>
    <div><h1>{title}</h1><p className={styles.sub}>{sub}</p></div>
    {tag ? <span className={styles.pill}>{tag}</span> : null}
  </div>;
}

import Link from "next/link";

import styles from "./community-home-v3.module.css";

export type GroupArt = "location" | "discipleship" | "leading" | "public" | "private";

/* Background art lives in public/assets/dashboard/community-groups/: a 3:2 cut
   for wider tiles and a compact square cut for phones, each at 1x and 2x. */
const groupTag: Record<GroupArt, string> = { location: "Location", discipleship: "Discipleship", leading: "You lead", public: "Public", private: "Private" };

/** Groups you lead share one illustration in two colourways, alternated oldest-first so neighbours differ. No light green (user preference). */
export const leadColourways = ["lilac", "slate"] as const;

export function GroupCard({ href, art, title, meta, prefetch, colourway, tag }: { href: string; art: GroupArt; title: string; meta: string; prefetch?: false; colourway?: string; tag?: string }) {
  return <Link href={href} prefetch={prefetch} className={styles.groupCard} data-art={art} data-colourway={colourway} title={title}>
    <span className={styles.groupTop}><span className={styles.groupTag}>{tag ?? groupTag[art]}</span><h3>{title}</h3></span>
    <span className={styles.groupMeta}>{meta}</span>
  </Link>;
}

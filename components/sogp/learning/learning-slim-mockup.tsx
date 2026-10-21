"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ChevronRightIcon, PlayIcon } from "lucide-react";

import groupStyles from "@/components/community/discipleship/discipleship-group.module.css";

import cards from "./learning-cards.module.css";
import styles from "./learning-hub.module.css";

/**
 * Mockup (sample data, nothing saved) of Learning after the Pastor's 21
 * October review. Your current learning is a class of its own: its name heads
 * the learning card, since whatever is playing plays from it. Other learning
 * is the rest, as cards the size of the group cards with their own Codex art.
 */

export type LearningArt = "welcome" | "pre-sogp" | "sogp" | "advanced" | "podcast" | "library";
type Tile = { art: LearningArt; title: string; meta?: string; tag: string; href: string };

/** Each field colour is sampled from its art, so the card shows no seam. */
export const LEARNING_FIELDS: Record<LearningArt, { field: string; ink: string }> = {
  welcome: { field: "#fbdec3", ink: "#6b3410" },
  "pre-sogp": { field: "#f7e6b1", ink: "#5a4508" },
  sogp: { field: "#d3e0fc", ink: "#1f3260" },
  advanced: { field: "#e6dbfb", ink: "#3e1876" },
  podcast: { field: "#f9ebc2", ink: "#5b4a10" },
  library: { field: "#f1c7c6", ink: "#5e2236" },
};

const art = (key: LearningArt): CSSProperties => ({
  backgroundColor: LEARNING_FIELDS[key].field, color: LEARNING_FIELDS[key].ink,
  ["--art-compact-1x" as string]: `url("/assets/dashboard/learning-cards/${key}-compact-320.webp")`,
  ["--art-compact-2x" as string]: `url("/assets/dashboard/learning-cards/${key}-compact-640.webp")`,
  ["--art-wide-1x" as string]: `url("/assets/dashboard/learning-cards/${key}-wide-480.webp")`,
  ["--art-wide-2x" as string]: `url("/assets/dashboard/learning-cards/${key}-wide-960.webp")`,
});

const OTHER: Tile[] = [
  { art: "welcome", title: "Welcome Pack", meta: "Gifts and orientation", tag: "Done", href: "#" },
  { art: "pre-sogp", title: "Pre-SOGP", meta: "10 videos", tag: "Done", href: "#" },
  { art: "advanced", title: "Advanced SOGP", tag: "Coming soon", href: "#" },
  { art: "podcast", title: "Podcast", meta: "At your own pace", tag: "Any time", href: "#" },
  { art: "library", title: "Library", meta: "Teachings and series", tag: "Any time", href: "#" },
];

export function LearningSlimMockup() {
  return <div className="grid gap-3.5">
    <div>
      <h1>Learning</h1>
      <p className={groupStyles.sub}>SOGP October 2026 · Week 2 of 4</p>
    </div>

    {/* Your current learning, a class of its own: its name heads the card playing from it. */}
    <div className={groupStyles.sectionTitle}>
      <h2>School of God’s Purpose</h2>
      <Link href="/preview/dashboard-v3/sogp-page" className={`${groupStyles.quiet} inline-flex items-center gap-0.5`}>Open<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link>
    </div>
    <section className={styles.card} aria-label="Resume learning" style={{ "--hub-art": `url("/assets/dashboard/learning-card/my-learning-level-2.webp")`, "--hub-art-wide": `url("/assets/dashboard/learning-card/my-learning-level-2-wide.webp")`, "--hub-field": "#24704d", "--hub-ink": "#1d5e40" } as CSSProperties}>
      <div className={styles.cardTop}><span>Level 2 · Track 9</span><span className={styles.pace}>A lesson a day</span></div>
      <div>
        <h2>Biblical Origin and Ontology</h2>
        <span className={styles.cardMeta}>9 of 24 teachings</span>
        <div className={styles.meter} aria-hidden="true"><i style={{ width: "38%" }} /></div>
      </div>
      <Link href="#" className={styles.resume}>Resume learning <PlayIcon className="size-4" fill="currentColor" strokeWidth={0} /></Link>
    </section>
    <Link href="#" className={`${groupStyles.quiet} -mt-1 inline-flex items-center gap-0.5 justify-self-start`}>Today’s tasks and your progress are on Home<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link>

    <div className={groupStyles.sectionTitle}><h2>Other learning</h2></div>
    <div className={cards.grid}>
      {OTHER.map(tile => <Link key={tile.art} href={tile.href} className={cards.card} data-art={tile.art} style={art(tile.art)}>
        <span className={cards.top}><span className={cards.tag}>{tile.tag}</span><h3>{tile.title}</h3></span>
        {tile.meta ? <span className={cards.meta}>{tile.meta}</span> : null}
      </Link>)}
    </div>
  </div>;
}

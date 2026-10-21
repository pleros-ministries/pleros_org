"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { BookOpenIcon, ChevronRightIcon, GemIcon, GiftIcon, HeadphonesIcon, PlayIcon, SparklesIcon, VideoIcon } from "lucide-react";

import groupStyles from "@/components/community/discipleship/discipleship-group.module.css";

import styles from "./learning-hub.module.css";

/**
 * Mockup (sample data, nothing saved) of Learning after the Pastor's 21
 * October review: only what you're learning now (the learning card, with
 * Home for today's details), then "Other learning" as six cards the size of
 * the group cards. The SOGP card opens the SOGP page. Each card would get its
 * own Codex art (one object, bottom-right); the mockup uses a large icon in
 * its place.
 */

type Tile = { title: string; meta: string; tag: string; icon: ReactNode; field: string; ink: string; href: string };
const TILES: Tile[] = [
  { title: "Welcome Pack", meta: "Gifts, orientation, reminders", tag: "Done", icon: <GiftIcon />, field: "#fde3cf", ink: "#7a3a10", href: "#" },
  { title: "Pre-SOGP", meta: "10 foundation videos", tag: "Done", icon: <VideoIcon />, field: "#f6e4ac", ink: "#5a4508", href: "#" },
  { title: "School of God’s Purpose", meta: "Day 9 of 28", tag: "Now", icon: <GemIcon />, field: "#e6ecfc", ink: "#1f3260", href: "/preview/dashboard-v3/sogp-page" },
  { title: "Advanced SOGP", meta: "After SOGP", tag: "Coming soon", icon: <SparklesIcon />, field: "#efe7fb", ink: "#56209c", href: "#" },
  { title: "Podcast", meta: "Listen at your own pace", tag: "Any time", icon: <HeadphonesIcon />, field: "#f1ecc4", ink: "#5b5212", href: "#" },
  { title: "Library", meta: "Teachings and series", tag: "Any time", icon: <BookOpenIcon />, field: "#f6d9de", ink: "#7a2e45", href: "#" },
];

function LearningTile({ tile }: { tile: Tile }) {
  return <Link href={tile.href} className="relative grid min-h-[132px] content-between gap-3 overflow-hidden rounded-[16px] p-3.5 no-underline" style={{ background: tile.field, color: tile.ink }}>
    <span className="w-fit rounded-full bg-white/70 px-2 text-[11px] leading-5 font-medium">{tile.tag}</span>
    <span className="relative z-10 grid max-w-[78%] gap-0.5">
      <span className="font-[family-name:var(--font-dashboard-heading)] text-[15.5px] leading-5 font-medium tracking-[-0.02em]">{tile.title}</span>
      <span className="text-[12px] leading-4 opacity-80">{tile.meta}</span>
    </span>
    {/* Stand-in for the card's art: one object, bottom-right, bleeding off the edge. */}
    <span className="pointer-events-none absolute -right-3 -bottom-3 opacity-20 [&>svg]:size-[72px]" aria-hidden="true">{tile.icon}</span>
  </Link>;
}

export function LearningSlimMockup() {
  return <div className="grid gap-3.5">
    <div>
      <h1>Learning</h1>
      <p className={groupStyles.sub}>SOGP October 2026 · Week 2 of 4</p>
    </div>

    {/* What you're learning now: the same card as today. */}
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
    <div className="grid grid-cols-2 gap-2.5">
      {TILES.map(tile => <LearningTile key={tile.title} tile={tile} />)}
    </div>
  </div>;
}

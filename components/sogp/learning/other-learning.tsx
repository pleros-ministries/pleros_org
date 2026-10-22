import Link from "next/link";
import type { CSSProperties } from "react";

import type { LearningHubData } from "@/lib/dashboard/learning-hub";

import cards from "./learning-cards.module.css";

/**
 * Other learning (Pastor, 21 October): everything besides your current
 * learning, as cards the size of the group cards. Each has its own Codex
 * object, snug in the corner (see DESIGN.md, "Learning cards").
 */

export type LearningArt = "welcome" | "pre-sogp" | "sogp" | "advanced" | "podcast" | "library";

/** Field colours sampled from each artwork, so the feathered object meets the card with no seam. */
const FIELDS: Record<LearningArt, { field: string; ink: string }> = {
  welcome: { field: "#d1e7fc", ink: "#123f6e" },
  "pre-sogp": { field: "#f4d2ea", ink: "#5a1e4a" },
  sogp: { field: "#fcd9c7", ink: "#6e2a17" },
  advanced: { field: "#e6dbfb", ink: "#3e1876" },
  podcast: { field: "#d3dfeb", ink: "#1f3a55" },
  library: { field: "#f3e0c4", ink: "#4d3a26" },
};

const artStyle = (key: LearningArt): CSSProperties => ({
  backgroundColor: FIELDS[key].field, color: FIELDS[key].ink,
  ["--art-1x" as string]: `url("/assets/dashboard/learning-cards/${key}-tile-192.webp")`,
  ["--art-2x" as string]: `url("/assets/dashboard/learning-cards/${key}-tile-384.webp")`,
});

type Tile = { art: LearningArt; title: string; tag: string; meta?: string; href: string };

export function otherLearningTiles(hub: LearningHubData): Tile[] {
  const pre = hub.journey.preSogp;
  const preDone = pre.total > 0 && pre.done >= pre.total;
  const podcastPath = hub.path === "podcast_one" || hub.path === "podcast_two";
  return [
    // Once a next learning is chosen, SOGP joins Other learning (Pastor, 21 October).
    ...(hub.next.card ? [{ art: "sogp" as const, title: "School of God’s Purpose", tag: "Done", meta: hub.certificate.available ? "Certificate ready" : "Your history", href: "/dashboard/sogp/school" }] : []),
    { art: "welcome", title: "Welcome Pack", tag: hub.journey.welcomePackDone ? "Done" : "To finish", meta: "Gifts and orientation", href: "/dashboard/welcomepack" },
    { art: "pre-sogp", title: "Pre-SOGP", tag: preDone ? "Done" : hub.state === "preparing" ? "Now" : "Open", meta: pre.total ? `${Math.min(pre.done, pre.total)} of ${pre.total} videos` : "Foundation videos", href: "/dashboard/pre-sogp" },
    { art: "advanced", title: "Advanced SOGP", tag: hub.advancedInterest ? "We’ll tell you" : "Coming soon", meta: "After SOGP", href: "/dashboard/library" },
    { art: "podcast", title: "Podcast", tag: podcastPath ? "Your path" : "Any time", meta: "At your own pace", href: "/dashboard/podcast" },
    { art: "library", title: "Library", tag: "Any time", meta: "Teachings and series", href: "/dashboard/library/teachings" },
  ];
}

export function OtherLearning({ tiles }: { tiles: Tile[] }) {
  return <div className={cards.grid}>
    {tiles.map(tile => <Link key={tile.art} href={tile.href} className={cards.card} style={artStyle(tile.art)}>
      <span className={cards.art} aria-hidden="true" />
      <span className={cards.top}><span className={cards.tag}>{tile.tag}</span><h3>{tile.title}</h3></span>
      {tile.meta ? <span className={cards.meta}>{tile.meta}</span> : null}
    </Link>)}
  </div>;
}

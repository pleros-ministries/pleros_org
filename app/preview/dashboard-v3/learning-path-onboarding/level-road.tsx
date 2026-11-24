"use client";
import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import { SOGP_LEVELS } from "@/lib/sogp/curriculum";

import styles from "./mock.module.css";
import { longDate, sogpLevels, type StartLevel } from "./sample";

/**
 * SOGP's road by level (user, 24 November): how many tracks, when the level
 * starts and ends, and the tracks themselves. The first level is open; any
 * other opens with a tap.
 */
export function LevelRoad({ start, compact = false }: { start: StartLevel; compact?: boolean }) {
  const { stops, tracks, finish } = sogpLevels(start, SOGP_LEVELS);
  const [open, setOpen] = useState<number | null>(start);
  return <div className="grid gap-2">
    <ol className={styles.levels}>{stops.map((stop, index) => {
      const expanded = open === stop.level;
      return <li key={stop.level} data-state={stop.soon ? "soon" : index === 0 ? "now" : "later"}>
        <button type="button" className={styles.levelHead} aria-expanded={expanded} onClick={() => setOpen(expanded ? null : stop.level)}>
          <span className={styles.levelName}>Level {stop.level}<span className={styles.when}> · {stop.trackCount} tracks</span></span>
          <span className={styles.when}>{stop.soon ? "Coming soon" : stop.range}</span>
          <ChevronDownIcon className={styles.levelChevron} strokeWidth={2} aria-hidden="true" />
        </button>
        <div className={styles.more} data-open={expanded} inert={!expanded}><div className={styles.moreInner}>
          <ol className={styles.trackList}>
            {stop.tracks.map((track, position) => <li key={track.title}><span className={styles.trackNo}>{position + 1}</span><span>{track.title}</span>{track.when ? <span className={styles.when}>{track.when}</span> : null}</li>)}
            {stop.review ? <li data-review><span className={styles.trackNo} aria-hidden="true">·</span><span>Group review</span><span className={styles.when}>{stop.review}</span></li> : null}
          </ol>
        </div></div>
      </li>;
    })}
      <li data-state="soon"><div className={styles.levelHead} style={{ cursor: "default" }}><span className={styles.levelName}>Then<span className={styles.when}> · Advanced SOGP</span></span><span className={styles.when}>After level 4</span><span /></div></li>
    </ol>
    {compact ? null : <p className={styles.lede}>{tracks} tracks · done by <b style={{ fontWeight: 500, color: "var(--color-text-strong)" }}>{longDate(finish)}</b> at a track a day</p>}
  </div>;
}

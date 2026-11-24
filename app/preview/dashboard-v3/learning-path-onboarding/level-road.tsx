"use client";
import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import { SOGP_LEVELS } from "@/lib/sogp/curriculum";

import styles from "./mock.module.css";
import { longDate, sogpLevels, type StartLevel } from "./sample";

/**
 * SOGP's road by level (user, 24 November): how many tracks, when the level
 * starts and ends, and the tracks themselves. An open level stands alone (user,
 * 24 November); tap it again to see every level.
 */
export function LevelRoad({ start, compact = false }: { start: StartLevel; compact?: boolean }) {
  const { stops, tracks, finish } = sogpLevels(start, SOGP_LEVELS);
  const [open, setOpen] = useState<number | null>(start);
  return <div className="grid gap-2">
    <ol className={styles.levels}>{stops.filter(stop => open === null || open === stop.level).map(stop => {
      const index = stops.indexOf(stop);
      const expanded = open === stop.level;
      return <li key={stop.level} data-state={stop.soon ? "soon" : index === 0 ? "now" : "later"}>
        <button type="button" className={styles.levelHead} aria-expanded={expanded} onClick={() => setOpen(expanded ? null : stop.level)}>
          <span className="grid"><span className={styles.levelName}>Level {stop.level}</span><span className={styles.levelMeta}>{stop.trackCount} tracks · {stop.soon ? "Coming soon" : stop.range}</span></span>
          <span className={styles.levelMeta}>{index === 0 && !stop.soon ? "Start" : ""}</span>
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
      {open === null ? <li data-state="soon"><div className={styles.levelHead} style={{ cursor: "default" }}><span className="grid"><span className={styles.levelName}>Advanced SOGP</span><span className={styles.levelMeta}>After level 4</span></span><span /><span /></div></li> : null}
    </ol>
    {compact ? null : <p className={styles.lede}>{tracks} tracks · done by <b style={{ fontWeight: 500, color: "var(--color-text-strong)" }}>{longDate(finish)}</b> at a track a day</p>}
  </div>;
}

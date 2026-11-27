import { SOGP_LEVELS } from "@/lib/sogp/curriculum";

import styles from "./mock.module.css";
import { longDate, sogpLevels, type StartLevel } from "./sample";

/**
 * The chosen starting level, shown on its own (user, 24 November): the
 * Level 1/2/3 picker already does the choosing, so there's no list of levels
 * to open. Its tracks with their dates, then one line on what follows.
 */
export function LevelRoad({ start }: { start: StartLevel }) {
  const { stops, tracks, finish } = sogpLevels(start, SOGP_LEVELS);
  const level = stops[0]!;
  const after = stops.slice(1).filter(stop => !stop.soon).map(stop => stop.level);
  return <div className="grid gap-2">
    <p className={styles.levelMeta} style={{ margin: 0 }}>{level.trackCount} tracks · {level.range}</p>
    <ol className={styles.trackList} style={{ margin: 0 }}>
      {level.tracks.map((track, position) => <li key={track.title}><span className={styles.trackNo}>{position + 1}</span><span>{track.title}</span>{track.when ? <span className={styles.when}>{track.when}</span> : null}</li>)}
      {level.review ? <li data-review><span className={styles.trackNo} aria-hidden="true">·</span><span>Group review</span><span className={styles.when}>{level.review}</span></li> : null}
    </ol>
    <p className={styles.lede}>
      {after.length ? <>Then {after.length > 1 ? "levels" : "level"} {after.join(" and ")}. </> : null}
      {tracks} tracks done by <b style={{ fontWeight: 500, color: "var(--color-text-strong)" }}>{longDate(finish)}</b>. Level 4 is coming soon.
    </p>
  </div>;
}

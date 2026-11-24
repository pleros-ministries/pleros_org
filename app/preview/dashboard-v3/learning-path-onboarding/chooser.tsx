"use client";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { CheckIcon } from "lucide-react";

import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import learn from "@/components/sogp/learning/learning.module.css";

import styles from "./mock.module.css";
import { longDate, podcastRoad, sogpRoad, type StartLevel } from "./sample";

type PathKey = "sogp" | "podcast" | "own";

/** Each path takes its learning-card field and object (DESIGN.md: learning-card family). */
const ART: Record<PathKey, { art: string; field: string; ink: string }> = {
  sogp: { art: "sogp", field: "#fcd9c7", ink: "#6e2a17" },
  // Brighter than the old slate, which read gloomy (user, 24 November).
  podcast: { art: "podcast-sky", field: "#d4e8fc", ink: "#16406e" },
  own: { art: "library", field: "#f3e0c4", ink: "#4d3a26" },
};
const look = (key: PathKey) => ({
  "--field": ART[key].field, "--ink": ART[key].ink,
  "--art-1x": `url("/assets/dashboard/learning-cards/${ART[key].art}-tile-192.webp")`,
  "--art-2x": `url("/assets/dashboard/learning-cards/${ART[key].art}-tile-384.webp")`,
}) as CSSProperties;

function Road({ rows, finish, finishLabel }: { rows: { label: string; title: string; when: string; soon?: boolean }[]; finish?: Date; finishLabel?: string }) {
  return <>
    <ol className={styles.road}>{rows.map((row, index) => <li key={row.label + row.title} data-state={row.soon ? "soon" : index === 0 ? "now" : "later"}><span><b>{row.label}</b> · {row.title}</span><span className={styles.when}>{row.when}</span></li>)}</ol>
    {finish ? <p className={styles.lede}>{finishLabel} by <b style={{ fontWeight: 500, color: "var(--color-text-strong)" }}>{longDate(finish)}</b></p> : null}
  </>;
}

/**
 * Round 2 of the chooser (user and Pastor, 18–24 November): three paths, each a
 * coloured card that opens to show where it leads and when you'd finish.
 */
export function ChooserMock() {
  const [path, setPath] = useState<PathKey | null>(null);
  const [level, setLevel] = useState<StartLevel>(1);
  const [pace, setPace] = useState<1 | 2 | null>(null);
  const sogp = sogpRoad(level), podcast = podcastRoad(pace ?? 2);
  const ready = path === "sogp" || path === "own" || (path === "podcast" && pace !== null);
  const next = path === "sogp" ? "?screen=done-sogp" : path === "podcast" ? `?screen=build&pace=${pace === 1 ? "one" : "two"}` : "?screen=journey";
  const action = path === "sogp" ? `Start level ${level}` : path === "podcast" ? "Build my podcast plan" : path === "own" ? "Choose my teachings" : "Continue";

  const card = (key: PathKey, title: string, line: string, fact: string, body: React.ReactNode) => {
    const on = path === key;
    // The card stays a card; its details open in their own panel under it (user, 24 November).
    return <div className={styles.pathSlot}>
      <div className={styles.path} data-on={on} style={look(key)}>
        <button type="button" role="radio" aria-checked={on} className={styles.pathHead} onClick={() => setPath(key)}>
          <span className={styles.pathArt} aria-hidden="true" />
          <span className={styles.pathTitle}>{title}<span className={styles.check} aria-hidden="true"><CheckIcon className="size-3" strokeWidth={3} /></span></span>
          <span className={styles.pathLine}>{line}</span>
          <span className={styles.pathFact}>{fact}</span>
        </button>
      </div>
      <div className={styles.more} data-open={on} inert={!on}><div className={styles.moreInner}><div className={styles.moreBody}>{body}</div></div></div>
    </div>;
  };

  return <section className={`${learn.page} ${learn.choicePage}`}>
    <header className={learn.header}><h1>Choose a learning path</h1><p className={styles.lede}>See where each one leads. You can change later</p></header>
    <div role="radiogroup" aria-label="Learning path" className={styles.paths}>
      {card("sogp", "SOGP", "A teaching, quiz and written response each day", "1 hr a day · 3 levels", <>
        <span className={styles.askLabel} id="start-level">Where are you starting?</span>
        <div role="radiogroup" aria-labelledby="start-level" className={styles.choices} data-count="3">
          {([1, 2, 3] as const).map(value => <button key={value} type="button" role="radio" aria-checked={level === value} className={styles.choice} onClick={() => setLevel(value)}><strong>Level {value}</strong></button>)}
        </div>
        <Road rows={sogp.rows} finish={sogp.finish} finishLabel="Level 3 done" />
      </>)}
      {card("podcast", "Podcast", "Short episodes at your own pace", "15 or 30 min a day", <>
        <span className={styles.askLabel} id="pace">Choose your pace</span>
        <div role="radiogroup" aria-labelledby="pace" className={styles.choices}>
          {([[1, "15 min a day", "1 episode"], [2, "30 min a day", "2 episodes"]] as const).map(([value, label, sub]) => <button key={value} type="button" role="radio" aria-checked={pace === value} className={styles.choice} onClick={() => setPace(value)}><strong>{label}</strong><span>{sub}</span></button>)}
        </div>
        {pace ? <Road rows={podcast.rows} finish={podcast.finish} finishLabel="Podcast plan done" /> : null}
      </>)}
      {card("own", "Choose doctrinal journey", "The doctrinal series you want, in your order", "One a day · up to 120", <>
        <Road rows={[{ label: "Next", title: "Choose a series or single teachings", when: "Today" }, { label: "Then", title: "One a day, in your order", when: "Your pace" }]} />
      </>)}
    </div>
    <div className={styles.footer}>
      {path === "podcast" && !pace ? <p className={styles.footNote}>Choose a pace to continue</p> : null}
      {ready
        ? <Link href={next} className={learn.primary}>{action}<DashboardIcon name="right" size={16} /></Link>
        : <button type="button" className={learn.primary} disabled>{action}<DashboardIcon name="right" size={16} /></button>}
    </div>
  </section>;
}

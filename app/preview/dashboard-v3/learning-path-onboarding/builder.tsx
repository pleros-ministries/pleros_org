"use client";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, ChevronDownIcon, PlusIcon, SearchIcon } from "lucide-react";

import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import learn from "@/components/sogp/learning/learning.module.css";

import styles from "./mock.module.css";
import { EPISODES, SERIES, longDate, podcastRoad, suggestedPlan } from "./sample";

const podcastArt = { "--art-1x": `url("/assets/dashboard/learning-cards/podcast-tile-192.webp")`, "--art-2x": `url("/assets/dashboard/learning-cards/podcast-tile-384.webp")` } as CSSProperties;

/**
 * Round 2 of building a podcast plan (user, 24 November): take the suggested
 * plan in one tap, or build your own from whole series or single episodes with
 * a running count, then review and reorder day by day. Nothing saves.
 */
export function BuilderMock({ pace }: { pace: 1 | 2 }) {
  const slots = pace * 30;
  const road = podcastRoad(pace);
  const [tab, setTab] = useState<"suggested" | "own">("suggested");
  const [step, setStep] = useState<"pick" | "review">("pick");
  const [chosen, setChosen] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>("reality");
  const [query, setQuery] = useState("");
  const suggested = useMemo(() => suggestedPlan(slots), [slots]);
  const plan = tab === "suggested" ? suggested : chosen;
  const days = Math.ceil(plan.length / pace);
  const full = chosen.length >= slots;

  const toggle = (guid: string) => setChosen(list => list.includes(guid) ? list.filter(item => item !== guid) : list.length >= slots ? list : [...list, guid]);
  const addSeries = (guids: string[]) => setChosen(list => { const all = guids.every(guid => list.includes(guid)); if (all) return list.filter(guid => !guids.includes(guid)); return [...list, ...guids.filter(guid => !list.includes(guid))].slice(0, slots); });

  if (step === "review") return <Review pace={pace} initial={plan} onBack={() => setStep("pick")} />;

  const visible = SERIES.filter(item => item.title.toLowerCase().includes(query.trim().toLowerCase()));
  return <section className={learn.page} style={{ paddingBottom: tab === "own" ? 0 : undefined }}>
    <header className={learn.header}><p className={learn.eyebrow}>Podcast · {pace === 2 ? "30" : "15"} min a day</p><h1>Build your podcast plan</h1><p className={styles.lede}>{slots} episodes over 30 days. Use ours or pick your own</p></header>
    <div className={styles.segmented} role="tablist" aria-label="Plan">
      <button type="button" role="tab" aria-selected={tab === "suggested"} onClick={() => setTab("suggested")}>Suggested plan</button>
      <button type="button" role="tab" aria-selected={tab === "own"} onClick={() => setTab("own")}>Build my own</button>
    </div>

    {tab === "suggested" ? <>
      <div className={styles.planCard} style={podcastArt}>
        <span className={styles.pathArt} aria-hidden="true" />
        <span className={styles.planMeta}>Foundations plan</span>
        <span className={styles.planBig}>{slots} episodes · 30 days</span>
        <span className={styles.planMeta}>Done by {longDate(road.finish)}, then SOGP from level 1</span>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between"><h2>In this order</h2></div>
        <div className={styles.panel}>{seriesInPlan(suggested, pace).map(group => <div key={group.title} className={styles.series}><div className={styles.seriesRow}>
          <span className={styles.seriesToggle}><strong>{group.title}</strong><span>{group.count} episodes · days {group.days}</span></span>
        </div></div>)}</div>
      </div>
      <div className={styles.footer}>
        <Link href="?screen=done-podcast" className={learn.primary}>Use this plan<DashboardIcon name="right" size={16} /></Link>
        <button type="button" className={learn.secondary} onClick={() => setStep("review")}>See it day by day</button>
      </div>
    </> : <>
      <label className={styles.search}><SearchIcon className="size-4" strokeWidth={2} aria-hidden="true" /><input type="search" placeholder="Search series" value={query} onChange={event => setQuery(event.target.value)} aria-label="Search series" /></label>
      {chosen.length === 0 ? <button type="button" className={`${styles.addBtn} justify-self-start`} onClick={() => setChosen(suggested)}>Start from the suggested plan</button> : null}
      <div className={styles.panel}>{visible.map(item => {
        const guids = item.episodes.map(episode => episode.guid);
        const picked = guids.filter(guid => chosen.includes(guid)).length;
        const expanded = open === item.id;
        return <div key={item.id} className={styles.series}>
          <div className={styles.seriesRow}>
            <button type="button" className={styles.seriesToggle} aria-expanded={expanded} onClick={() => setOpen(expanded ? null : item.id)}>
              <strong>{item.title}</strong>
              <span className="inline-flex items-center gap-1">{picked ? `${picked} of ${guids.length} added` : `${guids.length} episodes`}<ChevronDownIcon className="size-3.5" strokeWidth={2} style={{ transform: expanded ? "rotate(180deg)" : undefined, transition: "transform 200ms var(--ease-out)" }} aria-hidden="true" /></span>
            </button>
            <button type="button" className={styles.addBtn} aria-pressed={picked === guids.length} disabled={full && picked < guids.length && picked === 0} onClick={() => addSeries(guids)}>
              {picked === guids.length ? <><CheckIcon className="size-3.5" strokeWidth={2.4} />Added</> : <><PlusIcon className="size-3.5" strokeWidth={2.4} />{picked ? "Add the rest" : "Add all"}</>}
            </button>
          </div>
          {expanded ? <div className={styles.episodes}>{item.episodes.map(episode => {
            const on = chosen.includes(episode.guid);
            return <button key={episode.guid} type="button" className={styles.episode} aria-pressed={on} disabled={!on && full} onClick={() => toggle(episode.guid)}>
              <span className={styles.box} aria-hidden="true">{on ? <CheckIcon className="size-3" strokeWidth={3} /> : null}</span>
              <span>Part {episode.part}</span><span className={styles.dur}>{episode.duration}</span>
            </button>;
          })}</div> : null}
        </div>;
      })}</div>
      <div className={styles.tray}>
        <div className={styles.trayRow}><b>{chosen.length} of {slots} episodes</b><span className={styles.dur}>{chosen.length ? `${days} ${days === 1 ? "day" : "days"} planned` : "Add a series to begin"}</span></div>
        <div className={styles.meter} aria-hidden="true"><i style={{ transform: `scaleX(${chosen.length / slots})` }} /></div>
        <button type="button" className={learn.primary} disabled={!chosen.length} onClick={() => setStep("review")} style={{ width: "100%" }}>Review my plan<DashboardIcon name="right" size={16} /></button>
      </div>
    </>}
  </section>;
}

function seriesInPlan(guids: string[], pace: 1 | 2) {
  const groups: { title: string; first: number; last: number; count: number; days: string }[] = [];
  guids.forEach((guid, index) => {
    const title = EPISODES.get(guid)!.title.replace(/\s*\(Part \d+\)$/, "");
    const last = groups.at(-1);
    if (last?.title === title) { last.last = index; last.count++; } else groups.push({ title, first: index, last: index, count: 1, days: "" });
  });
  return groups.map(group => ({ ...group, days: `${Math.floor(group.first / pace) + 1}–${Math.floor(group.last / pace) + 1}` }));
}

function Review({ pace, initial, onBack }: { pace: 1 | 2; initial: string[]; onBack: () => void }) {
  const [order, setOrder] = useState(initial);
  const move = (index: number, by: -1 | 1) => setOrder(list => { const next = [...list]; const [item] = next.splice(index, 1); next.splice(index + by, 0, item!); return next; });
  const days = Array.from({ length: Math.ceil(order.length / pace) }, (_, day) => order.slice(day * pace, day * pace + pace));
  const [shown, setShown] = useState(5);
  return <section className={learn.page}>
    <header className={learn.header}><p className={learn.eyebrow}>Podcast · {pace === 2 ? "30" : "15"} min a day</p><h1>Your {days.length} days</h1><p className={styles.lede}>Move any episode up or down</p></header>
    <div className={styles.panel}>{days.slice(0, shown).map((guids, day) => <div key={day} className={styles.day}>
      <span className={styles.dayLabel}>Day {day + 1}</span>
      {guids.map((guid, offset) => { const index = day * pace + offset; const episode = EPISODES.get(guid)!; return <div key={guid} className={styles.dayEp}>
        <span>{episode.title}<span className={styles.dur}> · {episode.duration}</span></span>
        <button type="button" className={styles.move} aria-label={`Move ${episode.title} earlier`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUpIcon className="size-4" strokeWidth={2} /></button>
        <button type="button" className={styles.move} aria-label={`Move ${episode.title} later`} disabled={index === order.length - 1} onClick={() => move(index, 1)}><ArrowDownIcon className="size-4" strokeWidth={2} /></button>
      </div>; })}
    </div>)}</div>
    {shown < days.length ? <button type="button" className={`${styles.addBtn} justify-self-center`} onClick={() => setShown(count => count + 8)}>Show more days</button> : null}
    <div className={styles.footer}>
      <Link href="?screen=done-podcast" className={learn.primary}>Start my plan<DashboardIcon name="check" /></Link>
      <button type="button" className={learn.secondary} onClick={onBack}>Back to episodes</button>
    </div>
  </section>;
}

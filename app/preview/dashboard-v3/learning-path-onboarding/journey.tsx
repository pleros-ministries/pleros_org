"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, ChevronDownIcon, PlusIcon, SearchIcon } from "lucide-react";

import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import learn from "@/components/sogp/learning/learning.module.css";

import styles from "./mock.module.css";
import { addDays, longDate } from "./sample";

export type LibrarySeries = { series: string; teachings: { id: string; title: string; duration: string }[] };
const MAX = 120;

/**
 * Choose doctrinal journey (user, 24 November): the Teachings Library sits
 * inside the picker. Open a series, add it whole or tick single teachings,
 * watch the journey's length grow, then put them in order. One a day, up to
 * 120. Nothing saves.
 */
export function JourneyMock({ library }: { library: LibrarySeries[] }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(library[0]?.series ?? null);
  const [query, setQuery] = useState("");
  const [step, setStep] = useState<"pick" | "review">("pick");
  const titles = new Map(library.flatMap(group => group.teachings.map(item => [item.id, { ...item, series: group.series }] as const)));
  const full = chosen.length >= MAX;
  const toggle = (id: string) => setChosen(list => list.includes(id) ? list.filter(item => item !== id) : full ? list : [...list, id]);
  const addSeries = (ids: string[]) => setChosen(list => ids.every(id => list.includes(id)) ? list.filter(id => !ids.includes(id)) : [...list, ...ids.filter(id => !list.includes(id))].slice(0, MAX));

  if (step === "review") return <Review order={chosen} setOrder={setChosen} titles={titles} onBack={() => setStep("pick")} />;

  const needle = query.trim().toLowerCase();
  const visible = library
    .map(group => ({ ...group, matches: needle ? group.teachings.filter(item => item.title.toLowerCase().includes(needle)) : group.teachings, seriesHit: group.series.toLowerCase().includes(needle) }))
    .filter(group => !needle || group.seriesHit || group.matches.length);

  return <section className={learn.page} style={{ paddingBottom: 0 }}>
    <header className={learn.header}><p className={learn.eyebrow}>Doctrinal journey · one a day</p><h1>Choose your teachings</h1><p className={styles.lede}>From the Library. Add a whole series or single teachings</p></header>
    <label className={styles.search}><SearchIcon className="size-4" strokeWidth={2} aria-hidden="true" /><input type="search" placeholder="Search the Library" value={query} onChange={event => setQuery(event.target.value)} aria-label="Search the Library" /></label>
    <div className="flex items-baseline justify-between"><h2 className="text-[15px] font-medium">Teachings Library</h2><span className={styles.dur}>{library.length} series</span></div>
    <div className={styles.panel}>{visible.map(group => {
      const ids = group.teachings.map(item => item.id);
      const picked = ids.filter(id => chosen.includes(id)).length;
      const expanded = open === group.series || (needle !== "" && !group.seriesHit);
      const rows = needle && !group.seriesHit ? group.matches : group.teachings;
      return <div key={group.series} className={styles.series}>
        <div className={styles.seriesRow}>
          <button type="button" className={styles.seriesToggle} aria-expanded={expanded} onClick={() => setOpen(open === group.series ? null : group.series)}>
            <strong>{group.series}</strong>
            <span className="inline-flex items-center gap-1">{picked ? `${picked} of ${ids.length} added` : `${ids.length} ${ids.length === 1 ? "teaching" : "teachings"}`}<ChevronDownIcon className="size-3.5" strokeWidth={2} style={{ transform: expanded ? "rotate(180deg)" : undefined, transition: "transform 200ms var(--ease-out)" }} aria-hidden="true" /></span>
          </button>
          <button type="button" className={styles.addBtn} aria-pressed={picked === ids.length} disabled={full && picked === 0} onClick={() => addSeries(ids)}>
            {picked === ids.length ? <><CheckIcon className="size-3.5" strokeWidth={2.4} />Added</> : <><PlusIcon className="size-3.5" strokeWidth={2.4} />{picked ? "Add the rest" : "Add series"}</>}
          </button>
        </div>
        <div className={styles.more} data-open={expanded} inert={!expanded}><div className={styles.moreInner}><div className={styles.episodes}>{rows.map(item => {
          const on = chosen.includes(item.id);
          return <button key={item.id} type="button" className={styles.episode} aria-pressed={on} disabled={!on && full} onClick={() => toggle(item.id)}>
            <span className={styles.box} aria-hidden="true">{on ? <CheckIcon className="size-3" strokeWidth={3} /> : null}</span>
            <span>{item.title}</span><span className={styles.dur}>{item.duration}</span>
          </button>;
        })}</div></div></div>
      </div>;
    })}{visible.length === 0 ? <p className="p-4 text-[13px] text-(--color-text-muted)">No teachings match “{query}”.</p> : null}</div>
    <div className={styles.tray}>
      <div className={styles.trayRow}><b>{chosen.length} {chosen.length === 1 ? "teaching" : "teachings"}</b><span className={styles.dur}>{chosen.length ? `${chosen.length} days · done by ${longDate(addDays(chosen.length - 1))}` : "Add a teaching to begin"}</span></div>
      <div className={styles.meter} aria-hidden="true"><i style={{ transform: `scaleX(${chosen.length / MAX})` }} /></div>
      <button type="button" className={learn.primary} disabled={!chosen.length} onClick={() => setStep("review")} style={{ width: "100%" }}>Put them in order<DashboardIcon name="right" size={16} /></button>
    </div>
  </section>;
}

function Review({ order, setOrder, titles, onBack }: { order: string[]; setOrder: (update: (list: string[]) => string[]) => void; titles: Map<string, { title: string; duration: string; series: string }>; onBack: () => void }) {
  const [shown, setShown] = useState(8);
  const move = (index: number, by: -1 | 1) => setOrder(list => { const next = [...list]; const [item] = next.splice(index, 1); next.splice(index + by, 0, item!); return next; });
  return <section className={learn.page}>
    <header className={learn.header}><p className={learn.eyebrow}>Doctrinal journey · one a day</p><h1>Your {order.length} days</h1><p className={styles.lede}>Done by {longDate(addDays(order.length - 1))}. Move any teaching up or down</p></header>
    <div className={styles.panel}>{order.slice(0, shown).map((id, index) => { const item = titles.get(id)!; return <div key={id} className={styles.day}>
      <span className={styles.dayLabel}>Day {index + 1} · {item.series}</span>
      <div className={styles.dayEp}>
        <span>{item.title}{item.duration ? <span className={styles.dur}> · {item.duration}</span> : null}</span>
        <button type="button" className={styles.move} aria-label={`Move ${item.title} earlier`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUpIcon className="size-4" strokeWidth={2} /></button>
        <button type="button" className={styles.move} aria-label={`Move ${item.title} later`} disabled={index === order.length - 1} onClick={() => move(index, 1)}><ArrowDownIcon className="size-4" strokeWidth={2} /></button>
      </div>
    </div>; })}</div>
    {shown < order.length ? <button type="button" className={`${styles.addBtn} justify-self-center`} onClick={() => setShown(count => count + 8)}>Show more days</button> : null}
    <div className={styles.footer}>
      <Link href="?screen=done-own" className={learn.primary}>Start my journey<DashboardIcon name="check" /></Link>
      <button type="button" className={learn.secondary} onClick={onBack}>Back to the Library</button>
    </div>
  </section>;
}

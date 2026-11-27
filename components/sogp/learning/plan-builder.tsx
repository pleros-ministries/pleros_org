"use client";
import { useMemo, useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, ChevronDownIcon, PlusIcon, SearchIcon } from "lucide-react";

import { chooseSogpPathAction } from "@/app/_actions/sogp-learning-actions";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import { isTeachingKey } from "@/lib/sogp/learning-input";
import { learningWriteNotice, podcastSuggestion, type LearningEpisode, type LearningViewData } from "@/lib/sogp/learning-view";

import learn from "./learning.module.css";
import styles from "./learning-paths.module.css";

const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "Africa/Lagos" });
const doneBy = (days: number) => longDate.format(new Date(Date.now() + Math.max(0, days - 1) * 86_400_000));
const art = (key: string, field: string, ink: string) => ({ "--field": field, "--ink": ink, "--art-1x": `url("/assets/dashboard/learning-cards/${key}-tile-192.webp")`, "--art-2x": `url("/assets/dashboard/learning-cards/${key}-tile-384.webp")` }) as CSSProperties;
const seriesOf = (title: string) => /^(.*?)\s*\(Part\s+\d+\)\s*$/i.exec(title)?.[1] ?? null;
const partOf = (title: string) => /\((Part\s+\d+)\)\s*$/i.exec(title)?.[1] ?? title;
/** The feed spells some series two ways ("Fulfil"/"Fulfill"); group them as one. */
const seriesKey = (title: string) => title.toLowerCase().replace(/fulfill/g, "fulfil").replace(/[’‘]/g, "'").trim();
const dayRange = (first: number, last: number) => first === last ? `day ${first}` : `days ${first}–${last}`;
const clock = (duration: string) => duration.replace(/^00:/, "").replace(/^0(\d:)/, "$1");

type Group = { id: string; title: string; items: LearningEpisode[] };

/** Podcast episodes grouped by series ("… (Part n)"); single episodes sit together at the end. */
function podcastGroups(episodes: LearningEpisode[]): Group[] {
  const groups = new Map<string, Group>(), singles: LearningEpisode[] = [];
  for (const episode of episodes) {
    const series = seriesOf(episode.title);
    if (!series) { singles.push(episode); continue; }
    const key = seriesKey(series);
    const group = groups.get(key) ?? { id: key, title: series, items: [] };
    group.items.push(episode);
    groups.set(key, group);
  }
  for (const group of groups.values()) group.items.sort((a, b) => Number(/\d+/.exec(partOf(a.title))?.[0] ?? 0) - Number(/\d+/.exec(partOf(b.title))?.[0] ?? 0));
  return [...groups.values(), ...(singles.length ? [{ id: "singles", title: "Single episodes", items: singles }] : [])];
}
/** Library teachings grouped by their series, in Library order. */
function libraryGroups(teachings: LearningEpisode[]): Group[] {
  const groups = new Map<string, Group>();
  for (const teaching of teachings) {
    const key = teaching.series ?? "Teachings";
    const group = groups.get(key) ?? { id: key, title: key, items: [] };
    group.items.push(teaching);
    groups.set(key, group);
  }
  return [...groups.values()];
}

/** Saves the plan (the path may already be saved) and ends on Learning, like every path (user, 24 November). */
function useSavePlan(data: LearningViewData, path: "podcast_one" | "podcast_two" | "doctrinal") {
  const router = useRouter();
  const query = useQueryClient();
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const save = (guids: string[]) => {
    setError(null);
    startSave(async () => {
      try {
        const result = await chooseSogpPathAction({ path, expectedRevision: data.state?.revision ?? 0, episodeGuids: guids });
        if (!result.ok) { setError(result.error); return; }
        query.setQueryData<LearningViewData>(["sogp", "learning-v3"], old => ({ ...(old ?? data), state: result.value }));
        router.push("/dashboard/sogp"); router.refresh();
      } catch { setError("Couldn’t save your plan. Check your connection and try again; your picks are still here."); }
    });
  };
  return { save, saving, error: error ?? (!data.canWrite ? learningWriteNotice(data) : null) };
}

/**
 * Pick series or single items, with a running count, then put them in order.
 * Shared by the podcast plan and the doctrinal journey.
 */
function Picker({ groups, chosen, setChosen, max, perDay, unit, searchLabel, onReview, intro }: {
  groups: Group[]; chosen: string[]; setChosen: (update: (list: string[]) => string[]) => void; max: number; perDay: 1 | 2;
  unit: { one: string; many: string }; searchLabel: string; onReview: () => void; intro?: React.ReactNode;
}) {
  const [open, setOpen] = useState<string | null>(groups[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const full = chosen.length >= max;
  const days = Math.ceil(chosen.length / perDay);
  const toggle = (guid: string) => setChosen(list => list.includes(guid) ? list.filter(item => item !== guid) : list.length >= max ? list : [...list, guid]);
  const addGroup = (guids: string[]) => setChosen(list => guids.every(guid => list.includes(guid)) ? list.filter(guid => !guids.includes(guid)) : [...list, ...guids.filter(guid => !list.includes(guid))].slice(0, max));
  const needle = query.trim().toLowerCase();
  const visible = groups.map(group => {
    const groupHit = group.title.toLowerCase().includes(needle);
    return { group, groupHit, items: !needle || groupHit ? group.items : group.items.filter(item => item.title.toLowerCase().includes(needle)) };
  }).filter(entry => !needle || entry.groupHit || entry.items.length);
  return <>
    {intro}
    <label className={styles.search}><SearchIcon className="size-4" strokeWidth={2} aria-hidden="true" /><input type="search" placeholder={searchLabel} value={query} onChange={event => setQuery(event.target.value)} aria-label={searchLabel} /></label>
    <div className={styles.box}>{visible.map(({ group, groupHit, items }) => {
      const guids = group.items.map(item => item.guid);
      const picked = guids.filter(guid => chosen.includes(guid)).length;
      const expanded = open === group.id || (needle !== "" && !groupHit);
      return <div key={group.id} className={styles.series}>
        <div className={styles.seriesRow}>
          <button type="button" className={styles.toggle} aria-expanded={expanded} onClick={() => setOpen(open === group.id ? null : group.id)}>
            <strong>{group.title}</strong>
            <span>{picked ? `${picked} of ${guids.length} added` : `${guids.length} ${guids.length === 1 ? unit.one : unit.many}`}<ChevronDownIcon className="size-3.5" strokeWidth={2} aria-hidden="true" /></span>
          </button>
          <button type="button" className={styles.add} aria-pressed={picked === guids.length} disabled={full && picked === 0} onClick={() => addGroup(guids)}>
            {picked === guids.length ? <><CheckIcon className="size-3.5" strokeWidth={2.4} aria-hidden="true" />Added</> : <><PlusIcon className="size-3.5" strokeWidth={2.4} aria-hidden="true" />{picked ? "Add the rest" : "Add all"}</>}
          </button>
        </div>
        <div className={styles.more} data-open={expanded} inert={!expanded}><div className={styles.moreInner}><div className={styles.items}>{items.map(item => {
          const on = chosen.includes(item.guid);
          return <button key={item.guid} type="button" className={styles.item} aria-pressed={on} disabled={!on && full} onClick={() => toggle(item.guid)}>
            <span className={styles.tick} aria-hidden="true">{on ? <CheckIcon className="size-3" strokeWidth={3} /> : null}</span>
            <span>{seriesOf(item.title) && seriesKey(seriesOf(item.title)!) === seriesKey(group.title) ? partOf(item.title) : item.title}</span><span className={styles.dur}>{item.duration ? clock(item.duration) : ""}</span>
          </button>;
        })}</div></div></div>
      </div>;
    })}{visible.length === 0 ? <p className={`${learn.muted} p-4`}>Nothing matches “{query}”.</p> : null}</div>
    <div className={styles.tray}>
      <div className={styles.trayRow}><b>{chosen.length} of {max} {unit.many}</b><span className={styles.dur}>{chosen.length ? `${days} ${days === 1 ? "day" : "days"} · done by ${doneBy(days)}` : `Add ${unit.many} to begin`}</span></div>
      <div className={styles.meter} aria-hidden="true"><i style={{ transform: `scaleX(${Math.min(1, chosen.length / max)})` }} /></div>
      <button type="button" className={learn.primary} disabled={!chosen.length} onClick={onReview} style={{ width: "100%" }}>Put them in order<DashboardIcon name="right" size={16} /></button>
    </div>
  </>;
}

/** One row per day; any item moves up or down. Saving starts the plan. */
function Review({ order, setOrder, items, perDay, eyebrow, unit, saving, error, onBack, onStart }: {
  order: string[]; setOrder: (update: (list: string[]) => string[]) => void; items: Map<string, LearningEpisode>; perDay: 1 | 2; eyebrow: string;
  unit: string; saving: boolean; error: string | null; onBack: () => void; onStart: () => void;
}) {
  const [shown, setShown] = useState(8);
  const days = Array.from({ length: Math.ceil(order.length / perDay) }, (_, day) => order.slice(day * perDay, day * perDay + perDay));
  const move = (index: number, by: -1 | 1) => setOrder(list => { const next = [...list]; const [item] = next.splice(index, 1); next.splice(index + by, 0, item!); return next; });
  return <section className={learn.page}>
    <header className={learn.header}><p className={learn.eyebrow}>{eyebrow}</p><h1>Your {days.length} {days.length === 1 ? "day" : "days"}</h1><p className={styles.lede}>Done by {doneBy(days.length)}. Move any {unit} up or down</p></header>
    <div className={styles.box}>{days.slice(0, shown).map((guids, day) => <div key={day} className={styles.day}>
      <span className={styles.dayLabel}>Day {day + 1}{perDay === 1 && items.get(guids[0]!)?.series ? ` · ${items.get(guids[0]!)!.series}` : ""}</span>
      {guids.map((guid, offset) => {
        const index = day * perDay + offset, item = items.get(guid), title = item?.title ?? "No longer available";
        return <div key={guid} className={styles.dayItem}>
          <span>{title}{item?.duration ? <span className={styles.dur}> · {clock(item.duration)}</span> : null}</span>
          <button type="button" className={styles.move} aria-label={`Move ${title} earlier`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUpIcon className="size-4" strokeWidth={2} /></button>
          <button type="button" className={styles.move} aria-label={`Move ${title} later`} disabled={index === order.length - 1} onClick={() => move(index, 1)}><ArrowDownIcon className="size-4" strokeWidth={2} /></button>
        </div>;
      })}
    </div>)}</div>
    {shown < days.length ? <button type="button" className={`${styles.add} ${styles.showMore}`} onClick={() => setShown(count => count + 8)}>Show more days</button> : null}
    <div className={styles.footer}>
      {error ? <p role="alert" className={learn.error}>{error}</p> : null}
      <button type="button" className={learn.primary} disabled={saving || !order.length} onClick={onStart}>{saving ? "Saving…" : "Start my plan"}<DashboardIcon name="check" /></button>
      <button type="button" className={learn.secondary} disabled={saving} onClick={onBack}>Back</button>
    </div>
  </section>;
}

/**
 * Build a podcast plan (user, 24 November): take the suggested plan in one
 * tap, or build your own from whole series or single episodes, then put them
 * in order. The path is already saved; this saves the plan.
 */
export function PodcastBuilder({ data, path }: { data: LearningViewData; path: "podcast_one" | "podcast_two" }) {
  const pace = path === "podcast_two" ? 2 : 1, slots = pace * 30;
  const episodes = useMemo(() => data.episodes.filter(episode => !isTeachingKey(episode.guid)), [data.episodes]);
  const items = useMemo(() => new Map(episodes.map(episode => [episode.guid, episode])), [episodes]);
  const groups = useMemo(() => podcastGroups(episodes), [episodes]);
  const suggested = useMemo(() => podcastSuggestion(episodes, pace), [episodes, pace]);
  const [tab, setTab] = useState<"suggested" | "own">(suggested.length ? "suggested" : "own");
  const [chosen, setChosen] = useState<string[]>([]);
  const [review, setReview] = useState<string[] | null>(null);
  const { save, saving, error } = useSavePlan(data, path);
  const eyebrow = `Podcast · ${pace === 2 ? "30" : "15"} min a day`;
  if (review) return <Review order={review} setOrder={update => setReview(list => update(list ?? []))} items={items} perDay={pace} eyebrow={eyebrow} unit="episode" saving={saving} error={error} onBack={() => setReview(null)} onStart={() => save(review)} />;

  const inOrder = suggested.reduce<{ title: string; count: number; first: number; last: number }[]>((list, guid, index) => {
    const title = seriesOf(items.get(guid)?.title ?? "") ?? items.get(guid)?.title ?? "Episode", last = list.at(-1);
    if (last && seriesKey(last.title) === seriesKey(title)) { last.count++; last.last = index; } else list.push({ title, count: 1, first: index, last: index });
    return list;
  }, []);
  const days = Math.ceil(suggested.length / pace);
  return <section className={learn.page} style={tab === "own" ? { paddingBottom: 0 } : undefined}>
    <header className={learn.header}><p className={learn.eyebrow}>{eyebrow}</p><h1>Build your podcast plan</h1><p className={styles.lede}>{slots} episodes, {pace === 2 ? "two" : "one"} a day. Use ours or pick your own</p></header>
    <div className={styles.segmented} role="tablist" aria-label="Plan">
      <button type="button" role="tab" aria-selected={tab === "suggested"} disabled={!suggested.length} onClick={() => setTab("suggested")}>Suggested plan</button>
      <button type="button" role="tab" aria-selected={tab === "own"} onClick={() => setTab("own")}>Build my own</button>
    </div>
    {tab === "suggested" ? <>
      <div className={styles.planCard} style={art("podcast-sky", "#d4e8fc", "#16406e")}>
        <span className={styles.art} aria-hidden="true" />
        <span className={styles.planMeta}>Foundations plan</span>
        <span className={styles.planBig}>{suggested.length} episodes · {days} days</span>
        <span className={styles.planMeta}>Done by {doneBy(days)}, then the doctrinal path from level 1</span>
      </div>
      <h2 className="text-[15px] font-medium">In this order</h2>
      <div className={styles.box}>{inOrder.map(group => <div key={`${group.title}-${group.first}`} className={styles.series}><div className={styles.seriesRow}>
        <span className={styles.toggle}><strong>{group.title}</strong><span>{group.count} {group.count === 1 ? "episode" : "episodes"} · {dayRange(Math.floor(group.first / pace) + 1, Math.floor(group.last / pace) + 1)}</span></span>
      </div></div>)}</div>
      <div className={styles.footer}>
        {error ? <p role="alert" className={learn.error}>{error}</p> : null}
        <button type="button" className={learn.primary} disabled={saving || !data.canWrite} onClick={() => save(suggested)}>{saving ? "Saving…" : "Use this plan"}<DashboardIcon name="right" size={16} /></button>
        <button type="button" className={learn.secondary} disabled={saving} onClick={() => setReview([...suggested])}>See it day by day</button>
      </div>
    </> : !episodes.length ? <p className={learn.muted}>The podcast library is unavailable right now. Your path is saved; come back to build your plan.</p>
    : <Picker groups={groups} chosen={chosen} setChosen={setChosen} max={slots} perDay={pace} unit={{ one: "episode", many: "episodes" }} searchLabel="Search series or episodes" onReview={() => setReview([...chosen])}
        intro={!chosen.length && suggested.length ? <button type="button" className={styles.add} style={{ justifySelf: "start" }} onClick={() => setChosen(() => [...suggested])}>Start from the suggested plan</button> : null} />}
  </section>;
}

/**
 * Choose doctrinal journey (user, 24 November): the Teachings Library inside
 * the picker. Add a series or single teachings, one a day, up to 120, then put
 * them in order. Counts toward the certificate like a podcast plan.
 */
export function JourneyBuilder({ data }: { data: LearningViewData }) {
  const teachings = useMemo(() => data.episodes.filter(episode => isTeachingKey(episode.guid)), [data.episodes]);
  const items = useMemo(() => new Map(teachings.map(teaching => [teaching.guid, teaching])), [teachings]);
  const groups = useMemo(() => libraryGroups(teachings), [teachings]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [review, setReview] = useState<string[] | null>(null);
  const { save, saving, error } = useSavePlan(data, "doctrinal");
  const eyebrow = "Personalised path · one a day";
  if (review) return <Review order={review} setOrder={update => setReview(list => update(list ?? []))} items={items} perDay={1} eyebrow={eyebrow} unit="teaching" saving={saving} error={error} onBack={() => setReview(null)} onStart={() => save(review)} />;
  return <section className={learn.page} style={{ paddingBottom: 0 }}>
    <header className={learn.header}><p className={learn.eyebrow}>{eyebrow}</p><h1>Choose your teachings</h1><p className={styles.lede}>From the Library. Add a whole series or single teachings</p></header>
    {!teachings.length ? <p className={learn.muted}>The Library is unavailable right now. Your path is saved; come back to choose your teachings.</p>
      : <Picker groups={groups} chosen={chosen} setChosen={setChosen} max={120} perDay={1} unit={{ one: "teaching", many: "teachings" }} searchLabel="Search the Library" onReview={() => setReview([...chosen])} />}
  </section>;
}

"use client";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import type { LearningEpisode } from "@/lib/sogp/learning-view";
import styles from "./learning.module.css";

/** "The Reality of God's Purpose (Part 3)" → series "The Reality of God's Purpose", part 3. */
function split(title: string) {
  const match = /^(.*?)\s*\(Part\s+(\d+)\)\s*$/i.exec(title);
  return match ? { series: match[1], part: Number(match[2]) } : { series: title, part: null };
}
function seconds(duration: string) {
  const parts = duration.split(":").map(Number);
  return parts.some(Number.isNaN) ? 0 : parts.reduce((total, value) => total * 60 + value, 0);
}
const clock = (total: number) => `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
function seriesGroups(guids: string[], episodes: Map<string, LearningEpisode>, pace: 1 | 2) {
  const groups: { series: string; first: number; last: number; parts: number[] }[] = [];
  guids.forEach((guid, index) => {
    const { series, part } = split(episodes.get(guid)?.title ?? "Episode");
    const current = groups.at(-1);
    if (current && current.series === series) { current.last = index; if (part) current.parts.push(part); }
    else groups.push({ series, first: index, last: index, parts: part ? [part] : [] });
  });
  return groups.map(group => ({ ...group, days: `${Math.floor(group.first / pace) + 1}–${Math.floor(group.last / pace) + 1}`, count: group.last - group.first + 1 }));
}

type Common = { pace: 1 | 2; guids: string[]; episodes: Map<string, LearningEpisode> };
const paceLabel = (pace: 1 | 2) => pace === 2 ? "30 min/day" : "15 min/day";
const perDay = (pace: 1 | 2) => pace === 2 ? "2 podcast episodes/day" : "1 podcast episode/day";

/** Paper: Pleros-onboarding-30min / -15min ("Preview your plan"). */
export function PlanPreviewStep({ pace, guids, episodes, onNext }: Common & { onNext: () => void }) {
  const firstDay = guids.slice(0, pace).map(guid => episodes.get(guid)).filter(Boolean) as LearningEpisode[];
  const total = firstDay.reduce((sum, episode) => sum + seconds(episode.duration), 0);
  return <section className={styles.page}>
    <header className={styles.header}><p className={styles.eyebrow}>{pace === 2 ? "30-minute path" : "15-minute path"}</p><h1>{pace === 2 ? "Two episodes each day" : "One episode each day"}</h1><p className={styles.muted}>Build your own 30-day podcast tracklist.</p></header>
    <div className={styles.summaryCard}><span className={styles.meta}>Daily time aim</span><strong>{paceLabel(pace)}</strong><span className={styles.meta}>{perDay(pace)}</span></div>
    <div className={styles.stack}>
      <div className={styles.metaRow}><h2>Suggested first day</h2>{total ? <span className={styles.meta}>{clock(total)} total</span> : null}</div>
      <ol className={styles.trackList}>{firstDay.map((episode, index) => { const { series, part } = split(episode.title); return <li key={episode.guid}><span className={styles.trackNumber}>{String(index + 1).padStart(2, "0")}</span><span><strong>{series}</strong><span className={styles.meta}>{part ? `Part ${part} · ` : ""}Podcast · {episode.duration}</span></span></li>; })}</ol>
    </div>
    <div className={styles.stack}><h2>Purpose is a suggested start</h2><p className={styles.muted}>Use this suggestion or choose other episodes; edit and reorder all {pace * 30} episode slots.</p><p className={styles.meta}>Individual podcast durations vary.</p></div>
    <div className={styles.footer}><p className={`${styles.meta} ${styles.centre}`}>30 days · {pace * 30} episode slots</p><button type="button" className={styles.primary} onClick={onNext}>Build my 30-day tracklist<DashboardIcon name="arrow" /></button></div>
  </section>;
}

/** Paper: Pleros-tracklist-suggested ("Make it your tracklist", step 1 of 3). */
export function SuggestedTracklistStep({ pace, guids, episodes, onUse, onEdit }: Common & { onUse: () => void; onEdit: () => void }) {
  const groups = seriesGroups(guids, episodes, pace);
  const lead = groups.slice(0, 3), rest = groups.slice(3);
  return <section className={styles.page}>
    <header className={styles.header}><p className={styles.eyebrow}>Your 30-day plan · Step 1 of 3</p><h1>Make it your tracklist</h1><p className={styles.muted}>Purpose is an optional starting point. Choose any episodes from the library.</p></header>
    <div className={styles.summaryCard}><span className={styles.meta}>{paceLabel(pace)}</span><div className={styles.split}><strong>{Math.ceil(guids.length / pace)} days</strong><strong>{guids.length} episodes</strong></div></div>
    <div className={styles.stack}>
      <div className={styles.metaRow}><h2>Suggested plan</h2><span className={styles.accent}>{guids.length}/{pace * 30} selected</span></div>
      <ol className={styles.seriesCard}>{lead.map((group, index) => <li key={`${group.series}-${group.first}`}><span className={styles.trackNumber}>{String(index + 1).padStart(2, "0")}</span><span><strong>{group.series}</strong><span className={styles.meta}>{group.parts.length > 1 ? `Parts ${Math.min(...group.parts)}–${Math.max(...group.parts)} · ` : ""}Days {group.days}</span></span><span className={styles.accent}><DashboardIcon name="check" /></span></li>)}</ol>
    </div>
    {rest.length ? <div className={styles.stack}><h2>Then continue with</h2><ul className={styles.plainList}>{rest.map(group => <li key={`${group.series}-${group.first}`}><span>{group.series}</span><span className={styles.meta}>{group.count} {group.count === 1 ? "episode" : "episodes"}</span></li>)}</ul></div> : null}
    <p className={styles.muted}>Your starting plan is filled. Swap episodes from the library or change their order next.</p>
    <button type="button" className={styles.rowButton} onClick={onEdit}><DashboardIcon name="edit" /><span>Edit episodes</span><DashboardIcon name="right" size={16} /></button>
    <div className={styles.footer}><p className={`${styles.meta} ${styles.centre}`}>{pace === 2 ? "2 episodes" : "1 episode"} each day · You can make it yours</p><button type="button" className={styles.primary} onClick={onUse}>Use suggested plan<DashboardIcon name="arrow" /></button></div>
  </section>;
}

/** Paper: Pleros-tracklist-review / -review-15min ("Your next 30 days, ready", step 3 of 3). Saving happens here. */
export function TracklistReadyStep({ pace, guids, episodes, saving, canWrite, error, onEdit, onStart }: Common & { saving: boolean; canWrite: boolean; error: string | null; onEdit: () => void; onStart: () => void }) {
  const firstDay = guids.slice(0, pace).map(guid => episodes.get(guid)).filter(Boolean) as LearningEpisode[];
  const total = firstDay.reduce((sum, episode) => sum + seconds(episode.duration), 0);
  const days = Math.ceil(guids.length / pace);
  return <section className={styles.page}>
    <header className={styles.header}><p className={styles.eyebrow}>Your 30-day plan · Step 3 of 3</p><h1>Your next {days} days, ready</h1><p className={styles.muted}>A little time, set aside every day. Your chosen episodes, in your own order.</p></header>
    <div className={styles.summaryCard}><span className={styles.eyebrow}>Your daily aim</span><strong>{paceLabel(pace)}</strong><span className={styles.meta}>{pace === 2 ? "2 podcast episodes each day" : "1 podcast episode each day"}</span><div className={styles.summaryFacts}><span><DashboardIcon name="calendar" size={16} />{days} days</span><span><DashboardIcon name="headphones" size={16} />{guids.length} episodes</span></div></div>
    <div className={styles.stack}>
      <div className={styles.metaRow}><h2>Day 1</h2><span className={styles.meta}>{firstDay.length} {firstDay.length === 1 ? "episode" : "episodes"}{total ? ` · ${clock(total)}` : ""}</span></div>
      <ol className={styles.seriesCard}>{firstDay.map((episode, index) => <li key={episode.guid}><span className={styles.trackNumber}>{String(index + 1).padStart(2, "0")}</span><span><strong>{episode.title}</strong><span className={styles.meta}><DashboardIcon name="headphones" size={16} /> Podcast · {episode.duration}</span></span></li>)}</ol>
    </div>
    <div className={styles.readyLine}><DashboardIcon name="circlecheck" /><span><strong>Your tracklist is ready</strong><span className={styles.meta}>{guids.length}/{pace * 30} episodes selected</span><span className={styles.meta}>Ordered across all {days} days</span></span></div>
    <button type="button" className={styles.rowButton} onClick={onEdit}><DashboardIcon name="edit" /><span>Edit episodes or reorder</span><DashboardIcon name="right" size={16} /></button>
    <p className={styles.readyNote}><DashboardIcon name="clock" size={16} /><span>Your daily aim is approximate. Individual episode durations vary.</span></p>
    <div className={styles.footer}>{error ? <p role="alert" className={styles.error}>{error}</p> : null}<p className={`${styles.meta} ${styles.centre}`}>Your first {pace === 2 ? "two episodes" : "episode"}{total ? ` · ${Math.floor(total / 60)} min ${total % 60} sec` : ""}</p><button type="button" className={styles.primary} disabled={saving || !canWrite || !guids.length} onClick={onStart}>{saving ? "Saving…" : "Start day 1"}<DashboardIcon name="play" size={24} /></button></div>
  </section>;
}

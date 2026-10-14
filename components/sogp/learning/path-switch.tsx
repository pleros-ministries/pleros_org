"use client";
import { DashboardIcon, StatusPill } from "@/components/dashboard/v3/primitives";
import { readPodcastPlan, switchPodcastPace } from "@/lib/sogp/podcast-plan";
import type { LearningViewData } from "@/lib/sogp/learning-view";
import type { SogpLearningPath } from "@/lib/sogp/learning-input";
import styles from "./learning.module.css";

const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const paceLabel = (pace: 1 | 2) => pace === 2 ? "30 min/day" : "15 min/day";

type Props = { data: LearningViewData; target: SogpLearningPath; saving: boolean; error: string | null; onConfirm: () => void; onCancel: () => void };

/** Paper: Pleros-learning-switch-one-episode (and the 1→2 direction). Only remaining episodes regroup. */
export function PaceSwitchConfirm({ data, target, saving, error, onConfirm, onCancel }: Props) {
  const state = data.state!, plan = state.plan!;
  const nextPace = target === "podcast_two" ? 2 : 1;
  const progress = { listenedEpisodeGuids: new Set(state.progress.listenedEpisodeGuids), playbackPositionSeconds: new Map(state.progress.playbackPositions.map(row => [row.episodeGuid, row.positionSeconds])) };
  const switched = switchPodcastPace(plan, nextPace, progress);
  const read = readPodcastPlan(switched, progress);
  const remaining = read.days.flatMap(day => day.episodes).filter(episode => !episode.listened);
  const listened = [...plan.episodeGuids, ...plan.historyEpisodeGuids].filter(guid => progress.listenedEpisodeGuids.has(guid)).length;
  const days = read.days.filter(day => !day.complete).length;
  const episodes = new Map(data.episodes.map(episode => [episode.guid, episode]));
  const labels = ["Next learning day", "Then", "After that"];
  return <section className={styles.page}>
    <header className={styles.header}><p className={styles.eyebrow}>Preview before switching</p><h1>{nextPace === 1 ? "A little more space" : "A little more each day"}</h1><p className={styles.muted}>{nextPace === 1 ? "Move from two episodes to one each day." : "Move from one episode to two each day."} Only your remaining episodes are regrouped.</p></header>
    <div className={styles.compare}><div><span className={styles.eyebrow}>Current</span><strong>{paceLabel(plan.episodesPerDay)}</strong><span className={styles.meta}>{plan.episodesPerDay === 2 ? "2 episodes" : "1 episode"}</span></div><DashboardIcon name="arrow" /><div><span className={styles.eyebrow}>New</span><strong>{paceLabel(nextPace)}</strong><span className={styles.meta}>{nextPace === 2 ? "2 episodes" : "1 episode"}</span></div></div>
    <ul className={`${styles.checkList} ${styles.factPanel}`}>
      <li><DashboardIcon name="shield" size={16} />{listened} listened {listened === 1 ? "episode stays" : "episodes stay"} completed.</li>
      <li><DashboardIcon name="circlecheck" size={16} />{remaining.length} remaining {remaining.length === 1 ? "episode keeps its" : "episodes keep their"} order.</li>
      <li><DashboardIcon name="circlecheck" size={16} />All saved playback positions stay.</li>
    </ul>
    <div className={styles.stack}><h2>Your remaining plan</h2><p className={styles.meta}>{days} learning {days === 1 ? "day" : "days"} · {nextPace === 2 ? "Two episodes each day" : "One episode each day"}</p>
      <ol className={styles.seriesCard}>{remaining.slice(0, 3).map((episode, index) => { const item = episodes.get(episode.episodeGuid); return <li key={episode.episodeGuid}><span /><span><span className={`${styles.eyebrow} ${styles.blueEyebrow}`}>{labels[index]}</span><strong>{item?.title ?? "Episode no longer in the catalogue"}</strong><span className={styles.meta}>{item?.duration ?? "Duration unavailable"} · {episode.playbackPositionSeconds ? `Resume at ${clock(episode.playbackPositionSeconds)}` : "Not started"}</span></span></li>; })}</ol>
    </div>
    <p className={styles.readyNote}><DashboardIcon name="calendar" size={16} /><span>No episodes are dropped to fit 30 days.{nextPace === 1 ? " Your remaining plan takes longer at this pace." : ""}</span></p>
    <p className={styles.readyNote}><DashboardIcon name="clock" size={16} /><span>Missed days wait for you. Nothing skips or advances by date.</span></p>
    <div className={styles.footer}>{error ? <p role="alert" className={styles.error}>{error}</p> : null}
      <button type="button" className={styles.secondary} disabled={saving} onClick={onCancel}>Keep my current pace</button>
      <p className={`${styles.meta} ${styles.centre}`}>You can switch again at any time</p>
      <button type="button" className={styles.primary} disabled={saving || !data.canWrite} onClick={onConfirm}>{saving ? "Saving…" : `Switch to ${nextPace} ${nextPace === 1 ? "episode" : "episodes"} a day`}<DashboardIcon name="check" /></button></div>
  </section>;
}

/** Paper: Pleros-learning-switch-traditional (both directions). Histories stay separate; no credit transfers. */
export function PathSwitchConfirm({ data, target, saving, error, onConfirm, onCancel }: Props) {
  const state = data.state!;
  const plan = state.plan;
  const progress = { listenedEpisodeGuids: new Set(state.progress.listenedEpisodeGuids), playbackPositionSeconds: new Map(state.progress.playbackPositions.map(row => [row.episodeGuid, row.positionSeconds])) };
  const read = plan ? readPodcastPlan(plan, progress) : null;
  const listened = plan ? [...plan.episodeGuids, ...plan.historyEpisodeGuids].filter(guid => progress.listenedEpisodeGuids.has(guid)).length : 0;
  const next = read?.nextDay?.episodes.find(episode => !episode.listened);
  const nextEpisode = next ? data.episodes.find(episode => episode.guid === next.episodeGuid) : null;
  const toTraditional = target === "traditional";
  const podcastCurrent = state.path !== "traditional";
  return <section className={styles.page}>
    <header className={styles.header}><p className={styles.eyebrow}>Your learning history</p><h1>Pick up either path</h1><p className={styles.muted}>Traditional SOGP uses full teaching tracks. Podcasts use shorter, individual episodes.</p></header>
    <div className={styles.pathCard} data-target={!toTraditional}>
      <div className={styles.metaRow}><h2><DashboardIcon name="headphones" size={20} />Podcast plan</h2>{podcastCurrent ? <StatusPill tone="blue">Current</StatusPill> : !toTraditional ? <span className={styles.accent}><DashboardIcon name="check" /></span> : null}</div>
      {plan ? <><p className={styles.meta}>{paceLabel(plan.episodesPerDay)} · {plan.episodesPerDay === 2 ? "2 episodes" : "1 episode"}</p><p>{listened} {listened === 1 ? "episode" : "episodes"} listened · {read!.days.flatMap(day => day.episodes).filter(episode => !episode.listened).length} remaining</p>{nextEpisode ? <p className={styles.meta}>{nextEpisode.title}{next?.playbackPositionSeconds ? ` · Playback saved at ${clock(next.playbackPositionSeconds)}` : ""}</p> : null}</> : <p className={styles.meta}>No podcast plan yet. You’ll build one after switching.</p>}
    </div>
    <div className={styles.pathCard} data-target={toTraditional}>
      <div className={styles.metaRow}><h2><DashboardIcon name="book" size={20} />Traditional SOGP</h2>{!podcastCurrent ? <StatusPill tone="blue">Current</StatusPill> : toTraditional ? <span className={styles.accent}><DashboardIcon name="check" /></span> : null}</div>
      <p className={styles.meta}>1 hr/day · Full teaching tracks</p>
      <p>{data.traditional.completed} {data.traditional.completed === 1 ? "track" : "tracks"} completed</p>
      {data.traditional.nextTitle ? <p className={styles.meta}>Next: {data.traditional.nextTitle}</p> : null}
    </div>
    <div className={styles.stack}><h2>What happens when you switch</h2>
      <ul className={styles.checkList}>
        <li><DashboardIcon name="circlecheck" size={16} />Both paths keep their own history, completions and playback positions.</li>
        <li><DashboardIcon name="circlecheck" size={16} />Switching doesn’t transfer completion. Podcast listens do not complete tracks.</li>
        <li><DashboardIcon name="circlecheck" size={16} />{toTraditional ? "Resume your saved traditional track immediately after switching. Your podcast plan is kept for you." : plan ? "Your podcast plan resumes where you left it. Your traditional progress is kept." : "Build a podcast plan next. Your traditional progress is kept."}</li>
        <li><DashboardIcon name="circlecheck" size={16} />Switch back whenever you’re ready.</li>
      </ul>
    </div>
    <div className={styles.footer}>{error ? <p role="alert" className={styles.error}>{error}</p> : null}
      <button type="button" className={styles.secondary} disabled={saving} onClick={onCancel}>{podcastCurrent ? "Stay on my podcast plan" : "Stay on traditional"}</button>
      <p className={`${styles.meta} ${styles.centre}`}>Your path changes only when you confirm</p>
      <button type="button" className={styles.primary} disabled={saving || !data.canWrite} onClick={onConfirm}>{saving ? "Saving…" : toTraditional ? "Switch & resume traditional" : plan ? "Switch & resume podcasts" : "Switch & build my plan"}<DashboardIcon name="check" /></button></div>
  </section>;
}

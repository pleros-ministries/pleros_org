"use client";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { saveSogpPlaybackAction, setSogpListenedAction } from "@/app/_actions/sogp-learning-actions";
import { readPodcastPlan } from "@/lib/sogp/podcast-plan";
import { learningResume, learningWriteNotice, type LearningEpisode, type LearningViewData } from "@/lib/sogp/learning-view";
import { LessonAudioControls } from "@/components/media/lesson-audio-controls";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import { ChevronRightIcon, HeadphonesIcon, LibraryIcon, ListMusicIcon } from "lucide-react";
import { DisciplerQuestion } from "../discipler-question";
import styles from "./learning.module.css";

function PodcastPlayer({ episode,position,canWrite }: { episode: LearningEpisode;position?: { positionSeconds: number;revision: number };canWrite: boolean }) {
  const persistence = useRef({ revision: position?.revision ?? 0,desired: position?.positionSeconds ?? 0,saved: position?.positionSeconds ?? 0,busy: false });
  const [error,setError] = useState<string | null>(null);
  const [status,setStatus] = useState("");
  async function save(seconds: number) {
    if (!canWrite || !Number.isFinite(seconds) || seconds < 0) return;
    const pending = persistence.current;
    pending.desired = seconds;
    if (pending.busy || seconds === pending.saved) return;
    pending.busy = true;
    const requested = seconds;
    try {
      const result = await saveSogpPlaybackAction({ episodeGuid: episode.guid,positionSeconds: requested,expectedPlaybackRevision: pending.revision });
      if (!result.ok) { setError(result.error);return; }
      pending.revision = result.value.revision;pending.saved = requested;
      setError(null);setStatus("Playback position saved");
    } catch { setError("Playback position could not be saved. Retry while keeping your place."); }
    finally { pending.busy = false; }
    if (pending.desired !== requested) void save(pending.desired);
  }
  return <div className={styles.stack}>
    {episode.audioUrl ? <LessonAudioControls key={episode.guid} src={episode.audioUrl} label="podcast" dashboard initialPositionSeconds={position?.positionSeconds ?? 0} onSavePosition={seconds => { void save(seconds); }} onProgress={seconds => { persistence.current.desired = seconds;if (Math.abs(seconds - persistence.current.saved) >= 15) void save(seconds); }} /> : <p className={styles.muted}>Audio is unavailable for this episode. Your history is preserved.</p>}
    <p role="status" className={styles.meta}>{status}</p>
    {error ? <div className={styles.stack}><p role="alert" className={styles.error}>{error}</p><div className={styles.tools}><button type="button" onClick={() => { void save(persistence.current.desired); }}>Retry saving position</button><button type="button" onClick={() => window.location.reload()}>Reload saved state</button></div></div> : null}
  </div>;
}
function dayLength(durations: (string | undefined)[]) {
  const total = durations.reduce((sum, value) => { const parts = (value ?? "").split(":").map(Number); return parts.length > 1 && !parts.some(Number.isNaN) ? sum + parts.reduce((acc, part) => acc * 60 + part, 0) : sum; }, 0);
  return total ? ` · ${Math.floor(total / 60)} min ${total % 60} sec of listening` : "";
}


export function ListeningPage({ data,requestedDay }: { data: LearningViewData;requestedDay?: number }) {
  const [dayNumber] = useState(requestedDay ?? learningResume(data.state)?.dayNumber ?? 1);
  const [error,setError] = useState<string | null>(null);
  const [saving,startMark] = useTransition();
  const query = useQueryClient();
  const router = useRouter();
  const state = data.state;
  const plan = state?.plan ? readPodcastPlan(state.plan,{ listenedEpisodeGuids: new Set(state.progress.listenedEpisodeGuids),playbackPositionSeconds: new Map(state.progress.playbackPositions.map(row => [row.episodeGuid,row.positionSeconds])) }) : null;
  const day = plan?.days.find(item => item.dayNumber === dayNumber);
  function mark(episodeGuid: string,listened: boolean) {
    startMark(async () => {
      try {
        const result = await setSogpListenedAction({ episodeGuid,listened,expectedRevision: state?.revision ?? 0 });
        if (!result.ok) { setError(result.error);return; }
        query.setQueryData<LearningViewData>(["sogp","learning-v3"],old => old ? { ...old,state: result.value } : { ...data,state: result.value });
        setError(null);router.refresh();
      } catch { setError("The listened mark could not be saved. Try again; your progress is unchanged."); }
    });
  }
  const listenedCount = day ? day.episodes.filter(episode => episode.listened).length : 0;
  return <section className={styles.page}>
    <header className={styles.header}><p className={styles.eyebrow}>Podcast · {state?.plan?.episodesPerDay === 2 ? "30" : "15"} min/day</p><h1>{day ? day.episodes.length === 2 ? "Your two episodes" : "Your next episode" : "Your listening plan"}</h1>{day ? <p className={styles.muted}>Day {day.dayNumber}{dayLength(day.episodes.map(item => data.episodes.find(row => row.guid === item.episodeGuid)?.duration))}</p> : null}</header>
    {!day ? <div className={styles.empty}>
      <span className={styles.chip} aria-hidden="true"><HeadphonesIcon className="size-4" strokeWidth={2} /></span>
      <h2>Nothing to listen to here</h2>
      <p>No episodes are waiting on this day. Your completed history has not been removed.</p>
      <Link className={styles.primary} href="/dashboard/sogp/plan">Choose or edit your episodes</Link>
    </div> : <>
      <div className={styles.dayProgress}>
        <div className={styles.metaRow}><h2>{listenedCount} of {day.episodes.length} {day.episodes.length === 1 ? "episode" : "episodes"} marked listened</h2><span className={styles.pill} data-tone={day.complete ? "done" : undefined}>{day.complete ? "Day complete" : `Day ${day.dayNumber}`}</span></div>
        <div className={styles.meterTrack} aria-hidden="true"><i style={{ width: `${day.episodes.length ? Math.round(listenedCount / day.episodes.length * 100) : 0}%` }} /></div>
        <p className={styles.meta}>{day.episodes.length === 2 ? "Mark both listened to complete this day." : "Mark it listened to complete this day."}</p>
      </div>
      {day.episodes.map((item, index) => { const episode = data.episodes.find(row => row.guid === item.episodeGuid), position = state?.progress.playbackPositions.find(row => row.episodeGuid === item.episodeGuid);
        const saved = position && position.positionSeconds > 0 && !item.listened ? ` · Saved at ${Math.floor(position.positionSeconds / 60)}:${String(Math.floor(position.positionSeconds % 60)).padStart(2, "0")}` : "";
        return <article className={styles.episode} key={item.episodeGuid}>
          <div className={styles.episodeHead}>
            <span className={styles.chip} aria-hidden="true"><HeadphonesIcon className="size-4" strokeWidth={2} /></span>
            <div className={styles.rowCopy}><h2 className={styles.episodeTitle}>{episode?.title ?? "Episode no longer in the catalogue"}</h2><span className={styles.meta}>{day.episodes.length > 1 ? `Episode ${index + 1} · ` : "Podcast · "}{episode?.duration || "Duration unavailable"}{saved}</span></div>
            <span className={styles.pill} data-tone={item.listened ? "done" : undefined}>{item.listened ? "Listened" : "To listen"}</span>
          </div>
          {episode ? <PodcastPlayer episode={episode} position={position} canWrite={data.canWrite} /> : <p className={styles.muted}>Your completion and saved position remain in your history.</p>}
          <button type="button" className={item.listened ? styles.secondary : styles.primary} disabled={saving || !data.canWrite} onClick={() => mark(item.episodeGuid,!item.listened)}>{saving ? "Saving…" : item.listened ? "Undo listened mark" : "Mark listened"}<DashboardIcon name="check" size={16} /></button>
          {episode ? <DisciplerQuestion guid={item.episodeGuid} title={episode.title} kind="episode" disabled={!data.canWrite} /> : null}
        </article>;
      })}
      {day.complete ? <Link className={styles.primary} href="/dashboard/sogp">Day completed · Back to Learning</Link> : null}
    </>}
    {!data.canWrite ? <p className={styles.notice}>{learningWriteNotice(data)}</p> : null}
    {error ? <div className={styles.stack}><p role="alert" className={styles.error}>{error}</p><button type="button" className={styles.secondary} onClick={() => window.location.reload()}>Reload saved progress</button></div> : null}
    {day ? <p className={styles.readyNote}><DashboardIcon name="calendar" size={16} /><span>Missed days wait. {day.episodes.length === 2 ? "Mark both episodes listened" : "Mark the episode listened"} to complete this day.</span></p> : null}
    <div className={styles.panel}><ul className={styles.list}>
      <li><Link className={styles.listRow} href="/dashboard/sogp/plan">
        <span className={styles.chip} style={{ background: "#fff1c2", color: "#8a5a00" }} aria-hidden="true"><ListMusicIcon className="size-4" strokeWidth={2} /></span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>Your tracklist</span><span className={styles.rowMeta}>Reorder or replace what’s left</span></span>
        <ChevronRightIcon className={`size-4 ${styles.chevron}`} strokeWidth={2} />
      </Link></li>
      <li><Link className={styles.listRow} href="/dashboard/podcast">
        <span className={styles.chip} style={{ background: "#cfe6fb", color: "#0e3f73" }} aria-hidden="true"><LibraryIcon className="size-4" strokeWidth={2} /></span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>Podcast library and history</span><span className={styles.rowMeta}>Every episode and what you’ve heard</span></span>
        <ChevronRightIcon className={`size-4 ${styles.chevron}`} strokeWidth={2} />
      </Link></li>
    </ul></div>
  </section>;
}

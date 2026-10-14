"use client";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { saveSogpPlaybackAction, setSogpListenedAction } from "@/app/_actions/sogp-learning-actions";
import { readPodcastPlan } from "@/lib/sogp/podcast-plan";
import { learningResume, learningWriteNotice, type LearningEpisode, type LearningViewData } from "@/lib/sogp/learning-view";
import { LessonAudioControls } from "@/components/media/lesson-audio-controls";
import { DashboardIcon, StatusPill } from "@/components/dashboard/v3/primitives";
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
  return <section className={styles.page}>
    <Link href="/dashboard/sogp">← Back to My SOGP</Link>
    <header className={styles.header}><p className={styles.meta}>Podcast · {state?.plan?.episodesPerDay === 2 ? "30" : "15"} min/day</p><h1>{day ? day.episodes.length === 2 ? "Your two episodes" : "Your next episode" : "Your listening plan"}</h1>{day ? <p className={styles.muted}>Day {day.dayNumber}</p> : null}</header>
    {!day ? <div className={styles.stack}><p>No episodes are waiting on this day. Your completed history has not been removed.</p><Link className={styles.secondary} href="/dashboard/sogp/plan">Choose or edit your episodes</Link></div> : <>
      <div className={styles.notice}><h2>{day.episodes.filter(episode => episode.listened).length} of {day.episodes.length} episodes marked listened</h2><p className={styles.meta}>{day.episodes.length === 2 ? "Both episodes must be marked listened to complete this day." : "Mark this episode listened to complete this day."} Playback ending does not mark completion.</p></div>
      {day.episodes.map(item => { const episode = data.episodes.find(row => row.guid === item.episodeGuid), position = state?.progress.playbackPositions.find(row => row.episodeGuid === item.episodeGuid);
        return <article className={styles.episode} key={item.episodeGuid}><h2>{episode?.title ?? "Episode no longer in the catalogue"}</h2><p className={styles.meta}>{episode?.duration || "Duration unavailable"}</p><StatusPill tone={item.listened ? "green" : "neutral"}>{item.listened ? "Listened" : "Not marked listened"}</StatusPill>{episode ? <PodcastPlayer episode={episode} position={position} canWrite={data.canWrite} /> : <p>Your completion and saved position remain in your history.</p>}<button type="button" className={item.listened ? styles.secondary : styles.primary} disabled={saving || !data.canWrite} onClick={() => mark(item.episodeGuid,!item.listened)}>{saving ? "Saving…" : item.listened ? "Undo listened mark" : "Mark listened"}<DashboardIcon name="check" /></button></article>;
      })}
      {day.complete ? <Link className={styles.primary} href="/dashboard/sogp">Day completed · Back to My SOGP</Link> : null}
    </>}
    {!data.canWrite ? <p className={styles.muted}>{learningWriteNotice(data)}</p> : null}
    {error ? <div className={styles.stack}><p role="alert" className={styles.error}>{error}</p><button type="button" className={styles.secondary} onClick={() => window.location.reload()}>Reload saved progress</button></div> : null}
    <div className={styles.notice}><p>Questions are optional and don’t affect completion.</p><p className={styles.meta}>Episode-specific question delivery is not connected yet. You can still use Ask Pleros, with its existing privacy choice.</p><Link href="/dashboard/community/ask">Open Ask Pleros</Link></div>
    <Link href="/dashboard/podcast">Existing podcast library and history</Link>
  </section>;
}

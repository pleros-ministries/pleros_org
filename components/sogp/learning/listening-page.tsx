"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { saveSogpPlaybackAction, setSogpListenedAction } from "@/app/_actions/sogp-learning-actions";
import { readPodcastPlan } from "@/lib/sogp/podcast-plan";
import { learningResume, learningWriteNotice, type LearningEpisode, type LearningViewData } from "@/lib/sogp/learning-view";
import { LessonAudioControls } from "@/components/media/lesson-audio-controls";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
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

/** Per-episode question: to the active discipler with episode context, else Ask Pleros. */
function EpisodeQuestion({ episodeGuid, episodeTitle, canWrite }: { episodeGuid: string; episodeTitle: string; canWrite: boolean }) {
  const [route, setRoute] = useState<"discipler" | "ask" | null>(null);
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSend] = useTransition();
  useEffect(() => {
    let live = true;
    import("@/app/(site)/dashboard/sogp/discipleship/_actions").then(
      ({ getEpisodeQuestionRouteAction }) => getEpisodeQuestionRouteAction().then(
        result => { if (live) setRoute(result.kind === "discipler" ? "discipler" : "ask"); },
        () => { if (live) setRoute("ask"); },
      ),
      () => { if (live) setRoute("ask"); },
    );
    return () => { live = false; };
  }, []);
  function send() {
    if (!body.trim()) { setError("Write your question first."); return; }
    startSend(async () => {
      try {
        const { askEpisodeQuestionAction } = await import("@/app/(site)/dashboard/sogp/discipleship/_actions");
        const result = await askEpisodeQuestionAction({ episodeGuid, episodeTitle, body: body.trim() });
        if (!result.ok) { setError(result.error); return; }
        setBody(""); setOpen(false); setSent(true); setError(null);
      } catch { setError("Your question could not be sent. Try again."); }
    });
  }
  if (!route) return null;
  if (route === "ask" && !open) {
    const params = new URLSearchParams({ episodeGuid, episodeTitle });
    return <div className={styles.stack}><Link className={styles.rowButton} href={`/dashboard/community/ask?${params.toString()}`}><DashboardIcon name="chat" /><span>Ask a question · Optional</span><DashboardIcon name="right" size={16} /></Link><p className={styles.meta}>Questions aren’t required for completion. They go to Pleros through Ask Pleros.</p></div>;
  }
  return <div className={styles.stack}>
    {!open && !sent ? <button type="button" className={styles.rowButton} disabled={!canWrite} onClick={() => setOpen(true)}><DashboardIcon name="chat" /><span>Ask about this episode · Optional</span><DashboardIcon name="right" size={16} /></button> : null}
    {open ? <>
      <label className={styles.field}>Your question<textarea rows={4} maxLength={2000} value={body} disabled={saving} onChange={event => setBody(event.target.value)} placeholder="Ask your discipler about this episode" /></label>
      {error ? <p role="alert" className={styles.error}>{error}</p> : null}
      <div className={styles.tools}><button type="button" className={styles.primary} disabled={saving || !canWrite} onClick={send}>{saving ? "Sending…" : "Send to my discipler"}</button><button type="button" className={styles.secondary} onClick={() => { setOpen(false); setError(null); }}>Cancel</button></div>
      <p className={styles.meta}>Only you and your discipler see this question.</p>
    </> : null}
    {sent ? <p role="status" className={styles.meta}>Sent to your discipler.</p> : null}
    {!open && !sent ? <p className={styles.meta}>Questions aren’t required for completion.</p> : null}
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
    <header className={styles.header}><p className={styles.eyebrow}>Podcast · {state?.plan?.episodesPerDay === 2 ? "30" : "15"} min/day</p><h1>{day ? day.episodes.length === 2 ? "Your two episodes" : "Your next episode" : "Your listening plan"}</h1>{day ? <p className={styles.muted}>Day {day.dayNumber}{dayLength(day.episodes.map(item => data.episodes.find(row => row.guid === item.episodeGuid)?.duration))}</p> : null}</header>
    {!day ? <div className={styles.stack}><p>No episodes are waiting on this day. Your completed history has not been removed.</p><Link className={styles.secondary} href="/dashboard/sogp/plan">Choose or edit your episodes</Link></div> : <>
      <div className={styles.dayProgress}><h2>{day.episodes.filter(episode => episode.listened).length} of {day.episodes.length} {day.episodes.length === 1 ? "episode" : "episodes"} marked listened</h2><p className={styles.meta}>{day.episodes.length === 2 ? "Mark both listened to complete this day." : "Mark it listened to complete this day."}</p></div>
      {day.episodes.map(item => { const episode = data.episodes.find(row => row.guid === item.episodeGuid), position = state?.progress.playbackPositions.find(row => row.episodeGuid === item.episodeGuid);
        return <article className={styles.episode} key={item.episodeGuid}><h2>{episode?.title ?? "Episode no longer in the catalogue"}</h2><div className={styles.metaRow}><p className={styles.meta}>Podcast · {episode?.duration || "Duration unavailable"}</p><span className={styles.meta}>{item.listened ? "Listened" : "Not marked listened"}</span></div>{episode ? <PodcastPlayer episode={episode} position={position} canWrite={data.canWrite} /> : <p>Your completion and saved position remain in your history.</p>}<button type="button" className={item.listened ? styles.secondary : styles.primary} disabled={saving || !data.canWrite} onClick={() => mark(item.episodeGuid,!item.listened)}>{saving ? "Saving…" : item.listened ? "Undo listened mark" : "Mark listened"}<DashboardIcon name="check" /></button>{episode ? <EpisodeQuestion episodeGuid={item.episodeGuid} episodeTitle={episode.title} canWrite={data.canWrite} /> : null}</article>;
      })}
      {day.complete ? <Link className={styles.primary} href="/dashboard/sogp">Day completed · Back to My SOGP</Link> : null}
    </>}
    {!data.canWrite ? <p className={styles.muted}>{learningWriteNotice(data)}</p> : null}
    {error ? <div className={styles.stack}><p role="alert" className={styles.error}>{error}</p><button type="button" className={styles.secondary} onClick={() => window.location.reload()}>Reload saved progress</button></div> : null}
    {day ? <p className={styles.readyNote}><DashboardIcon name="calendar" size={16} /><span>Missed days wait. {day.episodes.length === 2 ? "Mark both episodes listened" : "Mark the episode listened"} to complete this day.</span></p> : null}
    <Link href="/dashboard/podcast">Podcast library and history</Link>
  </section>;
}

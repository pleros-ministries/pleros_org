"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { chooseSogpPathAction } from "@/app/_actions/sogp-learning-actions";
import { learningResume, learningWriteNotice, type LearningViewData } from "@/lib/sogp/learning-view";
import type { SogpLearningPath } from "@/lib/sogp/learning-input";
import { switchPodcastPace } from "@/lib/sogp/podcast-plan";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import styles from "./learning.module.css";

export function LearningHome({ data }: { data: LearningViewData }) {
  const podcast = data.state?.path && data.state.path !== "traditional";
  const next = learningResume(data.state);
  const resumeHref = podcast ? next ? `/dashboard/sogp/listen?day=${next.dayNumber}` : "/dashboard/sogp/plan" : data.traditional.resumeHref;
  return <section className={styles.page}>
    <header className={styles.header}><h1>My SOGP</h1><p className={styles.muted}>Your learning, your pace. Your current plan and history stay with you.</p></header>
    <article className={styles.card}>
      <p className={styles.meta}>{podcast ? data.state!.path === "podcast_two" ? "30 min/day · Podcast path" : "15 min/day · Podcast path" : "1 hr/day · Traditional SOGP"}</p>
      <h2>{podcast ? next ? `Day ${next.dayNumber} is waiting for you` : "Your current plan is complete" : data.traditional.nextTitle ?? "Your traditional learning"}</h2>
      <p>{podcast ? next ? `${next.listened} of ${next.total} episodes marked listened` : "Choose more episodes whenever you’re ready." : `${data.traditional.completed} of ${data.traditional.total} tracks completed`}</p>
      <Link className={styles.primary} href={resumeHref}>{podcast && !next ? "Edit your plan" : "Resume learning"}<DashboardIcon name="play" size={24} /></Link>
    </article>
    <div className={styles.stack}><p>Missed a day? Your next listen waits.</p><p className={styles.meta}>Unfinished podcast episodes are never skipped. Traditional assessments keep their existing requirements.</p></div>
    <div className={styles.rows}>
      <Link className={styles.row} href="/dashboard/sogp/path"><span><strong>Your learning path</strong><span className={styles.meta}>Choose or switch your daily commitment</span></span><DashboardIcon name="right" size={16} /></Link>
      <Link className={styles.row} href="/dashboard/sogp/plan"><span><strong>Your tracklist</strong><span className={styles.meta}>Edit your podcast episodes and remaining days</span></span><DashboardIcon name="right" size={16} /></Link>
      <Link className={styles.row} href="/dashboard/podcast"><span><strong>Podcast history and library</strong><span className={styles.meta}>Your existing listens and journeys are retained</span></span><DashboardIcon name="right" size={16} /></Link>
      <Link className={styles.row} href="/dashboard/sogp/traditional"><span><strong>Traditional calendar and assessments</strong><span className={styles.meta}>Teaching, Prayer Watch, daily reviews and progress</span></span><DashboardIcon name="right" size={16} /></Link>
    </div>
    <div className={styles.notice}><h2>Weekly group reviews</h2><p>Required on both paths. Group scheduling and leader-confirmed attendance are not connected yet. Keep learning while this is being completed.</p></div>
    <div className={styles.tools}><Link href="/dashboard/sogp/referrals">Share my referral</Link><Link href="/dashboard/sogp/certificate">Existing certificate status</Link><Link href="/dashboard/pre-sogp">Pre-SOGP resources</Link><Link href="/dashboard/sogp/leaderboard">Leaderboard</Link></div>
  </section>;
}

export function PathChooser({ data }: { data: LearningViewData }) {
  const [path,setPath] = useState<SogpLearningPath | "">(data.state?.revision ? data.state.path : "");
  const [error,setError] = useState<string | null>(null);
  const [saving,startSave] = useTransition();
  const router = useRouter();
  const query = useQueryClient();
  const plan = data.state?.plan;
  const preview = plan && path && path !== "traditional" ? switchPodcastPace(plan,path === "podcast_one" ? 1 : 2,{ listenedEpisodeGuids: new Set(data.state!.progress.listenedEpisodeGuids),playbackPositionSeconds: new Map() }) : null;
  function submit() {
    if (!path) { setError("Choose one option to continue."); return; }
    if (path !== "traditional" && !plan) { router.push(`/dashboard/sogp/plan?path=${path}`); return; }
    startSave(async () => {
      try {
        const result = await chooseSogpPathAction({ path,expectedRevision: data.state?.revision ?? 0 });
        if (!result.ok) { setError(result.error); return; }
        query.setQueryData<LearningViewData>(["sogp","learning-v3"],old => ({ ...(old ?? data),state: result.value }));
        router.push("/dashboard/sogp"); router.refresh();
      } catch { setError("Your path could not be saved. Try again; your previous choice is unchanged."); }
    });
  }
  return <section className={styles.page}>
    <Link href="/dashboard/sogp">← Back to My SOGP</Link>
    <header className={styles.header}><p className={styles.meta}>Your daily commitment</p><h1>Make room to grow</h1><p className={styles.muted}>How much time will you set aside each day?</p></header>
    <fieldset className={styles.choices}><legend>Choose one option</legend>
      {([{ key: "traditional",title: "1 hr/day",description: "Traditional one-hour tracks" },{ key: "podcast_two",title: "30 min/day",description: "2 podcast episodes/day" },{ key: "podcast_one",title: "15 min/day",description: "1 podcast episode/day" }] as const).map(option => <label className={styles.choice} key={option.key}><span><strong>{option.title}</strong><span className={styles.meta}>{option.description}</span></span><input type="radio" name="path" value={option.key} checked={path === option.key} onChange={() => { setPath(option.key);setError(null); }} /></label>)}
    </fieldset>
    <div className={styles.notice}><p>Both paths keep their own history, completions and playback positions.</p><p className={styles.meta}>Switching doesn’t transfer completion. Your podcast plan is kept when you choose Traditional.</p>{preview ? <p>{preview.episodeGuids.length} queued episodes · {Math.ceil(preview.episodeGuids.length / preview.episodesPerDay)} learning days after this choice. No remaining episodes are dropped.</p> : null}</div>
    {!data.canWrite ? <p className={styles.muted}>{learningWriteNotice(data)}</p> : null}
    <div className={styles.footer}>{error ? <p role="alert" className={styles.error}>{error}</p> : null}<button className={styles.primary} type="button" disabled={saving || !data.canWrite} onClick={submit}>{saving ? "Saving…" : path && path !== "traditional" && !plan ? "Choose your episodes" : "Confirm path"}<DashboardIcon name="right" size={16} /></button></div>
  </section>;
}

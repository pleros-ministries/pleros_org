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
import { BookOpenIcon, HeadphonesIcon } from "lucide-react";
import styles from "./learning.module.css";
import { PaceSwitchConfirm, PathSwitchConfirm, TraditionalPreview } from "./path-switch";

export function LearningHome({ data }: { data: LearningViewData }) {
  const podcast = data.state?.path && data.state.path !== "traditional";
  const next = learningResume(data.state);
  const resumeHref = podcast ? next ? `/dashboard/sogp/listen?day=${next.dayNumber}` : "/dashboard/sogp/plan" : data.traditional.resumeHref;
  return <section className={`${styles.page} ${styles.homePage}`}>
    <header className={`${styles.header} ${styles.homeHeader}`}><h1>Your learning, your pace</h1><p className={styles.muted}>Your current plan and history stay with you.</p></header>
    <article className={styles.card}>
      <p className={styles.meta}>{podcast ? data.state!.path === "podcast_two" ? "30 min/day · Podcast path" : "15 min/day · Podcast path" : "1 hr/day · Traditional SOGP"}</p>
      <h2 data-dashboard-learning-title>{podcast ? next ? `Day ${next.dayNumber} is waiting for you` : "Your current plan is complete" : data.traditional.nextTitle ?? "Your traditional learning"}</h2>
      <p>{podcast ? next ? `${next.listened} of ${next.total} ${next.total === 1 ? "episode" : "episodes"} marked listened` : "Choose more episodes whenever you’re ready." : `${data.traditional.completed} of ${data.traditional.total} tracks completed`}</p>
      <Link className={styles.primary} href={resumeHref}>{podcast && !next ? "Edit your plan" : "Resume learning"}<DashboardIcon name="play" size={24} /></Link>
    </article>
    <div className={`${styles.stack} ${styles.tight}`}><p>{podcast ? "Missed a day? Your next listen waits." : "Missed a day? Your next lesson waits."}</p><p className={styles.meta}>{podcast ? "Unfinished episodes are never skipped." : "Unfinished lessons are never skipped."}</p></div>
    <div className={styles.rows}>
      <Link className={styles.row} href="/dashboard/sogp/plan"><span><strong>Your tracklist</strong><span className={styles.meta}>Edit episodes or switch your path</span></span><DashboardIcon name="right" size={16} /></Link>
      <Link className={styles.row} href={podcast ? "/dashboard/podcast" : "/dashboard/sogp/traditional"}><span><strong>Learning history</strong><span className={styles.meta}>{podcast && data.state ? `${data.state.progress.listenedEpisodeGuids.length} episodes listened${data.state.progress.playbackPositions.length ? " · Positions saved" : ""}` : `${data.traditional.completed} tracks completed`}</span></span><DashboardIcon name="right" size={16} /></Link>
      <Link className={styles.row} href="/dashboard/sogp/reviews"><span><strong>Weekly group reviews</strong><span className={styles.meta}>Required on traditional and podcast paths</span></span><DashboardIcon name="right" size={16} /></Link>
    </div>
    <section className={styles.stack}><h2>Your follow-up person</h2>{data.followUp ? <Link className={styles.person} href="/dashboard/sogp/follow-up/welcome"><span className={styles.avatar}>{data.followUp.name.trim().split(/\s+/).map(part=>part[0]??"").join("").slice(0,2).toUpperCase()}</span><span><strong>{data.followUp.name}</strong><span className={styles.meta}>{data.followUp.source === "code" ? "Joined with their referral code" : data.followUp.source === "link" ? "Joined through their referral link" : data.followUp.source === "geography" ? "Assigned by your location" : "Current follow-up"}</span></span></Link> : <p className={styles.meta}>You can start learning before a follow-up person is assigned.</p>}<Link className={styles.secondary} href="/dashboard/sogp/follow-up">Request someone else<DashboardIcon name="right" size={16} /></Link></section>
    <section className={styles.stack}><h2>Invite someone to SOGP</h2><p className={styles.meta}>Your personal referral code and link</p><Link className={styles.primary} href="/dashboard/sogp/referrals">Share my referral<DashboardIcon name="arrow" /></Link></section>
    <Link className={styles.row} href="/dashboard/sogp/readiness"><span><strong>Certification readiness</strong><span className={styles.meta}>Your learning and confirmed review history</span></span><DashboardIcon name="right" size={16} /></Link>
    <details className={styles.contextTools}><summary>Traditional learning tools</summary><div className={styles.tools}><Link href="/dashboard/sogp/traditional">Calendar and assessments</Link><Link href="/dashboard/sogp/certificate">Existing issued certificate</Link><Link href="/dashboard/pre-sogp">Pre-SOGP resources</Link><Link href="/dashboard/sogp/leaderboard">Leaderboard</Link></div></details>
  </section>;
}

export function PathChooser({ data }: { data: LearningViewData }) {
  const current = data.state?.revision ? data.state.path : null;
  const [path,setPath] = useState<SogpLearningPath | "">(current ?? "");
  const [confirming,setConfirming] = useState(false);
  const [error,setError] = useState<string | null>(null);
  const [saving,startSave] = useTransition();
  const router = useRouter();
  const query = useQueryClient();
  const plan = data.state?.plan;
  const preview = plan && path && path !== "traditional" ? switchPodcastPace(plan,path === "podcast_one" ? 1 : 2,{ listenedEpisodeGuids: new Set(data.state!.progress.listenedEpisodeGuids),playbackPositionSeconds: new Map() }) : null;
  function submit() {
    if (!path) { setError("Choose one option to continue."); return; }
    // An existing learner previews what a switch keeps before anything is saved (Paper).
    if ((current ? path !== current : path === "traditional") && !confirming) { setError(null); setConfirming(true); return; }
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
  if (confirming && path === "traditional" && !current) return <TraditionalPreview data={data} saving={saving} error={error} onConfirm={submit} onCancel={() => { setConfirming(false); setError(null); }} />;
  if (confirming && path && current) {
    const props = { data, target: path, saving, error, onConfirm: submit, onCancel: () => { setConfirming(false); setPath(current); setError(null); } };
    return current !== "traditional" && path !== "traditional" && plan ? <PaceSwitchConfirm {...props} /> : <PathSwitchConfirm {...props} />;
  }
  const podcastPick = path === "podcast_one" || path === "podcast_two";
  const tag = <span className={styles.currentTag}>Current</span>;
  // Two paths, the current one marked, Podcast's pace inline as a segmented control (mockup B).
  return <section className={`${styles.page} ${styles.choicePage}`}>
    <header className={styles.header}><h1>How you learn SOGP</h1><p className={styles.muted}>{current ? "You keep everything you’ve done. Switching only changes what comes next." : "Choose the time you can set aside each day."}</p></header>
    <div role="radiogroup" aria-label="Learning path" className={styles.pathOptions}>
      <button type="button" role="radio" aria-checked={path === "traditional"} onClick={() => { setPath("traditional"); setError(null); }} className={styles.pathOption}>
        <span className={styles.pathOptionHead}><span className={styles.pathOptionTitle}><span className={styles.pathOptionIcon} style={{ background: "#e4ebfd", color: "#2331ae" }} aria-hidden="true"><BookOpenIcon className="size-4" strokeWidth={2} /></span><strong>Traditional · 1 hr/day</strong></span>{current === "traditional" ? tag : null}</span>
        <span className={styles.meta}>A teaching a day with a quiz and a written response. Counts toward your certificate, with a weekly group review.</span>
      </button>
      <div role="radio" aria-checked={podcastPick} tabIndex={0} onClick={() => { if (!podcastPick) { setPath(current === "podcast_one" ? "podcast_one" : "podcast_two"); setError(null); } }} onKeyDown={event => { if ((event.key === "Enter" || event.key === " ") && !podcastPick) { event.preventDefault(); setPath("podcast_two"); } }} className={styles.pathOption}>
        <span className={styles.pathOptionHead}><span className={styles.pathOptionTitle}><span className={styles.pathOptionIcon} style={{ background: "#cfe6fb", color: "#0e3f73" }} aria-hidden="true"><HeadphonesIcon className="size-4" strokeWidth={2} /></span><strong>Podcast</strong></span>{current && current !== "traditional" ? tag : null}</span>
        <span className={styles.meta}>Listen to episodes at your own pace and reorder what’s left. Weekly group review.</span>
        <span className={styles.paceChips} role="group" aria-label="Podcast pace">
          {([["podcast_two", "30 min/day · 2 episodes"], ["podcast_one", "15 min/day · 1 episode"]] as const).map(([key, label]) => <button key={key} type="button" aria-pressed={path === key} onClick={event => { event.stopPropagation(); setPath(key); setError(null); }}>{label}</button>)}
        </span>
      </div>
    </div>
    {data.state?.revision ? <div className={styles.notice}><p>Both paths keep their own history, completions and playback positions.</p><p className={styles.meta}>Switching doesn’t transfer completion. Your podcast plan is kept when you choose Traditional.</p>{preview ? <p>{preview.episodeGuids.length} queued episodes · {Math.ceil(preview.episodeGuids.length / preview.episodesPerDay)} learning days after this choice. No remaining episodes are dropped.</p> : null}</div> : null}
    {!data.canWrite ? <p className={styles.muted}>{learningWriteNotice(data)}</p> : null}
    <div className={styles.footer}>{error ? <p role="alert" className={styles.error}>{error}</p> : null}<button className={styles.primary} type="button" disabled={saving || !data.canWrite || !path} onClick={submit}>{saving ? "Saving…" : current && path && path !== current ? "Preview this change" : current ? `Keep ${current === "traditional" ? "Traditional" : "this pace"}` : "Continue"}<DashboardIcon name="right" size={16} /></button></div>
  </section>;
}

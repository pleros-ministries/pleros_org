"use client";
import Link from "next/link";
import { learningResume, type LearningViewData } from "@/lib/sogp/learning-view";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import styles from "./learning.module.css";

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
    <details className={styles.contextTools}><summary>Traditional learning tools</summary><div className={styles.tools}><Link href="/dashboard/sogp/traditional">Calendar and assessments</Link><Link href="/dashboard/sogp/certificate">Existing issued certificate</Link><Link href="/dashboard/pre-sogp">Pre-SOGP resources</Link><Link href="/dashboard/leaderboard">Leaderboard</Link></div></details>
  </section>;
}

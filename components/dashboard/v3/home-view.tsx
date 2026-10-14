"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DashboardHomeData, HomeLearningCard } from "@/lib/dashboard/home";
import { DashboardIcon, LearningCard, ReportRow } from "./primitives";
import styles from "./dashboard.module.css";

const clock = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
function Progress({ value, total, label }: { value: number; total: number; label: string }) {
  return <div className={styles.whiteProgress} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}><span style={{ width: `${total > 0 ? Math.min(100, value / total * 100) : 0}%` }} /></div>;
}

/** Paper adaptive cards (adaptive_home.py): white bordered, blue actions; Start SOGP stays blue. */
function AdaptiveLearning({ card, planHref }: { card: HomeLearningCard; planHref: string }) {
  if (card.kind === "start") return <section className={styles.learning} aria-label="Your next step">
    <div className={styles.sectionHeader}><h2>Your next step</h2></div>
    <article className={styles.learningCard}><p className={styles.learningMeta}>SOGP</p><h2 className={styles.lessonTitle}>Make room to grow</h2><p className={styles.startCopy}>Choose a daily pace that fits your life. Traditional tracks or podcast episodes.</p><Link className={styles.lessonAction} href={card.href}>Start SOGP<DashboardIcon name="arrow" /></Link></article>
    <p className={styles.homeNote}><DashboardIcon name="clock" /><span><span className={styles.rowTitle}>1 hour, 30 minutes or 15 minutes a day</span><span className={styles.metadata}>You’ll choose before starting.</span></span></p>
  </section>;
  const header = <div className={styles.sectionHeader}><h2>Continue learning</h2><Link className={styles.textAction} href={planHref}>View plan</Link></div>;
  if (card.kind === "traditional") return <section className={styles.learning} aria-label="Continue learning">{header}
    <article className={styles.whiteCard}><p className={styles.metadata}>Traditional track · 1 hr/day</p><h2 className={styles.whiteTitle} data-dashboard-learning-title>{card.title}</h2><Progress value={card.completed} total={card.total} label="Tracks completed" /><div className={styles.playbackMetaDark}><span>{card.completed} completed</span><span>{card.total} tracks</span></div><Link className={styles.blueAction} href={card.href}>Resume track<DashboardIcon name="play" size={24} /></Link></article>
    <Link className={styles.planRow} href={planHref}><span className={styles.rowIcon}><DashboardIcon name="book" /></span><span className={styles.rowCopy}><span className={styles.rowTitle}>{card.completed} traditional {card.completed === 1 ? "track" : "tracks"} completed</span><span className={styles.metadata}>Your place in your course is saved.</span></span><span className={styles.rowIcon}><DashboardIcon name="right" size={16} /></span></Link>
  </section>;
  const current = card.episodes.findIndex(episode => !episode.listened);
  const active = card.episodes[current] ?? card.episodes[0];
  return <section className={styles.learning} aria-label="Continue learning">{header}
    <article className={styles.whiteCard}>
      <p className={styles.metadata}>Podcast plan · {card.pace === 2 ? "30" : "15"} min/day</p>
      {card.pace === 2 ? <>
        <h2 className={styles.whiteTitle} data-dashboard-learning-title>Today’s two episodes</h2><p className={styles.metadata}>{card.series}</p>
        <ul className={styles.dayEpisodes}>{card.episodes.map((episode, index) => <li key={index}>
          <div className={styles.episodeLine}><span>{episode.listened ? <DashboardIcon name="check" size={16} /> : null}{episode.part}{episode.listened && episode.durationSeconds ? ` · ${clock(episode.durationSeconds)}` : ""}</span><span className={episode.listened ? styles.doneText : styles.metadata}>{episode.listened ? "Completed" : episode.positionSeconds ? "In progress" : "Not started"}</span></div>
          {!episode.listened && index === current ? <><Progress value={episode.positionSeconds} total={episode.durationSeconds} label={`${episode.part} playback`} /><div className={styles.playbackMetaDark}><span>{clock(episode.positionSeconds)} elapsed</span><span>{episode.durationSeconds ? `${clock(episode.durationSeconds)} total` : ""}</span></div></> : null}
        </li>)}</ul>
        <Link className={styles.blueAction} href={card.href}>{active?.positionSeconds ? "Resume" : "Start"} episode {String(current + 1).padStart(2, "0")}<DashboardIcon name="play" size={24} /></Link>
      </> : <>
        <h2 className={styles.whiteTitle} data-dashboard-learning-title>{card.series}</h2><p className={styles.metadata}>{active?.part} · 1 episode today</p>
        <Progress value={active?.positionSeconds ?? 0} total={active?.durationSeconds ?? 0} label="Episode playback" />
        <div className={styles.playbackMetaDark}><span>{clock(active?.positionSeconds ?? 0)} elapsed</span><span>{active?.durationSeconds ? `${clock(active.durationSeconds)} total` : ""}</span></div>
        <Link className={styles.blueAction} href={card.href}>{active?.positionSeconds ? "Resume episode" : "Start episode"}<DashboardIcon name="play" size={24} /></Link>
      </>}
    </article>
    <Link className={styles.planRow} href={planHref}><span className={styles.rowIcon}><DashboardIcon name="headphones" /></span><span className={styles.rowCopy}><span className={styles.rowTitle}>Your podcast path</span><span className={styles.metadata}>Day {card.dayNumber}{active ? ` · ${active.part} · ${clock(active.positionSeconds)}${active.durationSeconds ? ` of ${clock(active.durationSeconds)}` : ""} listened` : ""}</span></span><span className={styles.rowIcon}><DashboardIcon name="right" size={16} /></span></Link>
  </section>;
}

export function DashboardHomeView({ name, greeting, data }: { name?: string; greeting: string; data: DashboardHomeData }) {
  const router = useRouter();
  const dayHref = `/dashboard/community/report?day=${encodeURIComponent(data.day)}`;
  const planHref = data.learning.enrolled ? "/dashboard/sogp" : "/sogp";
  const unit = data.learning.unit ?? "tracks";
  return <div className={styles.content}>
    <h1 className={styles.greeting} data-dashboard-greeting>{name ? `${greeting}, ${name}` : greeting}</h1>
    {data.card ? <AdaptiveLearning card={data.card} planHref={planHref} /> : <section className={styles.learning} aria-label="Continue learning">
      <div className={styles.sectionHeader}><h2>{data.learning.enrolled ? "Continue learning" : "Start learning"}</h2><Link className={styles.textAction} href={planHref}>{data.learning.enrolled ? "View plan" : "About SOGP"}</Link></div>
      <LearningCard onContinue={() => router.push(data.learning.href)} actionLabel={data.learning.action} lesson={{
        title: data.learning.title, pathLabel: data.learning.pathLabel ?? "SOGP", elapsedSeconds: data.learning.completed, durationSeconds: data.learning.total,
        elapsedLabel: String(data.learning.completed), durationLabel: String(data.learning.total), progressLabel: "SOGP progress",
        leftLabel: data.learning.total > 0 ? `${data.learning.completed} complete` : "Your learning journey",
        rightLabel: data.learning.total > 0 ? `${data.learning.total} ${unit}` : "",
      }} />
      <Link className={styles.planRow} href={planHref}><span className={styles.rowIcon}><DashboardIcon name="book" /></span><span className={styles.rowCopy}><span className={styles.rowTitle}>My SOGP</span><span className={styles.metadata}>{data.learning.total > 0 ? `${data.learning.completed} of ${data.learning.total} ${unit} complete` : "Your learning and reviews"}</span></span><span className={styles.rowIcon}><DashboardIcon name="right" size={16} /></span></Link>
    </section>}
    {data.reports ? <section className={styles.reports} aria-label="My reports">
      <div className={styles.sectionHeader}><h2>My reports</h2><Link href={dayHref} className={styles.textAction}>View day</Link></div>
      <div className={styles.reportList}>{data.reports.map(row => <ReportRow key={row.category} icon={row.category === "devotional" ? "book" : row.category === "ministry" ? "heart" : "people"} title={row.title} description={row.description} status={row.status} tone={row.tone} onClick={() => router.push(dayHref)} />)}</div>
    </section> : null}
    <section className={styles.support} aria-label="My support"><h2>My support</h2>
      {data.support ? <div className={styles.person}><span className={styles.avatar}>{data.support.firstName.slice(0,2).toUpperCase()}</span><span className={styles.rowCopy}><span className={styles.rowTitle}>{data.support.firstName}</span><span className={styles.metadata}>Your discipler · Connected</span></span>{data.support.canMessage ? <Link href="/dashboard/community/messages" className={styles.textAction}>Message</Link> : null}</div> : <div className={styles.supportEmpty}><p className={styles.metadata}>You’re not connected to a discipler yet.</p>{data.community ? <Link href="/dashboard/community/ask" className={styles.textAction}>Ask Pleros</Link> : <Link href="/contact" className={styles.textAction}>Contact Pleros</Link>}</div>}
    </section>
    <nav aria-label="Dashboard essentials" className={styles.essentials}>
      <Link href="/dashboard/welcomepack">Welcome Pack</Link><Link href="/dashboard/prayer-watch">Prayer Watch</Link><Link href="/dashboard/podcast">Podcast</Link>
      {data.learning.enrolled ? <Link href="/dashboard/pre-sogp">Pre-SOGP lessons</Link> : null}
    </nav>
  </div>;
}

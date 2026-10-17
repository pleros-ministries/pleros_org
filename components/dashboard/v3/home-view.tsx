"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { DashboardHomeData, HomeLearningCard, HomeReport, HomeSogp, HomeToday } from "@/lib/dashboard/home";
import { PRAYER_WATCH_YOUTUBE_URL } from "@/lib/prayer-watch";
import { HomeArt, type HomeArtName } from "./home-art";
import { DashboardIcon, StatusPill } from "./primitives";
import styles from "./dashboard.module.css";

// Only loaded when a learner opens it.
const ShareLearningProgressDialog = dynamic(() => import("@/components/sogp/share-learning-progress-dialog").then(module => module.ShareLearningProgressDialog), { ssr: false });

type LearningDoor = {
  href: string;
  meta: string;
  title: string;
  summary: string;
  action: string;
  value: number;
  total: number;
};

function learningDoor(card: HomeLearningCard | undefined, fallback: DashboardHomeData["learning"]): LearningDoor {
  if (card?.kind === "start") {
    return {
      href: card.href,
      meta: "SOGP",
      title: "Make room to grow",
      summary: "Choose a daily pace that fits your life.",
      action: "Start SOGP",
      value: 0,
      total: 0,
    };
  }

  if (card?.kind === "traditional") {
    return {
      href: card.href,
      meta: "1 hr/day · Traditional SOGP",
      title: card.title,
      summary: `${card.completed} of ${card.total} tracks completed`,
      action: "Resume learning",
      value: card.completed,
      total: card.total,
    };
  }

  if (card?.kind === "podcast") {
    const listened = card.episodes.filter(episode => episode.listened).length;
    const active = card.episodes.find(episode => !episode.listened);
    const episodeLabel = card.episodes.length === 1 ? "episode" : "episodes";
    return {
      href: card.href,
      meta: `${card.pace === 2 ? "30" : "15"} min/day · Podcast path`,
      title: `Day ${card.dayNumber} is waiting for you`,
      summary: `${listened} of ${card.episodes.length} ${episodeLabel} marked listened`,
      action: active?.positionSeconds ? "Resume learning" : "Start learning",
      value: listened,
      total: card.episodes.length,
    };
  }

  return {
    href: fallback.href,
    meta: fallback.pathLabel ?? "SOGP",
    title: fallback.title,
    summary: fallback.total > 0
      ? `${fallback.completed} of ${fallback.total} ${fallback.unit ?? "tracks"} completed`
      : "Your learning and progress stay with you.",
    action: fallback.action,
    value: fallback.completed,
    total: fallback.total,
  };
}

function reportsCompleted(rows: HomeReport[]) {
  return rows.filter(row => row.status === "Confirmed" || row.status === "Reported" || row.status === "Not confirmed").length;
}

function reportDate(day: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Lagos",
  }).format(new Date(`${day}T12:00:00Z`));
}

function LearningDestination({ card, fallback, hubHref }: {
  card: HomeLearningCard | undefined;
  fallback: DashboardHomeData["learning"];
  hubHref: string;
}) {
  const door = learningDoor(card, fallback);
  const percent = door.total > 0 ? Math.min(100, door.value / door.total * 100) : 0;

  return <section
    className={styles.homeLearningCard}
    aria-label="My learning"
    style={{ backgroundImage: 'url("/assets/dashboard/learning-card/my-learning-background-v5.webp")' }}
  >
    <div className={styles.homeLearningTopline}>
      <Link href={hubHref} className={styles.homeLearningLabel} aria-label="Open My learning">
        My learning
      </Link>
      <span className={styles.homeLearningPace}>{door.meta}</span>
    </div>
    <h2 className={styles.homeLearningTitle} title={door.title} data-dashboard-learning-title>{door.title}</h2>
    <p className={styles.homeLearningSummary}>{door.summary}</p>
    {door.total > 0 ? <div className={styles.homeLearningProgressRow}>
      <div
        className={styles.homeLearningProgress}
        role="progressbar"
        aria-label="Learning progress"
        aria-valuemin={0}
        aria-valuemax={door.total}
        aria-valuenow={door.value}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <span>{Math.round(percent)}%</span>
    </div> : null}
    <Link className={styles.homeLearningAction} href={door.href}>
      {door.action}
      <DashboardIcon name="arrow" />
    </Link>
  </section>;
}

function ReportsDestination({ day, rows }: { day: string; rows: HomeReport[] }) {
  const href = `/dashboard/community/report?day=${encodeURIComponent(day)}`;
  const completed = reportsCompleted(rows);

  return <section className={styles.homeSection} aria-labelledby="home-reports-heading">
    <div className={styles.homeSectionHeader}><h2 id="home-reports-heading">My reports</h2></div>
    <Link href={href} className={styles.homeReportsCompact} aria-label={`Open My reports for ${reportDate(day)}`}>
      <span className={styles.rowCopy}>
        <span><span className={styles.rowTitle}>Today</span> <span className={styles.metadata}>· {completed} of {rows.length} reported</span></span>
        <span className={styles.homePillRow}>
          {rows.map(row => <StatusPill key={row.category} tone={row.tone}><span title={row.status}>{row.title}</span></StatusPill>)}
        </span>
      </span>
      <DashboardIcon name="right" />
    </Link>
  </section>;
}

function PrayerWatchRow({ today }: { today: HomeToday }) {
  const router = useRouter();
  const [complete, setComplete] = useState(today.prayerWatch?.complete ?? false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !complete;
    setComplete(next); setPending(true); setError(null);
    try {
      const response = await fetch("/api/sogp/prayer-watch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dateKey: today.dateKey, complete: next }) });
      if (!response.ok) throw new Error(((await response.json().catch(() => null)) as { error?: string } | null)?.error ?? "Prayer Watch could not be saved");
      router.refresh();
    } catch (cause) {
      setComplete(!next);
      setError(cause instanceof Error ? cause.message : "Prayer Watch could not be saved");
    } finally {
      setPending(false);
    }
  }

  return <div className={styles.homeTaskRow}>
    <span className={styles.homeReportIcon} data-tone="amber"><DashboardIcon name="clock" /></span>
    <span className={styles.rowCopy}>
      <span className={styles.rowTitle}>5:30 am Prayer Watch</span>
      <span className={styles.metadata}>Live or replay · <a href={PRAYER_WATCH_YOUTUBE_URL} target="_blank" rel="noreferrer" className={styles.homeInlineLink}>Pleros Live ↗</a></span>
      {error ? <span className={styles.homeError} role="alert">{error}</span> : null}
    </span>
    <button type="button" className={styles.homeTick} data-complete={complete} aria-pressed={complete} disabled={pending} onClick={toggle} aria-label={complete ? "Prayer Watch done. Mark as not done" : "Mark Prayer Watch done"}>
      <span>{complete ? <DashboardIcon name="check" size={16} /> : null}</span>
    </button>
  </div>;
}

const weekStateLabel = { complete: "done", missed: "to catch up", current: "today", future: "upcoming", outside: "outside your cohort" } as const;

function TodaySection({ today }: { today: HomeToday }) {
  const review = today.review;
  return <section className={styles.homeSection} aria-labelledby="home-today-heading">
    <div className={styles.homeSectionHeader}>
      <h2 id="home-today-heading">Today</h2>
      <Link href="/dashboard/sogp/traditional" className={styles.textAction}>Calendar</Link>
    </div>
    <div className={styles.homePanel}>
      <div className={styles.homeTodayHead}>
        <span className={styles.rowTitle}>{today.dateLabel}</span>
        {today.total > 0 ? <span className={styles.metadata}>{today.done} of {today.total} done</span> : null}
      </div>
      <ol className={styles.homeWeek} aria-label="This week">
        {today.week.map(day => <li key={day.dateKey} data-state={day.state} data-today={day.isToday || undefined} aria-label={`${day.weekday} ${day.dayOfMonth}, ${weekStateLabel[day.state]}${day.hasReview ? ", group review" : ""}`}>
          <span>{day.weekday}</span>
          <b>{day.dayOfMonth}</b>
          <i data-review={day.hasReview || undefined} />
        </li>)}
      </ol>
      {today.prayerWatch ? <PrayerWatchRow today={today} /> : null}
      {review ? <div className={styles.homeTaskRow}>
        <span className={styles.homeReportIcon} data-tone="blue"><DashboardIcon name="play" /></span>
        <span className={styles.rowCopy}>
          <span className={styles.rowTitle}>{review.title}</span>
          <span className={styles.metadata}>{review.when === "Today" && review.href ? <a href={review.href} target="_blank" rel="noreferrer" className={styles.homeInlineLink}>Join or watch ↗</a> : <>{review.when} · <Link href="/dashboard/sogp/reviews" className={styles.homeInlineLink}>Reviews</Link></>}</span>
        </span>
        <StatusPill tone={review.complete ? "green" : "neutral"}>{review.complete ? "Done" : review.when.split(" ")[0]}</StatusPill>
      </div> : null}
    </div>
  </section>;
}

function ProgressRow({ label, value, total, text, tone }: { label: string; value: number; total: number; text: string; tone?: "amber" | "lilac" }) {
  const percent = total > 0 ? Math.min(100, value / total * 100) : 0;
  return <div className={styles.homeProgressRow}>
    <span>{label}</span>
    <span className={styles.homeMeter} data-tone={tone} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}><span style={{ width: `${percent}%` }} /></span>
    <b>{text}</b>
  </div>;
}

function ProgressSection({ progress }: { progress: NonNullable<HomeSogp["progress"]> }) {
  return <section className={styles.homeSection} aria-labelledby="home-progress-heading">
    <div className={styles.homeSectionHeader}><h2 id="home-progress-heading">Your progress</h2><Link href="/dashboard/sogp" className={styles.textAction}>My learning</Link></div>
    <div className={styles.homePanel}>
      <ProgressRow label={progress.learningLabel} value={progress.learningDone} total={progress.learningTotal} text={`${progress.learningDone} of ${progress.learningTotal}`} />
      <ProgressRow label="Prayer Watch" value={progress.prayerPercent} total={100} text={`${progress.prayerPercent}%`} tone="amber" />
      {progress.reviewsOwed > 0 ? <ProgressRow label="Group reviews" value={progress.reviewsSatisfied} total={progress.reviewsOwed} text={`${progress.reviewsSatisfied} of ${progress.reviewsOwed}`} tone="lilac" /> : null}
      <Link href="/dashboard/sogp/readiness" className={styles.homeProgressLink}>
        <span>Certificate</span>
        <StatusPill tone={progress.checksPassed === 3 ? "green" : "amber"}>{progress.checksPassed} of 3 checks</StatusPill>
        <DashboardIcon name="right" />
      </Link>
    </div>
  </section>;
}

function Tile({ href, art, tone, title, children, action, prefetch, onClick }: { href?: string; art: HomeArtName; tone: string; title: string; children?: ReactNode; action: string; prefetch?: false; onClick?: () => void }) {
  const body = <>
    <span className={styles.homeTileCopy}><h3>{title}</h3>{children}</span>
    <span className={styles.homeTileAction}>{action}</span>
    <HomeArt name={art} className={styles.homeTileArt} />
  </>;
  return onClick
    ? <button type="button" className={styles.homeTile} data-tone={tone} onClick={onClick}>{body}</button>
    : <Link href={href!} prefetch={prefetch} className={styles.homeTile} data-tone={tone}>{body}</Link>;
}

function GrowTogether({ sogp }: { sogp: HomeSogp }) {
  const [sharing, setSharing] = useState(false);
  const group = sogp.group;
  return <section className={styles.homeSection} aria-labelledby="home-grow-heading">
    <div className={styles.homeSectionHeader}><h2 id="home-grow-heading">Grow together</h2></div>
    <div className={styles.homeTiles}>
      <Tile href="/dashboard/sogp/leaderboard" art="leaderboard" tone="teal" title="Leaderboard" action="View">
        {sogp.leaderboard ? <><span className={styles.homeRank}>#{sogp.leaderboard.rank}</span><p>{sogp.leaderboard.points} points this cohort</p></> : <p>See how your cohort is growing</p>}
      </Tile>
      <Tile href="/dashboard/sogp/referrals" art="invite" tone="lime" title="Invite friends" action="Share link">
        <p>Share your link and walk with them</p>
      </Tile>
      {group.kind === "member"
        ? <Tile href="/dashboard/community/discipleship" art="group" tone="lilac" title="My group" action="Open group"><p>{group.leaderFirstName}&apos;s group</p></Tile>
        : group.kind === "leader"
          ? <Tile href="/dashboard/sogp/discipleship" prefetch={false} art="group" tone="lilac" title="My disciples" action="Open"><p>{group.disciples} {group.disciples === 1 ? "disciple" : "disciples"}{group.groups > 1 ? ` in ${group.groups} groups` : ""}</p></Tile>
          : <Tile href="/dashboard/sogp/discipleship" prefetch={false} art="group" tone="lilac" title="Start your group" action="Invite"><p>Walk through SOGP with the people you invite</p></Tile>}
      <Tile art="share" tone="sand" title="Share what you learnt" action="Create card" onClick={() => setSharing(true)}>
        <p>Turn today into a card</p>
      </Tile>
    </div>
    {sharing ? <ShareLearningProgressDialog open={sharing} onOpenChange={setSharing} track="sogp" dayNumber={sogp.shareDayNumber ?? undefined} /> : null}
  </section>;
}

const morePleros: { href: string; art: HomeArtName; tone: string; title: string; summary: string }[] = [
  { href: "/dashboard/podcast", art: "podcast", tone: "butter", title: "Podcast", summary: "Daily devotional episodes" },
  { href: "/dashboard/welcomepack", art: "welcome", tone: "sky", title: "Welcome Pack", summary: "Your gifts and orientation" },
  { href: "/dashboard/pre-sogp", art: "preSogp", tone: "periwinkle", title: "Pre-SOGP", summary: "Foundation videos" },
  { href: "/partner", art: "partner", tone: "peach", title: "Partner with us", summary: "Give towards the Gospel" },
];

function MoreFromPleros() {
  return <section className={styles.homeSection} aria-labelledby="home-more-heading">
    <div className={styles.homeSectionHeader}><h2 id="home-more-heading">More from Pleros</h2></div>
    <ul className={styles.homeRail}>
      {morePleros.map(item => <li key={item.href}>
        <Link href={item.href} className={styles.homeRailTile} data-tone={item.tone}>
          <span className={styles.homeTileCopy}><h3>{item.title}</h3><p>{item.summary}</p></span>
          <HomeArt name={item.art} className={styles.homeTileArt} />
        </Link>
      </li>)}
    </ul>
  </section>;
}

export function DashboardHomeView({ name, greeting, data }: { name?: string; greeting: string; data: DashboardHomeData }) {
  const learningHubHref = data.learning.enrolled ? "/dashboard/sogp" : "/sogp";

  const sogp = data.sogp;

  return <div className={`${styles.content} ${styles.homeContent}`}>
    <div className={styles.homeGreeting}>
      <h1 className={styles.greeting} data-dashboard-greeting>{name ? `${greeting}, ${name}` : greeting}</h1>
      {sogp ? <p className={styles.metadata}>{[sogp.cohortTitle, sogp.weekLabel].filter(Boolean).join(" · ")}</p> : null}
    </div>
    <div className={styles.homeMain}>
      <LearningDestination card={data.card} fallback={data.learning} hubHref={learningHubHref} />
      {sogp?.today ? <TodaySection today={sogp.today} /> : null}
      {sogp?.progress ? <ProgressSection progress={sogp.progress} /> : null}
    </div>
    <div className={styles.homeSide}>
      {sogp ? <GrowTogether sogp={sogp} /> : null}
      {data.reports ? <ReportsDestination day={data.day} rows={data.reports} /> : null}
    </div>
    <div className={styles.homeWide}><MoreFromPleros /></div>
  </div>;
}

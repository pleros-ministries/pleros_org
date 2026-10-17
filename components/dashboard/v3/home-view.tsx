"use client";

import Link from "next/link";
import type { DashboardHomeData, HomeLearningCard, HomeReport } from "@/lib/dashboard/home";
import { DashboardIcon, StatusPill } from "./primitives";
import styles from "./dashboard.module.css";

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
    <h2 className={styles.homeLearningTitle} data-dashboard-learning-title>{door.title}</h2>
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
  const date = reportDate(day);

  return <Link href={href} className={styles.homeReportsCard} aria-label={`Open My reports for ${date}`}>
    <span className={styles.homeReportsHeader}>
      <span>
        <h2>My reports</h2>
        <span>{date}</span>
      </span>
      <DashboardIcon name="right" />
    </span>
    <span className={styles.homeReportsSummary}>{completed} of {rows.length} categories reported</span>
    <span className={styles.homeReportList}>
      {rows.map(row => <span className={styles.homeReportRow} key={row.category}>
        <span className={styles.homeReportIcon} data-tone={row.tone}>
          <DashboardIcon name={row.category === "devotional" ? "book" : row.category === "ministry" ? "heart" : "people"} />
        </span>
        <span className={styles.rowCopy}>
          <span className={styles.rowTitle}>{row.title}</span>
          <span className={styles.metadata}>{row.description}</span>
        </span>
        <StatusPill tone={row.tone}>{row.status}</StatusPill>
      </span>)}
    </span>
  </Link>;
}

export function DashboardHomeView({ name, greeting, data }: { name?: string; greeting: string; data: DashboardHomeData }) {
  const learningHubHref = data.learning.enrolled ? "/dashboard/sogp" : "/sogp";

  return <div className={styles.content}>
    <h1 className={styles.greeting} data-dashboard-greeting>{name ? `${greeting}, ${name}` : greeting}</h1>
    <LearningDestination card={data.card} fallback={data.learning} hubHref={learningHubHref} />
    {data.reports ? <ReportsDestination day={data.day} rows={data.reports} /> : null}
  </div>;
}

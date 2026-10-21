"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BookOpenCheckIcon, CheckIcon, ChevronDownIcon, ClipboardCheckIcon, CopyIcon, GiftIcon, HeadphonesIcon, Share2Icon, TrophyIcon, UserPlusIcon, UsersRoundIcon } from "lucide-react";
import type { DashboardHomeData, HomeLearningCard, HomeReport, HomeSogp, HomeSogpDay, HomeToday } from "@/lib/dashboard/home";
import { PRAYER_WATCH_YOUTUBE_URL } from "@/lib/prayer-watch";
import { buildReferralShareMessage } from "@/lib/sogp/referral";
import { LeaderboardPreview } from "@/components/sogp/learning/leaderboard-preview";
import { DashboardIcon, StatusPill } from "./primitives";
import styles from "./dashboard.module.css";
import strip from "./sogp-day-strip.module.css";

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

/** One illustrated card per SOGP level; level 1, podcast paths and unknown levels use the staircase. */
const learningArt: Record<number, { image: string; field: string; accent: string; ink: string }> = {
  1: { image: "my-learning-background-v5.webp", field: "#2056d6", accent: "#d8ff65", ink: "#2056d6" },
  2: { image: "my-learning-level-2.webp", field: "#24704d", accent: "#ffd479", ink: "#1d5e40" },
  3: { image: "my-learning-level-3.webp", field: "#b84f35", accent: "#ffe0a3", ink: "#a8432c" },
  4: { image: "my-learning-level-4.webp", field: "#56298a", accent: "#ffd479", ink: "#4a2275" },
};

function LearningDestination({ card, fallback, hubHref }: {
  card: HomeLearningCard | undefined;
  fallback: DashboardHomeData["learning"];
  hubHref: string;
}) {
  const door = learningDoor(card, fallback);
  const percent = door.total > 0 ? Math.min(100, door.value / door.total * 100) : 0;
  const art = learningArt[card?.kind === "traditional" ? card.level ?? 1 : 1] ?? learningArt[1];

  return <section
    className={styles.homeLearningCard}
    aria-label="My learning"
    data-learning-art={art.image}
    style={{
      // Phones use the 3:2 art; wide desktop cards switch to the 3:1 cut (CSS).
      ["--learning-art" as string]: `url("/assets/dashboard/learning-card/${art.image}")`,
      ["--learning-art-wide" as string]: `url("/assets/dashboard/learning-card/${art.image.replace(".webp", "-wide.webp")}")`,
      backgroundColor: art.field,
      ["--learning-accent" as string]: art.accent,
      ["--learning-ink" as string]: art.ink,
    }}
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

const dayStateLabel = { done: "done", missed: "to catch up", today: "today", later: "upcoming" } as const;
const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });

/** A row of SOGP days: the big number is the SOGP day, the weekday and date sit under it. */
function DayWeek({ days, label }: { days: HomeSogpDay[]; label?: string }) {
  return <>
    {label ? <p className={strip.weekLabel}>{label}</p> : null}
    <ol className={strip.strip} aria-label={label ?? "This week of SOGP"}>
      {days.map(day => <li key={day.dateKey} className={strip.day} data-state={day.state === "today" ? undefined : day.state} data-today={day.state === "today" || undefined} data-review={day.review || undefined}
        aria-label={`Day ${day.number}, ${day.weekday} ${day.dayOfMonth} ${monthFormat.format(new Date(`${day.dateKey}T00:00:00.000Z`))}${day.review ? ", group review" : ""}, ${dayStateLabel[day.state]}`}>
        <b>{day.number}</b>
        <span>{day.weekday} {day.dayOfMonth}</span>
      </li>)}
    </ol>
  </>;
}

function Tick({ done, label, pending, onToggle }: { done: boolean; label: string; pending?: boolean; onToggle?: () => void }) {
  return <button type="button" className={styles.homeTick} data-complete={done} aria-pressed={done} disabled={pending || !onToggle} onClick={onToggle} aria-label={label}>
    <span>{done ? <DashboardIcon name="check" size={16} /> : null}</span>
  </button>;
}

/** Teaching: ticked when you've listened. The traditional tick saves at once and rolls back if it fails; the podcast player ticks its own. */
function TeachingRow({ teaching }: { teaching: NonNullable<HomeToday["teaching"]> }) {
  const router = useRouter();
  const [done, setDone] = useState(teaching.done);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function toggle() {
    if (teaching.dayNumber == null) return;
    const next = !done;
    setDone(next); setPending(true); setError(null);
    try {
      const response = await fetch(`/api/sogp/course/day/${teaching.dayNumber}/progress`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ signal: "audio", done: next }) });
      if (!response.ok) throw new Error(((await response.json().catch(() => null)) as { error?: string } | null)?.error ?? "That couldn’t be saved");
      router.refresh();
    } catch (cause) {
      setDone(!next);
      setError(cause instanceof Error && cause.message !== "Day is locked" ? cause.message : "That couldn’t be saved. Try again.");
    } finally {
      setPending(false);
    }
  }
  return <div className={styles.homeTaskRow}>
    <span className={styles.homeReportIcon} data-tone="blue">{teaching.podcast ? <HeadphonesIcon className="size-4" strokeWidth={2} /> : <BookOpenCheckIcon className="size-4" strokeWidth={2} />}</span>
    <span className={styles.rowCopy}>
      <span className={styles.rowTitle}>Teaching</span>
      <span className={styles.metadata}>{teaching.title} · <Link href={teaching.href} className={styles.homeInlineLink}>Listen</Link></span>
      {error ? <span className={styles.homeError} role="alert">{error}</span> : null}
    </span>
    {teaching.podcast
      ? <Tick done={done} label={done ? "Today’s episodes listened" : "Ticked when you finish today’s episodes"} />
      : <Tick done={done} pending={pending} onToggle={toggle} label={done ? "Teaching listened. Mark as not listened" : "Mark that you listened to the teaching"} />}
  </div>;
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
    <Tick done={complete} pending={pending} onToggle={toggle} label={complete ? "Prayer Watch done. Mark as not done" : "Mark Prayer Watch done"} />
  </div>;
}

/**
 * Today (Pastor, 21 October): your SOGP days, one week with all of them a tap
 * away, then Teaching, Prayer Watch and Assessment (traditional path only,
 * done once the quiz and written response are), then Share what you learnt.
 */
function TodaySection({ today, shareDayNumber }: { today: HomeToday; shareDayNumber: number | null }) {
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const days = today.sogpDays;
  const at = today.dayNumber ?? days.filter(day => day.dateKey <= today.dateKey).at(-1)?.number ?? 1;
  const weekStart = Math.floor((at - 1) / 7) * 7;
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => days.slice(index * 7, index * 7 + 7));
  return <section className={styles.homeSection} aria-labelledby="home-today-heading">
    <div className={styles.homeSectionHeader}>
      <h2 id="home-today-heading">Today</h2>
      {today.total > 0 ? <span className={styles.metadata}>{today.done} of {today.total} done</span> : null}
    </div>
    <div className={styles.homePanel}>
      <div className={styles.homeTodayHead}>
        <span className={styles.rowTitle}>{today.dayNumber ? `Day ${today.dayNumber} of ${days.length} · ` : ""}{today.dateLabel}</span>
      </div>
      {days.length ? <>
        {open ? <div className={strip.weeks}>{weeks.map((week, index) => <DayWeek key={index} label={`Week ${index + 1}`} days={week} />)}</div>
          : <DayWeek days={days.slice(weekStart, weekStart + 7)} />}
        {days.length > 7 ? <button type="button" className={strip.more} aria-expanded={open} onClick={() => setOpen(value => !value)}>
          {open ? "Show this week only" : `See all ${days.length} days`}<ChevronDownIcon className="size-4" strokeWidth={2.2} aria-hidden="true" />
        </button> : null}
        <div className={strip.divider} />
      </> : null}
      {today.teaching ? <TeachingRow teaching={today.teaching} /> : null}
      {today.prayerWatch ? <PrayerWatchRow today={today} /> : null}
      {today.assessment ? <div className={styles.homeTaskRow}>
        <span className={styles.homeReportIcon} data-tone="lilac"><ClipboardCheckIcon className="size-4" strokeWidth={2} /></span>
        <span className={styles.rowCopy}>
          <span className={styles.rowTitle}>Assessment</span>
          <span className={styles.metadata}>Quiz and written response{today.assessment.complete ? "" : <> · <Link href={today.assessment.href} className={styles.homeInlineLink}>Do it</Link></>}</span>
        </span>
        <Tick done={today.assessment.complete} label={today.assessment.complete ? "Assessment done" : "Marked done when you finish the quiz and written response"} />
      </div> : null}
      <div className={styles.homeTaskRow}>
        <span className={styles.homeReportIcon} style={{ background: "#f6ecd9", color: "#5a3d0c" }}><Share2Icon className="size-4" strokeWidth={2} /></span>
        <span className={styles.rowCopy}>
          <span className={styles.rowTitle}>Share what you learnt</span>
          <span className={styles.metadata}>Turn today into a card</span>
        </span>
        <button type="button" className={styles.homeActionButton} onClick={() => setSharing(true)}>Share</button>
      </div>
    </div>
    {sharing ? <ShareLearningProgressDialog open={sharing} onOpenChange={setSharing} track="sogp" dayNumber={shareDayNumber ?? undefined} /> : null}
  </section>;
}

/** The same three as Today, as counts (Pastor, 21 October); colour only where something needs attention. */
function ProgressSection({ progress }: { progress: NonNullable<HomeSogp["progress"]> }) {
  const cells: Array<{ label: string; value: string; detail: string; warn: boolean }> = [
    { label: "Teaching", value: String(progress.teaching.done), detail: `of ${progress.teaching.total} ${progress.teaching.unit}`, warn: false },
    { label: "Prayer Watch", value: `${progress.prayer.percent}%`, detail: progress.prayer.percent >= progress.prayer.required ? "on track" : `needs ${progress.prayer.required}%`, warn: progress.prayer.percent < progress.prayer.required },
    ...(progress.assessment ? [{ label: "Assessment", value: String(progress.assessment.done), detail: `of ${progress.assessment.total} done`, warn: false }] : []),
  ];
  return <section className={styles.homeSection} aria-labelledby="home-progress-heading">
    <div className={styles.homeSectionHeader}><h2 id="home-progress-heading">Your progress</h2><Link href="/dashboard/sogp/school" className={styles.textAction}>SOGP</Link></div>
    <div className={styles.homeProgressStrip} style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
      {cells.map(cell => <div key={cell.label}>
        <span>{cell.label}</span>
        <strong style={cell.warn ? { color: "#a15c12" } : undefined}>{cell.value}</strong>
        <span>{cell.detail}</span>
      </div>)}
    </div>
  </section>;
}

function ActionRow({ href, icon, tone, title, children, action, prefetch, onClick }: { href?: string; icon: ReactNode; tone: [string, string]; title: ReactNode; children?: ReactNode; action: string; prefetch?: false; onClick?: () => void }) {
  return <li className={styles.homeActionRow}>
    <span className={styles.homeActionIcon} style={{ background: tone[0], color: tone[1] }} aria-hidden="true">{icon}</span>
    <span className={styles.homeActionCopy}><b>{title}</b>{children}</span>
    {onClick
      ? <button type="button" className={styles.homeActionButton} onClick={onClick}>{action}</button>
      : <Link href={href!} prefetch={prefetch} className={styles.homeActionButton}>{action}</Link>}
  </li>;
}

/** Grow together as actionable rows with buttons (Pastor review, 18 October), not illustrated tiles. */
function GrowTogether({ sogp }: { sogp: HomeSogp }) {
  const group = sogp.group;
  return <section className={styles.homeSection} aria-labelledby="home-grow-heading">
    <div className={styles.homeSectionHeader}><h2 id="home-grow-heading">Grow together</h2></div>
    <ul className={styles.homeActions}>
      {/* With a board to show, the leaderboard has its own preview under Your progress. */}
      {sogp.board ? null : <ActionRow href="/dashboard/sogp/leaderboard" icon={<TrophyIcon className="size-4" strokeWidth={2} />} tone={["#fff1c2", "#8a5a00"]} title={sogp.leaderboard ? <>Leaderboard · <span className={styles.homeRank}>#{sogp.leaderboard.rank}</span></> : "Leaderboard"} action="View">
        <span>{sogp.leaderboard ? `${sogp.leaderboard.points} points this cohort` : "See how your cohort is growing"}</span>
      </ActionRow>}
      {/* With a link to show, Invite someone has its own panel. */}
      {sogp.invite ? null : <ActionRow href="/dashboard/sogp/referrals" icon={<UserPlusIcon className="size-4" strokeWidth={2} />} tone={["#f6d9de", "#5e2236"]} title="Invite someone" action="Share link">
        <span>Share your link and walk with them</span>
      </ActionRow>}
      {group.kind === "member"
        ? <ActionRow href="/dashboard/community/discipleship" prefetch={false} icon={<UsersRoundIcon className="size-4" strokeWidth={2} />} tone={["#efe7fb", "#56209c"]} title="My group" action="Open"><span>{group.leaderFirstName}&apos;s group</span></ActionRow>
        : group.kind === "leader"
          ? <ActionRow href={group.groups > 1 ? "/dashboard/community/groups" : "/dashboard/community/discipleship"} prefetch={false} icon={<UsersRoundIcon className="size-4" strokeWidth={2} />} tone={["#efe7fb", "#56209c"]} title={group.groups > 1 ? "Your groups" : "Your group"} action="Open"><span>{group.disciples} {group.disciples === 1 ? "disciple" : "disciples"}{group.groups > 1 ? ` in ${group.groups} groups` : ""}</span></ActionRow>
          : <ActionRow href="/dashboard/sogp/discipleship" prefetch={false} icon={<UsersRoundIcon className="size-4" strokeWidth={2} />} tone={["#efe7fb", "#56209c"]} title="Start your group" action="Invite"><span>Walk through SOGP with people you invite</span></ActionRow>}
    </ul>
  </section>;
}

/** Invite someone as its own panel (Pastor, 20 October): the link and code to copy, and Share. Sharing never assigns or invites by itself. */
function InvitePanel({ invite }: { invite: NonNullable<HomeSogp["invite"]> }) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const copy = async (kind: "link" | "code") => {
    try { await navigator.clipboard.writeText(kind === "link" ? invite.url : invite.code); setCopied(kind); window.setTimeout(() => setCopied(null), 2000); } catch { setCopied(null); }
  };
  const share = async () => {
    const text = `${buildReferralShareMessage()} ${invite.url}`;
    try { if (navigator.share) { await navigator.share({ title: "Join me in SOGP", text, url: invite.url }); return; } } catch { return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };
  const copyButton = (kind: "link" | "code") => <button type="button" className={styles.homeInviteCopy} onClick={() => copy(kind)} aria-label={kind === "link" ? "Copy your link" : "Copy your code"}>
    {copied === kind ? <><CheckIcon className="size-3.5" strokeWidth={2.4} aria-hidden="true" />Copied</> : <><CopyIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />Copy</>}
  </button>;
  return <section className={styles.homeSection} aria-labelledby="home-invite-heading">
    <div className={styles.homeSectionHeader}>
      <h2 id="home-invite-heading">Invite someone</h2>
      <Link href="/dashboard/sogp/referrals" className={styles.textAction}>{invite.joined ? `${invite.joined} joined with you` : "Who joined"}</Link>
    </div>
    <div className={`${styles.homePanel} ${styles.homeInvite}`}>
      <p className={styles.homeInviteLead}>Share your link and walk with them through SOGP.</p>
      <div className={styles.homeInviteField}>
        <span className={styles.homeInviteValue}><b>{invite.url.replace(/^https?:\/\//, "")}</b><span>Your link</span></span>
        {copyButton("link")}
      </div>
      <div className={styles.homeInviteField}>
        <span className={styles.homeInviteValue}><b>{invite.code}</b><span>Your code</span></span>
        {copyButton("code")}
      </div>
      <button type="button" className={styles.homeInviteShare} onClick={share}><Share2Icon className="size-4" strokeWidth={2.2} aria-hidden="true" />Share your link</button>
    </div>
  </section>;
}

/** Welcome Pack stays on Home until its last step (reminders) is saved, as a quiet row lower down (Pastor, 21 October: not under the learning card). */
function WelcomePackRow() {
  return <section className={styles.homeSection} aria-labelledby="home-setup-heading">
    <div className={styles.homeSectionHeader}><h2 id="home-setup-heading">Finish setting up</h2></div>
    <ul className={styles.homeActions}>
      <ActionRow href="/dashboard/welcomepack" icon={<GiftIcon className="size-4" strokeWidth={2} />} tone={["#d1e7fc", "#123f6e"]} title="Your Welcome Pack" action="Continue">
        <span>Gifts, orientation and reminders</span>
      </ActionRow>
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
      {sogp?.today ? <TodaySection today={sogp.today} shareDayNumber={sogp.shareDayNumber} /> : null}
      {sogp?.progress ? <ProgressSection progress={sogp.progress} /> : null}
      {/* The same leaderboard preview as Learning (Pastor, 20 October), not one row among the others. */}
      {sogp?.board ? <div className={styles.homeSection}><LeaderboardPreview board={sogp.board} id="home-leaderboard" dense /></div> : null}
    </div>
    <div className={styles.homeSide}>
      {sogp?.invite ? <InvitePanel invite={sogp.invite} /> : null}
      {data.welcomePack && !data.welcomePack.done ? <WelcomePackRow /> : null}
      {sogp ? <GrowTogether sogp={sogp} /> : null}
      {data.reports ? <ReportsDestination day={data.day} rows={data.reports} /> : null}
    </div>
  </div>;
}

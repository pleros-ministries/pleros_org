import Link from "next/link";
import type { CSSProperties } from "react";
import { AwardIcon, CalendarCheckIcon, ChevronRightIcon, HistoryIcon, MessageCircleQuestionIcon, PlayIcon, RefreshCcwIcon, RepeatIcon, TrophyIcon } from "lucide-react";

import type { LearningHubData } from "@/lib/dashboard/learning-hub";
import type { LearningViewData } from "@/lib/sogp/learning-view";

import styles from "./learning-hub.module.css";

/** Each SOGP level's card art and colours, as on the You home's learning card. */
const LEVEL_ART: Record<number, { image: string; field: string; ink: string }> = {
  1: { image: "my-learning-background-v5.webp", field: "#2056d6", ink: "#2056d6" },
  2: { image: "my-learning-level-2.webp", field: "#24704d", ink: "#1d5e40" },
  3: { image: "my-learning-level-3.webp", field: "#b84f35", ink: "#a8432c" },
  4: { image: "my-learning-level-4.webp", field: "#56298a", ink: "#4a2275" },
};

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? "").join("").toUpperCase();

function Tool({ href, icon, tone, title, meta }: { href: string; icon: React.ReactNode; tone: [string, string]; title: string; meta: string }) {
  return <Link href={href} className={styles.tool}>
    <span className={styles.toolIcon} style={{ background: tone[0], color: tone[1] }} aria-hidden="true">{icon}</span>
    <b>{title}</b>
    <span>{meta}</span>
  </Link>;
}

/**
 * My learning: resume, an optional catch-up (missed lessons never block
 * today's), this week, what's next, a leaderboard preview and the tools.
 */
export function LearningHub({ hub, learning }: { hub: LearningHubData; learning: LearningViewData }) {
  const art = LEVEL_ART[hub.card.level] ?? LEVEL_ART[1]!;
  const share = hub.card.total ? Math.min(100, Math.round((hub.card.done / hub.card.total) * 100)) : 0;
  const podcast = hub.path === "podcast_one" || hub.path === "podcast_two";
  // Every published track done: the card celebrates instead of resuming.
  const finished = hub.card.total > 0 && hub.doneCount >= hub.card.total && !podcast;
  const outsideTop = hub.leaderboard?.me && !hub.leaderboard.top.some(row => row.isMe) ? hub.leaderboard.me : null;

  const resume = hub.state === "start"
    ? <section className={styles.card} style={{ "--hub-art": `url("/assets/dashboard/learning-card/${art.image}")`, "--hub-field": art.field, "--hub-ink": art.ink } as CSSProperties}>
      <div className={styles.cardTop}><span>{hub.cohortTitle ?? "SOGP"}</span></div>
      <div><h2>Choose how you’ll learn</h2><span className={styles.cardMeta}>A lesson a day, or podcasts at your own pace</span></div>
      <Link href="/dashboard/sogp/path" className={styles.resume}>Get started <ChevronRightIcon className="size-4" strokeWidth={2.2} /></Link>
    </section>
    : finished ? <section className={styles.card} aria-label="SOGP finished" style={{ "--hub-art": `url("/assets/dashboard/learning-card/${LEVEL_ART[2]!.image}")`, "--hub-field": LEVEL_ART[2]!.field, "--hub-ink": LEVEL_ART[2]!.ink } as CSSProperties}>
      <div className={styles.cardTop}><span>{hub.cohortTitle ?? "SOGP"} · Completed</span></div>
      <div><h2>You’ve finished SOGP</h2><span className={styles.cardMeta}>{hub.doneCount} tracks complete</span></div>
      <Link href={hub.certificate.available ? "/dashboard/sogp/certificate" : "/dashboard/sogp/readiness"} className={styles.resume}>{hub.certificate.available ? "View your certificate" : "Check your certificate"} <ChevronRightIcon className="size-4" strokeWidth={2.2} /></Link>
    </section>
    : <section className={styles.card} aria-label="Resume learning" style={{ "--hub-art": `url("/assets/dashboard/learning-card/${art.image}")`, "--hub-field": art.field, "--hub-ink": art.ink } as CSSProperties}>
      <div className={styles.cardTop}><span>{hub.card.eyebrow}</span><span className={styles.pace}>{hub.paceLabel}</span></div>
      <div>
        <h2>{hub.card.title}</h2>
        <span className={styles.cardMeta}>{hub.card.progress}</span>
        {hub.card.total ? <div className={styles.meter} aria-hidden="true"><i style={{ width: `${share}%` }} /></div> : null}
      </div>
      {hub.state === "withdrawn"
        ? <span className={styles.cardMeta}>Your enrolment is withdrawn. Your history stays here.</span>
        : <Link href={hub.card.href} className={styles.resume}>{hub.card.action} <PlayIcon className="size-4" fill="currentColor" strokeWidth={0} /></Link>}
    </section>;

  return <div className={styles.page}>
    <div className={styles.column}>
      {resume}

      {hub.state === "preparing" ? <p className={styles.notice}>Your cohort hasn’t started yet. Pre-SOGP is open now, and your first teachings unlock on the start date.</p> : null}
      {hub.state === "completed" ? <p className={styles.notice}>{finished ? "You’ve finished every track. Keep growing below." : "Your cohort has ended. Your history and any remaining lessons stay open here."}</p> : null}
      {hub.state === "completed" ? <div className={styles.panel} style={{ padding: 14, background: "#f6f3ff", borderColor: "#e3d8f8", display: "grid", gap: 6 }}>
        <b style={{ fontFamily: "var(--font-dashboard-heading)", fontSize: 15, fontWeight: 500, color: "#3e1876" }}>Advanced SOGP is coming</b>
        <span style={{ fontSize: 12.5, lineHeight: "18px", color: "#56209c" }}>Deeper formation for those who’ve finished SOGP. We’ll announce it in Pleros updates the moment it opens.</span>
      </div> : null}

      {hub.catchUp && hub.state === "active" ? <div className={styles.catch}>
        <span className={styles.catchIcon} aria-hidden="true"><RefreshCcwIcon className="size-4" strokeWidth={2.2} /></span>
        <span className={styles.rowCopy}>
          <span className={styles.rowTitle} style={{ fontWeight: 500 }}>{hub.catchUp.count} {hub.catchUp.count === 1 ? "lesson" : "lessons"} from earlier</span>
          <span className={styles.rowMeta}>{hub.catchUp.days.join(", ")} · you can still do {hub.catchUp.count === 1 ? "it" : "them"} any time</span>
        </span>
        <Link href={hub.catchUp.href} className={styles.btn}>Catch up</Link>
      </div> : null}

      {hub.week ? <>
        <div className={styles.sectionTitle}><h2>This week</h2>{hub.weekLabel ? <span>{hub.weekLabel}</span> : null}</div>
        <div className={styles.week} aria-label="This week">
          {hub.week.map(day => <div key={day.dateKey} className={styles.day}>
            <i data-state={day.state} aria-label={`${day.weekday}: ${day.state}`}>{day.state === "complete" ? "✓" : day.state === "missed" ? "!" : day.isToday ? "•" : ""}</i>
            {day.weekday.slice(0, 1)}
          </div>)}
        </div>
      </> : null}

      {hub.review ? <div className={styles.panel}><div className={styles.row}>
        <span className={styles.num} aria-hidden="true"><CalendarCheckIcon className="size-3.5" strokeWidth={2.2} /></span>
        <span className={styles.rowCopy}><span className={styles.rowTitle} style={{ fontWeight: 500 }}>{hub.review.title}</span><span className={styles.rowMeta}>Group review · {hub.review.when}</span></span>
      </div></div> : null}
    </div>

    <div className={styles.column}>
      {hub.upNext.length ? <>
        <div className={styles.sectionTitle}><h2>Up next</h2><Link href="/dashboard/sogp/traditional">Full calendar</Link></div>
        <div className={styles.panel}><ul className={styles.list}>
          {hub.upNext.map(item => <li key={item.key}>{item.href
            ? <Link href={item.href} className={styles.row}><span className={styles.num} data-current={item.current || undefined}>{item.number}</span><span className={styles.rowCopy}><span className={styles.rowTitle}>{item.title}</span><span className={styles.rowMeta}>{item.meta}</span></span><ChevronRightIcon className="size-4 shrink-0 text-[#a6abb2]" strokeWidth={2} /></Link>
            : <div className={styles.row}><span className={styles.num}>{item.number}</span><span className={styles.rowCopy}><span className={styles.rowTitle}>{item.title}</span><span className={styles.rowMeta}>{item.meta}</span></span></div>}</li>)}
        </ul></div>
      </> : null}

      {hub.leaderboard && hub.leaderboard.top.length ? <>
        <div className={styles.sectionTitle}><h2>Leaderboard</h2><Link href="/dashboard/sogp/leaderboard">See all {hub.leaderboard.total}</Link></div>
        <div className={styles.panel}><ul className={styles.list}>
          {hub.leaderboard.top.map(row => <li key={row.rank}><div className={`${styles.row} ${row.isMe ? styles.me : ""}`}>
            <span className={styles.num} data-rank={row.rank}>{row.rank}</span>
            <span className={styles.rowCopy}><span className={styles.rowTitle}>{row.isMe ? `${row.name} (you)` : row.name}</span></span>
            <span className={styles.points}>{row.points} pts</span>
          </div></li>)}
          {outsideTop ? <li><div className={`${styles.row} ${styles.me}`}>
            <span className={styles.num}>{outsideTop.rank}</span>
            <span className={styles.rowCopy}><span className={styles.rowTitle}>You</span></span>
            <span className={styles.points}>{outsideTop.points} pts</span>
          </div></li> : null}
        </ul></div>
      </> : null}

      <div className={styles.sectionTitle}><h2>Your learning</h2></div>
      <div className={styles.tools}>
        <Tool href="/dashboard/sogp/path" icon={<RepeatIcon className="size-4" strokeWidth={2.2} />} tone={["#e4ebfd", "#2331ae"]} title="Change path or pace" meta={hub.paceLabel} />
        <Tool href="/dashboard/sogp/history" icon={<HistoryIcon className="size-4" strokeWidth={2.2} />} tone={["#efe7fb", "#56209c"]} title="History" meta={podcast ? `${hub.card.done} episodes listened` : `${hub.doneCount} ${hub.doneCount === 1 ? "track" : "tracks"} done`} />
        <Tool href={hub.discipler ? "/dashboard/community/discipleship" : "/dashboard/community/ask"} icon={<MessageCircleQuestionIcon className="size-4" strokeWidth={2.2} />} tone={["#fde3cf", "#7a3a10"]} title={hub.discipler ? `Ask ${hub.discipler.firstName}` : "Ask Pleros"} meta={hub.discipler ? "Questions about your teachings" : "Questions about your teachings"} />
        <Tool href={hub.certificate.available ? "/dashboard/sogp/certificate" : "/dashboard/sogp/readiness"} icon={<AwardIcon className="size-4" strokeWidth={2.2} />} tone={["#f6e4ac", "#5a4508"]} title="Certificate" meta={hub.certificate.available ? "Ready to download" : "See what’s left to qualify"} />
        <Tool href="/dashboard/sogp/reviews" icon={<CalendarCheckIcon className="size-4" strokeWidth={2.2} />} tone={["#e6ecfc", "#1f3260"]} title="Group reviews" meta={hub.review ? hub.review.when : "Weekly, with your group"} />
        <Tool href="/dashboard/sogp/leaderboard" icon={<TrophyIcon className="size-4" strokeWidth={2.2} />} tone={["#fff1c2", "#8a5a00"]} title="Leaderboard" meta={hub.leaderboard?.me ? `You’re #${hub.leaderboard.me.rank}` : "Your cohort’s points"} />
      </div>

      <div className={styles.sectionTitle}><h2>People</h2></div>
      <div className={styles.panel}><ul className={styles.list}>
        <li><Link href={learning.followUp ? "/dashboard/sogp/follow-up/welcome" : "/dashboard/sogp/follow-up"} className={styles.row}>
          <span className={styles.avatar} aria-hidden="true">{learning.followUp ? initials(learning.followUp.name) : "?"}</span>
          <span className={styles.rowCopy}><span className={styles.rowTitle} style={{ fontWeight: 500 }}>{learning.followUp?.name ?? "Your follow-up person"}</span><span className={styles.rowMeta}>{learning.followUp ? "Your follow-up person" : "Assigned soon. You can start learning now"}</span></span>
          <ChevronRightIcon className="size-4 shrink-0 text-[#a6abb2]" strokeWidth={2} />
        </Link></li>
        <li><Link href="/dashboard/sogp/referrals" className={styles.row}>
          <span className={styles.avatar} style={{ background: "#f6d9de", color: "#5e2236" }} aria-hidden="true">+</span>
          <span className={styles.rowCopy}><span className={styles.rowTitle} style={{ fontWeight: 500 }}>Invite someone to SOGP</span><span className={styles.rowMeta}>Your referral code and link</span></span>
          <ChevronRightIcon className="size-4 shrink-0 text-[#a6abb2]" strokeWidth={2} />
        </Link></li>
      </ul></div>

      <details className={styles.panel}>
        <summary className={styles.row} style={{ cursor: "pointer", listStyle: "none" }}><span className={styles.rowCopy}><span className={styles.rowTitle} style={{ fontWeight: 500 }}>More learning tools</span><span className={styles.rowMeta}>Calendar and assessments, Pre-SOGP, issued certificate</span></span></summary>
        <ul className={styles.list}>
          <li><Link href="/dashboard/sogp/traditional" className={styles.row}><span className={styles.rowCopy}><span className={styles.rowTitle} style={{ fontWeight: 500 }}>Calendar and assessments</span></span></Link></li>
          {podcast ? <li><Link href="/dashboard/sogp/plan" className={styles.row}><span className={styles.rowCopy}><span className={styles.rowTitle} style={{ fontWeight: 500 }}>Your tracklist</span></span></Link></li> : null}
          <li><Link href="/dashboard/pre-sogp" className={styles.row}><span className={styles.rowCopy}><span className={styles.rowTitle} style={{ fontWeight: 500 }}>Pre-SOGP resources</span></span></Link></li>
          <li><Link href="/dashboard/sogp/certificate" className={styles.row}><span className={styles.rowCopy}><span className={styles.rowTitle} style={{ fontWeight: 500 }}>Issued certificate</span></span></Link></li>
        </ul>
      </details>
    </div>
  </div>;
}

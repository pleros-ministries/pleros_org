import Link from "next/link";
import type { ReactNode } from "react";
import { AwardIcon, CalendarCheckIcon, CalendarDaysIcon, ChevronRightIcon, HistoryIcon, InfoIcon, ListMusicIcon, LockIcon, MessageCircleQuestionIcon, RepeatIcon, SparklesIcon, UserRoundIcon } from "lucide-react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";
import { CrumbLabel } from "@/components/dashboard/shell/breadcrumbs";
import type { LearningHubData } from "@/lib/dashboard/learning-hub";
import type { CertificationFacts } from "@/lib/db/queries/sogp-certification-facts";
import type { LearningViewData } from "@/lib/sogp/learning-view";

/**
 * The SOGP page (Pastor, 21 October): Learning keeps only what you're
 * learning now, so SOGP's details live here. The certificate near the top
 * names only what's missing; then your levels (or your podcast plan), what
 * comes after SOGP, and the Your learning tools as a quiet list at the foot.
 */

export const SOGP_PAGE = "/dashboard/sogp/school";
const AMBER = "#a15c12";
const GREEN = "var(--color-community-green-ink)";

function Chip({ tone, children }: { tone: [string, string]; children: ReactNode }) {
  return <span className="grid size-9 shrink-0 place-items-center rounded-[10px]" style={{ background: tone[0], color: tone[1] }} aria-hidden="true">{children}</span>;
}

function Dot({ ok, label }: { ok: boolean; label: string }) {
  return <span className="inline-flex items-center gap-1.5 text-[12px] leading-4" style={{ color: ok ? GREEN : AMBER }}>
    <i className="size-1.5 shrink-0 rounded-full" style={{ background: ok ? GREEN : "#d98a1f" }} aria-hidden="true" />{label}
  </span>;
}

/** Only what's missing is named; a complete certificate is one quiet line. */
function certificateGaps(facts: CertificationFacts) {
  const gaps: string[] = [];
  if (!facts.learningPass) gaps.push(facts.podcast ? `Episodes ${facts.learningDone} of ${facts.learningTotal}` : `Teachings ${facts.learningDone} of ${facts.learningTotal}`);
  if (!facts.reviews.reviewPass && facts.reviews.outstanding) gaps.push(`${facts.reviews.outstanding} group ${facts.reviews.outstanding === 1 ? "review" : "reviews"} to attend or make up`);
  if (!facts.prayer.pass) gaps.push(`Prayer Watch ${facts.prayer.percent}%, needs ${facts.prayer.required}%`);
  return gaps;
}

export function SogpSchool({ hub, facts, followUp }: { hub: LearningHubData; facts: CertificationFacts | null; followUp: LearningViewData["followUp"] }) {
  const podcast = hub.path === "podcast_one" || hub.path === "podcast_two";
  const days = hub.journey.days;
  const sub = [hub.cohortTitle, days?.current ? `Day ${days.current} of ${days.total}` : days ? `${days.total} days` : null, hub.paceLabel].filter(Boolean).join(" · ");
  const issued = facts?.certificateAvailable ?? hub.certificate.available;
  const gaps = facts && !issued ? certificateGaps(facts) : [];

  const tools: Array<{ href: string; icon: ReactNode; title: string; meta: string }> = [
    { href: "/dashboard/sogp/path", icon: <RepeatIcon />, title: "Change path or pace", meta: hub.paceLabel },
    ...(podcast ? [{ href: "/dashboard/sogp/plan", icon: <ListMusicIcon />, title: "Your tracklist", meta: "The episodes in your plan" }] : []),
    { href: "/dashboard/sogp/history", icon: <HistoryIcon />, title: "History", meta: podcast ? `${hub.card.done} episodes listened` : `${hub.doneCount} ${hub.doneCount === 1 ? "teaching" : "teachings"} done` },
    { href: "/dashboard/sogp/reviews", icon: <CalendarCheckIcon />, title: "Group reviews", meta: hub.review ? `Next: ${hub.review.when}` : "Weekly, with your group" },
    { href: hub.discipler ? "/dashboard/community/discipleship" : "/dashboard/community/ask", icon: <MessageCircleQuestionIcon />, title: "Ask about a teaching", meta: hub.discipler ? `${hub.discipler.firstName} answers` : "Pleros answers" },
    { href: followUp ? "/dashboard/sogp/follow-up/welcome" : "/dashboard/sogp/follow-up", icon: <UserRoundIcon />, title: "Your follow-up person", meta: followUp?.name ?? "Assigned soon" },
    { href: "/dashboard/welcomepack/orientation", icon: <InfoIcon />, title: "How SOGP works", meta: "Days, reviews and the certificate" },
  ];

  return <div className={styles.page}>
    <CrumbLabel href={SOGP_PAGE} label="School of God’s Purpose" />
    <div className={styles.heading}><div><h1>School of God’s Purpose</h1><p className={styles.sub}>{sub}</p></div></div>

    {/* Certificate near the top (Pastor: "worth being here… more visible"); only what's missing is named. */}
    <div className={styles.panel}>
      <div className={styles.row} style={{ alignItems: "flex-start" }}>
        <Chip tone={["#f6e4ac", "#5a4508"]}><AwardIcon className="size-[18px]" strokeWidth={2} /></Chip>
        <span className={`${styles.rowCopy} gap-1`}>
          <span className={styles.rowTitle}>Your certificate</span>
          {issued ? <Dot ok label="Ready to download" />
            : facts?.meetsRequirements ? <Dot ok label="Everything’s in. Claim it now" />
            : gaps.length ? gaps.map(gap => <Dot key={gap} ok={false} label={gap} />)
            : <span className={styles.rowMeta}>We’ll show what’s left as you go</span>}
          <Link href={issued ? "/dashboard/sogp/certificate" : "/dashboard/sogp/readiness"} className={`${styles.btn} ${styles.mini} mt-1.5 justify-self-start no-underline`} data-primary={issued || facts?.meetsRequirements ? "" : undefined}>
            {issued ? "Download" : facts?.meetsRequirements ? "Claim your certificate" : "See what’s left"}
          </Link>
        </span>
      </div>
    </div>

    {podcast ? <>
      <div className={styles.sectionTitle}><h2>Your podcast plan</h2></div>
      <div className={styles.panel}><Link href={hub.card.href} className={styles.row}>
        <Chip tone={["#e6ecfc", "#1f3260"]}><ListMusicIcon className="size-[18px]" strokeWidth={2} /></Chip>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{hub.card.title}</span><span className={styles.rowMeta} style={{ whiteSpace: "normal" }}>{hub.card.progress}</span></span>
        <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
      </Link></div>
    </> : hub.levels.length ? <>
      <div className={styles.sectionTitle}><h2>Your four levels</h2>{days ? <Link href="/dashboard/sogp/days" className={styles.quiet}>Your {days.total} days</Link> : null}</div>
      <div className={styles.panel}><ul className={styles.list}>
        {hub.levels.map(level => <li key={level.level}><Link href="/dashboard/sogp/traditional" className={styles.row}>
          <span className="grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-medium"
            style={level.state === "now" ? { background: "#2331ae", color: "white" } : level.state === "done" ? { background: "#e4ebfd", color: "#2331ae" } : { background: "#f1f2f5", color: "#8b919a" }}>{level.level}</span>
          <span className={`${styles.rowCopy} gap-0.5`}>
            <span className={styles.rowTitle} style={{ whiteSpace: "normal" }}>{level.title}</span>
            {level.state === "done" ? <Dot ok label={`${level.done} of ${level.total} teachings · done`} />
              : level.state === "now" ? <span className={styles.rowMeta} style={{ color: "var(--color-community-blue)" }}>{level.done} of {level.total} teachings · now</span>
              : <span className={`${styles.rowMeta} inline-flex items-center gap-1`}><LockIcon className="size-3" strokeWidth={2} aria-hidden="true" />{level.opens ? `Opens ${level.opens}` : "Opens after the level before"}</span>}
          </span>
          <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
        </Link></li>)}
      </ul></div>
    </> : null}

    {/* The next phase (Pastor): after the first SOGP, choose the next set of teachings. */}
    <div className={styles.sectionTitle}><h2>After SOGP</h2></div>
    <div className={styles.panel}>
      <Link href="/dashboard/library" className={styles.row}>
        <Chip tone={["#eceef2", "#6b7280"]}><SparklesIcon className="size-[18px]" strokeWidth={2} /></Chip>
        <span className={styles.rowCopy}>
          <span className={styles.rowTitle}>Choose your next teachings</span>
          <span className={styles.rowMeta} style={{ whiteSpace: "normal" }}>{hub.state === "completed" ? "Advanced SOGP is coming. Until then, keep growing in the Library" : `Opens when you finish your ${days?.total ?? 28} days, so you always have something to learn and share`}</span>
        </span>
        <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
      </Link>
    </div>

    {/* Your learning: quiet, at the foot, where people look for settings. */}
    <div className={styles.sectionTitle}><h2>Your learning</h2></div>
    <div className={styles.panel}><ul className={styles.list}>
      {tools.map(tool => <li key={tool.title}><Link href={tool.href} className={styles.row}>
        <span className="shrink-0 text-[var(--color-community-muted)] [&>svg]:size-4" aria-hidden="true">{tool.icon}</span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{tool.title}</span><span className={styles.rowMeta}>{tool.meta}</span></span>
        <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
      </Link></li>)}
      {days ? null : <li><Link href="/dashboard/sogp/traditional" className={styles.row}>
        <span className="shrink-0 text-[var(--color-community-muted)]" aria-hidden="true"><CalendarDaysIcon className="size-4" /></span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>Calendar and assessments</span><span className={styles.rowMeta}>Every teaching day</span></span>
        <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
      </Link></li>}
    </ul></div>
  </div>;
}

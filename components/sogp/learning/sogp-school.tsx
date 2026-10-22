import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { AwardIcon, CalendarCheckIcon, CalendarDaysIcon, ChevronRightIcon, HistoryIcon, InfoIcon, ListMusicIcon, LockIcon, MessageCircleQuestionIcon, PlayIcon, RepeatIcon, UserRoundIcon } from "lucide-react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";
import { CrumbLabel } from "@/components/dashboard/shell/breadcrumbs";
import type { LearningHubData } from "@/lib/dashboard/learning-hub";
import type { CertificationFacts } from "@/lib/db/queries/sogp-certification-facts";
import type { LearningViewData } from "@/lib/sogp/learning-view";

import cards from "./learning-cards.module.css";
import frame from "./learning-hub.module.css";
import { artStyle } from "./other-learning";
import page from "./sogp-school.module.css";

/** Each level's art and field, as on Learning's card. */
const LEVEL_ART: Record<number, { image: string; field: string }> = {
  1: { image: "my-learning-background-v5.webp", field: "#2056d6" },
  2: { image: "my-learning-level-2.webp", field: "#24704d" },
  3: { image: "my-learning-level-3.webp", field: "#b84f35" },
  4: { image: "my-learning-level-4.webp", field: "#56298a" },
};

/**
 * The SOGP page (Pastor, 21 October; designed 22 October): Learning keeps
 * only what you're learning now, so SOGP's details live here. The SOGP card
 * heads it in its coral field; the certificate is three counts, coloured only
 * where something is missing; the levels are tiles in their own art (or your
 * podcast plan); After SOGP is a card; Your learning is a quiet list at the foot.
 */

export const SOGP_PAGE = "/dashboard/sogp/school";

function Chip({ tone, children }: { tone: [string, string]; children: ReactNode }) {
  return <span className="grid size-9 shrink-0 place-items-center rounded-[10px]" style={{ background: tone[0], color: tone[1] }} aria-hidden="true">{children}</span>;
}

export function SogpSchool({ hub, facts, followUp }: { hub: LearningHubData; facts: CertificationFacts | null; followUp: LearningViewData["followUp"] }) {
  const podcast = hub.path === "podcast_one" || hub.path === "podcast_two";
  const days = hub.journey.days;
  const issued = facts?.certificateAvailable ?? hub.certificate.available;

  const tools: Array<{ href: string; icon: ReactNode; title: string; meta: string }> = [
    { href: "/dashboard/sogp/path", icon: <RepeatIcon />, title: "Change path or pace", meta: hub.paceLabel },
    ...(podcast ? [{ href: "/dashboard/sogp/plan", icon: <ListMusicIcon />, title: "Your tracklist", meta: "The episodes in your plan" }] : []),
    { href: "/dashboard/sogp/history", icon: <HistoryIcon />, title: "History", meta: podcast ? `${hub.card.done} episodes listened` : `${hub.doneCount} ${hub.doneCount === 1 ? "teaching" : "teachings"} done` },
    { href: "/dashboard/sogp/reviews", icon: <CalendarCheckIcon />, title: "Group reviews", meta: hub.review ? `Next: ${hub.review.when}` : "Weekly, with your group" },
    { href: hub.discipler ? "/dashboard/community/discipleship" : "/dashboard/community/ask", icon: <MessageCircleQuestionIcon />, title: "Ask about a teaching", meta: hub.discipler ? `${hub.discipler.firstName} answers` : "Pleros answers" },
    { href: followUp ? "/dashboard/sogp/follow-up/welcome" : "/dashboard/sogp/follow-up", icon: <UserRoundIcon />, title: "Your follow-up person", meta: followUp?.name ?? "Assigned soon" },
    { href: "/dashboard/welcomepack/orientation", icon: <InfoIcon />, title: "How SOGP works", meta: "Days, reviews and the certificate" },
  ];

  const share = hub.card.total ? Math.min(100, Math.round((hub.card.done / hub.card.total) * 100)) : 0;
  const finished = hub.next.finished;
  const action = hub.state === "withdrawn" ? null
    : hub.state === "start" ? { href: "/dashboard/sogp/path", label: "Choose how you’ll learn" }
    : finished && hub.next.canChoose ? { href: "/dashboard/sogp/next", label: "Choose what’s next" }
    : { href: hub.card.href, label: hub.card.action };
  const line = [days?.current ? `Day ${days.current} of ${days.total}` : null, podcast ? hub.card.progress : `${hub.doneCount} of ${hub.card.total || 24} teachings`].filter(Boolean).join(" · ");
  const left = facts ? [!facts.learningPass, !facts.prayer.pass, !facts.reviews.reviewPass].filter(Boolean).length : 0;

  // Learning's frame, for the same 16px gutter and column width.
  return <div className={frame.page}><div className={frame.column}>
    <CrumbLabel href={SOGP_PAGE} label="School of God’s Purpose" />

    {/* The SOGP card heads the page in its own coral field with the gem (user, 22 October). */}
    <section className={`${cards.card} ${page.hero}`} style={artStyle("sogp")} aria-label="School of God’s Purpose">
      <span className={cards.art} aria-hidden="true" />
      <span className={`${cards.top} ${page.heroTop}`}>
        <span className={cards.tag}>{[hub.cohortTitle, podcast ? "Podcast" : "Traditional"].filter(Boolean).join(" · ")}</span>
        <h1>School of God’s Purpose</h1>
        <span className={page.heroLine}>{hub.state === "withdrawn" ? "Your enrolment is withdrawn. Your history stays here." : line}</span>
      </span>
      <span className={page.heroFoot}>
        {hub.card.total ? <span className={page.meter} aria-hidden="true"><i style={{ width: `${share}%` }} /></span> : null}
        {action ? <Link href={action.href} className={page.heroAction}>{action.label}{action.href === hub.card.href ? <PlayIcon className="size-3.5" fill="currentColor" strokeWidth={0} aria-hidden="true" /> : <ChevronRightIcon className="size-4" strokeWidth={2.2} aria-hidden="true" />}</Link> : null}
      </span>
    </section>

    {/* The certificate (Pastor: "more visible"): three counts, coloured only where something is missing. */}
    <div className={styles.sectionTitle}><h2>Your certificate</h2>{issued ? null : <Link href="/dashboard/sogp/readiness" className={styles.quiet}>See what’s left</Link>}</div>
    <div className={`${styles.panel} px-4`}>
      <div className={page.certHead} style={facts ? undefined : { borderBottom: 0 }}>
        <Chip tone={["#f6e4ac", "#5a4508"]}><AwardIcon className="size-[18px]" strokeWidth={2} /></Chip>
        <span className={styles.rowCopy}>
          <span className={styles.rowTitle}>{issued ? "Your certificate is ready" : facts?.meetsRequirements ? "Everything’s in" : left ? `${left} ${left === 1 ? "thing" : "things"} left` : "Your certificate"}</span>
          <span className={styles.rowMeta} style={{ whiteSpace: "normal" }}>{issued ? "Download it any time" : facts?.meetsRequirements ? "Claim it now" : facts ? "It unlocks when all three are in" : "We’ll show what’s left as you go"}</span>
        </span>
        {issued || facts?.meetsRequirements ? <Link href={issued ? "/dashboard/sogp/certificate" : "/dashboard/sogp/readiness"} className={`${styles.btn} no-underline`} data-primary="">{issued ? "Download" : "Claim"}</Link> : null}
      </div>
      {facts && !issued ? <div className={page.counts}>
        <div className={page.count} data-warn={!facts.learningPass || undefined}>
          <span>{facts.podcast ? "Episodes" : "Teachings"}</span><b>{facts.learningDone}</b>
          <span className={page.countDetail}><i aria-hidden="true" />{facts.learningPass ? "all in" : `of ${facts.learningTotal}`}</span>
        </div>
        <div className={page.count} data-warn={!facts.prayer.pass || undefined}>
          <span>Prayer Watch</span><b>{facts.prayer.percent}%</b>
          <span className={page.countDetail}><i aria-hidden="true" />{facts.prayer.pass ? "all in" : `needs ${facts.prayer.required}%`}</span>
        </div>
        <div className={page.count} data-warn={!facts.reviews.reviewPass || undefined}>
          <span>Reviews</span><b>{facts.reviews.attended + facts.reviews.madeUp}</b>
          <span className={page.countDetail}><i aria-hidden="true" />{facts.reviews.reviewPass ? "all in" : facts.reviews.outstanding ? `${facts.reviews.outstanding} to make up` : facts.reviews.owed ? `of ${facts.reviews.owed}` : "none yet"}</span>
        </div>
      </div> : null}
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
      {/* Each level in its own art (blue staircase, green stones, terracotta arch, plum hill). */}
      <div className={page.levels}>
        {hub.levels.map(level => {
          const levelArt = LEVEL_ART[level.level] ?? LEVEL_ART[1]!;
          return <Link key={level.level} href="/dashboard/sogp/traditional" className={page.level} data-state={level.state}
            style={{ "--level-field": levelArt.field, "--level-art": `url("/assets/dashboard/learning-card/${levelArt.image}")` } as CSSProperties}
            aria-label={`Level ${level.level}, ${level.title}: ${level.state === "later" ? (level.opens ? `opens ${level.opens}` : "opens after the level before") : `${level.done} of ${level.total} teachings`}`}>
            <span className={page.levelTop}>
              <span className={page.levelTag}>Level {level.level}{level.state === "done" ? " · Done" : level.state === "now" ? " · Now" : ""}</span>
              <span className={page.levelTitle}>{level.title}</span>
            </span>
            <span className={page.levelFoot}>
              {level.state === "later" ? <span className="inline-flex items-center gap-1"><LockIcon className="size-3" strokeWidth={2} aria-hidden="true" />{level.opens ? `Opens ${level.opens}` : "Opens next"}</span> : <span>{level.done} of {level.total} teachings</span>}
              {level.state === "later" ? null : <span className={page.levelMeter} aria-hidden="true"><i style={{ width: `${level.total ? (level.done / level.total) * 100 : 0}%` }} /></span>}
            </span>
          </Link>;
        })}
      </div>
    </> : null}

    {/* The next phase (Pastor): after SOGP, choose the next set of teachings. A card in the Advanced SOGP lilac. */}
    <div className={styles.sectionTitle}><h2>After SOGP</h2></div>
    <Link href={hub.next.canChoose ? "/dashboard/sogp/next" : "/dashboard/library"} className={`${cards.card} min-h-[112px]`} style={artStyle("advanced")}>
      <span className={cards.art} aria-hidden="true" />
      <span className={cards.top}>
        <span className={cards.tag}>{hub.next.card ? "Your next learning" : hub.next.canChoose ? "Open now" : "Opens when you finish"}</span>
        <h3>{hub.next.card ? hub.next.card.title : "Choose your next teachings"}</h3>
      </span>
      <span className={cards.meta}>{hub.next.card ? "Change it any time" : "A podcast journey, a series or your own episodes"}</span>
    </Link>

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
  </div></div>;
}

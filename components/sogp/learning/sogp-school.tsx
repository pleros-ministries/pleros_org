import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarCheckIcon, CalendarDaysIcon, ChevronRightIcon, HistoryIcon, InfoIcon, ListMusicIcon, MessageCircleQuestionIcon, RepeatIcon, UserRoundIcon } from "lucide-react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";
import { CrumbLabel } from "@/components/dashboard/shell/breadcrumbs";
import type { LearningHubData } from "@/lib/dashboard/learning-hub";
import type { CertificationFacts } from "@/lib/db/queries/sogp-certification-facts";
import type { LearningViewData } from "@/lib/sogp/learning-view";

import frame from "./learning-hub.module.css";


/**
 * The SOGP page (Pastor, 21 October; simplified 27 November): SOGP's details,
 * as plain panels of rows. The certificate is a row per requirement with its
 * state in a word; the levels are rows (or your plan); After SOGP is a row;
 * Your learning is a quiet list at the foot.
 */

export const SOGP_PAGE = "/dashboard/sogp/school";

/** A state as a dot and a word: done in deep green, attention in amber, otherwise quiet. */
function State({ state, word }: { state: "done" | "open" | "attention"; word: string }) {
  const tone = state === "done" ? "var(--color-community-green-ink, #2c6a22)" : state === "attention" ? "#a15c12" : "var(--color-community-muted)";
  const dot = state === "done" ? "var(--color-community-green-ink, #2c6a22)" : state === "attention" ? "#d98a1f" : "#c3c8cf";
  return <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px]" style={{ color: tone }}><span className="size-[7px] rounded-full" style={{ background: dot }} aria-hidden="true" />{word}</span>;
}

function Requirement({ title, meta, state, word }: { title: string; meta: string; state: "done" | "open" | "attention"; word?: string }) {
  return <li><div className={styles.row}>
    <span className={styles.rowCopy}><span className={styles.rowTitle}>{title}</span><span className={styles.rowMeta}>{meta}</span></span>
    <State state={state} word={word ?? (state === "done" ? "All in" : "Not yet")} />
  </div></li>;
}

export function SogpSchool({ hub, facts, followUp }: { hub: LearningHubData; facts: CertificationFacts | null; followUp: LearningViewData["followUp"] }) {
  // A doctrinal journey is a plan too: Library teachings, one a day (migration 0079).
  const podcast = hub.path === "podcast_one" || hub.path === "podcast_two" || hub.path === "doctrinal";
  const doctrinal = hub.path === "doctrinal";
  const unit = doctrinal ? "teachings" : "episodes";
  const issued = facts?.certificateAvailable ?? hub.certificate.available;

  const tools: Array<{ href: string; icon: ReactNode; title: string; meta: string }> = [
    { href: "/dashboard/sogp/path", icon: <RepeatIcon />, title: "Change path or pace", meta: hub.paceLabel },
    ...(podcast ? [{ href: "/dashboard/sogp/plan", icon: <ListMusicIcon />, title: doctrinal ? "Your teachings" : "Your tracklist", meta: doctrinal ? "The teachings in your path" : "The episodes in your plan" }] : []),
    { href: "/dashboard/sogp/history", icon: <HistoryIcon />, title: "History", meta: podcast ? `${hub.card.done} ${unit} listened` : `${hub.doneCount} ${hub.doneCount === 1 ? "teaching" : "teachings"} done` },
    { href: "/dashboard/sogp/reviews", icon: <CalendarCheckIcon />, title: "Group reviews", meta: hub.review ? `Next: ${hub.review.when}` : "Weekly, with your group" },
    { href: hub.discipler ? "/dashboard/community/discipleship" : "/dashboard/community/ask", icon: <MessageCircleQuestionIcon />, title: "Ask about a teaching", meta: hub.discipler ? `${hub.discipler.firstName} answers` : "Pleros answers" },
    { href: followUp ? "/dashboard/sogp/follow-up/welcome" : "/dashboard/sogp/follow-up", icon: <UserRoundIcon />, title: "Your follow-up person", meta: followUp?.name ?? "Assigned soon" },
    ...(hub.state === "start" ? [] : [{ href: "/dashboard/sogp/month", icon: <CalendarDaysIcon />, title: "This month", meta: `${hub.journey.month}: what you did and what’s next` }]),
    { href: "/dashboard/welcomepack/orientation", icon: <InfoIcon />, title: "How SOGP works", meta: "Days, reviews and the certificate" },
  ];

  const plan = podcast;
  const pathName = doctrinal ? "Personalised path" : plan ? "Podcast" : "Doctrinal path";

  // Learning's frame, for the same 16px gutter and column width.
  return <div className={frame.page}><div className={frame.column}>
    <CrumbLabel href={SOGP_PAGE} label="School of God’s Purpose" />

    {/* Plain panels (user, 27 November): no hero, strips or tiles. Learning keeps the card. */}
    <div><h1>School of God’s Purpose</h1><p className={styles.sub}>{hub.path ? `${pathName} · ${hub.journey.month}` : hub.journey.month}</p></div>
    {hub.state === "withdrawn" ? <p className={styles.note}>Your enrolment is withdrawn. Your history stays here.</p> : null}

    {/* The certificate: one row per requirement, each with its state in a word. */}
    <div className={styles.sectionTitle}><h2>Your certificate</h2>{issued ? null : <Link href="/dashboard/sogp/readiness" className={`${styles.quiet} inline-flex items-center gap-0.5`}>See what’s left<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link>}</div>
    <div className={styles.panel}><ul className={styles.list}>
      {issued || facts?.meetsRequirements ? <li><div className={styles.row}>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{issued ? "Your certificate is ready" : "Everything’s in"}</span><span className={styles.rowMeta}>{issued ? "Download it any time" : "Claim your certificate now"}</span></span>
        <Link href={issued ? "/dashboard/sogp/certificate" : "/dashboard/sogp/readiness"} className={`${styles.btn} no-underline`} data-primary="">{issued ? "Download" : "Claim"}</Link>
      </div></li> : null}
      {facts && !issued ? <>
        <Requirement title={facts.podcast ? (doctrinal ? "Teachings" : "Episodes") : "Tracks"} meta={`${facts.learningDone} of ${facts.learningTotal} ${facts.podcast ? "listened" : "done"}`} state={facts.learningPass ? "done" : "open"} />
        <Requirement title="Prayer Watch" meta={`${facts.prayer.percent}% of mornings · needs ${facts.prayer.required}%`} state={facts.prayer.pass ? "done" : "open"} />
        <Requirement title="Group reviews" meta={facts.reviews.owed ? `${facts.reviews.attended + facts.reviews.madeUp} of ${facts.reviews.owed}` : "None yet"}
          state={facts.reviews.reviewPass ? "done" : facts.reviews.outstanding ? "attention" : "open"} word={facts.reviews.outstanding ? `${facts.reviews.outstanding} to make up` : undefined} />
      </> : null}
      {!facts && !issued ? <li><div className={styles.row}><span className={styles.rowCopy}><span className={styles.rowTitle}>Your certificate</span><span className={styles.rowMeta}>We’ll show what’s left as you go</span></span></div></li> : null}
    </ul></div>

    {plan ? <>
      <div className={styles.sectionTitle}><h2>{doctrinal ? "Your teachings" : "Your plan"}</h2></div>
      <div className={styles.panel}><Link href={hub.card.href} className={styles.row}>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{hub.card.title}</span><span className={styles.rowMeta}>{hub.card.progress}</span></span>
        <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
      </Link></div>
    </> : hub.levels.length ? <>
      <div className={styles.sectionTitle}><h2>Levels</h2></div>
      <div className={styles.panel}><ul className={styles.list}>
        {hub.levels.map(level => <li key={level.level}>{level.state === "later"
          ? <div className={styles.row} style={{ color: "var(--color-community-muted)" }}>
            <span className={styles.rowCopy}><span className={styles.rowTitle}>{level.title}</span><span className={styles.rowMeta}>Level {level.level} · {level.opens ? `Opens ${level.opens}` : "Opens after the level before"}</span></span>
          </div>
          : <Link href="/dashboard/sogp/traditional" className={styles.row}>
            <span className={styles.rowCopy}><span className={styles.rowTitle}>{level.title}</span><span className={styles.rowMeta}>Level {level.level} · {level.total} tracks</span></span>
            <State state={level.state === "done" ? "done" : "open"} word={level.state === "done" ? "Done" : `${level.done} of ${level.total}`} />
            <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
          </Link>}</li>)}
      </ul></div>
    </> : null}

    <div className={styles.sectionTitle}><h2>After SOGP</h2></div>
    <div className={styles.panel}><Link href={hub.next.canChoose ? "/dashboard/sogp/next" : "/dashboard/library"} className={styles.row}>
      <span className={styles.rowCopy}><span className={styles.rowTitle}>{hub.next.card ? hub.next.card.title : "Choose your next teachings"}</span><span className={styles.rowMeta}>{hub.next.card ? "Your next learning · change it any time" : hub.next.canChoose ? "Open now" : "Opens when you finish"}</span></span>
      <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
    </Link></div>

    {/* Your learning: quiet, at the foot, where people look for settings. */}
    <div className={styles.sectionTitle}><h2>Your learning</h2></div>
    <div className={styles.panel}><ul className={styles.list}>
      {tools.map(tool => <li key={tool.title}><Link href={tool.href} className={styles.row}>
        <span className="shrink-0 text-[var(--color-community-muted)] [&>svg]:size-4" aria-hidden="true">{tool.icon}</span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>{tool.title}</span><span className={styles.rowMeta}>{tool.meta}</span></span>
        <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
      </Link></li>)}
    </ul></div>
    {plan ? null : <p className={styles.note}>A track a day, with a group review at the end of each level.</p>}
  </div></div>;
}

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ChevronRightIcon, PlayIcon, RefreshCcwIcon } from "lucide-react";

import groupStyles from "@/components/community/discipleship/discipleship-group.module.css";
import type { LearningHubData } from "@/lib/dashboard/learning-hub";
import type { LearningViewData } from "@/lib/sogp/learning-view";

import styles from "./learning-hub.module.css";
import { SOGP_PAGE } from "./sogp-school";

/** Each level's art; `wide` is the 3:1 cut that covers wide cards without a seam (as on Home). */
const LEVEL_ART: Record<number, { image: string; wide: string; field: string; ink: string }> = {
  1: { image: "my-learning-background-v5.webp", wide: "my-learning-background-v5-wide.webp", field: "#2056d6", ink: "#2056d6" },
  2: { image: "my-learning-level-2.webp", wide: "my-learning-level-2-wide.webp", field: "#24704d", ink: "#1d5e40" },
  3: { image: "my-learning-level-3.webp", wide: "my-learning-level-3-wide.webp", field: "#b84f35", ink: "#a8432c" },
  4: { image: "my-learning-level-4.webp", wide: "my-learning-level-4-wide.webp", field: "#56298a", ink: "#4a2275" },
};

/** The daily time, folded into the card's one top line (user, 24 November); the path itself is named under Your path. */
const PACE: Record<NonNullable<LearningHubData["path"]>, string> = { traditional: "1 hr a day", podcast_one: "15 min a day", podcast_two: "30 min a day", doctrinal: "One a day" };

/** What heads Learning for each path. */
const PATH_NAMES: Record<NonNullable<LearningHubData["path"]>, string> = { traditional: "Doctrinal path", podcast_one: "Podcast", podcast_two: "Podcast", doctrinal: "Personalised path" };

/** A day as a small calendar leaf (user, 27 November): weekday over the date; today in soft blue. */
function DateTile({ weekday, day, today }: { weekday: string; day: string; today: boolean }) {
  return <span className={styles.dateTile} data-today={today || undefined} aria-label={today ? `Today, ${weekday} ${day}` : `${weekday} ${day}`}>
    <span aria-hidden="true">{today ? "Today" : weekday}</span>
    <b aria-hidden="true">{day}</b>
  </span>;
}

/** How each path runs, in words, for Your path's first row. */
const PACE_LINE: Record<NonNullable<LearningHubData["path"]>, string> = { traditional: "A track a day, about an hour", podcast_one: "One episode a day, about 15 minutes", podcast_two: "Two episodes a day, about 30 minutes", doctrinal: "One teaching a day, chosen by you" };

/**
 * Learning below the card (user, 27 November): the rest of the month in
 * words, then your path in two rows. No counts strips, no level list: the
 * levels live on the SOGP page.
 */
function MonthAndPath({ hub }: { hub: LearningHubData }) {
  const month = hub.month!;
  const plan = hub.path === "podcast_one" || hub.path === "podcast_two" || hub.path === "doctrinal";
  const certificate = hub.certificate.available ? "Ready to download"
    : plan ? `${hub.card.done} of ${hub.card.total} ${hub.path === "doctrinal" ? "teachings" : "episodes"} listened`
    : `${hub.doneCount} of ${hub.card.total} tracks done`;
  const row = (title: string, meta: string, href: string | null, end?: string, lead?: ReactNode) => {
    const body = <>
      {lead}
      <span className={groupStyles.rowCopy}><span className={groupStyles.rowTitle}>{title}</span><span className={groupStyles.rowMeta}>{meta}</span></span>
      {end ? <span className={groupStyles.rowMeta}>{end}</span> : null}
      {href ? <ChevronRightIcon className={`${groupStyles.chev} size-4`} strokeWidth={2} aria-hidden="true" /> : null}
    </>;
    return href ? <Link href={href} className={groupStyles.row}>{body}</Link> : <div className={groupStyles.row}>{body}</div>;
  };
  return <>
    <div className={groupStyles.sectionTitle}><h2>Rest of {month.name}</h2><Link href="/dashboard/sogp/month" className={`${groupStyles.quiet} inline-flex items-center gap-0.5`}>See {month.name}<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link></div>
    <div className={groupStyles.panel} data-tour="your-path">{month.rows.length
      ? <ul className={groupStyles.list}>{month.rows.map(item => <li key={item.day + item.title}>{row(item.title, item.meta, item.href, undefined, <DateTile weekday={item.weekday} day={item.day} today={item.today} />)}</li>)}</ul>
      : <p className={groupStyles.empty}>{month.empty}</p>}</div>

    <div className={groupStyles.sectionTitle}><h2>Your path</h2><Link href="/dashboard/sogp/path" className={`${groupStyles.quiet} inline-flex items-center gap-0.5`}>Change<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link></div>
    <div className={groupStyles.panel}><ul className={groupStyles.list}>
      <li>{row(PATH_NAMES[hub.path ?? "traditional"], PACE_LINE[hub.path ?? "traditional"], null)}</li>
      <li>{row("Certificate", certificate, SOGP_PAGE)}</li>
    </ul></div>
    {month.note ? <p className={groupStyles.note}>{month.note}</p> : null}
  </>;
}

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? "").join("").toUpperCase();

/**
 * Learning (Pastor, 21 October): only what you're learning now. Your current
 * learning is a class of its own, named above the card playing from it, and
 * opens the SOGP page; Home keeps today's tasks. Everything else is Other
 * learning, as cards. Path, history, reviews and the certificate live on the
 * SOGP page.
 */
export function LearningHub({ hub, learning }: { hub: LearningHubData; learning: LearningViewData }) {
  const art = LEVEL_ART[hub.card.level] ?? LEVEL_ART[1]!;
  const share = hub.card.total ? Math.min(100, Math.round((hub.card.done / hub.card.total) * 100)) : 0;
  const podcast = hub.path === "podcast_one" || hub.path === "podcast_two";
  // Every published track done: the card celebrates instead of resuming.
  const finished = hub.card.total > 0 && hub.doneCount >= hub.card.total && !podcast;
  // After SOGP (Pastor, 21 October): the chosen next learning becomes the current learning.
  const next = hub.next.card;
  const nextArt = LEVEL_ART[1]!;
  const nextStyle = { "--hub-art": `url("/assets/dashboard/learning-card/${nextArt.image}")`, "--hub-art-wide": `url("/assets/dashboard/learning-card/${nextArt.wide}")`, "--hub-field": nextArt.field, "--hub-ink": nextArt.ink } as CSSProperties;

  const resume = next
    ? <section data-tour="learning-card" className={styles.card} aria-label="Resume learning" style={nextStyle}>
      <div className={styles.cardTop}><span>{next.finished ? "Journey complete" : `Episode ${next.episodeNumber} of ${next.totalDays} · Podcast`}</span></div>
      <div>
        <h2>{next.finished ? "You’ve finished this journey" : next.episodeTitle ?? next.title}</h2>
        <span className={styles.cardMeta}>{next.listened} of {next.totalDays} listened</span>
        <div className={styles.meter} aria-hidden="true"><i style={{ width: `${next.totalDays ? Math.min(100, Math.round((next.listened / next.totalDays) * 100)) : 0}%` }} /></div>
      </div>
      {next.finished
        ? <Link href="/dashboard/sogp/next" className={styles.resume}>Choose what’s next <ChevronRightIcon className="size-4" strokeWidth={2.2} /></Link>
        : <Link href="/dashboard/podcast" className={styles.resume}>{next.todayListened ? "Open today’s episode" : "Listen now"} <PlayIcon className="size-4" fill="currentColor" strokeWidth={0} /></Link>}
    </section>
    : hub.state === "start"
    ? <section data-tour="learning-card" className={styles.card} style={{ "--hub-art": `url("/assets/dashboard/learning-card/${art.image}")`, "--hub-art-wide": `url("/assets/dashboard/learning-card/${art.wide}")`, "--hub-field": art.field, "--hub-ink": art.ink } as CSSProperties}>
      {/* The cohort is already under the page heading; the card says only what's next. */}
      <div className={styles.cardTop}><span>Not chosen yet</span></div>
      <div><h2>Choose your SOGP path</h2><span className={styles.cardMeta}>Doctrinal, podcast or your own personalised path</span></div>
      <Link href="/dashboard/sogp/path" className={styles.resume}>Choose a path <ChevronRightIcon className="size-4" strokeWidth={2.2} /></Link>
    </section>
    : finished ? <section data-tour="learning-card" className={styles.card} aria-label="SOGP finished" style={{ "--hub-art": `url("/assets/dashboard/learning-card/${LEVEL_ART[2]!.image}")`, "--hub-art-wide": `url("/assets/dashboard/learning-card/${LEVEL_ART[2]!.wide}")`, "--hub-field": LEVEL_ART[2]!.field, "--hub-ink": LEVEL_ART[2]!.ink } as CSSProperties}>
      <div className={styles.cardTop}><span>{hub.cohortTitle ?? "SOGP"} · Completed</span></div>
      <div><h2>You’ve finished SOGP</h2><span className={styles.cardMeta}>{hub.doneCount} tracks{hub.certificate.available ? " · certificate ready" : " complete"}</span></div>
      {hub.next.canChoose
        ? <Link href="/dashboard/sogp/next" className={styles.resume}>Choose what’s next <ChevronRightIcon className="size-4" strokeWidth={2.2} /></Link>
        : <Link href={hub.certificate.available ? "/dashboard/sogp/certificate" : "/dashboard/sogp/readiness"} className={styles.resume}>{hub.certificate.available ? "View your certificate" : "Check your certificate"} <ChevronRightIcon className="size-4" strokeWidth={2.2} /></Link>}
    </section>
    : <section data-tour="learning-card" className={styles.card} aria-label="Resume learning" style={{ "--hub-art": `url("/assets/dashboard/learning-card/${art.image}")`, "--hub-art-wide": `url("/assets/dashboard/learning-card/${art.wide}")`, "--hub-field": art.field, "--hub-ink": art.ink } as CSSProperties}>
      <div className={styles.cardTop}><span>{[hub.card.eyebrow, hub.path ? PACE[hub.path] : null].filter(Boolean).join(" · ")}</span></div>
      <div>
        <h2>{hub.card.title}</h2>
        <span className={styles.cardMeta}>{hub.card.progress}</span>
        {hub.card.total ? <div className={styles.meter} aria-hidden="true"><i style={{ width: `${share}%` }} /></div> : null}
      </div>
      {hub.state === "withdrawn"
        ? <span className={styles.cardMeta}>Your enrolment is withdrawn. Your history stays here.</span>
        : <Link href={hub.card.href} className={styles.resume}>{hub.card.action} <PlayIcon className="size-4" fill="currentColor" strokeWidth={0} /></Link>}
    </section>;

  // A learner who joined by someone's link chooses whether to keep them (user, 18 October).
  const linkChoicePending = learning.followUp?.source === "link" && learning.followUp.choice == null;
  return <div className={styles.page}>
    <div className={styles.column}>
      {linkChoicePending ? <Link href="/dashboard/sogp/follow-up/welcome" data-tour="leader-banner" className={`${styles.panel} ${styles.row}`} style={{ display: "flex", background: "#eef3fe", borderColor: "#d6e0fb" }}>
        <span className={styles.avatar} aria-hidden="true">{initials(learning.followUp!.name)}</span>
        <span className={styles.rowCopy}><span className={styles.rowTitle} style={{ fontWeight: 500 }}>{learning.followUp!.name.split(" ")[0]} invited you</span><span className={styles.rowMeta}>Keep them as the person who looks after you, or ask for someone else</span></span>
        <ChevronRightIcon className="size-4 shrink-0 text-[#a6abb2]" strokeWidth={2} />
      </Link> : null}

      {/* The month frames the page (Pastor, 27 November); the cohort line only before a path. */}
      <div><h1>Learning</h1>{next ? <p className={groupStyles.sub}>Your next learning, after SOGP</p> : hub.month ? <p className={groupStyles.sub}>{hub.month.name} · {hub.month.daysLeft === 1 ? "last day" : `${hub.month.daysLeft} days left`}</p> : hub.cohortTitle ? <p className={groupStyles.sub}>{[hub.cohortTitle, hub.weekLabel].filter(Boolean).join(" · ")}</p> : null}</div>

      {resume}

      {hub.state === "preparing" ? <p className={styles.notice}>Your cohort hasn’t started yet. Pre-SOGP is open now, and your first teachings unlock on the start date.</p> : null}
      {next ? null : hub.next.canChoose ? <p className={styles.notice}>{finished ? "Choose your next teachings so you always have something to learn and share. It becomes your current learning here." : <>{hub.month?.rows.length ? "Your cohort has ended. Your plan carries on below at your own pace." : "Your cohort has ended. Your history and any remaining lessons stay open."} <Link href="/dashboard/sogp/next" className={groupStyles.quiet}>Choose what’s next</Link></>}</p>
        : hub.state === "completed" ? <p className={styles.notice}>Your cohort has ended. Your history and any remaining lessons stay open here.</p> : null}

      {hub.catchUp && hub.state === "active" && !next ? <div className={styles.catch}>
        <span className={styles.catchIcon} aria-hidden="true"><RefreshCcwIcon className="size-4" strokeWidth={2.2} /></span>
        <span className={styles.rowCopy}>
          <span className={styles.rowTitle} style={{ fontWeight: 500 }}>{hub.catchUp.count} {hub.catchUp.count === 1 ? "lesson" : "lessons"} from earlier</span>
          <span className={styles.rowMeta}>{hub.catchUp.days.join(", ")} · you can still do {hub.catchUp.count === 1 ? "it" : "them"} any time</span>
        </span>
        <Link href={hub.catchUp.href} className={styles.btn}>Catch up</Link>
      </div> : null}


      {hub.month && !next ? <MonthAndPath hub={hub} /> : null}
    </div>
  </div>;
}

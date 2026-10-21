import Link from "next/link";
import type { CSSProperties } from "react";
import { ChevronRightIcon, PlayIcon, RefreshCcwIcon } from "lucide-react";

import groupStyles from "@/components/community/discipleship/discipleship-group.module.css";
import type { LearningHubData } from "@/lib/dashboard/learning-hub";
import type { LearningViewData } from "@/lib/sogp/learning-view";

import styles from "./learning-hub.module.css";
import { OtherLearning, otherLearningTiles } from "./other-learning";
import { SOGP_PAGE } from "./sogp-school";

/** Each level's art; `wide` is the 3:1 cut that covers wide cards without a seam (as on Home). */
const LEVEL_ART: Record<number, { image: string; wide: string; field: string; ink: string }> = {
  1: { image: "my-learning-background-v5.webp", wide: "my-learning-background-v5-wide.webp", field: "#2056d6", ink: "#2056d6" },
  2: { image: "my-learning-level-2.webp", wide: "my-learning-level-2-wide.webp", field: "#24704d", ink: "#1d5e40" },
  3: { image: "my-learning-level-3.webp", wide: "my-learning-level-3-wide.webp", field: "#b84f35", ink: "#a8432c" },
  4: { image: "my-learning-level-4.webp", wide: "my-learning-level-4-wide.webp", field: "#56298a", ink: "#4a2275" },
};

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

  const resume = hub.state === "start"
    ? <section className={styles.card} style={{ "--hub-art": `url("/assets/dashboard/learning-card/${art.image}")`, "--hub-art-wide": `url("/assets/dashboard/learning-card/${art.wide}")`, "--hub-field": art.field, "--hub-ink": art.ink } as CSSProperties}>
      <div className={styles.cardTop}><span>{hub.cohortTitle ?? "SOGP"}</span></div>
      <div><h2>Choose how you’ll learn</h2><span className={styles.cardMeta}>A lesson a day, or podcasts at your own pace</span></div>
      <Link href="/dashboard/sogp/path" className={styles.resume}>Get started <ChevronRightIcon className="size-4" strokeWidth={2.2} /></Link>
    </section>
    : finished ? <section className={styles.card} aria-label="SOGP finished" style={{ "--hub-art": `url("/assets/dashboard/learning-card/${LEVEL_ART[2]!.image}")`, "--hub-art-wide": `url("/assets/dashboard/learning-card/${LEVEL_ART[2]!.wide}")`, "--hub-field": LEVEL_ART[2]!.field, "--hub-ink": LEVEL_ART[2]!.ink } as CSSProperties}>
      <div className={styles.cardTop}><span>{hub.cohortTitle ?? "SOGP"} · Completed</span></div>
      <div><h2>You’ve finished SOGP</h2><span className={styles.cardMeta}>{hub.doneCount} tracks complete</span></div>
      <Link href={hub.certificate.available ? "/dashboard/sogp/certificate" : "/dashboard/sogp/readiness"} className={styles.resume}>{hub.certificate.available ? "View your certificate" : "Check your certificate"} <ChevronRightIcon className="size-4" strokeWidth={2.2} /></Link>
    </section>
    : <section className={styles.card} aria-label="Resume learning" style={{ "--hub-art": `url("/assets/dashboard/learning-card/${art.image}")`, "--hub-art-wide": `url("/assets/dashboard/learning-card/${art.wide}")`, "--hub-field": art.field, "--hub-ink": art.ink } as CSSProperties}>
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

  // A learner who joined by someone's link chooses whether to keep them (user, 18 October).
  const linkChoicePending = learning.followUp?.source === "link" && learning.followUp.choice == null;
  return <div className={styles.page}>
    <div className={styles.column}>
      {linkChoicePending ? <Link href="/dashboard/sogp/follow-up/welcome" className={`${styles.panel} ${styles.row}`} style={{ display: "flex", background: "#eef3fe", borderColor: "#d6e0fb" }}>
        <span className={styles.avatar} aria-hidden="true">{initials(learning.followUp!.name)}</span>
        <span className={styles.rowCopy}><span className={styles.rowTitle} style={{ fontWeight: 500 }}>{learning.followUp!.name.split(" ")[0]} invited you</span><span className={styles.rowMeta}>Keep them as the person who looks after you, or ask for someone else</span></span>
        <ChevronRightIcon className="size-4 shrink-0 text-[#a6abb2]" strokeWidth={2} />
      </Link> : null}

      <div><h1>Learning</h1>{hub.cohortTitle ? <p className={groupStyles.sub}>{[hub.cohortTitle, hub.weekLabel].filter(Boolean).join(" · ")}</p> : null}</div>

      {/* Your current learning, a class of its own: its name heads the card playing from it. */}
      <div className={styles.sectionTitle}>
        <h2>School of God’s Purpose</h2>
        <Link href={SOGP_PAGE} className="inline-flex items-center gap-0.5">Open<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link>
      </div>
      {resume}

      {hub.state === "preparing" ? <p className={styles.notice}>Your cohort hasn’t started yet. Pre-SOGP is open now, and your first teachings unlock on the start date.</p> : null}
      {hub.state === "completed" ? <p className={styles.notice}>{finished ? "You’ve finished every track. Keep growing below." : "Your cohort has ended. Your history and any remaining lessons stay open here."}</p> : null}

      {hub.catchUp && hub.state === "active" ? <div className={styles.catch}>
        <span className={styles.catchIcon} aria-hidden="true"><RefreshCcwIcon className="size-4" strokeWidth={2.2} /></span>
        <span className={styles.rowCopy}>
          <span className={styles.rowTitle} style={{ fontWeight: 500 }}>{hub.catchUp.count} {hub.catchUp.count === 1 ? "lesson" : "lessons"} from earlier</span>
          <span className={styles.rowMeta}>{hub.catchUp.days.join(", ")} · you can still do {hub.catchUp.count === 1 ? "it" : "them"} any time</span>
        </span>
        <Link href={hub.catchUp.href} className={styles.btn}>Catch up</Link>
      </div> : null}

      {hub.state === "active" ? <Link href="/dashboard" className={`${groupStyles.quiet} -mt-1 inline-flex items-center gap-0.5 justify-self-start`}>Today’s tasks are on Home<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link> : null}

      <div className={styles.sectionTitle}><h2>Other learning</h2></div>
      <OtherLearning tiles={otherLearningTiles(hub)} />
    </div>
  </div>;
}

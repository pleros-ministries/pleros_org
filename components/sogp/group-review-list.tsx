import Link from "next/link";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import { CancelReviewButton } from "./group-review-cancel";
import type { GroupReviewView } from "@/lib/db/queries/sogp-group-reviews";
import styles from "./group-reviews.module.css";
import { groupReviewTimeLabel } from "@/lib/sogp/group-review";

export function GroupReviewList({ data }: { data: GroupReviewView }) {
  const now = data.now;
  const upcoming = data.reviews.filter(review => new Date(review.endsAt).getTime() > now).sort((a,b) => a.startsAt.localeCompare(b.startsAt));
  const history = data.reviews.filter(review => new Date(review.endsAt).getTime() <= now).sort((a,b) => b.startsAt.localeCompare(a.startsAt));
  function card(review: GroupReviewView["reviews"][number], future: boolean) {
    return <article className={styles.reviewCard} key={review.id}>
      <span className={styles.pills}><span className={styles.pill} data-tone={future ? "done" : review.canConfirm ? undefined : review.attendance === "attended" ? "done" : "todo"}>{future ? "Scheduled" : review.canConfirm ? "Review ended" : review.attendance === "attended" ? "Attended" : review.attendance === "missed" ? "Missed" : "Unconfirmed"}</span>
      {review.makeUpCompleted ? <span className={styles.pill} data-tone="done">Made up · original Missed kept</span> : null}</span>
      <h2 data-dashboard-learning-title className={styles.reviewTitle}>{review.title}</h2>{future || review.canConfirm ? <><p>{groupReviewTimeLabel(review.startsAt, review.endsAt)} · Lagos (WAT)</p><p className={styles.meta}>{review.venue} · Led by {review.leaderName}</p></> : <p className={styles.meta}>{new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(review.startsAt))}{review.attendance ? ` · Confirmed by ${review.leaderName}` : ""}</p>}
      {review.canConfirm || review.attendance === "missed" ? <div className={styles.actions}>{review.canConfirm ? <><Link className={styles.rowLink} href={`/dashboard/sogp/reviews/${review.id}/attendance`}>{future ? "View attendance sheet" : "Confirm attendance"}<DashboardIcon name="right" size={16} /></Link>{future ? <><Link className={styles.rowLink} href={`/dashboard/sogp/reviews/${review.id}/reschedule`}>Reschedule<DashboardIcon name="right" size={16} /></Link><CancelReviewButton reviewId={review.id} /></> : <Link className={styles.rowLink} href={`/dashboard/sogp/reviews/${review.id}/make-up-offer`}>Offer or confirm make-ups<DashboardIcon name="right" size={16} /></Link>}</> : review.attendance === "missed" ? <Link className={styles.rowLink} href={`/dashboard/sogp/reviews/${review.id}/make-up`}>{review.makeUpCompleted ? "View confirmed make-up" : "Choose a make-up"}<DashboardIcon name="right" size={16} /></Link> : null}</div> : null}
    </article>;
  }
  return <section className={styles.page}>
    <header className={styles.heading}><h1>Weekly group reviews</h1><p className={styles.meta}>{data.group?.name ?? "Your reviews"}</p></header>
    {data.reviews.length ? <div className={styles.strip}><div><span>Upcoming</span><strong>{upcoming.length}</strong></div><div><span>Attended</span><strong>{history.filter(review => review.attendance === "attended").length}</strong></div><div><span>Missed</span><strong style={{ color: history.some(review => review.attendance === "missed" && !review.makeUpCompleted) ? "#92400e" : undefined }}>{history.filter(review => review.attendance === "missed").length}</strong></div></div> : null}
    {data.groups.length > 1 ? <nav className={styles.groupLinks} aria-label="Your review groups">{data.groups.map(group => <Link key={group.id} aria-current={data.group?.id === group.id ? "page" : undefined} href={`/dashboard/sogp/reviews?group=${group.id}`}>{group.name}</Link>)}</nav> : null}
    <p className={styles.info}>Required for traditional and podcast paths. Your group lead confirms attendance, and you can keep learning between reviews.</p>
    {!data.groups.length ? <p className={styles.info}>No active discipleship group is linked yet. Group membership starts only after you accept an invitation; you can keep learning meanwhile.</p> : null}
    {data.group?.isLeader ? <Link href="/dashboard/sogp/reviews/schedule" className={styles.primary}>Schedule group review<DashboardIcon name="plus" /></Link> : null}
    <section className={styles.section}><h2>Next group review</h2>{upcoming.length ? upcoming.map(review => card(review, true)) : <div className={styles.empty}><p>No review scheduled yet.</p><p className={styles.meta}>{data.group?.isLeader ? "Schedule a review for your group when you’re ready." : "Your group lead schedules reviews. Your learning continues meanwhile."}</p></div>}</section>
    <section className={styles.section}><h2>{data.group?.isLeader ? "Previous group reviews" : "Your attendance"}</h2>{history.length ? history.map(review => card(review, false)) : <p className={styles.meta}>No group review attendance recorded yet.</p>}</section>
    <div className={styles.linkPanel}><Link href="/dashboard/sogp/readiness" className={styles.rowLink}>View certification readiness<DashboardIcon name="right" size={16} /></Link></div>
    <footer className={styles.footer}><Link href="/dashboard/sogp" className={styles.primary}>Continue learning<DashboardIcon name="arrow" /></Link></footer>
  </section>;
}

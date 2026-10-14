import Link from "next/link";
import { DashboardIcon, StatusPill } from "@/components/dashboard/v3/primitives";
import type { GroupReviewView } from "@/lib/db/queries/sogp-group-reviews";
import styles from "./group-reviews.module.css";
import { groupReviewTimeLabel } from "@/lib/sogp/group-review";

export function GroupReviewList({ data }: { data: GroupReviewView }) {
  const now = Date.now();
  const upcoming = data.reviews.filter(review => new Date(review.endsAt).getTime() > now).sort((a,b) => a.startsAt.localeCompare(b.startsAt));
  const history = data.reviews.filter(review => new Date(review.endsAt).getTime() <= now).sort((a,b) => b.startsAt.localeCompare(a.startsAt));
  function card(review: GroupReviewView["reviews"][number], future: boolean) {
    return <article className={styles.reviewCard} key={review.id}>
      <StatusPill tone={future ? "blue" : review.canConfirm ? "neutral" : review.attendance === "attended" ? "green" : "amber"}>{future ? "Scheduled" : review.canConfirm ? "Review ended" : review.attendance === "attended" ? "Attended" : review.attendance === "missed" ? "Missed" : "Unconfirmed"}</StatusPill>
      {review.makeUpCompleted ? <StatusPill tone="green">Made up · Original Missed retained</StatusPill> : null}
      <h2 data-dashboard-learning-title className={styles.reviewTitle}>{review.title}</h2><p>{groupReviewTimeLabel(review.startsAt, review.endsAt)}</p><p className={styles.meta}>Lagos (WAT)</p><p>{review.venue}</p><p className={styles.meta}>Session leader · {review.leaderName}</p>
      {review.canConfirm ? <><Link className={styles.rowLink} href={`/dashboard/sogp/reviews/${review.id}/attendance`}>{future ? "View attendance sheet" : "Confirm attendance"}<DashboardIcon name="right" size={16} /></Link>{!future ? <Link className={styles.rowLink} href={`/dashboard/sogp/reviews/${review.id}/make-up-offer`}>Offer or confirm make-ups<DashboardIcon name="right" size={16} /></Link> : null}</> : review.attendance === "missed" ? <Link className={styles.rowLink} href={`/dashboard/sogp/reviews/${review.id}/make-up`}>{review.makeUpCompleted ? "View confirmed make-up" : "Choose a make-up"}<DashboardIcon name="right" size={16} /></Link> : null}
    </article>;
  }
  return <section className={styles.page}>
    <header className={styles.heading}><h1>Weekly group reviews</h1><p className={styles.meta}>{data.group?.name ?? "Your reviews"}</p></header>
    {data.groups.length > 1 ? <nav className={styles.groupLinks} aria-label="Your review groups">{data.groups.map(group => <Link key={group.id} aria-current={data.group?.id === group.id ? "page" : undefined} href={`/dashboard/sogp/reviews?group=${group.id}`}>{group.name}</Link>)}</nav> : null}
    <div className={styles.info}><p>Required for traditional and podcast paths.<br />Your group lead confirms attendance.<br />You can keep learning between reviews.</p></div>
    {!data.groups.length ? <p className={styles.info}>No active discipleship group is linked yet. Group membership starts only after you accept an invitation; you can keep learning meanwhile.</p> : null}
    {data.group?.isLeader ? <Link href="/dashboard/sogp/reviews/schedule" className={styles.primary}>Schedule group review<DashboardIcon name="plus" /></Link> : null}
    <section className={styles.section}><h2>Next group review</h2>{upcoming.length ? upcoming.map(review => card(review, true)) : <div className={styles.empty}><p>No review scheduled yet.</p><p className={styles.meta}>{data.group?.isLeader ? "Schedule a review for your group when you’re ready." : "Your group lead schedules reviews. Your learning continues meanwhile."}</p></div>}</section>
    <section className={styles.section}><h2>{data.group?.isLeader ? "Previous group reviews" : "Your attendance"}</h2>{history.length ? history.map(review => card(review, false)) : <p className={styles.meta}>No group review attendance recorded yet.</p>}</section>
    <footer className={styles.footer}><Link href="/dashboard/sogp/readiness" className={styles.rowLink}>Certification readiness<DashboardIcon name="right" size={16} /></Link><Link href="/dashboard/sogp" className={styles.rowLink}>Continue learning<DashboardIcon name="arrow" /></Link></footer>
  </section>;
}

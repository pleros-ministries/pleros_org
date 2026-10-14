"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DashboardIcon, StatusPill } from "@/components/dashboard/v3/primitives";
import { groupReviewTimeLabel } from "@/lib/sogp/group-review";
import styles from "./group-reviews.module.css";

export type MakeUpReviewView = {
  original: { id: number; title: string; groupName: string; startsAt: string; endsAt: string; venue: string; leaderName: string };
  offers: { id: number; startsAt: string; endsAt: string; venue: string; leaderName: string }[];
  chosenOfferId: number | null;
  completed: boolean;
};

/** Paper's explicit-offer picker; selection itself never confirms attendance. */
export function GroupReviewMakeUp({ data, choose }: {
  data: MakeUpReviewView;
  choose: (offerId: number) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [selected, setSelected] = useState(data.chosenOfferId ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const router = useRouter();
  function save() {
    if (!selected) { setError("Choose one of the offered make-up sessions."); return; }
    startSave(async () => {
      try {
        const result = await choose(selected);
        if (!result.ok) { setError(result.error); return; }
        setError(null); router.refresh();
      } catch { setError("Your choice could not be saved. Try again; your attendance history is unchanged."); }
    });
  }
  return <section className={styles.page}>
    <header className={styles.heading}><h1>You can make this up</h1><StatusPill tone="amber">Missed review</StatusPill></header>
    <article className={styles.reviewCard}><h2 data-dashboard-learning-title className={styles.attendanceTitle}>{data.original.title}</h2><p className={styles.meta}>{data.original.groupName}</p><p>{groupReviewTimeLabel(data.original.startsAt, data.original.endsAt)}</p><p className={styles.meta}>{data.original.venue} · Lagos (WAT)</p><p className={styles.meta}>Session leader · {data.original.leaderName}</p></article>
    <div className={styles.info}><p>Keep learning while your make-up is pending.<br />This missed review stays in your history.</p></div>
    <fieldset className={styles.offerChoices}><legend>Choose a make-up session</legend><p className={styles.meta}>For {data.original.title}</p>
      {data.offers.length ? data.offers.map(offer => <label key={offer.id} className={styles.offerChoice}><span><span className={styles.offerTitle}>{groupReviewTimeLabel(offer.startsAt, offer.endsAt)}</span><span className={styles.meta}>{offer.venue} · Leader: {offer.leaderName}</span><span className={styles.meta}>Lagos (WAT)</span></span><input type="radio" name="make-up-session" checked={selected === offer.id} disabled={saving || data.completed} onChange={() => { setSelected(offer.id); setError(null); }} /></label>) : <p className={styles.empty}>No make-up session has been offered yet. Your learning continues.</p>}
    </fieldset>
    <section className={styles.section}><h2>Attendance status</h2><StatusPill tone={data.completed ? "green" : "amber"}>{data.completed ? "Make-up completed" : "Make-up pending"}</StatusPill><p className={styles.meta}>Choosing a session doesn’t confirm attendance.<br />Your group lead confirms it after the review.</p><Link className={styles.rowLink} href="/dashboard/sogp">Continue learning<DashboardIcon name="arrow" /></Link></section>
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    <footer className={styles.footer}><button type="button" className={styles.primary} disabled={saving || data.completed || !data.offers.length || !selected} onClick={save}>{saving ? "Saving…" : "Choose this make-up"}<DashboardIcon name="check" /></button></footer>
  </section>;
}

"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import { groupReviewTimeLabel } from "@/lib/sogp/group-review";
import styles from "./group-reviews.module.css";

export type MakeUpReviewView = {
  original: { id: number; title: string; groupName: string; startsAt: string; endsAt: string; venue: string; leaderName: string };
  offers: { id: number; startsAt: string; endsAt: string; venue: string; leaderName: string }[];
  chosenOfferId: number | null;
  completed: boolean;
  canChoose?: boolean;
};

/** Paper's explicit-offer picker; selection itself never confirms attendance. */
export function GroupReviewMakeUp({ data, choose, preview = false }: {
  data: MakeUpReviewView;
  choose: (offerId: number) => Promise<{ ok: true } | { ok: false; error: string }>;
  preview?: boolean;
}) {
  const [selected, setSelected] = useState(data.chosenOfferId ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const router = useRouter();
  function save() {
    if (preview) { setError("This visual preview does not save a make-up choice."); return; }
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
    <header className={styles.heading}><h1>You can make this up</h1><p className={styles.meta}>Missed review · {data.original.groupName}</p></header>
    <article className={`${styles.reviewCard} ${styles.lockedSummary}`}><h2 data-dashboard-learning-title className={styles.attendanceTitle}>{data.original.title}</h2><p className={styles.meta}>{data.original.groupName}</p><p>{groupReviewTimeLabel(data.original.startsAt, data.original.endsAt)}</p><p className={styles.meta}>{data.original.venue} · Lagos (WAT)</p><p className={styles.lockedLine}><span className={styles.meta}>Session leader · {data.original.leaderName}</span><DashboardIcon name="lock" size={16} /></p></article>
    <p className={styles.info}>Keep learning while your make-up is pending. This missed review stays in your history.</p>
    <fieldset className={styles.offerChoices}><legend>Choose a make-up session</legend><p className={styles.meta}>For {data.original.title}</p>
      {data.offers.length ? data.offers.map(offer => <label key={offer.id} className={`${styles.offerChoice} ${styles.makeUpChoice}`}><span className={styles.makeUpChoiceHeading}><input type="radio" name="make-up-session" checked={selected === offer.id} disabled={saving || data.completed || data.canChoose === false} onChange={() => { setSelected(offer.id); setError(null); }} /><span className={styles.offerTitle}>{new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Lagos",weekday:"short",day:"numeric",month:"short",year:"numeric"}).format(new Date(offer.startsAt))}</span></span><span className={styles.meta}>{new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Lagos",hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(offer.startsAt))}–{new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Lagos",hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(offer.endsAt))} · Lagos (WAT)</span><span className={styles.meta}>{offer.venue} · Leader: {offer.leaderName}</span></label>) : <p className={styles.empty}>{data.completed ? "Your confirmed replacement is retained in your history." : "No make-up session has been offered yet. Your learning continues."}</p>}
    </fieldset>
    <section className={styles.section}><h2>Attendance status</h2><div className={styles.reviewCard}><span className={styles.pill} data-tone={data.completed ? "done" : "todo"}>{data.completed ? "Make-up completed" : "Make-up pending"}</span><p className={styles.meta}>Choosing a session doesn’t confirm attendance. Your group lead confirms it after the review.</p><div className={styles.actions}><Link className={styles.rowLink} href={preview?"/preview/dashboard-v3":"/dashboard/sogp"}>Continue learning<DashboardIcon name="right" size={16} /></Link></div></div></section>
    {error ? <p role="alert" className={styles.error}>{error}</p> : null}
    {data.canChoose === false && !data.completed ? <p className={styles.meta}>Your history is available, but an active accepted group membership is needed to choose a replacement.</p> : null}
    <footer className={styles.footer}><button type="button" className={styles.primary} disabled={preview || saving || data.completed || data.canChoose === false || !data.offers.length || !selected} onClick={save}>{saving ? "Saving…" : "Choose this make-up"}<DashboardIcon name="check" /></button></footer>
  </section>;
}

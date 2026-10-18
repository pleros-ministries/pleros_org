"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { offerReviewMakeup, confirmReviewMakeup } from "@/app/_actions/sogp-group-review-actions";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import { groupReviewTimeLabel } from "@/lib/sogp/group-review";
import type { LeadMakeUpContext } from "@/lib/db/queries/sogp-review-makeups";
import styles from "./group-reviews.module.css";

export function GroupReviewMakeUpOffer({ data }: { data: LeadMakeUpContext }) {
  const eligible = data.sheet.learners.filter(learner=>learner.status==="missed"&&!data.offers.some(offer=>offer.enrollmentId===learner.enrollmentId&&offer.status==="attended"));
  const [learnerId,setLearnerId]=useState(eligible[0]?.enrollmentId??0);
  const [date,setDate]=useState(""),[startTime,setStart]=useState(""),[endTime,setEnd]=useState(""),[venue,setVenue]=useState("");
  const [requestKey,setRequestKey]=useState(()=>crypto.randomUUID());
  const [error,setError]=useState<string|null>(null),[notice,setNotice]=useState("");
  const [saving,startSave]=useTransition();
  const form=useRef<HTMLFormElement>(null);const router=useRouter();
  function offer() {
    if(!learnerId||!date||!startTime||!endTime||!venue.trim()){setError("Choose a learner and complete the replacement date, times and venue.");form.current?.querySelector<HTMLInputElement>('input[data-makeup-field]:placeholder-shown')?.focus();return;}
    startSave(async()=>{try{
      const result=await offerReviewMakeup({reviewId:data.sheet.id,enrollmentId:learnerId,date,startTime,endTime,venue,requestKey});
      if(!result.ok){setError(result.error);return;}
      setError(null);setNotice("Replacement offered. The learner can choose it; attendance is still unconfirmed.");setRequestKey(crypto.randomUUID());router.refresh();
    }catch{setError("The replacement could not be offered. Your details are still here; try again.");}});
  }
  function confirm(makeUpId:number,status:"attended"|"missed") {
    startSave(async()=>{try{
      const result=await confirmReviewMakeup({makeUpId,status});
      if(!result.ok){setError(result.error);return;}
      setError(null);setNotice(status==="attended"?"Replacement attendance confirmed. The original Missed record is retained.":"Replacement marked missed. The learner can choose another offered session.");router.refresh();
    }catch{setError("Replacement attendance could not be saved. Try again.");}});
  }
  return <section className={styles.page}>
    <header className={styles.heading}><h1>Offer a make-up review</h1><p className={styles.meta}>As group lead · {data.sheet.groupName}</p></header>
    <article className={styles.reviewCard}><h2 data-dashboard-learning-title className={styles.attendanceTitle}>{data.sheet.title}</h2><p className={styles.meta}>{data.sheet.groupName}</p><p>{groupReviewTimeLabel(data.sheet.startsAt,data.sheet.endsAt)}</p></article>
    <p className={styles.info}>Each offer replaces this named missed review for one learner. Choosing it does not confirm attendance. Only you, the group lead, confirm after the replacement session.</p>
    {eligible.length ? <form className={styles.section} ref={form} noValidate onSubmit={event=>{event.preventDefault();offer();}}>
      <label className={styles.field}>Learner<select value={learnerId} disabled={saving} onChange={event=>setLearnerId(Number(event.target.value))}>{eligible.map(learner=><option key={learner.enrollmentId} value={learner.enrollmentId}>{learner.name}</option>)}</select></label>
      <label className={styles.field}>Date<input data-makeup-field type="date" value={date} disabled={saving} onChange={event=>setDate(event.target.value)} /></label>
      <div className={styles.times}><label className={styles.field}>Start · Lagos (WAT)<input data-makeup-field type="time" value={startTime} disabled={saving} onChange={event=>setStart(event.target.value)} /></label><label className={styles.field}>End · Lagos (WAT)<input data-makeup-field type="time" value={endTime} disabled={saving} onChange={event=>setEnd(event.target.value)} /></label></div>
      <label className={styles.field}>Venue<input data-makeup-field value={venue} maxLength={300} disabled={saving} onChange={event=>setVenue(event.target.value)} /></label>
      <label className={styles.field}>Session leader<input value={data.sheet.leaderName} readOnly /></label>
      <button className={styles.primary} type="submit" disabled={saving}>{saving?"Saving…":"Offer this replacement"}<DashboardIcon name="arrow" /></button>
    </form> : <p className={styles.empty}>No current learners have an outstanding recorded missed review here.</p>}
    {notice ? <p className={styles.meta} role="status">{notice}</p> : null}{error?<p role="alert" className={styles.error}>{error}</p>:null}
    <section className={styles.section}><h2>Offered replacements</h2>{data.offers.length?data.offers.map(offer=><article key={offer.id} className={styles.reviewCard}>
      <h3>{offer.name}</h3><p>{groupReviewTimeLabel(offer.startsAt,offer.endsAt)}</p><p className={styles.meta}>{offer.venue}</p>
      <span className={styles.pill} data-tone={offer.status==="attended"?"done":offer.status==="offered"?undefined:"todo"}>{offer.status==="attended"?"Make-up completed":offer.status==="missed"?"Replacement missed":offer.status==="chosen"?"Chosen · Unconfirmed":"Offered · not chosen"}</span>
      {offer.status==="chosen"?<div className={styles.attendanceChoices}><button type="button" disabled={saving||new Date(offer.endsAt)>new Date()} onClick={()=>confirm(offer.id,"attended")}>Confirm attended</button><button type="button" disabled={saving||new Date(offer.endsAt)>new Date()} onClick={()=>confirm(offer.id,"missed")}>Confirm missed</button></div>:null}
    </article>):<p className={styles.meta}>No replacements offered yet.</p>}</section>
  </section>;
}

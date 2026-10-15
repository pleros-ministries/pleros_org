import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { getSogpDashboardData } from "./sogp";
import { getOwnSogpLearning } from "./sogp-learning";
import { getActiveSogpJourney } from "./sogp-journey";
import { learningResume } from "@/lib/sogp/learning-view";

/** Facts only. Neither a new eligibility formula nor a certificate issuer. */
export async function getOwnCertificationFacts(userId:string) {
  const [dashboard,state,enrollments]=await Promise.all([
    getSogpDashboardData(userId),getOwnSogpLearning(userId),
    db.select({id:s.sogpEnrollments.id}).from(s.sogpEnrollments).where(eq(s.sogpEnrollments.userId,userId)),
  ]);
  if(!dashboard||!enrollments.length)return null;
  const ids=enrollments.map(row=>row.id);
  const [attendance,makeups,memberships,journey]=await Promise.all([
    db.select({reviewId:s.sogpGroupReviewAttendance.reviewId,enrollmentId:s.sogpGroupReviewAttendance.enrollmentId,status:s.sogpGroupReviewAttendance.status})
      .from(s.sogpGroupReviewAttendance).where(inArray(s.sogpGroupReviewAttendance.enrollmentId,ids)),
    db.select({reviewId:s.sogpReviewMakeups.reviewId,enrollmentId:s.sogpReviewMakeups.enrollmentId})
      .from(s.sogpReviewMakeups).where(and(inArray(s.sogpReviewMakeups.enrollmentId,ids),eq(s.sogpReviewMakeups.status,"attended"))),
    db.select({groupId:s.discipleshipMemberships.groupId,enrollmentId:s.discipleshipMemberships.discipleEnrollmentId,joinedAt:s.discipleshipMemberships.joinedAt,endedAt:s.discipleshipMemberships.endedAt})
      .from(s.discipleshipMemberships).where(inArray(s.discipleshipMemberships.discipleEnrollmentId,ids)),
    getActiveSogpJourney(userId).catch(()=>null),
  ]);
  const attended=attendance.filter(row=>row.status==="attended").length;
  const missed=attendance.filter(row=>row.status==="missed");
  const madeUp=missed.filter(row=>makeups.some(makeup=>makeup.reviewId===row.reviewId&&makeup.enrollmentId===row.enrollmentId)).length;
  // Every review owed: all member groups the learner has belonged to, within each membership window.
  const groupIds=[...new Set(memberships.map(row=>row.groupId))];
  const owedReviews=groupIds.length?(await db.select({id:s.sogpGroupReviews.id,groupId:s.sogpGroupReviews.groupId,startsAt:s.sogpGroupReviews.startsAt})
    .from(s.sogpGroupReviews).where(inArray(s.sogpGroupReviews.groupId,groupIds)).limit(500)).filter(review=>memberships.some(m=>m.groupId===review.groupId&&new Date(m.joinedAt)<=new Date(review.startsAt)&&(m.endedAt==null||new Date(review.startsAt)<=new Date(m.endedAt)))):[];
  const satisfied=new Set(attendance.filter(row=>row.status==="attended").map(row=>`${row.reviewId}:${row.enrollmentId}`));
  for (const row of missed) if (makeups.some(makeup=>makeup.reviewId===row.reviewId&&makeup.enrollmentId===row.enrollmentId)) satisfied.add(`${row.reviewId}:${row.enrollmentId}`);
  const outstanding=owedReviews.filter(review=>!memberships.some(m=>m.groupId===review.groupId&&satisfied.has(`${review.id}:${m.enrollmentId}`)));
  const podcast=state?.path!==undefined&&state.path!=="traditional";
  const listened=new Set(state?.progress.listenedEpisodeGuids??[]);
  const planGuids=[...new Set([...(state?.plan?.episodeGuids??[]),...(state?.plan?.historyEpisodeGuids??[])])];
  // Traditional completion is assessment-based (required tracks), never derived from podcast listens.
  const learningDone=podcast?planGuids.filter(guid=>listened.has(guid)).length:(journey?.progress.coreCompleted??0);
  const learningTotal=podcast?planGuids.length:(journey?.progress.coreTotal??0);
  const learningPass=learningTotal>0&&learningDone>=learningTotal;
  const reviewPass=owedReviews.length>0&&outstanding.length===0;
  const prayerPresent=journey?.progress.prayerCompleted??0;
  const prayerTotal=journey?.progress.prayerTotal??0;
  const prayerPercent=journey?.progress.prayerPercent??0;
  const prayerRequired=dashboard.cohort.assessmentPolicy.requiredPrayerWatchPercent;
  const prayerPass=prayerTotal>0&&prayerPercent>=prayerRequired;
  const next=learningResume(state);
  return {
    pathLabel:podcast?state?.path==="podcast_two"?"Two podcasts a day":"One podcast a day":"Traditional path",
    podcast,learningDone,learningTotal,learningPass,
    learningLabel:podcast?"Episodes listened in your saved plan":"Required assessments complete",
    resumeHref:podcast?next?`/dashboard/sogp/listen?day=${next.dayNumber}`:"/dashboard/sogp/plan":"/dashboard/sogp/traditional",
    reviews:{attended,missed:missed.length,madeUp,outstandingMakeups:missed.length-madeUp,owed:owedReviews.length,outstanding:outstanding.length,reviewPass},
    prayer:{present:prayerPresent,total:prayerTotal,percent:prayerPercent,required:prayerRequired,pass:prayerPass},
    meetsRequirements:learningPass&&reviewPass&&prayerPass,
    certificateAvailable:Boolean(dashboard.certificate&&!dashboard.certificate.revokedAt),
  };
}
export type CertificationFacts=NonNullable<Awaited<ReturnType<typeof getOwnCertificationFacts>>>;

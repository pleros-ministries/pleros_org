import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { getSogpDashboardData } from "./sogp";
import { getOwnSogpLearning } from "./sogp-learning";
import { learningResume } from "@/lib/sogp/learning-view";

/** Facts only. Neither a new eligibility formula nor a certificate issuer. */
export async function getOwnCertificationFacts(userId:string) {
  const [dashboard,state,enrollments]=await Promise.all([
    getSogpDashboardData(userId),getOwnSogpLearning(userId),
    db.select({id:s.sogpEnrollments.id}).from(s.sogpEnrollments).where(eq(s.sogpEnrollments.userId,userId)),
  ]);
  if(!dashboard||!enrollments.length)return null;
  const ids=enrollments.map(row=>row.id);
  const [attendance,makeups]=await Promise.all([
    db.select({reviewId:s.sogpGroupReviewAttendance.reviewId,enrollmentId:s.sogpGroupReviewAttendance.enrollmentId,status:s.sogpGroupReviewAttendance.status})
      .from(s.sogpGroupReviewAttendance).where(inArray(s.sogpGroupReviewAttendance.enrollmentId,ids)),
    db.select({reviewId:s.sogpReviewMakeups.reviewId,enrollmentId:s.sogpReviewMakeups.enrollmentId})
      .from(s.sogpReviewMakeups).where(and(inArray(s.sogpReviewMakeups.enrollmentId,ids),eq(s.sogpReviewMakeups.status,"attended"))),
  ]);
  const attended=attendance.filter(row=>row.status==="attended").length;
  const missed=attendance.filter(row=>row.status==="missed");
  const madeUp=missed.filter(row=>makeups.some(makeup=>makeup.reviewId===row.reviewId&&makeup.enrollmentId===row.enrollmentId)).length;
  const podcast=state?.path!==undefined&&state.path!=="traditional";
  const listened=new Set(state?.progress.listenedEpisodeGuids??[]);
  const planGuids=[...new Set([...(state?.plan?.episodeGuids??[]),...(state?.plan?.historyEpisodeGuids??[])])];
  const published=dashboard.tracks.filter(track=>track.lesson.status==="published");
  const learningDone=podcast?planGuids.filter(guid=>listened.has(guid)).length:published.filter(track=>track.completed).length;
  const learningTotal=podcast?planGuids.length:published.length;
  const next=learningResume(state);
  return {
    pathLabel:podcast?state?.path==="podcast_two"?"Two podcasts a day":"One podcast a day":"Traditional path",
    podcast,learningDone,learningTotal,
    learningLabel:podcast?"Episodes listened in your saved plan":"Published tracks completed",
    resumeHref:podcast?next?`/dashboard/sogp/listen?day=${next.dayNumber}`:"/dashboard/sogp/plan":"/dashboard/sogp/traditional",
    reviews:{attended,missed:missed.length,madeUp,outstandingMakeups:missed.length-madeUp},
    certificateAvailable:Boolean(dashboard.certificate&&!dashboard.certificate.revokedAt),
  };
}
export type CertificationFacts=NonNullable<Awaited<ReturnType<typeof getOwnCertificationFacts>>>;

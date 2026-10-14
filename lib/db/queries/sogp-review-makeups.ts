import "server-only";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { transactionDb } from "@/lib/db/transaction";
import * as s from "@/lib/db/schema";
import { CommunityError } from "@/lib/community/errors";
import { firstNameOf } from "@/lib/community/visibility";
import { parseGroupReviewSchedule } from "@/lib/sogp/group-review";
import { getOwnAttendanceSheet, lockOwnedGroup } from "./sogp-group-reviews";

type Tx = Parameters<Parameters<typeof transactionDb.transaction>[0]>[0];
const pair = (reviewId: number, enrollmentId: number) => and(eq(s.sogpReviewMakeups.reviewId,reviewId),eq(s.sogpReviewMakeups.enrollmentId,enrollmentId));

async function ownMissed(userId: string, reviewId: number) {
  const leader = alias(s.sogpEnrollments,"makeup_original_leader");
  const [row] = await db.select({ id: s.sogpGroupReviews.id, groupId:s.sogpGroupReviews.groupId, title:s.sogpGroupReviews.title, groupName:s.discipleshipGroups.name, startsAt:s.sogpGroupReviews.startsAt, endsAt:s.sogpGroupReviews.endsAt, venue:s.sogpGroupReviews.venue, leaderName:leader.name, enrollmentId:s.sogpEnrollments.id, enrollmentStatus:s.sogpEnrollments.status })
    .from(s.sogpGroupReviewAttendance).innerJoin(s.sogpEnrollments,eq(s.sogpEnrollments.id,s.sogpGroupReviewAttendance.enrollmentId))
    .innerJoin(s.sogpGroupReviews,eq(s.sogpGroupReviews.id,s.sogpGroupReviewAttendance.reviewId))
    .innerJoin(s.discipleshipGroups,eq(s.discipleshipGroups.id,s.sogpGroupReviews.groupId))
    .innerJoin(leader,eq(leader.id,s.discipleshipGroups.leaderEnrollmentId))
    .where(and(eq(s.sogpEnrollments.userId,userId),eq(s.sogpGroupReviews.id,reviewId),eq(s.sogpGroupReviewAttendance.status,"missed")))
    .orderBy(desc(s.sogpEnrollments.createdAt)).limit(1);
  return row ?? null;
}
async function acceptedMembership(tx: Tx, groupId: number, enrollmentId: number) {
  const [member] = await tx.select({ id:s.discipleshipMemberships.id }).from(s.discipleshipMemberships)
    .innerJoin(s.sogpEnrollments,eq(s.sogpEnrollments.id,s.discipleshipMemberships.discipleEnrollmentId))
    .where(and(eq(s.discipleshipMemberships.groupId,groupId),eq(s.discipleshipMemberships.discipleEnrollmentId,enrollmentId),eq(s.discipleshipMemberships.status,"active"),ne(s.sogpEnrollments.status,"withdrawn"))).for("share");
  if (!member) throw new CommunityError("This learner no longer has an active accepted membership in this group.");
}
async function missedForLead(tx: Tx, userId: string, reviewId: number, enrollmentId: number) {
  const [review] = await tx.select().from(s.sogpGroupReviews).where(eq(s.sogpGroupReviews.id,reviewId));
  if (!review) throw new CommunityError("This review is not available.");
  const group = await lockOwnedGroup(tx,userId,review.groupId);
  const [original] = await tx.select().from(s.sogpGroupReviewAttendance).where(and(eq(s.sogpGroupReviewAttendance.reviewId,reviewId),eq(s.sogpGroupReviewAttendance.enrollmentId,enrollmentId))).for("update");
  if (!original || original.status !== "missed" || enrollmentId === group.leaderEnrollmentId) throw new CommunityError("Choose a learner’s recorded missed review.");
  const [target] = await tx.select({ userId:s.sogpEnrollments.userId }).from(s.sogpEnrollments).where(eq(s.sogpEnrollments.id,enrollmentId));
  if (!target || target.userId === userId) throw new CommunityError("Group leads cannot confirm their own review attendance.");
  await acceptedMembership(tx,review.groupId,enrollmentId);
  return review;
}

export async function getOwnMakeUpView(userId: string, reviewId: number) {
  const original = await ownMissed(userId,reviewId);
  if (!original) return null;
  const [[membership], rows] = await Promise.all([
    db.select({ id:s.discipleshipMemberships.id }).from(s.discipleshipMemberships)
      .innerJoin(s.discipleshipGroups,eq(s.discipleshipGroups.id,s.discipleshipMemberships.groupId))
      .where(and(eq(s.discipleshipMemberships.groupId,original.groupId),eq(s.discipleshipMemberships.discipleEnrollmentId,original.enrollmentId),eq(s.discipleshipMemberships.status,"active"),eq(s.discipleshipGroups.status,"active"))).limit(1),
    db.select().from(s.sogpReviewMakeups).where(pair(reviewId,original.enrollmentId)).orderBy(asc(s.sogpReviewMakeups.startsAt)),
  ]);
  const canChoose = Boolean(membership) && original.enrollmentStatus !== "withdrawn";
  return {
    original:{ id:original.id,title:original.title,groupName:original.groupName,startsAt:new Date(original.startsAt).toISOString(),endsAt:new Date(original.endsAt).toISOString(),venue:original.venue,leaderName:firstNameOf(original.leaderName) },
    offers:canChoose ? rows.filter(row=>row.status === "offered" || row.status === "chosen" || row.status === "attended").map(row=>({id:row.id,startsAt:new Date(row.startsAt).toISOString(),endsAt:new Date(row.endsAt).toISOString(),venue:row.venue,leaderName:firstNameOf(original.leaderName)})) : [],
    chosenOfferId:rows.find(row=>row.status === "chosen" || row.status === "attended")?.id ?? null,
    completed:rows.some(row=>row.status === "attended"),canChoose,
  };
}
export async function getLeadMakeUpContext(userId: string, reviewId: number) {
  const sheet = await getOwnAttendanceSheet(userId,reviewId);
  if (!sheet) return null;
  const rows = await db.select().from(s.sogpReviewMakeups).where(eq(s.sogpReviewMakeups.reviewId,reviewId)).orderBy(asc(s.sogpReviewMakeups.startsAt));
  const names = new Map(sheet.learners.map(learner=>[learner.enrollmentId,learner.name]));
  return { sheet, offers:rows.filter(row=>names.has(row.enrollmentId)).map(row=>({id:row.id,name:names.get(row.enrollmentId)!,enrollmentId:row.enrollmentId,startsAt:new Date(row.startsAt).toISOString(),endsAt:new Date(row.endsAt).toISOString(),venue:row.venue,status:row.status})) };
}
export type LeadMakeUpContext = NonNullable<Awaited<ReturnType<typeof getLeadMakeUpContext>>>;

export async function offerOwnReviewMakeUp(userId: string, raw: unknown) {
  if (!raw || typeof raw !== "object") throw new CommunityError("Complete the replacement review details.");
  const input = raw as Record<string,unknown>;
  if (!Number.isSafeInteger(input.reviewId) || !Number.isSafeInteger(input.enrollmentId)) throw new CommunityError("Choose the missed review and learner.");
  return transactionDb.transaction(async tx=>{
    const review = await missedForLead(tx,userId,Number(input.reviewId),Number(input.enrollmentId));
    let details;
    try { details = parseGroupReviewSchedule({...input,groupId:review.groupId,title:review.title},new Date(0)); } catch(error) {throw new CommunityError(error instanceof Error?error.message:"Check the replacement date and venue.");}
    const [old] = await tx.select().from(s.sogpReviewMakeups).where(and(eq(s.sogpReviewMakeups.offeredBy,userId),eq(s.sogpReviewMakeups.requestKey,details.requestKey))).limit(1);
    if (old) {
      if (old.reviewId!==review.id || old.enrollmentId!==input.enrollmentId || old.venue!==details.venue || new Date(old.startsAt).getTime()!==details.startsAt.getTime() || new Date(old.endsAt).getTime()!==details.endsAt.getTime()) throw new CommunityError("This form already offered a different replacement. Refresh the offer list.");
      return {groupId:review.groupId};
    }
    const [complete] = await tx.select({id:s.sogpReviewMakeups.id}).from(s.sogpReviewMakeups).where(and(pair(review.id,Number(input.enrollmentId)),eq(s.sogpReviewMakeups.status,"attended"))).limit(1);
    if (complete) throw new CommunityError("This missed review already has a confirmed replacement.");
    if (details.startsAt <= new Date()) throw new CommunityError("Offer an upcoming replacement session.");
    await tx.insert(s.sogpReviewMakeups).values({reviewId:review.id,enrollmentId:Number(input.enrollmentId),offeredBy:userId,requestKey:details.requestKey,startsAt:details.startsAt,endsAt:details.endsAt,venue:details.venue});
    return {groupId:review.groupId};
  });
}
export async function chooseOwnReviewMakeUp(userId: string, raw: unknown) {
  if (!Number.isSafeInteger(raw) || Number(raw)<1) throw new CommunityError("Choose an offered replacement.");
  const [offer] = await db.select().from(s.sogpReviewMakeups).where(eq(s.sogpReviewMakeups.id,Number(raw))).limit(1);
  if (!offer) throw new CommunityError("This replacement is not available.");
  const own = await ownMissed(userId,offer.reviewId);
  if (!own || own.enrollmentId!==offer.enrollmentId) throw new CommunityError("This replacement is not offered to you.");
  return transactionDb.transaction(async tx=>{
    const [group] = await tx.select().from(s.discipleshipGroups).where(eq(s.discipleshipGroups.id,own.groupId)).for("share");
    if (!group || group.status!=="active") throw new CommunityError("This group is no longer active.");
    const [original] = await tx.select().from(s.sogpGroupReviewAttendance).where(and(eq(s.sogpGroupReviewAttendance.reviewId,own.id),eq(s.sogpGroupReviewAttendance.enrollmentId,own.enrollmentId))).for("update");
    if (!original || original.status!=="missed") throw new CommunityError("This review no longer needs a make-up.");
    await acceptedMembership(tx,own.groupId,own.enrollmentId);
    const rows = await tx.select().from(s.sogpReviewMakeups).where(pair(own.id,own.enrollmentId)).for("update");
    const selected = rows.find(row=>row.id===offer.id),completed=rows.find(row=>row.status==="attended");
    if (completed) {if(completed.id===offer.id)return {groupId:own.groupId};throw new CommunityError("This review already has a confirmed replacement.");}
    if (!selected || selected.status === "missed") throw new CommunityError("Choose an available offered session.");
    if (selected.status !== "chosen") {
      await tx.update(s.sogpReviewMakeups).set({status:"offered"}).where(and(pair(own.id,own.enrollmentId),eq(s.sogpReviewMakeups.status,"chosen")));
      await tx.update(s.sogpReviewMakeups).set({status:"chosen",chosenAt:new Date()}).where(eq(s.sogpReviewMakeups.id,selected.id));
    }
    return {groupId:own.groupId};
  });
}
export async function confirmOwnReviewMakeUp(userId:string,raw:unknown) {
  if (!raw || typeof raw!=="object") throw new CommunityError("Choose the replacement attendance.");
  const input=raw as {makeUpId?:unknown;status?:unknown};
  if (!Number.isSafeInteger(input.makeUpId) || typeof input.status!=="string" || !["attended","missed"].includes(input.status)) throw new CommunityError("Choose Attended or Missed for a replacement.");
  return transactionDb.transaction(async tx=>{
    const [initial]=await tx.select().from(s.sogpReviewMakeups).where(eq(s.sogpReviewMakeups.id,Number(input.makeUpId)));
    if(!initial)throw new CommunityError("This replacement is not available.");
    const review=await missedForLead(tx,userId,initial.reviewId,initial.enrollmentId);
    const [offer]=await tx.select().from(s.sogpReviewMakeups).where(eq(s.sogpReviewMakeups.id,initial.id)).for("update");
    if(offer.status === "attended" || offer.status === "missed") {
      if(offer.status===input.status)return {groupId:review.groupId};
      throw new CommunityError("This replacement attendance is already confirmed. It cannot be changed here.");
    }
    if(offer.status!=="chosen")throw new CommunityError("The learner must choose this offered replacement first.");
    if(new Date(offer.endsAt)>new Date())throw new CommunityError("Confirm replacement attendance after the session ends.");
    await tx.update(s.sogpReviewMakeups).set({status:input.status as "attended"|"missed",confirmedBy:userId,confirmedAt:new Date()}).where(eq(s.sogpReviewMakeups.id,offer.id));
    return {groupId:review.groupId};
  });
}

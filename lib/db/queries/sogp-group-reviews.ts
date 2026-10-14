import "server-only";
import { and, asc, desc, eq, inArray, isNotNull, lte, ne, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { transactionDb } from "@/lib/db/transaction";
import * as s from "@/lib/db/schema";
import { CommunityError } from "@/lib/community/errors";
import { firstNameOf } from "@/lib/community/visibility";
import { parseGroupReviewSchedule } from "@/lib/sogp/group-review";

type ReviewTx = Parameters<Parameters<typeof transactionDb.transaction>[0]>[0];

/** Same owner-row → group lock order as group creation/closure. No role-label bypass. */
export async function lockOwnedGroup(tx: ReviewTx, userId: string, groupId: number) {
  const [initial] = await tx.select({ leaderId: s.discipleshipGroups.leaderEnrollmentId }).from(s.discipleshipGroups).where(eq(s.discipleshipGroups.id, groupId));
  if (!initial) throw new CommunityError("This group is not available.");
  const [owner] = await tx.select({ id: s.sogpEnrollments.id, status: s.sogpEnrollments.status }).from(s.sogpEnrollments)
    .where(and(eq(s.sogpEnrollments.id, initial.leaderId), eq(s.sogpEnrollments.userId, userId))).for("no key update");
  if (!owner || owner.status === "withdrawn") throw new CommunityError("Only this group’s active lead can manage its reviews.");
  const [group] = await tx.select().from(s.discipleshipGroups).where(eq(s.discipleshipGroups.id, groupId)).for("update");
  if (!group || group.status !== "active" || group.leaderEnrollmentId !== owner.id) throw new CommunityError("Paused or closed groups cannot manage reviews.");
  return group;
}

export async function getReviewGroups(userId: string) {
  const leader = alias(s.sogpEnrollments, "review_group_leader");
  const [led, joined] = await Promise.all([
    db.select({ id: s.discipleshipGroups.id, name: s.discipleshipGroups.name, leaderName: s.sogpEnrollments.name })
      .from(s.discipleshipGroups).innerJoin(s.sogpEnrollments, eq(s.sogpEnrollments.id, s.discipleshipGroups.leaderEnrollmentId))
      .where(and(eq(s.sogpEnrollments.userId, userId), ne(s.sogpEnrollments.status, "withdrawn"), eq(s.discipleshipGroups.status, "active"))).orderBy(asc(s.discipleshipGroups.createdAt)),
    db.select({ id: s.discipleshipGroups.id, name: s.discipleshipGroups.name, leaderName: leader.name, joinedAt: s.discipleshipMemberships.joinedAt })
      .from(s.discipleshipMemberships).innerJoin(s.sogpEnrollments, eq(s.sogpEnrollments.id, s.discipleshipMemberships.discipleEnrollmentId))
      .innerJoin(s.discipleshipGroups, eq(s.discipleshipGroups.id, s.discipleshipMemberships.groupId))
      .innerJoin(leader, eq(leader.id, s.discipleshipGroups.leaderEnrollmentId))
      .where(and(eq(s.sogpEnrollments.userId, userId), eq(s.discipleshipMemberships.status, "active"), eq(s.discipleshipGroups.status, "active"))).limit(1),
  ]);
  return [...joined.map(group => ({ ...group, joinedAt: new Date(group.joinedAt).toISOString(), isLeader: false })), ...led.map(group => ({ ...group, joinedAt: null, isLeader: true }))];
}

export async function getGroupReviewView(userId: string, requestedGroupId?: number) {
  const [groups, enrollments] = await Promise.all([getReviewGroups(userId), db.select({ id: s.sogpEnrollments.id }).from(s.sogpEnrollments).where(eq(s.sogpEnrollments.userId, userId))]);
  if (!enrollments.length) return null;
  const group = groups.find(item => item.id === requestedGroupId) ?? groups[0] ?? null;
  const ownAttendance = alias(s.sogpGroupReviewAttendance, "own_review_attendance");
  const leader = alias(s.sogpEnrollments, "list_review_leader");
  const allowed = groups.map(item => item.id);
  const accessible = allowed.length ? or(inArray(s.sogpGroupReviews.groupId, allowed), isNotNull(ownAttendance.enrollmentId)) : isNotNull(ownAttendance.enrollmentId);
  const rows = await db.selectDistinctOn([s.sogpGroupReviews.id], {
    id: s.sogpGroupReviews.id, groupId: s.sogpGroupReviews.groupId, groupName: s.discipleshipGroups.name,
    title: s.sogpGroupReviews.title, venue: s.sogpGroupReviews.venue, startsAt: s.sogpGroupReviews.startsAt, endsAt: s.sogpGroupReviews.endsAt,
    leaderName: leader.firstName, leaderFullName: leader.name, attendance: ownAttendance.status, attendanceEnrollmentId: ownAttendance.enrollmentId,
  }).from(s.sogpGroupReviews)
    .innerJoin(s.discipleshipGroups, eq(s.discipleshipGroups.id, s.sogpGroupReviews.groupId))
    .innerJoin(leader, eq(leader.id, s.discipleshipGroups.leaderEnrollmentId))
    .leftJoin(ownAttendance, and(eq(ownAttendance.reviewId, s.sogpGroupReviews.id), inArray(ownAttendance.enrollmentId, enrollments.map(item => item.id))))
    .where(and(accessible, requestedGroupId ? eq(s.sogpGroupReviews.groupId, requestedGroupId) : group ? eq(s.sogpGroupReviews.groupId, group.id) : undefined))
    .orderBy(desc(s.sogpGroupReviews.id), desc(ownAttendance.confirmedAt)).limit(100);
  const madeUp = rows.length ? await db.select({reviewId:s.sogpReviewMakeups.reviewId,enrollmentId:s.sogpReviewMakeups.enrollmentId}).from(s.sogpReviewMakeups)
    .where(and(inArray(s.sogpReviewMakeups.reviewId,rows.map(row=>row.id)),inArray(s.sogpReviewMakeups.enrollmentId,enrollments.map(row=>row.id)),eq(s.sogpReviewMakeups.status,"attended"))) : [];
  return {
    groups, group,
    reviews: rows.filter(row => {
      const membership = groups.find(item => item.id === row.groupId);
      return row.attendance || membership?.isLeader || membership?.joinedAt && new Date(membership.joinedAt) <= new Date(row.startsAt);
    }).map(row => ({ ...row, makeUpCompleted:row.attendance==="missed"&&madeUp.some(makeUp=>makeUp.reviewId===row.id&&makeUp.enrollmentId===row.attendanceEnrollmentId), attendanceEnrollmentId: undefined, leaderName: firstNameOf(row.leaderName || row.leaderFullName), leaderFullName: undefined, startsAt: new Date(row.startsAt).toISOString(), endsAt: new Date(row.endsAt).toISOString(), canConfirm: groups.some(item => item.id === row.groupId && item.isLeader) })),
  };
}
export type GroupReviewView = NonNullable<Awaited<ReturnType<typeof getGroupReviewView>>>;

export async function scheduleOwnGroupReview(userId: string, raw: unknown) {
  let input;
  try { input = parseGroupReviewSchedule(raw, new Date(0)); } catch (error) { throw new CommunityError(error instanceof Error ? error.message : "Check your review details."); }
  return transactionDb.transaction(async tx => {
    await lockOwnedGroup(tx, userId, input.groupId);
    const [existing] = await tx.select().from(s.sogpGroupReviews).where(and(eq(s.sogpGroupReviews.scheduledBy, userId), eq(s.sogpGroupReviews.requestKey, input.requestKey))).limit(1);
    if (existing) {
      if (existing.groupId !== input.groupId || existing.title !== input.title || existing.venue !== input.venue || new Date(existing.startsAt).getTime() !== input.startsAt.getTime() || new Date(existing.endsAt).getTime() !== input.endsAt.getTime()) throw new CommunityError("This form already scheduled a different review. Open the group’s review list.");
      return { groupId: existing.groupId };
    }
    if (input.startsAt <= new Date()) throw new CommunityError("Choose an upcoming review date and time.");
    await tx.insert(s.sogpGroupReviews).values({ ...input, scheduledBy: userId });
    return { groupId: input.groupId };
  });
}

export async function getOwnAttendanceSheet(userId: string, reviewId: number) {
  const [review] = await db.select({ id: s.sogpGroupReviews.id, title: s.sogpGroupReviews.title, groupName: s.discipleshipGroups.name, groupId: s.discipleshipGroups.id, startsAt: s.sogpGroupReviews.startsAt, endsAt: s.sogpGroupReviews.endsAt, venue: s.sogpGroupReviews.venue, leaderName: s.sogpEnrollments.name })
    .from(s.sogpGroupReviews).innerJoin(s.discipleshipGroups, eq(s.discipleshipGroups.id, s.sogpGroupReviews.groupId))
    .innerJoin(s.sogpEnrollments, eq(s.sogpEnrollments.id, s.discipleshipGroups.leaderEnrollmentId))
    .where(and(eq(s.sogpGroupReviews.id, reviewId), eq(s.sogpEnrollments.userId, userId), ne(s.sogpEnrollments.status, "withdrawn"), eq(s.discipleshipGroups.status, "active"))).limit(1);
  if (!review) return null;
  const learners = await db.select({ enrollmentId: s.sogpEnrollments.id, firstName: s.sogpEnrollments.firstName, name: s.sogpEnrollments.name, path: s.sogpLearningPreferences.path, status: s.sogpGroupReviewAttendance.status })
    .from(s.discipleshipMemberships).innerJoin(s.sogpEnrollments, eq(s.sogpEnrollments.id, s.discipleshipMemberships.discipleEnrollmentId))
    .leftJoin(s.sogpLearningPreferences, eq(s.sogpLearningPreferences.userId, s.sogpEnrollments.userId))
    .leftJoin(s.sogpGroupReviewAttendance, and(eq(s.sogpGroupReviewAttendance.reviewId, review.id), eq(s.sogpGroupReviewAttendance.enrollmentId, s.sogpEnrollments.id)))
    .where(and(eq(s.discipleshipMemberships.groupId, review.groupId), eq(s.discipleshipMemberships.status, "active"), or(lte(s.discipleshipMemberships.joinedAt, review.startsAt),isNotNull(s.sogpGroupReviewAttendance.enrollmentId)), ne(s.sogpEnrollments.userId, userId))).orderBy(asc(s.sogpEnrollments.firstName));
  return { ...review, startsAt: new Date(review.startsAt).toISOString(), endsAt: new Date(review.endsAt).toISOString(), learners: learners.map(row => ({ enrollmentId: row.enrollmentId, name: firstNameOf(row.firstName || row.name), path: row.path ?? "traditional", status: row.status })) };
}
export type GroupAttendanceSheet = NonNullable<Awaited<ReturnType<typeof getOwnAttendanceSheet>>>;

/** First confirmations only; unmarked people stay unconfirmed, never auto-missed. */
export async function confirmOwnGroupAttendance(userId: string, raw: unknown) {
  if (!raw || typeof raw !== "object") throw new CommunityError("Choose the attendance to confirm.");
  const input = raw as { reviewId?: unknown; marks?: unknown };
  if (!Number.isSafeInteger(input.reviewId) || Number(input.reviewId) < 1 || !Array.isArray(input.marks) || !input.marks.length || input.marks.length > 12) throw new CommunityError("Select at least one learner to confirm.");
  const marks = input.marks.map(value => {
    if (!value || typeof value !== "object" || !Number.isSafeInteger(value.enrollmentId) || value.enrollmentId < 1 || !["attended", "missed"].includes(value.status)) throw new CommunityError("Choose Attended or Missed for an available learner.");
    return { enrollmentId: value.enrollmentId as number, status: value.status as "attended" | "missed" };
  });
  if (new Set(marks.map(mark => mark.enrollmentId)).size !== marks.length) throw new CommunityError("Each learner can be included only once.");
  return transactionDb.transaction(async tx => {
    const [initial] = await tx.select().from(s.sogpGroupReviews).where(eq(s.sogpGroupReviews.id, Number(input.reviewId)));
    if (!initial) throw new CommunityError("This review is not available.");
    await lockOwnedGroup(tx, userId, initial.groupId);
    const [review] = await tx.select().from(s.sogpGroupReviews).where(eq(s.sogpGroupReviews.id, initial.id)).for("update");
    if (new Date(review.endsAt) > new Date()) throw new CommunityError("Confirm attendance after the review has taken place.");
    const eligible = await tx.select({ id: s.sogpEnrollments.id }).from(s.discipleshipMemberships)
      .innerJoin(s.sogpEnrollments, eq(s.sogpEnrollments.id, s.discipleshipMemberships.discipleEnrollmentId))
      .where(and(eq(s.discipleshipMemberships.groupId, review.groupId), eq(s.discipleshipMemberships.status, "active"), lte(s.discipleshipMemberships.joinedAt, review.startsAt), ne(s.sogpEnrollments.userId, userId), inArray(s.sogpEnrollments.id, marks.map(mark => mark.enrollmentId)))).for("share");
    if (eligible.length !== marks.length) throw new CommunityError("Only the review’s current group learners can be confirmed. Learners cannot confirm their own review.");
    for (const mark of marks) {
      const [existing] = await tx.select({ status: s.sogpGroupReviewAttendance.status }).from(s.sogpGroupReviewAttendance).where(and(eq(s.sogpGroupReviewAttendance.reviewId, review.id), eq(s.sogpGroupReviewAttendance.enrollmentId, mark.enrollmentId)));
      if (existing && existing.status !== mark.status) throw new CommunityError("This attendance is already confirmed. It cannot be changed here.");
      if (!existing) await tx.insert(s.sogpGroupReviewAttendance).values({ reviewId: review.id, ...mark, confirmedBy: userId });
    }
    return { groupId: review.groupId };
  });
}

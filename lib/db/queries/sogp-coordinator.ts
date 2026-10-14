import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { transactionDb } from "@/lib/db/transaction";
import * as s from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/require-role";
import { CommunityError } from "@/lib/community/errors";

/**
 * SOGP coordinator (existing admins) read models for Paper's control centre
 * and enrollee details. Follow-up ownership only: no church appointments or
 * group membership are read or changed here.
 */
const owner = alias(s.users, "coordinator_owner");
const referrer = alias(s.users, "coordinator_referrer");
const referrerEnrollment = alias(s.sogpEnrollments, "coordinator_referrer_enrollment");

export type CoordinatorRow = {
  enrollmentId: number; name: string; cohortTitle: string; region: string; createdAt: string;
  source: "code" | "link" | "geography" | null; ownerName: string | null; ownerId: string | null; requested: boolean;
};

export async function listCoordinatorEnrollees(): Promise<CoordinatorRow[]> {
  await requireAdmin();
  // Correlated outer refs stay raw text (see sogp-follow-up-requests.ts): an
  // interpolated outer column can render bare and bind to the inner table.
  const pending = sql<boolean>`exists (select 1 from ${s.sogpFollowUpRequests} as r where r.enrollment_id = sogp_enrollments.id and r.status = 'pending')`;
  const rows = await db.select({
    enrollmentId: s.sogpEnrollments.id, name: s.sogpEnrollments.name, cohortTitle: s.sogpCohorts.title, region: s.sogpEnrollments.region, createdAt: s.sogpEnrollments.createdAt,
    source: s.sogpFollowUpRoutes.source, ownerName: owner.name, ownerId: s.pastorAssignments.pastorUserId, requested: pending,
  }).from(s.sogpEnrollments)
    .innerJoin(s.sogpCohorts, eq(s.sogpCohorts.id, s.sogpEnrollments.cohortId))
    .leftJoin(s.pastorAssignments, eq(s.pastorAssignments.enrollmentId, s.sogpEnrollments.id))
    .leftJoin(owner, eq(owner.id, s.pastorAssignments.pastorUserId))
    .leftJoin(s.sogpFollowUpRoutes, eq(s.sogpFollowUpRoutes.enrollmentId, s.sogpEnrollments.id))
    .where(sql`${s.sogpEnrollments.status} <> 'withdrawn'`)
    .orderBy(desc(s.sogpEnrollments.createdAt)).limit(1000);
  return rows.map(row => ({ ...row, region: row.region ?? "", createdAt: new Date(row.createdAt).toISOString() }));
}

export type CoordinatorHistoryItem = { at: string; title: string; detail: string };
export async function getCoordinatorEnrollee(enrollmentId: number) {
  await requireAdmin();
  const [row] = await db.select({
    enrollmentId: s.sogpEnrollments.id, name: s.sogpEnrollments.name, cohortTitle: s.sogpCohorts.title, region: s.sogpEnrollments.region, country: s.sogpEnrollments.country,
    createdAt: s.sogpEnrollments.createdAt, ownerName: owner.name, ownerId: s.pastorAssignments.pastorUserId, assignedAt: s.pastorAssignments.assignedAt,
    lastContactedAt: s.pastorAssignments.lastContactedAt, source: s.sogpFollowUpRoutes.source, routeOwnerId: s.sogpFollowUpRoutes.ownerUserId,
    routeAt: s.sogpFollowUpRoutes.createdAt, choice: s.sogpFollowUpRoutes.choice, chosenAt: s.sogpFollowUpRoutes.chosenAt, referrerName: referrer.name,
  }).from(s.sogpEnrollments)
    .innerJoin(s.sogpCohorts, eq(s.sogpCohorts.id, s.sogpEnrollments.cohortId))
    .leftJoin(s.pastorAssignments, eq(s.pastorAssignments.enrollmentId, s.sogpEnrollments.id))
    .leftJoin(owner, eq(owner.id, s.pastorAssignments.pastorUserId))
    .leftJoin(s.sogpFollowUpRoutes, eq(s.sogpFollowUpRoutes.enrollmentId, s.sogpEnrollments.id))
    .leftJoin(referrerEnrollment, eq(referrerEnrollment.id, s.sogpEnrollments.referredByEnrollmentId))
    .leftJoin(referrer, eq(referrer.id, referrerEnrollment.userId))
    .where(eq(s.sogpEnrollments.id, enrollmentId)).limit(1);
  if (!row) return null;
  const requests = await db.select({ id: s.sogpFollowUpRequests.id, reason: s.sogpFollowUpRequests.reason, status: s.sogpFollowUpRequests.status, createdAt: s.sogpFollowUpRequests.createdAt, reviewedAt: s.sogpFollowUpRequests.reviewedAt })
    .from(s.sogpFollowUpRequests).where(eq(s.sogpFollowUpRequests.enrollmentId, enrollmentId)).orderBy(desc(s.sogpFollowUpRequests.createdAt)).limit(20);
  const iso = (value: Date | string | null) => value ? new Date(value).toISOString() : null;
  const sourceLabel = row.source === "code" ? "Referral code" : row.source === "link" ? "Referral link" : row.source === "geography" ? "Assigned by location" : null;
  const history: CoordinatorHistoryItem[] = [];
  if (row.routeAt && sourceLabel) history.push({ at: iso(row.routeAt)!, title: "Follow-up assigned", detail: sourceLabel });
  if (row.chosenAt && row.choice === "accepted") history.push({ at: iso(row.chosenAt)!, title: "Accepted their follow-up person", detail: "Referral link choice" });
  for (const request of [...requests].reverse()) {
    history.push({ at: iso(request.createdAt)!, title: "Requested someone else", detail: request.status === "pending" ? "Awaiting review" : request.status === "resolved" ? "Approved" : "Declined" });
    if (request.reviewedAt) history.push({ at: iso(request.reviewedAt)!, title: request.status === "resolved" ? "Owner changed" : "Request declined", detail: "Reviewed by a coordinator" });
  }
  if (row.assignedAt && row.routeOwnerId !== row.ownerId) history.push({ at: iso(row.assignedAt)!, title: `Assigned to ${row.ownerName ?? "an owner"}`, detail: "Coordinator assignment" });
  history.sort((a, b) => a.at.localeCompare(b.at));
  const pending = requests.find(request => request.status === "pending");
  return {
    enrollmentId: row.enrollmentId, name: row.name, cohortTitle: row.cohortTitle, place: [row.region, row.country].filter(Boolean).join(", "),
    joinedAt: iso(row.createdAt)!, ownerName: row.ownerName, ownerId: row.ownerId, lastContactedAt: iso(row.lastContactedAt),
    sourceLabel: sourceLabel ?? (row.ownerId ? "Assigned" : null), referrerName: row.referrerName, history,
    pendingRequest: pending ? { id: pending.id, reason: pending.reason, createdAt: iso(pending.createdAt)! } : null,
  };
}
export type CoordinatorEnrollee = NonNullable<Awaited<ReturnType<typeof getCoordinatorEnrollee>>>;

/** Direct admin owner change, using the same eligibility as request approval. Never touches membership. */
export async function changeFollowUpOwner(input: { enrollmentId: number; ownerUserId: string; expectedOwnerId: string | null }) {
  const session = await requireAdmin();
  await transactionDb.transaction(async tx => {
    const [enrollment] = await tx.select({ status: s.sogpEnrollments.status, userId: s.sogpEnrollments.userId }).from(s.sogpEnrollments).where(eq(s.sogpEnrollments.id, input.enrollmentId)).for("update");
    if (!enrollment || enrollment.status === "withdrawn") throw new CommunityError("This enrolment can no longer be reassigned.");
    if (enrollment.userId === input.ownerUserId) throw new CommunityError("A learner cannot follow themselves up.");
    const [candidate] = await tx.select({ id: s.users.id }).from(s.users).where(and(eq(s.users.id, input.ownerUserId), sql`(${s.users.role} = 'pastor' or ${s.users.isPastor} or exists (select 1 from ${s.sogpEnrollments} as e where e.user_id = users.id and e.status <> 'withdrawn'))`));
    if (!candidate) throw new CommunityError("Choose an existing eligible follow-up person.");
    const [current] = await tx.select({ ownerId: s.pastorAssignments.pastorUserId }).from(s.pastorAssignments).where(eq(s.pastorAssignments.enrollmentId, input.enrollmentId)).for("update");
    if ((current?.ownerId ?? null) !== input.expectedOwnerId) throw new CommunityError("The assignment changed while you were reviewing. Refresh and try again.");
    if (current?.ownerId === candidate.id) throw new CommunityError("Choose a different follow-up person.");
    await tx.insert(s.pastorAssignments).values({ enrollmentId: input.enrollmentId, pastorUserId: candidate.id, assignedBy: session.user.id })
      .onConflictDoUpdate({ target: s.pastorAssignments.enrollmentId, set: { pastorUserId: candidate.id, assignedBy: session.user.id, assignedAt: new Date() } });
  });
}

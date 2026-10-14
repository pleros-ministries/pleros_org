import "server-only";
import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import { transactionDb } from "@/lib/db/transaction";
import * as s from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/require-role";
import { CommunityError } from "@/lib/community/errors";

async function ownEnrollment(userId: string) {
  const [enrollment] = await db.select({ id: s.sogpEnrollments.id, status: s.sogpEnrollments.status })
    .from(s.sogpEnrollments).where(eq(s.sogpEnrollments.userId, userId))
    .orderBy(desc(s.sogpEnrollments.createdAt)).limit(1);
  return enrollment ?? null;
}

export async function getOwnFollowUpView(userId: string) {
  const enrollment = await ownEnrollment(userId);
  if (!enrollment) return null;
  const [[owner], [request]] = await Promise.all([
    db.select({ name: s.users.name }).from(s.pastorAssignments)
      .innerJoin(s.users, eq(s.users.id, s.pastorAssignments.pastorUserId))
      .where(eq(s.pastorAssignments.enrollmentId, enrollment.id)).limit(1),
    db.select({ reason: s.sogpFollowUpRequests.reason, status: s.sogpFollowUpRequests.status, createdAt: s.sogpFollowUpRequests.createdAt })
      .from(s.sogpFollowUpRequests).where(eq(s.sogpFollowUpRequests.enrollmentId, enrollment.id))
      .orderBy(desc(s.sogpFollowUpRequests.createdAt), desc(s.sogpFollowUpRequests.id)).limit(1),
  ]);
  return {
    currentName: owner?.name ?? null,
    canRequest: enrollment.status !== "withdrawn",
    request: request ? { ...request, createdAt: new Date(request.createdAt).toISOString() } : null,
  };
}
export type FollowUpView = NonNullable<Awaited<ReturnType<typeof getOwnFollowUpView>>>;

/** Actor/enrolment are derived from the session, never supplied by the form. */
export async function createOwnFollowUpRequest(userId: string, rawReason: unknown) {
  if (typeof rawReason !== "string" || !rawReason.trim()) throw new CommunityError("Tell us what would help with your follow-up.");
  const reason = rawReason.trim();
  if (reason.length > 2000) throw new CommunityError("Keep your reason within 2,000 characters.");
  const own = await ownEnrollment(userId);
  if (!own) throw new CommunityError("An SOGP enrolment is required.");
  await transactionDb.transaction(async tx => {
    const [enrollment] = await tx.select({ id: s.sogpEnrollments.id, status: s.sogpEnrollments.status })
      .from(s.sogpEnrollments).where(and(eq(s.sogpEnrollments.id, own.id), eq(s.sogpEnrollments.userId, userId))).for("update");
    if (!enrollment || enrollment.status === "withdrawn") throw new CommunityError("This enrolment cannot send a follow-up request.");
    const [pending] = await tx.select({ id: s.sogpFollowUpRequests.id }).from(s.sogpFollowUpRequests)
      .where(and(eq(s.sogpFollowUpRequests.enrollmentId, enrollment.id), eq(s.sogpFollowUpRequests.status, "pending"))).limit(1);
    if (pending) return; // Retry/double click retains the original request.
    const [owner] = await tx.select({ id: s.pastorAssignments.pastorUserId }).from(s.pastorAssignments)
      .where(eq(s.pastorAssignments.enrollmentId, enrollment.id)).limit(1);
    await tx.insert(s.sogpFollowUpRequests).values({ enrollmentId: enrollment.id, previousFollowUpUserId: owner?.id ?? null, reason });
  });
  // A link arrival's "Request someone else" choice is this request. Outside the
  // request transaction so a database without 0059 still accepts requests.
  await db.update(s.sogpFollowUpRoutes).set({ choice: "requested", chosenAt: new Date() })
    .where(and(eq(s.sogpFollowUpRoutes.enrollmentId, own.id), eq(s.sogpFollowUpRoutes.source, "link"), sql`${s.sogpFollowUpRoutes.choice} is null`))
    .catch(error => console.error("Follow-up route choice update failed:", error));
}

/** Existing admins only; no request reasons reach pastors or church leaders. */
export async function listFollowUpRequests() {
  await requireAdmin();
  const owner = alias(s.users, "request_current_owner");
  const rows = await db.select({
    id: s.sogpFollowUpRequests.id, reason: s.sogpFollowUpRequests.reason, createdAt: s.sogpFollowUpRequests.createdAt,
    learnerName: s.sogpEnrollments.name, currentOwnerName: owner.name,
  }).from(s.sogpFollowUpRequests)
    .innerJoin(s.sogpEnrollments, eq(s.sogpEnrollments.id, s.sogpFollowUpRequests.enrollmentId))
    .leftJoin(s.pastorAssignments, eq(s.pastorAssignments.enrollmentId, s.sogpEnrollments.id))
    .leftJoin(owner, eq(owner.id, s.pastorAssignments.pastorUserId))
    .where(eq(s.sogpFollowUpRequests.status, "pending")).orderBy(asc(s.sogpFollowUpRequests.createdAt)).limit(100);
  return rows.map(row => ({ ...row, createdAt: new Date(row.createdAt).toISOString() }));
}
export type FollowUpQueueRow = Awaited<ReturnType<typeof listFollowUpRequests>>[number];

export async function resolveFollowUpRequest(input: { requestId: number; decision: "approve" | "decline"; replacementUserId?: string }) {
  const session = await requireAdmin();
  if (!Number.isSafeInteger(input.requestId) || input.requestId < 1 || !["approve", "decline"].includes(input.decision)) throw new CommunityError("Choose an available request and decision.");
  await transactionDb.transaction(async tx => {
    const [request] = await tx.select().from(s.sogpFollowUpRequests).where(eq(s.sogpFollowUpRequests.id, input.requestId)).for("update");
    if (!request) throw new CommunityError("This request is no longer available.");
    if (request.status !== "pending") throw new CommunityError("This request has already been reviewed. Refresh the queue.");
    if (input.decision === "approve") {
      const [enrollment] = await tx.select({ status: s.sogpEnrollments.status }).from(s.sogpEnrollments).where(eq(s.sogpEnrollments.id, request.enrollmentId)).for("update");
      if (!enrollment || enrollment.status === "withdrawn") throw new CommunityError("This enrolment can no longer be reassigned.");
      if (!input.replacementUserId || input.replacementUserId === request.previousFollowUpUserId) throw new CommunityError("Choose a different follow-up person.");
      const [candidate] = await tx.select({ id: s.users.id }).from(s.users).where(and(eq(s.users.id, input.replacementUserId), or(eq(s.users.role, "pastor"), eq(s.users.isPastor, true)))).for("share");
      if (!candidate) throw new CommunityError("Choose an existing eligible follow-up person.");
      const [current] = await tx.select({ ownerId: s.pastorAssignments.pastorUserId }).from(s.pastorAssignments).where(eq(s.pastorAssignments.enrollmentId, request.enrollmentId)).for("update");
      if ((current?.ownerId ?? null) !== request.previousFollowUpUserId) throw new CommunityError("The assignment changed after this request. Refresh and review the current assignment before proceeding.");
      const changed = await tx.insert(s.pastorAssignments).values({ enrollmentId: request.enrollmentId, pastorUserId: candidate.id, assignedBy: session.user.id })
        .onConflictDoUpdate({ target: s.pastorAssignments.enrollmentId, set: { pastorUserId: candidate.id, assignedBy: session.user.id, assignedAt: new Date() }, setWhere: request.previousFollowUpUserId ? eq(s.pastorAssignments.pastorUserId, request.previousFollowUpUserId) : sql`false` })
        .returning({ id: s.pastorAssignments.id });
      if (!changed.length) throw new CommunityError("The assignment changed while reviewing. Refresh and try again.");
    }
    await tx.update(s.sogpFollowUpRequests).set({ status: input.decision === "approve" ? "resolved" : "declined", reviewedBy: session.user.id, reviewedAt: new Date() }).where(eq(s.sogpFollowUpRequests.id, request.id));
  });
}

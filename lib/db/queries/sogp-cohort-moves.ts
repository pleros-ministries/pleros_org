import { and, asc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { transactionDb } from "@/lib/db/transaction";
import { formatCohortDates } from "@/lib/sogp/cohort-dates";
import {
  getCohortMoveBlocker,
  type CohortMoveBlocker,
  type CohortMoveResponse,
  type CohortMoveState,
  type CohortMoveTarget,
} from "@/lib/sogp/cohort-move";

import { getOpenSogpCohort } from "./sogp";

/**
 * The cohort staff can move enrollees into: the one a new learner would be
 * enrolled in today. Cohort `status` alone can't tell cohorts apart — a
 * running cohort may still say `enrollment_open` — so this follows the
 * enrolment window, exactly as public enrolment does.
 */
export async function getCohortMoveTarget(): Promise<CohortMoveTarget | null> {
  const cohort = await getOpenSogpCohort();
  if (!cohort) return null;

  return {
    id: cohort.id,
    title: cohort.title,
    startsAt: cohort.startsAt.toISOString(),
    datesLabel: formatCohortDates(cohort.startsAt, cohort.endsAt),
  };
}

/**
 * Where each enrolment stands on the move, keyed by enrolment id: asked or
 * declined for the current target, otherwise the move that brought it into
 * the cohort it is in now. Enrolments nobody has asked are absent.
 */
export async function getCohortMoveStates(filter: {
  targetCohortId: number | null;
  pastorUserId?: string;
  enrollmentId?: number;
}): Promise<Record<number, CohortMoveState>> {
  const transfers = schema.sogpCohortTransfers;
  const rows = await db
    .select({
      enrollmentId: transfers.enrollmentId,
      status: transfers.status,
      askedAt: transfers.askedAt,
      resolvedAt: transfers.resolvedAt,
      fromCohortTitle: schema.sogpCohorts.title,
    })
    .from(transfers)
    .innerJoin(schema.sogpEnrollments, eq(schema.sogpEnrollments.id, transfers.enrollmentId))
    .innerJoin(schema.sogpCohorts, eq(schema.sogpCohorts.id, transfers.fromCohortId))
    .where(
      and(
        or(
          and(
            eq(transfers.status, "moved"),
            eq(transfers.toCohortId, schema.sogpEnrollments.cohortId),
          ),
          filter.targetCohortId != null
            ? and(ne(transfers.status, "moved"), eq(transfers.toCohortId, filter.targetCohortId))
            : undefined,
        ),
        filter.enrollmentId != null ? eq(transfers.enrollmentId, filter.enrollmentId) : undefined,
        filter.pastorUserId
          ? inArray(
              transfers.enrollmentId,
              db
                .select({ enrollmentId: schema.pastorAssignments.enrollmentId })
                .from(schema.pastorAssignments)
                .where(eq(schema.pastorAssignments.pastorUserId, filter.pastorUserId)),
            )
          : undefined,
      ),
    );

  const states: Record<number, CohortMoveState> = {};
  for (const row of rows) {
    // An open question about the current target outranks an older move.
    if (row.status === "moved" && states[row.enrollmentId]) continue;
    states[row.enrollmentId] = {
      status: row.status,
      at: new Date(
        row.status === "asked" ? row.askedAt : (row.resolvedAt ?? row.askedAt),
      ).toISOString(),
      fromCohortTitle: row.fromCohortTitle,
    };
  }
  return states;
}

/**
 * Record that enrollees were asked about the target cohort or declined it, or
 * clear that with null. Never touches a completed move.
 */
export async function setCohortMoveResponses(input: {
  enrollmentIds: number[];
  targetCohortId: number;
  response: CohortMoveResponse | null;
  actorId: string;
}): Promise<number> {
  const { enrollmentIds, targetCohortId, response, actorId } = input;
  if (!enrollmentIds.length) return 0;
  const transfers = schema.sogpCohortTransfers;

  if (response === null) {
    const cleared = await db
      .delete(transfers)
      .where(
        and(
          inArray(transfers.enrollmentId, enrollmentIds),
          eq(transfers.toCohortId, targetCohortId),
          ne(transfers.status, "moved"),
        ),
      )
      .returning({ id: transfers.id });
    return cleared.length;
  }

  const enrollments = await db
    .select({ id: schema.sogpEnrollments.id, cohortId: schema.sogpEnrollments.cohortId })
    .from(schema.sogpEnrollments)
    .where(
      and(
        inArray(schema.sogpEnrollments.id, enrollmentIds),
        ne(schema.sogpEnrollments.cohortId, targetCohortId),
      ),
    );
  if (!enrollments.length) return 0;

  const now = new Date();
  const declined = response === "declined";
  const saved = await db
    .insert(transfers)
    .values(
      enrollments.map((enrollment) => ({
        enrollmentId: enrollment.id,
        fromCohortId: enrollment.cohortId,
        toCohortId: targetCohortId,
        status: response,
        askedBy: actorId,
        askedAt: now,
        resolvedBy: declined ? actorId : null,
        resolvedAt: declined ? now : null,
      })),
    )
    .onConflictDoUpdate({
      target: [transfers.enrollmentId, transfers.toCohortId],
      set: declined
        ? { status: "declined", resolvedBy: actorId, resolvedAt: now }
        : { status: "asked", askedBy: actorId, askedAt: now, resolvedBy: null, resolvedAt: null },
      setWhere: ne(transfers.status, "moved"),
    })
    .returning({ id: transfers.id });
  return saved.length;
}

export type CohortMoveResult = {
  moved: Array<{ enrollmentId: number; name: string; email: string }>;
  skipped: Array<{ enrollmentId: number; name: string; reason: CohortMoveBlocker }>;
};

/**
 * Move enrolments into the target cohort in place, atomically. Everything
 * hanging off the enrolment (pastor, unit, Fullness tag, referral code,
 * discipleship) comes along. Pre-SOGP ticks are dropped because they point at
 * the old cohort's days and would otherwise count as progress in the new one;
 * the leaderboard alias is per cohort, so it is cleared too. Enrolments that
 * cannot move are reported back rather than failing the batch.
 */
export async function moveEnrollmentsToCohort(input: {
  enrollmentIds: number[];
  targetCohortId: number;
  movedBy: string;
}): Promise<CohortMoveResult> {
  const { enrollmentIds, targetCohortId, movedBy } = input;
  if (!enrollmentIds.length) return { moved: [], skipped: [] };

  return transactionDb.transaction(async (tx) => {
    const [target] = await tx
      .select({ id: schema.sogpCohorts.id, startsAt: schema.sogpCohorts.startsAt })
      .from(schema.sogpCohorts)
      .where(eq(schema.sogpCohorts.id, targetCohortId))
      .limit(1);
    if (!target) throw new Error("Target cohort not found.");

    const candidates = await tx
      .select({
        enrollmentId: schema.sogpEnrollments.id,
        userId: schema.sogpEnrollments.userId,
        name: schema.sogpEnrollments.name,
        email: schema.sogpEnrollments.email,
        cohortId: schema.sogpEnrollments.cohortId,
        status: schema.sogpEnrollments.status,
        cohortStartsAt: schema.sogpCohorts.startsAt,
      })
      .from(schema.sogpEnrollments)
      .innerJoin(schema.sogpCohorts, eq(schema.sogpCohorts.id, schema.sogpEnrollments.cohortId))
      .where(inArray(schema.sogpEnrollments.id, enrollmentIds))
      .orderBy(asc(schema.sogpEnrollments.id))
      .for("update", { of: schema.sogpEnrollments });

    const result: CohortMoveResult = { moved: [], skipped: [] };
    const found = new Set(candidates.map((row) => row.enrollmentId));
    for (const enrollmentId of enrollmentIds) {
      if (!found.has(enrollmentId)) {
        result.skipped.push({ enrollmentId, name: "", reason: "not_found" });
      }
    }
    if (!candidates.length) return result;

    const certified = await tx
      .select({ enrollmentId: schema.sogpCertificates.enrollmentId })
      .from(schema.sogpCertificates)
      .where(
        and(
          inArray(schema.sogpCertificates.enrollmentId, [...found]),
          isNull(schema.sogpCertificates.revokedAt),
        ),
      );
    // One enrolment per user and per email in a cohort (unique indexes).
    const taken = await tx
      .select({ userId: schema.sogpEnrollments.userId, email: schema.sogpEnrollments.email })
      .from(schema.sogpEnrollments)
      .where(
        and(
          eq(schema.sogpEnrollments.cohortId, target.id),
          or(
            inArray(
              schema.sogpEnrollments.userId,
              candidates.map((row) => row.userId),
            ),
            inArray(
              schema.sogpEnrollments.email,
              candidates.map((row) => row.email),
            ),
          ),
        ),
      );
    const certifiedIds = new Set(certified.map((row) => row.enrollmentId));
    const takenUserIds = new Set(taken.map((row) => row.userId));
    const takenEmails = new Set(taken.map((row) => row.email));

    const movable: typeof candidates = [];
    for (const row of candidates) {
      const reason =
        getCohortMoveBlocker(
          { ...row, certificateIssued: certifiedIds.has(row.enrollmentId) },
          target,
        ) ??
        (takenUserIds.has(row.userId) || takenEmails.has(row.email) ? "already_enrolled" : null);
      if (reason) {
        result.skipped.push({ enrollmentId: row.enrollmentId, name: row.name, reason });
        continue;
      }
      movable.push(row);
      // Two selected enrolments for one person: only the first can land.
      takenUserIds.add(row.userId);
      takenEmails.add(row.email);
    }
    if (!movable.length) return result;

    const movableIds = movable.map((row) => row.enrollmentId);
    const now = new Date();
    const transfers = schema.sogpCohortTransfers;

    await tx
      .delete(schema.sogpPreparationCompletions)
      .where(inArray(schema.sogpPreparationCompletions.enrollmentId, movableIds));
    await tx
      .update(schema.sogpEnrollments)
      .set({ cohortId: target.id, status: "enrolled", leaderboardAlias: null, updatedAt: now })
      .where(inArray(schema.sogpEnrollments.id, movableIds));
    await tx
      .insert(transfers)
      .values(
        movable.map((row) => ({
          enrollmentId: row.enrollmentId,
          fromCohortId: row.cohortId,
          toCohortId: target.id,
          status: "moved" as const,
          askedBy: movedBy,
          askedAt: now,
          resolvedBy: movedBy,
          resolvedAt: now,
        })),
      )
      .onConflictDoUpdate({
        target: [transfers.enrollmentId, transfers.toCohortId],
        // Keeps who asked and when; only the outcome is new.
        set: {
          fromCohortId: sql`excluded.from_cohort_id`,
          status: "moved",
          resolvedBy: movedBy,
          resolvedAt: now,
        },
      });

    result.moved = movable.map((row) => ({
      enrollmentId: row.enrollmentId,
      name: row.name,
      email: row.email,
    }));
    return result;
  });
}

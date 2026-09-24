import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { PRE_SOGP_PREPARATION_DAYS } from "@/lib/sogp/calendar";
import type { StudentStatus } from "@/lib/sogp/student-status";

import { getStudentStatusesForPastor } from "./sogp-daily";

/**
 * Full cleanup when someone stops being a pastor — whether their `isPastor`
 * flag was turned off, or their `role` was demoted away from `"pastor"`.
 * Frees every enrollee and region assigned to them so an admin can hand
 * those off to someone else; a no-op if they held none.
 *
 * Deliberately uses the plain HTTP `db` client, not the WebSocket-pool
 * `transactionDb` — this module gets imported by staff/admin actions that
 * have nothing to do with pastors (e.g. creating a plain admin invite), and
 * those shouldn't fail if the pool driver ever has trouble in a serverless
 * environment. Both deletes are independently idempotent, so doing them
 * sequentially instead of in a transaction costs nothing in practice.
 */
export async function unassignAllForPastor(pastorUserId: string): Promise<void> {
  await db
    .delete(schema.pastorAssignments)
    .where(eq(schema.pastorAssignments.pastorUserId, pastorUserId));
  await db
    .delete(schema.pastorRegions)
    .where(eq(schema.pastorRegions.pastorUserId, pastorUserId));
}

export type PastorSummary = {
  id: string;
  name: string;
  email: string;
  assignedCount: number;
  contactedCount: number;
  lastContactedAt: string | null;
  /** Written responses this pastor has approved/requested revision on. */
  reviewedCount: number;
  lastReviewedAt: string | null;
};

/**
 * Admin CRM rollup: everyone who can hold pastor assignments, plus their
 * activity — dedicated `role = "pastor"` accounts, plus any admin/super_admin
 * explicitly marked `isPastor` (see `setAdminPastorFlag`). Being an admin
 * alone does not put you on this list; an admin has to be assigned the
 * pastor flag first.
 */
export async function listPastors(): Promise<PastorSummary[]> {
  const rows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      assignedCount: sql<number>`count(distinct ${schema.pastorAssignments.id})::int`,
      contactedCount: sql<number>`count(distinct ${schema.pastorAssignments.id}) filter (where ${schema.pastorAssignments.contactCount} > 0)::int`,
      lastContactedAt: sql<string | null>`max(${schema.pastorAssignments.lastContactedAt})`,
      reviewedCount: sql<number>`count(distinct ${schema.writtenSubmissions.id}) filter (where ${schema.writtenSubmissions.reviewedBy} is not null)::int`,
      lastReviewedAt: sql<string | null>`max(${schema.writtenSubmissions.reviewedAt})`,
    })
    .from(schema.users)
    .leftJoin(
      schema.pastorAssignments,
      eq(schema.pastorAssignments.pastorUserId, schema.users.id),
    )
    .leftJoin(
      schema.writtenSubmissions,
      eq(schema.writtenSubmissions.reviewedBy, schema.users.id),
    )
    .where(
      or(eq(schema.users.role, "pastor"), eq(schema.users.isPastor, true)),
    )
    .groupBy(schema.users.id, schema.users.name, schema.users.email)
    .orderBy(asc(schema.users.name));

  return rows.map((row) => ({
    ...row,
    lastContactedAt: row.lastContactedAt
      ? new Date(row.lastContactedAt).toISOString()
      : null,
    lastReviewedAt: row.lastReviewedAt
      ? new Date(row.lastReviewedAt).toISOString()
      : null,
  }));
}

export type AdminForPastorFlag = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "super_admin";
  isPastor: boolean;
};

/** Every admin/super_admin, with whether they're currently also a pastor. */
export async function listAdminsForPastorFlag(): Promise<AdminForPastorFlag[]> {
  const rows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      isPastor: schema.users.isPastor,
    })
    .from(schema.users)
    .where(
      or(eq(schema.users.role, "admin"), eq(schema.users.role, "super_admin")),
    )
    .orderBy(asc(schema.users.name));

  return rows as AdminForPastorFlag[];
}

/**
 * Toggle whether an admin also holds pastor assignments. Turning it off also
 * frees everything they were assigned — they stop being a pastor for real,
 * not just for the "who can be picked" list.
 */
export async function setAdminPastorFlag(
  userId: string,
  isPastor: boolean,
): Promise<void> {
  await db
    .update(schema.users)
    .set({ isPastor })
    .where(
      and(
        eq(schema.users.id, userId),
        or(eq(schema.users.role, "admin"), eq(schema.users.role, "super_admin")),
      ),
    );

  if (!isPastor) {
    await unassignAllForPastor(userId);
  }
}

export type SogpEnrolleeForAssignment = {
  enrollmentId: number;
  name: string;
  email: string;
  phone: string;
  whatsappConsent: boolean;
  cohortTitle: string;
  pastorUserId: string | null;
  pastorName: string | null;
};

/** Admin: every SOGP enrolment, with its current pastor assignment (if any). */
export async function listSogpEnrollees({
  search,
  onlyUnassigned = false,
  whatsappOnly = false,
  limit = 50,
  offset = 0,
}: {
  search?: string;
  onlyUnassigned?: boolean;
  whatsappOnly?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<SogpEnrolleeForAssignment[]> {
  const pastorUser = schema.users;
  const conditions = [];
  if (search) {
    const like = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(schema.sogpEnrollments.name, like),
        ilike(schema.sogpEnrollments.email, like),
        ilike(schema.sogpEnrollments.phone, like),
      ),
    );
  }
  if (onlyUnassigned) {
    conditions.push(sql`${schema.pastorAssignments.id} is null`);
  }
  if (whatsappOnly) {
    conditions.push(eq(schema.sogpEnrollments.whatsappConsent, true));
  }

  const rows = await db
    .select({
      enrollmentId: schema.sogpEnrollments.id,
      name: schema.sogpEnrollments.name,
      email: schema.sogpEnrollments.email,
      phone: schema.sogpEnrollments.phone,
      whatsappConsent: schema.sogpEnrollments.whatsappConsent,
      cohortTitle: schema.sogpCohorts.title,
      pastorUserId: schema.pastorAssignments.pastorUserId,
      pastorName: pastorUser.name,
    })
    .from(schema.sogpEnrollments)
    .innerJoin(
      schema.sogpCohorts,
      eq(schema.sogpCohorts.id, schema.sogpEnrollments.cohortId),
    )
    .leftJoin(
      schema.pastorAssignments,
      eq(schema.pastorAssignments.enrollmentId, schema.sogpEnrollments.id),
    )
    .leftJoin(pastorUser, eq(pastorUser.id, schema.pastorAssignments.pastorUserId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(schema.sogpEnrollments.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

/** Admin: assign (or reassign) a pastor to an enrolment — any enrolment. */
export async function assignEnrollmentToPastor(input: {
  enrollmentId: number;
  pastorUserId: string;
  assignedBy: string;
}): Promise<void> {
  await db
    .insert(schema.pastorAssignments)
    .values({
      enrollmentId: input.enrollmentId,
      pastorUserId: input.pastorUserId,
      assignedBy: input.assignedBy,
    })
    .onConflictDoUpdate({
      target: schema.pastorAssignments.enrollmentId,
      set: {
        pastorUserId: input.pastorUserId,
        assignedBy: input.assignedBy,
        assignedAt: new Date(),
      },
    });
}

/** Admin: remove a pastor assignment from an enrolment. */
export async function unassignPastor(enrollmentId: number): Promise<void> {
  await db
    .delete(schema.pastorAssignments)
    .where(eq(schema.pastorAssignments.enrollmentId, enrollmentId));
}

export type RegionWithPastor = {
  unitId: number;
  unitName: string;
  pastorUserId: string | null;
  pastorName: string | null;
  enrolleeCount: number;
};

/** Every region (unit), with its current pastor (if any) and enrollee count. */
export async function listRegionsWithPastors(): Promise<RegionWithPastor[]> {
  const rows = await db
    .select({
      unitId: schema.units.id,
      unitName: schema.units.name,
      pastorUserId: schema.pastorRegions.pastorUserId,
      pastorName: schema.users.name,
      enrolleeCount: sql<number>`count(${schema.unitMembers.id})::int`,
    })
    .from(schema.units)
    .leftJoin(
      schema.unitMembers,
      eq(schema.unitMembers.unitId, schema.units.id),
    )
    .leftJoin(
      schema.pastorRegions,
      eq(schema.pastorRegions.unitId, schema.units.id),
    )
    .leftJoin(schema.users, eq(schema.users.id, schema.pastorRegions.pastorUserId))
    .groupBy(
      schema.units.id,
      schema.units.name,
      schema.pastorRegions.pastorUserId,
      schema.users.name,
    )
    .orderBy(asc(schema.units.name));

  return rows;
}

/** Admin: set (or replace) the one pastor covering a region. */
export async function setPastorRegion(input: {
  unitId: number;
  pastorUserId: string;
  assignedBy: string;
}): Promise<void> {
  await db
    .insert(schema.pastorRegions)
    .values({
      unitId: input.unitId,
      pastorUserId: input.pastorUserId,
      assignedBy: input.assignedBy,
    })
    .onConflictDoUpdate({
      target: schema.pastorRegions.unitId,
      set: {
        pastorUserId: input.pastorUserId,
        assignedBy: input.assignedBy,
        assignedAt: new Date(),
      },
    });
}

/** Admin: clear the pastor covering a region. */
export async function removePastorRegion(unitId: number): Promise<void> {
  await db.delete(schema.pastorRegions).where(eq(schema.pastorRegions.unitId, unitId));
}

/**
 * Admin: assign a pastor to every enrollee currently in a region — the
 * explicit bulk action. Overwrites any existing per-enrollee pastor for
 * those enrollees (one pastor per region is the intent).
 */
export async function bulkAssignPastorToRegion(input: {
  unitId: number;
  pastorUserId: string;
  assignedBy: string;
}): Promise<{ assigned: number }> {
  const members = await db
    .select({ enrollmentId: schema.unitMembers.enrollmentId })
    .from(schema.unitMembers)
    .where(eq(schema.unitMembers.unitId, input.unitId));
  if (members.length === 0) return { assigned: 0 };

  await db
    .insert(schema.pastorAssignments)
    .values(
      members.map((m) => ({
        enrollmentId: m.enrollmentId,
        pastorUserId: input.pastorUserId,
        assignedBy: input.assignedBy,
      })),
    )
    .onConflictDoUpdate({
      target: schema.pastorAssignments.enrollmentId,
      set: {
        pastorUserId: input.pastorUserId,
        assignedBy: input.assignedBy,
        assignedAt: new Date(),
      },
    });

  return { assigned: members.length };
}

/**
 * Fill a brand-new enrollee's pastor from their region, if that region has
 * one. Never overwrites — a human assignment always wins. Called right after
 * `assignEnrollmentToUnit` during enrolment completion.
 */
export async function autoAssignPastorForEnrollment(
  enrollmentId: number,
  unitId: number,
): Promise<void> {
  const [region] = await db
    .select({ pastorUserId: schema.pastorRegions.pastorUserId })
    .from(schema.pastorRegions)
    .where(eq(schema.pastorRegions.unitId, unitId))
    .limit(1);
  if (!region) return;

  await db
    .insert(schema.pastorAssignments)
    .values({ enrollmentId, pastorUserId: region.pastorUserId })
    .onConflictDoNothing({ target: schema.pastorAssignments.enrollmentId });
}

export type PastorEnrollee = {
  enrollmentId: number;
  name: string;
  firstName: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  birthYear: number | null;
  referralSource: string;
  status: (typeof schema.sogpEnrollmentStatusEnum.enumValues)[number];
  whatsappConsent: boolean;
  cohortTitle: string;
  assignedAt: string;
  lastContactedAt: string | null;
  contactCount: number;
  /** Preparation lessons completed, out of `PRE_SOGP_PREPARATION_DAYS`. */
  preparationDaysComplete: number;
  preparationDaysTotal: number;
  /** Morning Prayer Watch days attended, all-time. */
  morningPrayerDays: number;
  /** Required live review sessions attended. */
  reviewSessionsComplete: number;
  /** Quizzes passed (score >= 70%), out of quiz-bearing lessons in their cohort. */
  quizzesPassed: number;
  quizzesTotal: number;
  /** Written responses a reviewer has approved. */
  responsesApproved: number;
  /** Whether they currently hold a valid (non-revoked) SOGP certificate. */
  certificateIssued: boolean;
  /** How many other enrollees they've personally referred in. */
  referredCount: number;
  /** Automatic participation status — see `lib/sogp/student-status.ts`.
   * Distinct from `status`, which is the enrollment lifecycle status. */
  followUpStatus: StudentStatus;
};

/** What `enrichWithProgress` alone can produce — `followUpStatus` is attached
 * afterward by each caller, since only `getPastorEnrollees` (the dashboard)
 * needs the extra participation-range query it requires. */
type PastorEnrolleeWithoutFollowUp = Omit<PastorEnrollee, "followUpStatus">;

type PastorEnrolleeBaseRow = {
  enrollmentId: number;
  userId: string;
  cohortId: number;
  name: string;
  firstName: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  birthYear: number | null;
  referralSource: string;
  status: (typeof schema.sogpEnrollmentStatusEnum.enumValues)[number];
  whatsappConsent: boolean;
  cohortTitle: string;
  assignedAt: Date;
  lastContactedAt: Date | null;
  contactCount: number;
  createdAt: Date;
};

const pastorEnrolleeColumns = {
  enrollmentId: schema.sogpEnrollments.id,
  userId: schema.sogpEnrollments.userId,
  cohortId: schema.sogpEnrollments.cohortId,
  name: schema.sogpEnrollments.name,
  firstName: schema.sogpEnrollments.firstName,
  email: schema.sogpEnrollments.email,
  phone: schema.sogpEnrollments.phone,
  country: schema.sogpEnrollments.country,
  region: schema.sogpEnrollments.region,
  birthYear: schema.sogpEnrollments.birthYear,
  referralSource: schema.sogpEnrollments.referralSource,
  status: schema.sogpEnrollments.status,
  whatsappConsent: schema.sogpEnrollments.whatsappConsent,
  cohortTitle: schema.sogpCohorts.title,
  assignedAt: schema.pastorAssignments.assignedAt,
  lastContactedAt: schema.pastorAssignments.lastContactedAt,
  contactCount: schema.pastorAssignments.contactCount,
  createdAt: schema.sogpEnrollments.createdAt,
} as const;

/**
 * Attach SOGP progress (preparation, morning prayer, live-class attendance)
 * to a batch of enrollee rows — the same metrics used in the admin SOGP
 * completion view (`app/admin/_actions/read-actions.ts`) and the community
 * leader report (`lib/db/queries/community-reports.ts`). Shared by both
 * `getPastorEnrollees` (a pastor's whole list) and `getPastorEnrolleeById`
 * (one enrollee's detail page) so the three progress queries live in one
 * place.
 */
async function enrichWithProgress(
  rows: PastorEnrolleeBaseRow[],
): Promise<PastorEnrolleeWithoutFollowUp[]> {
  const enrollmentIds = rows.map((row) => row.enrollmentId);
  const userIds = rows.map((row) => row.userId);
  const cohortIds = [...new Set(rows.map((row) => row.cohortId))];

  const [
    prepRows,
    prayerRows,
    reviewRows,
    quizPassedRows,
    quizTotalRows,
    approvedRows,
    certificateRows,
    referredRows,
  ] = await Promise.all([
    enrollmentIds.length
      ? db
          .select({
            enrollmentId: schema.sogpPreparationCompletions.enrollmentId,
            completed: sql<number>`count(*)::int`,
          })
          .from(schema.sogpPreparationCompletions)
          .where(
            inArray(
              schema.sogpPreparationCompletions.enrollmentId,
              enrollmentIds,
            ),
          )
          .groupBy(schema.sogpPreparationCompletions.enrollmentId)
      : Promise.resolve([]),
    userIds.length
      ? db
          .select({
            userId: schema.prayerWatchAttendance.userId,
            days: sql<number>`count(*)::int`,
          })
          .from(schema.prayerWatchAttendance)
          .where(
            and(
              inArray(schema.prayerWatchAttendance.userId, userIds),
              eq(schema.prayerWatchAttendance.session, "morning"),
            ),
          )
          .groupBy(schema.prayerWatchAttendance.userId)
      : Promise.resolve([]),
    userIds.length
      ? db
          .select({
            userId: schema.sogpLiveClassAttendance.userId,
            attended: sql<number>`count(*)::int`,
          })
          .from(schema.sogpLiveClassAttendance)
          .where(inArray(schema.sogpLiveClassAttendance.userId, userIds))
          .groupBy(schema.sogpLiveClassAttendance.userId)
      : Promise.resolve([]),
    userIds.length
      ? db
          .select({
            userId: schema.studentProgress.userId,
            passed: sql<number>`count(*)::int`,
          })
          .from(schema.studentProgress)
          .where(
            and(
              inArray(schema.studentProgress.userId, userIds),
              eq(schema.studentProgress.quizPassed, true),
            ),
          )
          .groupBy(schema.studentProgress.userId)
      : Promise.resolve([]),
    cohortIds.length
      ? db
          .select({
            cohortId: schema.sogpCohortTracks.cohortId,
            total: sql<number>`count(distinct ${schema.lessons.id})::int`,
          })
          .from(schema.sogpCohortTracks)
          .innerJoin(
            schema.lessons,
            eq(schema.lessons.id, schema.sogpCohortTracks.lessonId),
          )
          .innerJoin(
            schema.quizQuestions,
            eq(schema.quizQuestions.lessonId, schema.lessons.id),
          )
          .where(inArray(schema.sogpCohortTracks.cohortId, cohortIds))
          .groupBy(schema.sogpCohortTracks.cohortId)
      : Promise.resolve([]),
    userIds.length
      ? db
          .select({
            userId: schema.writtenSubmissions.userId,
            approved: sql<number>`count(*)::int`,
          })
          .from(schema.writtenSubmissions)
          .where(
            and(
              inArray(schema.writtenSubmissions.userId, userIds),
              eq(schema.writtenSubmissions.status, "approved"),
            ),
          )
          .groupBy(schema.writtenSubmissions.userId)
      : Promise.resolve([]),
    enrollmentIds.length
      ? db
          .select({ enrollmentId: schema.sogpCertificates.enrollmentId })
          .from(schema.sogpCertificates)
          .where(
            and(
              inArray(schema.sogpCertificates.enrollmentId, enrollmentIds),
              sql`${schema.sogpCertificates.revokedAt} is null`,
            ),
          )
      : Promise.resolve([]),
    enrollmentIds.length
      ? db
          .select({
            referredByEnrollmentId: schema.sogpEnrollments.referredByEnrollmentId,
            referred: sql<number>`count(*)::int`,
          })
          .from(schema.sogpEnrollments)
          .where(
            inArray(schema.sogpEnrollments.referredByEnrollmentId, enrollmentIds),
          )
          .groupBy(schema.sogpEnrollments.referredByEnrollmentId)
      : Promise.resolve([]),
  ]);

  const prepByEnrollment = new Map(prepRows.map((r) => [r.enrollmentId, r.completed]));
  const prayerByUser = new Map(prayerRows.map((r) => [r.userId, r.days]));
  const reviewByUser = new Map(reviewRows.map((r) => [r.userId, r.attended]));
  const quizPassedByUser = new Map(quizPassedRows.map((r) => [r.userId, r.passed]));
  const quizTotalByCohort = new Map(quizTotalRows.map((r) => [r.cohortId, r.total]));
  const approvedByUser = new Map(approvedRows.map((r) => [r.userId, r.approved]));
  const certifiedEnrollments = new Set(certificateRows.map((r) => r.enrollmentId));
  const referredByEnrollment = new Map(
    referredRows
      .filter((r) => r.referredByEnrollmentId != null)
      .map((r) => [r.referredByEnrollmentId as number, r.referred]),
  );
  return rows.map(({ userId, cohortId, createdAt, ...row }) => ({
    ...row,
    assignedAt: new Date(row.assignedAt).toISOString(),
    lastContactedAt: row.lastContactedAt
      ? new Date(row.lastContactedAt).toISOString()
      : null,
    preparationDaysComplete: prepByEnrollment.get(row.enrollmentId) ?? 0,
    preparationDaysTotal: PRE_SOGP_PREPARATION_DAYS,
    morningPrayerDays: prayerByUser.get(userId) ?? 0,
    reviewSessionsComplete: reviewByUser.get(userId) ?? 0,
    quizzesPassed: quizPassedByUser.get(userId) ?? 0,
    quizzesTotal: quizTotalByCohort.get(cohortId) ?? 0,
    responsesApproved: approvedByUser.get(userId) ?? 0,
    certificateIssued: certifiedEnrollments.has(row.enrollmentId),
    referredCount: referredByEnrollment.get(row.enrollmentId) ?? 0,
  }));
}

export type PastorCohortWindow = {
  id: number;
  title: string;
  startsAt: string;
  endsAt: string;
  status: (typeof schema.sogpCohortStatusEnum.enumValues)[number];
};

/**
 * Distinct cohorts a pastor currently has enrollees in, newest first —
 * powers the cohort picker for the pastor's daily participation table.
 * `status` lets the picker default to the one cohort an admin has marked
 * "active" (the authoritative "current cohort"), rather than guessing from
 * overlapping date windows.
 */
export async function getPastorCohorts(pastorUserId: string): Promise<PastorCohortWindow[]> {
  const rows = await db
    .selectDistinct({
      id: schema.sogpCohorts.id,
      title: schema.sogpCohorts.title,
      startsAt: schema.sogpCohorts.startsAt,
      endsAt: schema.sogpCohorts.endsAt,
      status: schema.sogpCohorts.status,
    })
    .from(schema.pastorAssignments)
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.pastorAssignments.enrollmentId),
    )
    .innerJoin(schema.sogpCohorts, eq(schema.sogpCohorts.id, schema.sogpEnrollments.cohortId))
    .where(eq(schema.pastorAssignments.pastorUserId, pastorUserId))
    .orderBy(desc(schema.sogpCohorts.startsAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    status: row.status,
  }));
}

/**
 * A pastor's own "my enrollees" list — full record for each assignment, plus
 * SOGP progress.
 */
export async function getPastorEnrollees(
  pastorUserId: string,
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<PastorEnrollee[]> {
  const rows = await db
    .select(pastorEnrolleeColumns)
    .from(schema.pastorAssignments)
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.pastorAssignments.enrollmentId),
    )
    .innerJoin(
      schema.sogpCohorts,
      eq(schema.sogpCohorts.id, schema.sogpEnrollments.cohortId),
    )
    .where(eq(schema.pastorAssignments.pastorUserId, pastorUserId))
    .orderBy(desc(schema.pastorAssignments.assignedAt))
    .limit(limit)
    .offset(offset);

  const [enriched, followUpStatusByEnrollment] = await Promise.all([
    enrichWithProgress(rows),
    getStudentStatusesForPastor(
      pastorUserId,
      rows.map((row) => ({
        enrollmentId: row.enrollmentId,
        cohortId: row.cohortId,
        enrollmentCreatedAt: row.createdAt,
      })),
    ),
  ]);

  return enriched.map((enrollee) => ({
    ...enrollee,
    followUpStatus: followUpStatusByEnrollment.get(enrollee.enrollmentId) ?? "on_track",
  }));
}

/** One enrollee's full record, regardless of which pastor holds it — powers
 * the enrollee detail/review page. Callers must check
 * `isPastorAssignedToEnrollment` themselves before showing this to a pastor. */
export async function getPastorEnrolleeById(
  enrollmentId: number,
): Promise<PastorEnrollee | null> {
  const rows = await db
    .select(pastorEnrolleeColumns)
    .from(schema.pastorAssignments)
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.pastorAssignments.enrollmentId),
    )
    .innerJoin(
      schema.sogpCohorts,
      eq(schema.sogpCohorts.id, schema.sogpEnrollments.cohortId),
    )
    .where(eq(schema.pastorAssignments.enrollmentId, enrollmentId))
    .limit(1);

  if (rows.length === 0) return null;
  const [enrollee] = await enrichWithProgress(rows);
  if (!enrollee) return null;
  // The detail page doesn't render `followUpStatus`, so it isn't worth the
  // extra participation-range query here — only `getPastorEnrollees` (the
  // dashboard list) computes it for real.
  return { ...enrollee, followUpStatus: "on_track" };
}

/** Ownership check — does this enrollment currently belong to this pastor? */
export async function isPastorAssignedToEnrollment(
  pastorUserId: string,
  enrollmentId: number,
): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.pastorAssignments.id })
    .from(schema.pastorAssignments)
    .where(
      and(
        eq(schema.pastorAssignments.pastorUserId, pastorUserId),
        eq(schema.pastorAssignments.enrollmentId, enrollmentId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export type PastorEnrolleeSubmission = {
  lessonId: number;
  lessonTitle: string;
  lessonNumber: number;
  dayNumber: number | null;
  weekNumber: number;
  responsePrompt: string | null;
  responseMarkingGuide: string | null;
  submissionId: number | null;
  content: string | null;
  status: (typeof schema.submissionStatusEnum.enumValues)[number] | null;
  reviewerNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
};

/**
 * Every SOGP curriculum day for this enrollee's cohort that has a written
 * response prompt, left-joined to whatever the enrollee has actually
 * submitted (if anything) — mirrors `getReviewQueue()`'s join shape
 * (`lib/db/queries/submissions.ts`) but walks the curriculum first, so an
 * untouched lesson still shows up as "not submitted" rather than being
 * absent from the list.
 */
export async function getPastorEnrolleeSubmissions(
  enrollmentId: number,
): Promise<PastorEnrolleeSubmission[]> {
  const [enrollment] = await db
    .select({
      userId: schema.sogpEnrollments.userId,
      cohortId: schema.sogpEnrollments.cohortId,
    })
    .from(schema.sogpEnrollments)
    .where(eq(schema.sogpEnrollments.id, enrollmentId))
    .limit(1);
  if (!enrollment) return [];

  const submission = schema.writtenSubmissions;
  const rows = await db
    .select({
      lessonId: schema.lessons.id,
      lessonTitle: schema.lessons.title,
      lessonNumber: schema.lessons.lessonNumber,
      dayNumber: schema.sogpCohortTracks.dayNumber,
      weekNumber: schema.sogpCohortTracks.weekNumber,
      responsePrompt: schema.lessons.responsePrompt,
      responseMarkingGuide: schema.lessons.responseMarkingGuide,
      submissionId: submission.id,
      content: submission.content,
      status: submission.status,
      reviewerNote: submission.reviewerNote,
      submittedAt: submission.submittedAt,
      reviewedAt: submission.reviewedAt,
    })
    .from(schema.sogpCohortTracks)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.sogpCohortTracks.lessonId))
    .leftJoin(
      submission,
      and(
        eq(submission.lessonId, schema.lessons.id),
        eq(submission.userId, enrollment.userId),
      ),
    )
    .where(
      and(
        eq(schema.sogpCohortTracks.cohortId, enrollment.cohortId),
        sql`${schema.lessons.responsePrompt} is not null`,
      ),
    )
    .orderBy(asc(schema.sogpCohortTracks.curriculumOrder));

  return rows.map((row) => ({
    ...row,
    submittedAt: row.submittedAt ? new Date(row.submittedAt).toISOString() : null,
    reviewedAt: row.reviewedAt ? new Date(row.reviewedAt).toISOString() : null,
  }));
}

/**
 * Log a follow-up touch. Scoped to the acting pastor's own assignment — a
 * mismatched enrolment/pastor pair updates nothing.
 */
export async function recordPastorContact(
  enrollmentId: number,
  pastorUserId: string,
): Promise<void> {
  await db
    .update(schema.pastorAssignments)
    .set({
      contactCount: sql`${schema.pastorAssignments.contactCount} + 1`,
      lastContactedAt: new Date(),
    })
    .where(
      and(
        eq(schema.pastorAssignments.enrollmentId, enrollmentId),
        eq(schema.pastorAssignments.pastorUserId, pastorUserId),
      ),
    );
}

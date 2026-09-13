import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { PRE_SOGP_PREPARATION_DAYS } from "@/lib/sogp/calendar";

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
      assignedCount: sql<number>`count(${schema.pastorAssignments.id})::int`,
      contactedCount: sql<number>`count(*) filter (where ${schema.pastorAssignments.contactCount} > 0)::int`,
      lastContactedAt: sql<string | null>`max(${schema.pastorAssignments.lastContactedAt})`,
    })
    .from(schema.users)
    .leftJoin(
      schema.pastorAssignments,
      eq(schema.pastorAssignments.pastorUserId, schema.users.id),
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
};

/**
 * A pastor's own "my enrollees" list — full record for each assignment, plus
 * SOGP progress (preparation, morning prayer, live-class attendance), the
 * same metrics used in the admin SOGP completion view
 * (`app/admin/_actions/read-actions.ts`) and the community leader report
 * (`lib/db/queries/community-reports.ts`).
 */
export async function getPastorEnrollees(
  pastorUserId: string,
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<PastorEnrollee[]> {
  const rows = await db
    .select({
      enrollmentId: schema.sogpEnrollments.id,
      userId: schema.sogpEnrollments.userId,
      name: schema.sogpEnrollments.name,
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
    })
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

  const enrollmentIds = rows.map((row) => row.enrollmentId);
  const userIds = rows.map((row) => row.userId);

  const [prepRows, prayerRows, reviewRows] = await Promise.all([
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
  ]);

  const prepByEnrollment = new Map(prepRows.map((r) => [r.enrollmentId, r.completed]));
  const prayerByUser = new Map(prayerRows.map((r) => [r.userId, r.days]));
  const reviewByUser = new Map(reviewRows.map((r) => [r.userId, r.attended]));

  return rows.map(({ userId, ...row }) => ({
    ...row,
    assignedAt: new Date(row.assignedAt).toISOString(),
    lastContactedAt: row.lastContactedAt
      ? new Date(row.lastContactedAt).toISOString()
      : null,
    preparationDaysComplete: prepByEnrollment.get(row.enrollmentId) ?? 0,
    preparationDaysTotal: PRE_SOGP_PREPARATION_DAYS,
    morningPrayerDays: prayerByUser.get(userId) ?? 0,
    reviewSessionsComplete: reviewByUser.get(userId) ?? 0,
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

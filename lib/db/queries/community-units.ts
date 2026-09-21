import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { buildUnitName, canonicalRegionKey } from "@/lib/community/units";
import { toPeerMember, type PeerMember } from "@/lib/community/visibility";
import {
  PRE_SOGP_PREPARATION_DAYS,
  SOGP_TOTAL_WEEKS,
  getSogpCohortWeek,
} from "@/lib/sogp/calendar";
import {
  countryCodeToFlag,
  getSogpCountry,
  resolveSogpCountryCode,
} from "@/lib/sogp/countries";

export type Unit = typeof schema.units.$inferSelect;

/** Find-or-create the unit for a (country, region) pair and return its id. */
export async function resolveUnitId(input: {
  countryCode: string;
  region: string | null;
}): Promise<number> {
  const countryCode = input.countryCode.toUpperCase();
  const regionKey = canonicalRegionKey(countryCode, input.region);

  const whereRegion = regionKey
    ? eq(schema.units.regionKey, regionKey)
    : isNull(schema.units.regionKey);

  const [existing] = await db
    .select({ id: schema.units.id })
    .from(schema.units)
    .where(and(eq(schema.units.countryCode, countryCode), whereRegion))
    .limit(1);
  if (existing) return existing.id;

  await db
    .insert(schema.units)
    .values({
      countryCode,
      regionKey,
      name: buildUnitName(countryCode, regionKey),
    })
    .onConflictDoNothing();

  const [unit] = await db
    .select({ id: schema.units.id })
    .from(schema.units)
    .where(and(eq(schema.units.countryCode, countryCode), whereRegion))
    .limit(1);
  if (!unit) throw new Error("Could not resolve a community unit.");
  return unit.id;
}

/**
 * Place an enrolment into its location unit. Idempotent — the unique index on
 * `unit_members.enrollment_id` makes a repeat call a no-op.
 */
export async function assignEnrollmentToUnit(
  enrollmentId: number,
): Promise<{ unitId: number } | null> {
  const [enrollment] = await db
    .select({
      countryCode: schema.sogpEnrollments.countryCode,
      country: schema.sogpEnrollments.country,
      region: schema.sogpEnrollments.region,
    })
    .from(schema.sogpEnrollments)
    .where(eq(schema.sogpEnrollments.id, enrollmentId))
    .limit(1);
  if (!enrollment) return null;

  const unitId = await resolveUnitId({
    countryCode: enrollment.countryCode || enrollment.country,
    region: enrollment.region,
  });

  await db
    .insert(schema.unitMembers)
    .values({ unitId, enrollmentId, role: "member" })
    .onConflictDoNothing({ target: schema.unitMembers.enrollmentId });

  return { unitId };
}

export type UnitWithCounts = Unit & {
  memberCount: number;
  leaderName: string | null;
};

export async function listUnits(): Promise<UnitWithCounts[]> {
  const rows = await db
    .select({
      unit: schema.units,
      memberCount: sql<number>`count(${schema.unitMembers.id})::int`,
      leaderName: sql<
        string | null
      >`max(case when ${schema.unitMembers.role} = 'leader' then ${schema.sogpEnrollments.firstName} end)`,
    })
    .from(schema.units)
    .leftJoin(
      schema.unitMembers,
      eq(schema.unitMembers.unitId, schema.units.id),
    )
    .leftJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.unitMembers.enrollmentId),
    )
    .groupBy(schema.units.id)
    .orderBy(schema.units.name);

  return rows.map((row) => ({
    ...row.unit,
    memberCount: row.memberCount,
    leaderName: row.leaderName,
  }));
}

export async function getUnit(id: number): Promise<Unit | null> {
  const [unit] = await db
    .select()
    .from(schema.units)
    .where(eq(schema.units.id, id))
    .limit(1);
  return unit ?? null;
}

export async function setUnitTelegramUrl(id: number, telegramUrl: string | null) {
  await db
    .update(schema.units)
    .set({ telegramUrl: telegramUrl || null, updatedAt: new Date() })
    .where(eq(schema.units.id, id));
}

export async function setUnitStatus(id: number, status: "active" | "archived") {
  await db
    .update(schema.units)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.units.id, id));
}

export type UnitDetail = {
  id: number;
  name: string;
  telegramUrl: string | null;
  status: "active" | "archived";
  memberCount: number;
  leader: { firstName: string } | null;
  members: PeerMember[];
  preparationDaysTotal: number;
};

/** Peer-safe member directory for a unit (first name + join month + stage). */
export async function getUnitDetail(unitId: number): Promise<UnitDetail | null> {
  const unit = await getUnit(unitId);
  if (!unit) return null;

  const memberRows = await db
    .select({
      role: schema.unitMembers.role,
      joinedAt: schema.unitMembers.joinedAt,
      name: schema.sogpEnrollments.name,
      firstName: schema.sogpEnrollments.firstName,
      enrollmentId: schema.sogpEnrollments.id,
      enrollmentStatus: schema.sogpEnrollments.status,
      cohortStatus: schema.sogpCohorts.status,
    })
    .from(schema.unitMembers)
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.unitMembers.enrollmentId),
    )
    .innerJoin(
      schema.sogpCohorts,
      eq(schema.sogpCohorts.id, schema.sogpEnrollments.cohortId),
    )
    .where(eq(schema.unitMembers.unitId, unitId))
    .orderBy(asc(schema.unitMembers.joinedAt));

  const ids = memberRows.map((row) => row.enrollmentId);
  const prepCounts = new Map<number, number>();
  if (ids.length > 0) {
    const rows = await db
      .select({
        enrollmentId: schema.sogpPreparationCompletions.enrollmentId,
        completed: sql<number>`count(*)::int`,
      })
      .from(schema.sogpPreparationCompletions)
      .where(inArray(schema.sogpPreparationCompletions.enrollmentId, ids))
      .groupBy(schema.sogpPreparationCompletions.enrollmentId);
    for (const row of rows) prepCounts.set(row.enrollmentId, row.completed);
  }

  const members = memberRows.map((row) =>
    toPeerMember({
      name: row.name,
      firstName: row.firstName,
      joinedAt: row.joinedAt,
      role: row.role,
      cohortStatus: row.cohortStatus,
      enrollmentStatus: row.enrollmentStatus,
      preparationDaysComplete: prepCounts.get(row.enrollmentId) ?? 0,
    }),
  );

  return {
    id: unit.id,
    name: unit.name,
    telegramUrl: unit.telegramUrl,
    status: unit.status,
    memberCount: members.length,
    leader: members.find((m) => m.isLeader)
      ? { firstName: members.find((m) => m.isLeader)!.firstName }
      : null,
    members,
    preparationDaysTotal: PRE_SOGP_PREPARATION_DAYS,
  };
}

export type UnitRailCard = {
  id: number;
  name: string;
  /** Regional-indicator flag emoji, or "" when the code is unusable. */
  flag: string;
  countryLabel: string | null;
  memberCount: number;
  leaderFirstName: string | null;
  /** null when the viewer has no enrolment / cohort. */
  cohort: {
    phase: "preparation" | "active" | "complete";
    week: number | null;
    total: number;
  } | null;
};

/** Compact "Your unit" payload for the community left rail. */
export async function getUnitRailCard(
  unitId: number,
  enrollmentId: number | null,
): Promise<UnitRailCard | null> {
  const [row] = await db
    .select({
      id: schema.units.id,
      name: schema.units.name,
      countryCode: schema.units.countryCode,
      memberCount: sql<number>`count(${schema.unitMembers.id})::int`,
      leaderFirstName: sql<
        string | null
      >`max(case when ${schema.unitMembers.role} = 'leader' then ${schema.sogpEnrollments.firstName} end)`,
    })
    .from(schema.units)
    .leftJoin(
      schema.unitMembers,
      eq(schema.unitMembers.unitId, schema.units.id),
    )
    .leftJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.unitMembers.enrollmentId),
    )
    .where(eq(schema.units.id, unitId))
    .groupBy(schema.units.id)
    .limit(1);
  if (!row) return null;

  let cohort: UnitRailCard["cohort"] = null;
  if (enrollmentId != null) {
    const [c] = await db
      .select({
        startsAt: schema.sogpCohorts.startsAt,
        endsAt: schema.sogpCohorts.endsAt,
      })
      .from(schema.sogpEnrollments)
      .innerJoin(
        schema.sogpCohorts,
        eq(schema.sogpCohorts.id, schema.sogpEnrollments.cohortId),
      )
      .where(eq(schema.sogpEnrollments.id, enrollmentId))
      .limit(1);
    if (c) {
      const week = getSogpCohortWeek(c.startsAt, c.endsAt);
      cohort = { ...week, total: SOGP_TOTAL_WEEKS };
    }
  }

  const flag =
    row.countryCode?.trim().length === 2
      ? countryCodeToFlag(row.countryCode)
      : "";

  return {
    id: row.id,
    name: row.name,
    flag,
    countryLabel:
      getSogpCountry(resolveSogpCountryCode(row.countryCode))?.label ?? null,
    memberCount: row.memberCount,
    leaderFirstName: row.leaderFirstName,
    cohort,
  };
}

/** Admin: make one member the unit's leader, demoting any current leader. */
export async function setUnitLeader(input: {
  unitId: number;
  enrollmentId: number | null;
}) {
  await db
    .update(schema.unitMembers)
    .set({ role: "member" })
    .where(
      and(
        eq(schema.unitMembers.unitId, input.unitId),
        eq(schema.unitMembers.role, "leader"),
      ),
    );

  if (input.enrollmentId != null) {
    await db
      .update(schema.unitMembers)
      .set({ role: "leader" })
      .where(
        and(
          eq(schema.unitMembers.unitId, input.unitId),
          eq(schema.unitMembers.enrollmentId, input.enrollmentId),
        ),
      );
  }
}

/** Enrolments in a unit, with names — admin-only (not peer-safe). */
export async function listUnitMembersForAdmin(unitId: number) {
  return db
    .select({
      enrollmentId: schema.sogpEnrollments.id,
      name: schema.sogpEnrollments.name,
      email: schema.sogpEnrollments.email,
      role: schema.unitMembers.role,
    })
    .from(schema.unitMembers)
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.unitMembers.enrollmentId),
    )
    .where(eq(schema.unitMembers.unitId, unitId))
    .orderBy(asc(schema.sogpEnrollments.name));
}

/** Move one member to another unit (admin action). */
export async function reassignMember(input: {
  enrollmentId: number;
  toUnitId: number;
  assignedBy: string;
}) {
  await db
    .update(schema.unitMembers)
    .set({
      unitId: input.toUnitId,
      assignedBy: input.assignedBy,
      role: "member",
    })
    .where(eq(schema.unitMembers.enrollmentId, input.enrollmentId));
}

/** Move every member of `fromUnitId` into `toUnitId`, then archive the source. */
export async function mergeUnits(input: {
  fromUnitId: number;
  toUnitId: number;
  assignedBy: string;
}) {
  const members = await db
    .select({ enrollmentId: schema.unitMembers.enrollmentId })
    .from(schema.unitMembers)
    .where(eq(schema.unitMembers.unitId, input.fromUnitId));

  for (const member of members) {
    // Skip enrolments already in the target unit.
    const [clash] = await db
      .select({ id: schema.unitMembers.id })
      .from(schema.unitMembers)
      .where(
        and(
          eq(schema.unitMembers.unitId, input.toUnitId),
          eq(schema.unitMembers.enrollmentId, member.enrollmentId),
        ),
      )
      .limit(1);
    if (clash) {
      await db
        .delete(schema.unitMembers)
        .where(
          and(
            eq(schema.unitMembers.unitId, input.fromUnitId),
            eq(schema.unitMembers.enrollmentId, member.enrollmentId),
          ),
        );
      continue;
    }
    await db
      .update(schema.unitMembers)
      .set({
        unitId: input.toUnitId,
        assignedBy: input.assignedBy,
        role: "member",
      })
      .where(
        and(
          eq(schema.unitMembers.unitId, input.fromUnitId),
          eq(schema.unitMembers.enrollmentId, member.enrollmentId),
        ),
      );
  }

  await setUnitStatus(input.fromUnitId, "archived");
}

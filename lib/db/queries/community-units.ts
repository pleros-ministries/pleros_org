import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { buildUnitName, canonicalRegionKey } from "@/lib/community/units";

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

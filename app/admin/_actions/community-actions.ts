"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/require-role";
import {
  assignEnrollmentToUnit,
  mergeUnits,
  reassignMember,
  setUnitStatus,
  setUnitTelegramUrl,
} from "@/lib/db/queries/community-units";

/**
 * Place every enrolment into its location unit. Idempotent — safe to re-run;
 * the unique index on `unit_members.enrollment_id` de-dupes.
 */
export async function backfillCommunityUnits() {
  await requireAdmin();
  const enrollments = await db
    .select({ id: schema.sogpEnrollments.id })
    .from(schema.sogpEnrollments);

  let assigned = 0;
  let failed = 0;
  for (const { id } of enrollments) {
    try {
      await assignEnrollmentToUnit(id);
      assigned += 1;
    } catch (error) {
      failed += 1;
      console.error(`Unit backfill failed for enrolment ${id}:`, error);
    }
  }

  revalidatePath("/admin/community");
  return { total: enrollments.length, assigned, failed };
}

export async function updateUnitTelegramUrl(input: {
  unitId: number;
  telegramUrl: string;
}) {
  await requireAdmin();
  await setUnitTelegramUrl(input.unitId, input.telegramUrl.trim() || null);
  revalidatePath("/admin/community");
}

export async function updateUnitStatus(input: {
  unitId: number;
  status: "active" | "archived";
}) {
  await requireAdmin();
  await setUnitStatus(input.unitId, input.status);
  revalidatePath("/admin/community");
}

export async function reassignUnitMember(input: {
  enrollmentId: number;
  toUnitId: number;
}) {
  const session = await requireAdmin();
  await reassignMember({ ...input, assignedBy: session.user.id });
  revalidatePath("/admin/community");
}

export async function mergeCommunityUnits(input: {
  fromUnitId: number;
  toUnitId: number;
}) {
  const session = await requireAdmin();
  await mergeUnits({ ...input, assignedBy: session.user.id });
  revalidatePath("/admin/community");
}

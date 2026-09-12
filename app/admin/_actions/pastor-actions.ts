"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-role";
import {
  assignEnrollmentToPastor,
  bulkAssignPastorToRegion,
  removePastorRegion,
  setAdminPastorFlag,
  setPastorRegion,
  unassignPastor,
} from "@/lib/db/queries/pastor-followups";

export async function assignPastorToEnrollment(input: {
  enrollmentId: number;
  pastorUserId: string;
}) {
  const session = await requireAdmin();
  await assignEnrollmentToPastor({
    enrollmentId: input.enrollmentId,
    pastorUserId: input.pastorUserId,
    assignedBy: session.user.id,
  });
  revalidatePath("/admin/pastors");
  revalidatePath("/admin/my-enrollees");
}

export async function unassignPastorFromEnrollment(input: {
  enrollmentId: number;
}) {
  await requireAdmin();
  await unassignPastor(input.enrollmentId);
  revalidatePath("/admin/pastors");
  revalidatePath("/admin/my-enrollees");
}

export async function setAdminAsPastor(input: {
  userId: string;
  isPastor: boolean;
}) {
  await requireAdmin();
  await setAdminPastorFlag(input.userId, input.isPastor);
  revalidatePath("/admin/pastors");
  revalidatePath("/admin/my-enrollees");
}

export async function setPastorRegionAssignment(input: {
  unitId: number;
  pastorUserId: string;
}) {
  const session = await requireAdmin();
  await setPastorRegion({
    unitId: input.unitId,
    pastorUserId: input.pastorUserId,
    assignedBy: session.user.id,
  });
  revalidatePath("/admin/pastors");
}

export async function removePastorRegionAssignment(input: { unitId: number }) {
  await requireAdmin();
  await removePastorRegion(input.unitId);
  revalidatePath("/admin/pastors");
}

export async function bulkAssignPastorToAllInRegion(input: {
  unitId: number;
  pastorUserId: string;
}) {
  const session = await requireAdmin();
  const result = await bulkAssignPastorToRegion({
    unitId: input.unitId,
    pastorUserId: input.pastorUserId,
    assignedBy: session.user.id,
  });
  revalidatePath("/admin/pastors");
  revalidatePath("/admin/my-enrollees");
  return result;
}

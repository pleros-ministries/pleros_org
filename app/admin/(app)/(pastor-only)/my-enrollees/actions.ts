"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/auth/require-role";
import {
  assignEnrolleeToDiscipler,
  placeEnrollmentInBranch,
  releaseDisciplerAssignment,
  requestBranchTransfer,
} from "@/lib/db/queries/sogp-branch-oversight";

function positiveInteger(value: FormDataEntryValue | null) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error("Choose a valid record.");
  return parsed;
}

async function finish(operation: () => Promise<unknown>) {
  let notice = "Saved.";
  try {
    await operation();
  } catch (error) {
    notice = error instanceof Error ? error.message : "That change could not be saved.";
  }
  revalidatePath("/admin/my-enrollees", "layout");
  redirect(`/admin/my-enrollees?notice=${encodeURIComponent(notice)}`);
}

export async function placeEnrolleeInBranchAction(formData: FormData) {
  const session = await requireAuth();
  return finish(() => placeEnrollmentInBranch({
    actorUserId: session.user.id,
    enrollmentId: positiveInteger(formData.get("enrollmentId")),
    branchId: positiveInteger(formData.get("branchId")),
  }));
}

export async function assignEnrolleeAction(formData: FormData) {
  const session = await requireAuth();
  const disciplerUserId = String(formData.get("disciplerUserId") ?? "").trim();
  return finish(() => assignEnrolleeToDiscipler({
    actorUserId: session.user.id,
    enrollmentId: positiveInteger(formData.get("enrollmentId")),
    disciplerUserId,
  }));
}

export async function releaseEnrolleeAction(formData: FormData) {
  const session = await requireAuth();
  return finish(() => releaseDisciplerAssignment({
    actorUserId: session.user.id,
    enrollmentId: positiveInteger(formData.get("enrollmentId")),
  }));
}

export async function requestEnrolleeTransferAction(formData: FormData) {
  const session = await requireAuth();
  return finish(() => requestBranchTransfer({
    actorUserId: session.user.id,
    enrollmentId: positiveInteger(formData.get("enrollmentId")),
    toBranchId: positiveInteger(formData.get("toBranchId")),
  }));
}

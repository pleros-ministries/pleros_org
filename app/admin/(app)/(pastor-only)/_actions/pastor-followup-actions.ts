"use server";

import { revalidatePath } from "next/cache";

import { requirePastorOrAdmin } from "@/lib/auth/require-role";
import { hasAdminAccess } from "@/lib/app-role";
import {
  recordPastorContact,
  setSogpEnrollmentFullness,
} from "@/lib/db/queries/pastor-followups";
import { isFullnessMembership, type FullnessMembership } from "@/lib/sogp/fullness";

export async function recordFollowUpContact(input: {
  enrollmentId: number;
  channel: "whatsapp" | "call" | "email";
  /** Admin previewing a specific pastor's queue — ignored for pastor sessions. */
  pastorUserId?: string;
}) {
  const session = await requirePastorOrAdmin();

  const pastorUserId =
    session.user.role === "pastor" ? session.user.id : input.pastorUserId;

  if (!pastorUserId) {
    return { error: "A pastor must be specified." };
  }

  if (!hasAdminAccess(session.user.role) && pastorUserId !== session.user.id) {
    return { error: "Forbidden" };
  }

  await recordPastorContact(input.enrollmentId, pastorUserId);
  revalidatePath("/admin/my-enrollees");
  revalidatePath("/admin/pastors");
  return { error: null as string | null };
}

const MAX_FULLNESS_BATCH = 1000;

/** Admin: tag one or many enrollees as Fullness / Non-Fullness, or clear it. */
export async function setEnrolleeFullness(input: {
  enrollmentIds: number[];
  value: FullnessMembership | null;
}): Promise<{ error: string | null; updated: number }> {
  const session = await requirePastorOrAdmin();
  if (!hasAdminAccess(session.user.role)) return { error: "Forbidden", updated: 0 };

  const value = input.value === null ? null : isFullnessMembership(input.value) ? input.value : undefined;
  if (value === undefined) return { error: "Choose Fullness, Non-Fullness or Not set.", updated: 0 };

  const ids = [...new Set((Array.isArray(input.enrollmentIds) ? input.enrollmentIds : []).map(Number))];
  if (!ids.length || ids.length > MAX_FULLNESS_BATCH || !ids.every((id) => Number.isInteger(id) && id > 0)) {
    return { error: `Select between 1 and ${MAX_FULLNESS_BATCH} enrollees.`, updated: 0 };
  }

  const updated = await setSogpEnrollmentFullness(ids, value);
  // Layout scope also refreshes each enrollee's detail page.
  revalidatePath("/admin/my-enrollees", "layout");
  return { error: null, updated };
}

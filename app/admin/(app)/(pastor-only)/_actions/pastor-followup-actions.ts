"use server";

import { revalidatePath } from "next/cache";

import { requirePastorOrAdmin } from "@/lib/auth/require-role";
import { hasAdminAccess } from "@/lib/app-role";
import { recordPastorContact } from "@/lib/db/queries/pastor-followups";

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
    throw new Error("A pastor must be specified.");
  }

  if (!hasAdminAccess(session.user.role) && pastorUserId !== session.user.id) {
    throw new Error("Forbidden");
  }

  await recordPastorContact(input.enrollmentId, pastorUserId);
  revalidatePath("/admin/my-enrollees");
  revalidatePath("/admin/pastors");
}

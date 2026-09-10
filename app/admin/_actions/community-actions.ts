"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/require-role";
import {
  notifyFlagResolved,
  notifyGlobalPost,
  notifyMadeLeader,
} from "@/lib/community/notify";
import {
  assignEnrollmentToUnit,
  mergeUnits,
  reassignMember,
  setUnitLeader,
  setUnitStatus,
  setUnitTelegramUrl,
} from "@/lib/db/queries/community-units";
import {
  createGlobalPost,
  editPost,
  setPostPinned,
  setPostStatus,
} from "@/lib/db/queries/community-posts";
import {
  messageThreadId,
  resolveFlag,
  setMessageStatus,
  setThreadStatus,
} from "@/lib/db/queries/community-discussion";
import { sendSogpChannelMessage } from "@/lib/telegram/sogp-broadcast";

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

export async function setCommunityUnitLeader(input: {
  unitId: number;
  enrollmentId: number | null;
}) {
  await requireAdmin();
  await setUnitLeader(input);

  if (input.enrollmentId != null) {
    const [unit] = await db
      .select({ name: schema.units.name })
      .from(schema.units)
      .where(eq(schema.units.id, input.unitId))
      .limit(1);
    if (unit) {
      after(() =>
        notifyMadeLeader({
          enrollmentId: input.enrollmentId!,
          unitName: unit.name,
        }).catch((error) =>
          console.error("Made-leader notification failed:", error),
        ),
      );
    }
  }

  revalidatePath("/admin/community");
  revalidatePath(`/dashboard/community/unit/${input.unitId}`);
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

// ─── Official posts ────────────────────────────────────────────────────────

export async function publishGlobalPost(input: {
  title: string;
  body: string;
  alsoTelegram: boolean;
}) {
  const session = await requireAdmin();
  const body = input.body.trim();
  if (!body) throw new Error("A post needs a body.");
  const title = input.title.trim() || null;

  const post = await createGlobalPost({
    authorId: session.user.id,
    title,
    body,
  });
  if (post) {
    after(() =>
      notifyGlobalPost({
        postId: post.id,
        title,
        authorId: session.user.id,
      }).catch((error) =>
        console.error("Community post notification failed:", error),
      ),
    );
  }

  if (input.alsoTelegram) {
    try {
      await sendSogpChannelMessage({
        kind: "general",
        message: title ? `${title}\n\n${body}` : body,
      });
    } catch (error) {
      console.error("Community post Telegram mirror failed:", error);
    }
  }

  revalidatePath("/admin/community");
  revalidatePath("/dashboard/community");
}

export async function updateGlobalPost(input: {
  postId: number;
  title: string;
  body: string;
}) {
  await requireAdmin();
  const body = input.body.trim();
  if (!body) throw new Error("A post needs a body.");
  await editPost({ postId: input.postId, title: input.title.trim() || null, body });
  revalidatePath("/admin/community");
  revalidatePath("/dashboard/community");
}

export async function togglePostPinned(input: {
  postId: number;
  pinned: boolean;
}) {
  await requireAdmin();
  await setPostPinned(input.postId, input.pinned);
  revalidatePath("/admin/community");
  revalidatePath("/dashboard/community");
}

export async function moderatePost(input: {
  postId: number;
  status: "published" | "hidden" | "removed";
}) {
  await requireAdmin();
  await setPostStatus(input.postId, input.status);
  revalidatePath("/admin/community");
  revalidatePath("/dashboard/community");
}

// ─── Moderation queue ─────────────────────────────────────────────────────

export async function resolveContentFlag(input: {
  flagId: number;
  targetType: "post" | "thread" | "message";
  targetId: number;
  action: "hide" | "dismiss";
}) {
  const session = await requireAdmin();

  if (input.action === "hide") {
    if (input.targetType === "post") {
      await setPostStatus(input.targetId, "hidden");
    } else if (input.targetType === "thread") {
      await setThreadStatus(input.targetId, "removed");
    } else {
      await setMessageStatus(input.targetId, "hidden");
    }
  }

  const [flag] = await db
    .select({ reporterId: schema.contentFlags.reporterId })
    .from(schema.contentFlags)
    .where(eq(schema.contentFlags.id, input.flagId))
    .limit(1);

  await resolveFlag({
    flagId: input.flagId,
    handledBy: session.user.id,
    status: input.action === "hide" ? "actioned" : "dismissed",
  });

  if (flag) {
    after(() =>
      notifyFlagResolved({
        reporterId: flag.reporterId,
        outcome: input.action === "hide" ? "actioned" : "dismissed",
      }).catch((error) =>
        console.error("Flag-resolved notification failed:", error),
      ),
    );
  }

  revalidatePath("/admin/community");
  revalidatePath("/dashboard/community");
  if (input.targetType === "message") {
    const threadId = await messageThreadId(input.targetId);
    if (threadId != null) {
      revalidatePath(`/dashboard/community/discussion/${threadId}`);
    }
  }
  if (input.targetType === "thread") {
    revalidatePath("/dashboard/community/discussion");
  }
}

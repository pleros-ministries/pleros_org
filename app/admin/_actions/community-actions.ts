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
  resolveFlag,
  setPostPinned,
  setPostStatus,
} from "@/lib/db/queries/community-posts";
import {
  commentPostId,
  setCommentStatus,
} from "@/lib/db/queries/community-comments";
import type { PostImage } from "@/lib/db/queries/community-posts";
import { setMessageStatus } from "@/lib/db/queries/community-messages";
import {
  clearRestriction,
  restrictMember,
} from "@/lib/db/queries/community-restrictions";
import { setDiscipleshipGroupStatus } from "@/lib/db/queries/sogp-discipleship";
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
  images?: PostImage[];
}) {
  const session = await requireAdmin();
  const body = input.body.trim();
  if (!body) return { error: "A post needs a body." };
  const title = input.title.trim() || null;

  const post = await createGlobalPost({
    authorId: session.user.id,
    title,
    body,
    images: input.images ?? [],
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
  return { error: null as string | null };
}

export async function updateGlobalPost(input: {
  postId: number;
  title: string;
  body: string;
  images?: PostImage[];
}) {
  await requireAdmin();
  const body = input.body.trim();
  if (!body) return { error: "A post needs a body." };
  await editPost({
    postId: input.postId,
    title: input.title.trim() || null,
    body,
    images: input.images,
  });
  revalidatePath("/admin/community");
  revalidatePath("/dashboard/community");
  return { error: null as string | null };
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

/**
 * Closes a flag. "hide" hides a post or comment, or removes a reported
 * private message. The target is read from the flag itself, never the client.
 */
export async function resolveContentFlag(input: {
  flagId: number;
  action: "hide" | "dismiss";
}) {
  const session = await requireAdmin();

  const [flag] = await db
    .select({
      reporterId: schema.contentFlags.reporterId,
      targetType: schema.contentFlags.targetType,
      targetId: schema.contentFlags.targetId,
    })
    .from(schema.contentFlags)
    .where(eq(schema.contentFlags.id, input.flagId))
    .limit(1);
  if (!flag) return;

  if (input.action === "hide") {
    if (flag.targetType === "post") {
      await setPostStatus(flag.targetId, "hidden");
    } else if (flag.targetType === "comment") {
      await setCommentStatus(flag.targetId, "hidden");
    } else if (flag.targetType === "message") {
      await setMessageStatus(flag.targetId, "removed");
    }
  }

  await resolveFlag({
    flagId: input.flagId,
    handledBy: session.user.id,
    status: input.action === "hide" ? "actioned" : "dismissed",
  });

  after(() =>
    notifyFlagResolved({
      reporterId: flag.reporterId,
      outcome: input.action === "hide" ? "actioned" : "dismissed",
    }).catch((error) =>
      console.error("Flag-resolved notification failed:", error),
    ),
  );

  revalidatePath("/admin/community");
  revalidatePath("/dashboard/community");
  if (flag.targetType === "comment") {
    const postId = await commentPostId(flag.targetId);
    if (postId != null) {
      revalidatePath(`/dashboard/community/post/${postId}`);
    }
  }
}

// ─── Member restrictions ──────────────────────────────────────────────────

/** Pause a member's posting or private messaging after misuse. */
export async function restrictCommunityMember(input: {
  userId: string;
  posting?: boolean;
  messaging?: boolean;
  reason?: string;
}) {
  const session = await requireAdmin();
  if (!input.userId) return;
  await restrictMember({ ...input, setBy: session.user.id });
  revalidatePath("/admin/community");
  revalidatePath("/dashboard/community");
}

/** Lift every pause on a member. */
export async function restoreCommunityMember(userId: string) {
  await requireAdmin();
  await clearRestriction(userId);
  revalidatePath("/admin/community");
  revalidatePath("/dashboard/community");
}

/** Pause or restore a learner's discipleship group (misuse handling). */
export async function updateDiscipleshipGroupStatus(input: {
  groupId: number;
  status: "active" | "archived";
}) {
  await requireAdmin();
  await setDiscipleshipGroupStatus(input.groupId, input.status);
  revalidatePath("/admin/community");
  revalidatePath("/dashboard/sogp/discipleship");
}

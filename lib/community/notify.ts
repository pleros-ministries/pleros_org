import { eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendPushToUser } from "@/lib/push/send";

type Kind =
  | "official_post"
  | "post_comment"
  | "comment_reply"
  | "made_leader"
  | "flag_resolved"
  | "leader_nudge";

const PUSH_COPY: Record<Kind, { title: string }> = {
  official_post: { title: "New Pleros update" },
  post_comment: { title: "New comment on your post" },
  comment_reply: { title: "Someone replied to you" },
  made_leader: { title: "You're now a unit leader" },
  flag_resolved: { title: "Your report was reviewed" },
  leader_nudge: { title: "A note from your unit leader" },
};

/**
 * Writes an in-app notification for each recipient and fires an opt-in push.
 * De-duplicates recipients and never notifies the actor.
 */
export async function notify(input: {
  userIds: string[];
  kind: Kind;
  payload: Record<string, unknown>;
  pushBody?: string;
  pushUrl?: string;
  exclude?: string;
}) {
  const recipients = [...new Set(input.userIds)].filter(
    (id) => id && id !== input.exclude,
  );
  if (recipients.length === 0) return;

  await db.insert(schema.communityNotifications).values(
    recipients.map((userId) => ({
      userId,
      kind: input.kind,
      payload: input.payload,
    })),
  );

  if (input.pushBody) {
    await Promise.allSettled(
      recipients.map((userId) =>
        sendPushToUser(userId, {
          title: PUSH_COPY[input.kind].title,
          body: input.pushBody!,
          url: input.pushUrl ?? "/dashboard/community",
        }),
      ),
    );
  }
}

/** Fan a new global post out to every enrolled learner. */
export async function notifyGlobalPost(input: {
  postId: number;
  title: string | null;
  authorId: string;
}) {
  const rows = await db
    .selectDistinct({ userId: schema.sogpEnrollments.userId })
    .from(schema.sogpEnrollments);
  await notify({
    userIds: rows.map((r) => r.userId),
    kind: "official_post",
    payload: { postId: input.postId, title: input.title },
    pushBody: input.title ?? "Open the community to read it.",
    pushUrl: "/dashboard/community",
    exclude: input.authorId,
  });
}

/** Notify a post's author that someone commented on it. */
export async function notifyPostComment(input: {
  postId: number;
  postTitle: string | null;
  postAuthorId: string;
  actorId: string;
}) {
  if (!input.postAuthorId || input.postAuthorId === input.actorId) return;
  await notify({
    userIds: [input.postAuthorId],
    kind: "post_comment",
    payload: { postId: input.postId, title: input.postTitle },
    pushBody: input.postTitle
      ? `On "${input.postTitle}"`
      : "Someone commented on your post.",
    pushUrl: `/dashboard/community/post/${input.postId}`,
    exclude: input.actorId,
  });
}

/** Notify the author of a comment that someone replied to it. */
export async function notifyCommentReply(input: {
  postId: number;
  postTitle: string | null;
  parentAuthorId: string | null;
  actorId: string;
}) {
  if (!input.parentAuthorId || input.parentAuthorId === input.actorId) return;
  await notify({
    userIds: [input.parentAuthorId],
    kind: "comment_reply",
    payload: { postId: input.postId, title: input.postTitle },
    pushBody: input.postTitle
      ? `On "${input.postTitle}"`
      : "Someone replied to your comment.",
    pushUrl: `/dashboard/community/post/${input.postId}`,
    exclude: input.actorId,
  });
}

export async function notifyMadeLeader(input: {
  enrollmentId: number;
  unitName: string;
}) {
  const [enrolment] = await db
    .select({ userId: schema.sogpEnrollments.userId })
    .from(schema.sogpEnrollments)
    .where(eq(schema.sogpEnrollments.id, input.enrollmentId))
    .limit(1);
  if (!enrolment) return;
  await notify({
    userIds: [enrolment.userId],
    kind: "made_leader",
    payload: { unitName: input.unitName },
    pushBody: `You now lead ${input.unitName}.`,
  });
}

export async function notifyFlagResolved(input: {
  reporterId: string;
  outcome: "actioned" | "dismissed";
}) {
  await notify({
    userIds: [input.reporterId],
    kind: "flag_resolved",
    payload: { outcome: input.outcome },
  });
}

export async function notifyLeaderNudge(input: {
  enrollmentIds: number[];
  unitName: string;
  message: string;
}) {
  if (input.enrollmentIds.length === 0) return;
  const rows = await db
    .select({
      userId: schema.sogpEnrollments.userId,
      id: schema.sogpEnrollments.id,
    })
    .from(schema.sogpEnrollments)
    .where(inArray(schema.sogpEnrollments.id, input.enrollmentIds));
  await notify({
    userIds: rows.map((r) => r.userId),
    kind: "leader_nudge",
    payload: { unitName: input.unitName, message: input.message },
    pushBody: input.message.slice(0, 120),
  });
}

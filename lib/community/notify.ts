import { eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendPushToUser } from "@/lib/push/send";

type Kind =
  | "official_post"
  | "thread_reply"
  | "message_reply"
  | "made_leader"
  | "flag_resolved"
  | "leader_nudge";

const PUSH_COPY: Record<Kind, { title: string }> = {
  official_post: { title: "New Pleros update" },
  thread_reply: { title: "New reply in your discussion" },
  message_reply: { title: "Someone replied to you" },
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

/** Notify the thread author + the replied-to author of a new message. */
export async function notifyThreadReply(input: {
  threadId: number;
  threadTitle: string;
  actorId: string;
  replyToAuthorId?: string | null;
}) {
  const [thread] = await db
    .select({ authorId: schema.communityThreads.authorId })
    .from(schema.communityThreads)
    .where(eq(schema.communityThreads.id, input.threadId))
    .limit(1);

  const targets = new Set<string>();
  if (thread?.authorId) targets.add(thread.authorId);
  if (input.replyToAuthorId) targets.add(input.replyToAuthorId);
  targets.delete(input.actorId);
  if (targets.size === 0) return;

  await notify({
    userIds: [...targets],
    kind: input.replyToAuthorId ? "message_reply" : "thread_reply",
    payload: { threadId: input.threadId, title: input.threadTitle },
    pushBody: `In "${input.threadTitle}"`,
    pushUrl: `/dashboard/community/discussion/${input.threadId}`,
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

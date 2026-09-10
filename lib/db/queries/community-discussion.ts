import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { CommunityContext } from "@/lib/community/context";
import {
  assertCanCreateThread,
  assertCanPostMessage,
} from "@/lib/community/rate-limit";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Someone";
}

const dateFmt = (d: Date) => d.toISOString();

export type ThreadSummary = {
  id: number;
  scope: "global" | "unit";
  unitId: number | null;
  title: string;
  authorName: string;
  status: "open" | "locked" | "removed";
  messageCount: number;
  lastMessageAt: string;
  canModerate: boolean;
};

function scopeWhere(ctx: CommunityContext) {
  return ctx.unit
    ? or(
        eq(schema.communityThreads.scope, "global"),
        and(
          eq(schema.communityThreads.scope, "unit"),
          eq(schema.communityThreads.unitId, ctx.unit.id),
        ),
      )
    : eq(schema.communityThreads.scope, "global");
}

function canModerateThreadRow(
  ctx: CommunityContext,
  row: { scope: "global" | "unit"; unitId: number | null },
) {
  return (
    ctx.isAdmin ||
    (ctx.isUnitLeader && row.scope === "unit" && row.unitId === ctx.unit?.id)
  );
}

export async function listThreads(
  ctx: CommunityContext,
): Promise<ThreadSummary[]> {
  const rows = await db
    .select({
      thread: schema.communityThreads,
      authorName: schema.users.name,
    })
    .from(schema.communityThreads)
    .innerJoin(
      schema.users,
      eq(schema.users.id, schema.communityThreads.authorId),
    )
    .where(
      and(
        sql`${schema.communityThreads.status} <> 'removed'`,
        scopeWhere(ctx),
      ),
    )
    .orderBy(desc(schema.communityThreads.lastMessageAt))
    .limit(100);

  return rows.map((row) => ({
    id: row.thread.id,
    scope: row.thread.scope,
    unitId: row.thread.unitId,
    title: row.thread.title,
    authorName: firstName(row.authorName),
    status: row.thread.status,
    messageCount: row.thread.messageCount,
    lastMessageAt: dateFmt(row.thread.lastMessageAt),
    canModerate: canModerateThreadRow(ctx, row.thread),
  }));
}

export type ThreadMessage = {
  id: number;
  body: string | null;
  authorName: string;
  isMine: boolean;
  replyToId: number | null;
  createdAt: string;
  status: "visible" | "hidden" | "removed";
  reactionCount: number;
  reactedByMe: boolean;
  canModerate: boolean;
};

export type ThreadDetail = {
  id: number;
  scope: "global" | "unit";
  unitId: number | null;
  title: string;
  status: "open" | "locked" | "removed";
  authorName: string;
  canModerate: boolean;
  messages: ThreadMessage[];
};

export async function getThread(
  ctx: CommunityContext,
  threadId: number,
): Promise<ThreadDetail | null> {
  const [thread] = await db
    .select({
      thread: schema.communityThreads,
      authorName: schema.users.name,
    })
    .from(schema.communityThreads)
    .innerJoin(
      schema.users,
      eq(schema.users.id, schema.communityThreads.authorId),
    )
    .where(eq(schema.communityThreads.id, threadId))
    .limit(1);
  if (!thread || thread.thread.status === "removed") return null;

  // Scope guard.
  const inScope =
    thread.thread.scope === "global" ||
    ctx.isAdmin ||
    thread.thread.unitId === ctx.unit?.id;
  if (!inScope) return null;

  const canModerate = canModerateThreadRow(ctx, thread.thread);

  const messageRows = await db
    .select({
      message: schema.communityMessages,
      authorName: schema.users.name,
      reactionCount: sql<number>`(
        select count(*) from ${schema.messageReactions}
        where ${schema.messageReactions.messageId} = ${schema.communityMessages.id}
      )::int`,
      reactedByMe: sql<boolean>`exists (
        select 1 from ${schema.messageReactions}
        where ${schema.messageReactions.messageId} = ${schema.communityMessages.id}
          and ${schema.messageReactions.userId} = ${ctx.userId}
      )`,
    })
    .from(schema.communityMessages)
    .innerJoin(
      schema.users,
      eq(schema.users.id, schema.communityMessages.authorId),
    )
    .where(
      and(
        eq(schema.communityMessages.threadId, threadId),
        sql`${schema.communityMessages.status} <> 'removed'`,
      ),
    )
    .orderBy(asc(schema.communityMessages.createdAt));

  return {
    id: thread.thread.id,
    scope: thread.thread.scope,
    unitId: thread.thread.unitId,
    title: thread.thread.title,
    status: thread.thread.status,
    authorName: firstName(thread.authorName),
    canModerate,
    messages: messageRows.map((row) => ({
      id: row.message.id,
      body: row.message.status === "hidden" ? null : row.message.body,
      authorName: firstName(row.authorName),
      isMine: row.message.authorId === ctx.userId,
      replyToId: row.message.replyToId,
      createdAt: dateFmt(row.message.createdAt),
      status: row.message.status,
      reactionCount: row.reactionCount,
      reactedByMe: row.reactedByMe,
      canModerate,
    })),
  };
}

export async function createThread(
  ctx: CommunityContext,
  input: { scope: "global" | "unit"; title: string; body: string },
): Promise<{ id: number }> {
  await assertCanCreateThread(ctx.userId);
  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) throw new Error("A discussion needs a title.");
  if (!body) throw new Error("A discussion needs an opening message.");
  if (input.scope === "unit" && !ctx.unit) {
    throw new Error("You are not in a unit yet.");
  }

  const now = new Date();
  const [thread] = await db
    .insert(schema.communityThreads)
    .values({
      scope: input.scope,
      unitId: input.scope === "unit" ? ctx.unit!.id : null,
      authorId: ctx.userId,
      title,
      lastMessageAt: now,
      messageCount: 1,
    })
    .returning({ id: schema.communityThreads.id });

  await db.insert(schema.communityMessages).values({
    threadId: thread.id,
    authorId: ctx.userId,
    body,
  });

  return thread;
}

export async function postMessage(
  ctx: CommunityContext,
  input: { threadId: number; body: string; replyToId?: number | null },
): Promise<{ id: number }> {
  await assertCanPostMessage(ctx.userId);
  const body = input.body.trim();
  if (!body) throw new Error("Message cannot be empty.");

  const [thread] = await db
    .select({
      scope: schema.communityThreads.scope,
      unitId: schema.communityThreads.unitId,
      status: schema.communityThreads.status,
    })
    .from(schema.communityThreads)
    .where(eq(schema.communityThreads.id, input.threadId))
    .limit(1);
  if (!thread || thread.status !== "open") {
    throw new Error("This discussion is closed.");
  }
  const inScope =
    thread.scope === "global" ||
    ctx.isAdmin ||
    thread.unitId === ctx.unit?.id;
  if (!inScope) throw new Error("Forbidden");

  // Only allow replying to a message that lives in this thread and isn't
  // itself a reply (one level of nesting).
  let replyToId: number | null = null;
  if (input.replyToId) {
    const [parent] = await db
      .select({
        threadId: schema.communityMessages.threadId,
        replyToId: schema.communityMessages.replyToId,
      })
      .from(schema.communityMessages)
      .where(eq(schema.communityMessages.id, input.replyToId))
      .limit(1);
    if (parent && parent.threadId === input.threadId && parent.replyToId == null) {
      replyToId = input.replyToId;
    }
  }

  const now = new Date();
  const [message] = await db
    .insert(schema.communityMessages)
    .values({ threadId: input.threadId, authorId: ctx.userId, body, replyToId })
    .returning({ id: schema.communityMessages.id });

  await db
    .update(schema.communityThreads)
    .set({
      messageCount: sql`${schema.communityThreads.messageCount} + 1`,
      lastMessageAt: now,
      updatedAt: now,
    })
    .where(eq(schema.communityThreads.id, input.threadId));

  return message;
}

export async function toggleMessageReaction(input: {
  messageId: number;
  userId: string;
}): Promise<{ reacted: boolean }> {
  const existing = await db
    .select({ id: schema.messageReactions.id })
    .from(schema.messageReactions)
    .where(
      and(
        eq(schema.messageReactions.messageId, input.messageId),
        eq(schema.messageReactions.userId, input.userId),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    await db
      .delete(schema.messageReactions)
      .where(
        and(
          eq(schema.messageReactions.messageId, input.messageId),
          eq(schema.messageReactions.userId, input.userId),
        ),
      );
    return { reacted: false };
  }
  await db
    .insert(schema.messageReactions)
    .values({ messageId: input.messageId, userId: input.userId })
    .onConflictDoNothing();
  return { reacted: true };
}

// ─── Moderation ───────────────────────────────────────────────────────────

export async function flagContent(input: {
  reporterId: string;
  targetType: "post" | "thread" | "message";
  targetId: number;
  reason: string;
}) {
  await db
    .insert(schema.contentFlags)
    .values({
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason.trim().slice(0, 500) || "Reported",
    })
    .onConflictDoNothing();
}

/** Guard that `ctx` may moderate a given thread. */
export async function assertCanModerateThread(
  ctx: CommunityContext,
  threadId: number,
) {
  const [thread] = await db
    .select({
      scope: schema.communityThreads.scope,
      unitId: schema.communityThreads.unitId,
    })
    .from(schema.communityThreads)
    .where(eq(schema.communityThreads.id, threadId))
    .limit(1);
  if (!thread) throw new Error("Thread not found");
  if (!canModerateThreadRow(ctx, thread)) throw new Error("Forbidden");
}

export async function setThreadStatus(
  threadId: number,
  status: "open" | "locked" | "removed",
) {
  await db
    .update(schema.communityThreads)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.communityThreads.id, threadId));
}

export async function setMessageStatus(
  messageId: number,
  status: "visible" | "hidden" | "removed",
) {
  await db
    .update(schema.communityMessages)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.communityMessages.id, messageId));
}

export async function messageThreadId(messageId: number): Promise<number | null> {
  const [row] = await db
    .select({ threadId: schema.communityMessages.threadId })
    .from(schema.communityMessages)
    .where(eq(schema.communityMessages.id, messageId))
    .limit(1);
  return row?.threadId ?? null;
}

export type OpenFlag = {
  id: number;
  targetType: "post" | "thread" | "message";
  targetId: number;
  reason: string;
  reporterName: string;
  createdAt: string;
  preview: string | null;
};

/** Open flags an admin (all) or a leader (own unit) should action. */
export async function listOpenFlags(
  ctx: CommunityContext,
): Promise<OpenFlag[]> {
  const rows = await db
    .select({
      flag: schema.contentFlags,
      reporterName: schema.users.name,
    })
    .from(schema.contentFlags)
    .innerJoin(schema.users, eq(schema.users.id, schema.contentFlags.reporterId))
    .where(eq(schema.contentFlags.status, "open"))
    .orderBy(asc(schema.contentFlags.createdAt))
    .limit(200);

  // Resolve a short preview + a leader-scope filter.
  const postIds = rows
    .filter((r) => r.flag.targetType === "post")
    .map((r) => r.flag.targetId);
  const threadIds = rows
    .filter((r) => r.flag.targetType === "thread")
    .map((r) => r.flag.targetId);
  const messageIds = rows
    .filter((r) => r.flag.targetType === "message")
    .map((r) => r.flag.targetId);

  const [posts, threads, messages] = await Promise.all([
    postIds.length
      ? db
          .select({
            id: schema.communityPosts.id,
            body: schema.communityPosts.body,
            unitId: schema.communityPosts.unitId,
            scope: schema.communityPosts.scope,
          })
          .from(schema.communityPosts)
          .where(inArray(schema.communityPosts.id, postIds))
      : Promise.resolve([]),
    threadIds.length
      ? db
          .select({
            id: schema.communityThreads.id,
            title: schema.communityThreads.title,
            unitId: schema.communityThreads.unitId,
            scope: schema.communityThreads.scope,
          })
          .from(schema.communityThreads)
          .where(inArray(schema.communityThreads.id, threadIds))
      : Promise.resolve([]),
    messageIds.length
      ? db
          .select({
            id: schema.communityMessages.id,
            body: schema.communityMessages.body,
            threadId: schema.communityMessages.threadId,
          })
          .from(schema.communityMessages)
          .where(inArray(schema.communityMessages.id, messageIds))
      : Promise.resolve([]),
  ]);

  const messageThreads = messages.length
    ? await db
        .select({
          id: schema.communityThreads.id,
          unitId: schema.communityThreads.unitId,
          scope: schema.communityThreads.scope,
        })
        .from(schema.communityThreads)
        .where(
          inArray(
            schema.communityThreads.id,
            messages.map((m) => m.threadId),
          ),
        )
    : [];

  const postById = new Map(posts.map((p) => [p.id, p]));
  const threadById = new Map(threads.map((t) => [t.id, t]));
  const messageById = new Map(messages.map((m) => [m.id, m]));
  const threadMetaById = new Map(messageThreads.map((t) => [t.id, t]));

  function unitScopeOf(flag: (typeof rows)[number]["flag"]): {
    scope: "global" | "unit";
    unitId: number | null;
  } | null {
    if (flag.targetType === "post") {
      const p = postById.get(flag.targetId);
      return p ? { scope: p.scope, unitId: p.unitId } : null;
    }
    if (flag.targetType === "thread") {
      const t = threadById.get(flag.targetId);
      return t ? { scope: t.scope, unitId: t.unitId } : null;
    }
    const m = messageById.get(flag.targetId);
    if (!m) return null;
    const t = threadMetaById.get(m.threadId);
    return t ? { scope: t.scope, unitId: t.unitId } : null;
  }

  return rows
    .filter((row) => {
      if (ctx.isAdmin) return true;
      const meta = unitScopeOf(row.flag);
      return (
        meta &&
        meta.scope === "unit" &&
        meta.unitId === ctx.unit?.id &&
        ctx.isUnitLeader
      );
    })
    .map((row) => {
      let preview: string | null = null;
      if (row.flag.targetType === "post") {
        preview = postById.get(row.flag.targetId)?.body.slice(0, 80) ?? null;
      } else if (row.flag.targetType === "thread") {
        preview = threadById.get(row.flag.targetId)?.title ?? null;
      } else {
        preview = messageById.get(row.flag.targetId)?.body.slice(0, 80) ?? null;
      }
      return {
        id: row.flag.id,
        targetType: row.flag.targetType,
        targetId: row.flag.targetId,
        reason: row.flag.reason,
        reporterName: firstName(row.reporterName),
        createdAt: dateFmt(row.flag.createdAt),
        preview,
      };
    });
}

export async function resolveFlag(input: {
  flagId: number;
  handledBy: string;
  status: "actioned" | "dismissed";
}) {
  await db
    .update(schema.contentFlags)
    .set({
      status: input.status,
      handledBy: input.handledBy,
      handledAt: new Date(),
    })
    .where(eq(schema.contentFlags.id, input.flagId));
}

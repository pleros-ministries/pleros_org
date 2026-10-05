import {
  and,
  asc,
  desc,
  eq,
  gt,
  ilike,
  inArray,
  isNotNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { transactionDb } from "@/lib/db/transaction";
import { hasAdminAccess } from "@/lib/app-role";
import type { CommunityContext } from "@/lib/community/context";
import {
  DM_PAGE_SIZE,
  evaluateCanMessage,
  isMinor,
  messageDenialCopy,
  messagePreview,
  minorBirthYearFloor,
  pairKey,
  type MessageDecision,
  type MessagingParty,
  type MessagingRelation,
} from "@/lib/community/messaging";
import { firstNameOf } from "@/lib/community/visibility";

/**
 * Private messages between two community members. Peers only ever see a first
 * name and a group name; message text is returned to the two participants and,
 * for a reported message only, to admins through the moderation queue.
 */

const TEAM_LABEL = "Pleros team";
const PASTOR_LABEL = "Pastor";

// ─── Who is messaging whom ─────────────────────────────────────────────────

type MemberProfile = {
  party: MessagingParty;
  firstName: string;
  /** Group name, or the team label for an admin without an enrolment. */
  unitName: string | null;
  units: Array<{ unitId: number; isLeader: boolean }>;
  enrollmentIds: number[];
};

async function loadMemberProfiles(
  userIds: string[],
): Promise<Map<string, MemberProfile>> {
  const ids = [...new Set(userIds)];
  const profiles = new Map<string, MemberProfile>();
  if (ids.length === 0) return profiles;

  const rows = await db
    .select({
      userId: schema.users.id,
      name: schema.users.name,
      role: schema.users.role,
      enrollmentId: schema.sogpEnrollments.id,
      firstName: schema.sogpEnrollments.firstName,
      birthYear: schema.sogpEnrollments.birthYear,
      unitId: schema.unitMembers.unitId,
      unitRole: schema.unitMembers.role,
      unitName: schema.units.name,
      messagingBlocked: schema.communityRestrictions.messagingBlocked,
    })
    .from(schema.users)
    .leftJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.userId, schema.users.id),
    )
    .leftJoin(
      schema.unitMembers,
      eq(schema.unitMembers.enrollmentId, schema.sogpEnrollments.id),
    )
    .leftJoin(schema.units, eq(schema.units.id, schema.unitMembers.unitId))
    .leftJoin(
      schema.communityRestrictions,
      eq(schema.communityRestrictions.userId, schema.users.id),
    )
    .where(inArray(schema.users.id, ids))
    .orderBy(schema.sogpEnrollments.createdAt);

  // A learner can hold several enrolments: the oldest names them, any one
  // makes them a member, and the latest year of birth is the safest reading.
  const latestBirthYear = new Map<string, number>();
  for (const row of rows) {
    let profile = profiles.get(row.userId);
    if (!profile) {
      const isAdmin = hasAdminAccess(row.role);
      profile = {
        party: {
          userId: row.userId,
          inCommunity: isAdmin,
          isAdmin,
          isMinor: false,
          messagingBlocked: row.messagingBlocked ?? false,
        },
        firstName: firstNameOf(row.firstName || row.name),
        unitName: row.unitName ?? (isAdmin ? TEAM_LABEL : null),
        units: [],
        enrollmentIds: [],
      };
      profiles.set(row.userId, profile);
    }
    if (row.enrollmentId == null) continue;

    profile.party.inCommunity = true;
    profile.enrollmentIds.push(row.enrollmentId);
    if (row.unitId != null) {
      profile.units.push({
        unitId: row.unitId,
        isLeader: row.unitRole === "leader",
      });
    }
    if (row.birthYear != null) {
      latestBirthYear.set(
        row.userId,
        Math.max(latestBirthYear.get(row.userId) ?? row.birthYear, row.birthYear),
      );
    }
  }
  for (const [userId, year] of latestBirthYear) {
    profiles.get(userId)!.party.isMinor = isMinor(year);
  }

  // The pastor assigned to a region is part of the community and leads its
  // unit for messaging purposes, with or without an enrolment of their own.
  const regions = await db
    .select({
      userId: schema.pastorRegions.pastorUserId,
      unitId: schema.pastorRegions.unitId,
    })
    .from(schema.pastorRegions)
    .where(inArray(schema.pastorRegions.pastorUserId, ids));
  for (const region of regions) {
    const profile = profiles.get(region.userId);
    if (!profile) continue;
    profile.party.inCommunity = true;
    profile.units.push({ unitId: region.unitId, isLeader: true });
    if (profile.unitName == null) profile.unitName = PASTOR_LABEL;
  }
  return profiles;
}

/** Active discipler links between two members, in either direction. */
async function loadDisciplerLinks(a: MemberProfile, b: MemberProfile) {
  const none = { aDisciplesB: false, bDisciplesA: false };
  if (a.enrollmentIds.length === 0 || b.enrollmentIds.length === 0) return none;

  const rows = await db
    .select({
      leaderEnrollmentId: schema.discipleshipGroups.leaderEnrollmentId,
    })
    .from(schema.discipleshipMemberships)
    .innerJoin(
      schema.discipleshipGroups,
      eq(schema.discipleshipGroups.id, schema.discipleshipMemberships.groupId),
    )
    .where(
      and(
        eq(schema.discipleshipMemberships.status, "active"),
        eq(schema.discipleshipGroups.status, "active"),
        or(
          and(
            inArray(schema.discipleshipGroups.leaderEnrollmentId, a.enrollmentIds),
            inArray(
              schema.discipleshipMemberships.discipleEnrollmentId,
              b.enrollmentIds,
            ),
          ),
          and(
            inArray(schema.discipleshipGroups.leaderEnrollmentId, b.enrollmentIds),
            inArray(
              schema.discipleshipMemberships.discipleEnrollmentId,
              a.enrollmentIds,
            ),
          ),
        ),
      ),
    );

  return {
    aDisciplesB: rows.some((r) => a.enrollmentIds.includes(r.leaderEnrollmentId)),
    bDisciplesA: rows.some((r) => b.enrollmentIds.includes(r.leaderEnrollmentId)),
  };
}

function leadsUnitOf(leader: MemberProfile, member: MemberProfile): boolean {
  return leader.units.some(
    (unit) =>
      unit.isLeader && member.units.some((other) => other.unitId === unit.unitId),
  );
}

async function loadRelation(
  sender: MemberProfile,
  recipient: MemberProfile,
): Promise<MessagingRelation> {
  const senderId = sender.party.userId;
  const recipientId = recipient.party.userId;
  // Guide links only matter when an under-18 is involved.
  const needsGuides = sender.party.isMinor || recipient.party.isMinor;

  const [blocks, links] = await Promise.all([
    db
      .select({ id: schema.userBlocks.id })
      .from(schema.userBlocks)
      .where(
        or(
          and(
            eq(schema.userBlocks.blockerId, senderId),
            eq(schema.userBlocks.blockedId, recipientId),
          ),
          and(
            eq(schema.userBlocks.blockerId, recipientId),
            eq(schema.userBlocks.blockedId, senderId),
          ),
        ),
      )
      .limit(1),
    needsGuides
      ? loadDisciplerLinks(sender, recipient)
      : Promise.resolve({ aDisciplesB: false, bDisciplesA: false }),
  ]);

  return {
    blockedEitherWay: blocks.length > 0,
    senderGuidesRecipient:
      needsGuides && (leadsUnitOf(sender, recipient) || links.aDisciplesB),
    recipientGuidesSender:
      needsGuides && (leadsUnitOf(recipient, sender) || links.bDisciplesA),
  };
}

export type MessagingCheck = {
  decision: MessageDecision;
  senderFirstName: string;
  recipient: { firstName: string; unitName: string | null } | null;
};

/** The single rule check behind opening a conversation and sending into one. */
export async function checkCanMessage(
  senderId: string,
  recipientId: string,
): Promise<MessagingCheck> {
  const profiles = await loadMemberProfiles([senderId, recipientId]);
  const sender = profiles.get(senderId);
  const recipient = profiles.get(recipientId);
  const recipientCard = recipient
    ? { firstName: recipient.firstName, unitName: recipient.unitName }
    : null;
  const senderFirstName = sender?.firstName ?? "Someone";

  if (senderId === recipientId) {
    return {
      decision: { ok: false, reason: "self" },
      senderFirstName,
      recipient: recipientCard,
    };
  }
  if (!sender) {
    return {
      decision: { ok: false, reason: "sender_unavailable" },
      senderFirstName,
      recipient: recipientCard,
    };
  }
  if (!recipient) {
    return {
      decision: { ok: false, reason: "recipient_unavailable" },
      senderFirstName,
      recipient: null,
    };
  }

  const relation = await loadRelation(sender, recipient);
  return {
    decision: evaluateCanMessage(sender.party, recipient.party, relation),
    senderFirstName,
    recipient: recipientCard,
  };
}

// ─── Conversations ─────────────────────────────────────────────────────────

export async function findConversationId(
  userA: string,
  userB: string,
): Promise<number | null> {
  const [row] = await db
    .select({ id: schema.dmConversations.id })
    .from(schema.dmConversations)
    .where(eq(schema.dmConversations.pairKey, pairKey(userA, userB)))
    .limit(1);
  return row?.id ?? null;
}

/**
 * Returns the one conversation for a pair, creating it when needed. Every
 * step is idempotent (unique `pair_key`, unique participant rows), so a retry
 * or a race repairs itself without a transaction.
 */
export async function findOrCreateConversation(
  userA: string,
  userB: string,
): Promise<number> {
  const key = pairKey(userA, userB);
  await db
    .insert(schema.dmConversations)
    .values({ pairKey: key })
    .onConflictDoNothing({ target: schema.dmConversations.pairKey });

  const [conversation] = await db
    .select({ id: schema.dmConversations.id })
    .from(schema.dmConversations)
    .where(eq(schema.dmConversations.pairKey, key))
    .limit(1);
  if (!conversation) throw new Error("Could not open the conversation.");

  await db
    .insert(schema.dmParticipants)
    .values([
      { conversationId: conversation.id, userId: userA },
      { conversationId: conversation.id, userId: userB },
    ])
    .onConflictDoNothing();

  return conversation.id;
}

/** The other participant's id, or null when `userId` is not in the conversation. */
export async function getConversationPartnerId(
  userId: string,
  conversationId: number,
): Promise<string | null> {
  const participants = await db
    .select({ userId: schema.dmParticipants.userId })
    .from(schema.dmParticipants)
    .where(eq(schema.dmParticipants.conversationId, conversationId));
  if (!participants.some((p) => p.userId === userId)) return null;
  return participants.find((p) => p.userId !== userId)?.userId ?? null;
}

export type ConversationDetail = {
  id: number;
  other: { userId: string; name: string; unitName: string | null };
  blockedByMe: boolean;
  /** Shown in place of the composer when the viewer cannot send; null when they can. */
  sendBlockedReason: string | null;
};

export async function getConversationForUser(
  userId: string,
  conversationId: number,
): Promise<ConversationDetail | null> {
  const otherId = await getConversationPartnerId(userId, conversationId);
  if (!otherId) return null;

  const [check, blockedByMe] = await Promise.all([
    checkCanMessage(userId, otherId),
    hasBlocked(userId, otherId),
  ]);

  return {
    id: conversationId,
    other: {
      userId: otherId,
      name: check.recipient?.firstName ?? "Member",
      unitName: check.recipient?.unitName ?? null,
    },
    blockedByMe,
    sendBlockedReason: check.decision.ok
      ? null
      : messageDenialCopy(check.decision.reason),
  };
}

export type ConversationSummary = {
  id: number;
  otherUserId: string;
  otherName: string;
  otherUnitName: string | null;
  lastMessagePreview: string | null;
  lastMessageMine: boolean;
  lastMessageAt: string;
  unreadCount: number;
};

/** The viewer's inbox: conversations with at least one message, newest first. */
export async function listConversations(
  userId: string,
): Promise<ConversationSummary[]> {
  const me = alias(schema.dmParticipants, "me");
  const other = alias(schema.dmParticipants, "other");

  const rows = await db
    .select({
      id: schema.dmConversations.id,
      lastMessageAt: schema.dmConversations.lastMessageAt,
      otherUserId: other.userId,
      lastMessageId: sql<number | null>`(
        select max(${schema.dmMessages.id}) from ${schema.dmMessages}
        where ${schema.dmMessages.conversationId} = ${schema.dmConversations.id}
      )`,
      unreadCount: sql<number>`(
        select count(*) from ${schema.dmMessages}
        where ${schema.dmMessages.conversationId} = ${schema.dmConversations.id}
          and ${schema.dmMessages.id} > ${me.lastReadMessageId}
          and ${schema.dmMessages.senderId} <> ${userId}
          and ${schema.dmMessages.status} = 'visible'
      )::int`,
    })
    .from(schema.dmConversations)
    .innerJoin(
      me,
      and(
        eq(me.conversationId, schema.dmConversations.id),
        eq(me.userId, userId),
      ),
    )
    .innerJoin(
      other,
      and(
        eq(other.conversationId, schema.dmConversations.id),
        ne(other.userId, userId),
      ),
    )
    .where(isNotNull(schema.dmConversations.lastMessageAt))
    .orderBy(desc(schema.dmConversations.lastMessageAt))
    .limit(50);
  if (rows.length === 0) return [];

  const lastIds = rows
    .map((row) => row.lastMessageId)
    .filter((id): id is number => id != null);
  const [profiles, lastMessages] = await Promise.all([
    loadMemberProfiles(rows.map((row) => row.otherUserId)),
    lastIds.length
      ? db
          .select({
            id: schema.dmMessages.id,
            body: schema.dmMessages.body,
            status: schema.dmMessages.status,
            senderId: schema.dmMessages.senderId,
          })
          .from(schema.dmMessages)
          .where(inArray(schema.dmMessages.id, lastIds))
      : Promise.resolve([]),
  ]);
  const messageById = new Map(lastMessages.map((m) => [m.id, m]));

  return rows.map((row) => {
    const profile = profiles.get(row.otherUserId);
    const last =
      row.lastMessageId != null ? messageById.get(row.lastMessageId) : undefined;
    return {
      id: row.id,
      otherUserId: row.otherUserId,
      otherName: profile?.firstName ?? "Member",
      otherUnitName: profile?.unitName ?? null,
      lastMessagePreview: last
        ? last.status === "visible"
          ? messagePreview(last.body)
          : "Message removed"
        : null,
      lastMessageMine: last?.senderId === userId,
      lastMessageAt: (row.lastMessageAt ?? new Date()).toISOString(),
      unreadCount: row.unreadCount,
    };
  });
}

/** Unread private messages across every conversation — the nav badge. */
export async function countUnreadMessages(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.dmMessages)
    .innerJoin(
      schema.dmParticipants,
      and(
        eq(schema.dmParticipants.conversationId, schema.dmMessages.conversationId),
        eq(schema.dmParticipants.userId, userId),
      ),
    )
    .where(
      and(
        gt(schema.dmMessages.id, schema.dmParticipants.lastReadMessageId),
        ne(schema.dmMessages.senderId, userId),
        eq(schema.dmMessages.status, "visible"),
      ),
    );
  return row?.n ?? 0;
}

// ─── Messages ──────────────────────────────────────────────────────────────

export type DirectMessage = {
  id: number;
  /** null once a moderator has removed the message. */
  body: string | null;
  mine: boolean;
  createdAt: string;
};

function toDirectMessage(
  row: {
    id: number;
    body: string;
    status: "visible" | "hidden" | "removed";
    senderId: string;
    createdAt: Date;
  },
  viewerId: string,
): DirectMessage {
  return {
    id: row.id,
    body: row.status === "visible" ? row.body : null,
    mine: row.senderId === viewerId,
    createdAt: row.createdAt.toISOString(),
  };
}

const messageColumns = {
  id: schema.dmMessages.id,
  body: schema.dmMessages.body,
  status: schema.dmMessages.status,
  senderId: schema.dmMessages.senderId,
  createdAt: schema.dmMessages.createdAt,
};

/**
 * Messages in a conversation, oldest first. The caller must already have
 * confirmed `viewerId` is a participant. `afterId` fetches only newer messages
 * (polling), `beforeId` pages back through history, and with neither the
 * latest page comes back.
 */
export async function listMessages(
  viewerId: string,
  conversationId: number,
  { afterId, beforeId }: { afterId?: number; beforeId?: number } = {},
): Promise<DirectMessage[]> {
  const inConversation = eq(schema.dmMessages.conversationId, conversationId);

  if (afterId != null) {
    const rows = await db
      .select(messageColumns)
      .from(schema.dmMessages)
      .where(and(inConversation, gt(schema.dmMessages.id, afterId)))
      .orderBy(asc(schema.dmMessages.id))
      .limit(200);
    return rows.map((row) => toDirectMessage(row, viewerId));
  }

  const rows = await db
    .select(messageColumns)
    .from(schema.dmMessages)
    .where(
      beforeId != null
        ? and(inConversation, lt(schema.dmMessages.id, beforeId))
        : inConversation,
    )
    .orderBy(desc(schema.dmMessages.id))
    .limit(DM_PAGE_SIZE);
  return rows.reverse().map((row) => toDirectMessage(row, viewerId));
}

/**
 * Stores a message and moves the conversation forward atomically. Also reports
 * whether the recipient had nothing unread from the sender beforehand, so one
 * push covers a burst of messages.
 */
export async function sendMessage(input: {
  conversationId: number;
  senderId: string;
  recipientId: string;
  body: string;
}): Promise<{ message: DirectMessage; notifyRecipient: boolean }> {
  return transactionDb.transaction(async (tx) => {
    const [recipientState] = await tx
      .select({ lastRead: schema.dmParticipants.lastReadMessageId })
      .from(schema.dmParticipants)
      .where(
        and(
          eq(schema.dmParticipants.conversationId, input.conversationId),
          eq(schema.dmParticipants.userId, input.recipientId),
        ),
      )
      .limit(1);

    const [{ unread }] = await tx
      .select({ unread: sql<number>`count(*)::int` })
      .from(schema.dmMessages)
      .where(
        and(
          eq(schema.dmMessages.conversationId, input.conversationId),
          eq(schema.dmMessages.senderId, input.senderId),
          eq(schema.dmMessages.status, "visible"),
          gt(schema.dmMessages.id, recipientState?.lastRead ?? 0),
        ),
      );

    const [message] = await tx
      .insert(schema.dmMessages)
      .values({
        conversationId: input.conversationId,
        senderId: input.senderId,
        body: input.body,
      })
      .returning(messageColumns);

    await tx
      .update(schema.dmConversations)
      .set({
        lastMessageAt: message.createdAt,
        startedBy: sql`coalesce(${schema.dmConversations.startedBy}, ${input.senderId})`,
        startedAt: sql`coalesce(${schema.dmConversations.startedAt}, now())`,
      })
      .where(eq(schema.dmConversations.id, input.conversationId));

    await tx
      .update(schema.dmParticipants)
      .set({ lastReadMessageId: message.id })
      .where(
        and(
          eq(schema.dmParticipants.conversationId, input.conversationId),
          eq(schema.dmParticipants.userId, input.senderId),
        ),
      );

    return {
      message: toDirectMessage(message, input.senderId),
      notifyRecipient: unread === 0,
    };
  });
}

/** True when nobody has sent a message in this conversation yet. */
export async function isConversationUnstarted(
  conversationId: number,
): Promise<boolean> {
  const [row] = await db
    .select({ startedAt: schema.dmConversations.startedAt })
    .from(schema.dmConversations)
    .where(eq(schema.dmConversations.id, conversationId))
    .limit(1);
  return row != null && row.startedAt == null;
}

/** Moves the viewer's read marker forward, never past the newest message. */
export async function markConversationRead(
  userId: string,
  conversationId: number,
  upToId: number,
) {
  await db
    .update(schema.dmParticipants)
    .set({
      lastReadMessageId: sql`greatest(
        ${schema.dmParticipants.lastReadMessageId},
        least(${upToId}, (
          select coalesce(max(${schema.dmMessages.id}), 0) from ${schema.dmMessages}
          where ${schema.dmMessages.conversationId} = ${conversationId}
        ))
      )`,
    })
    .where(
      and(
        eq(schema.dmParticipants.conversationId, conversationId),
        eq(schema.dmParticipants.userId, userId),
      ),
    );
}

/** A message plus the ids needed to gate a report or a moderator removal. */
export async function getMessageMeta(messageId: number) {
  const [row] = await db
    .select({
      id: schema.dmMessages.id,
      conversationId: schema.dmMessages.conversationId,
      senderId: schema.dmMessages.senderId,
      status: schema.dmMessages.status,
    })
    .from(schema.dmMessages)
    .where(eq(schema.dmMessages.id, messageId))
    .limit(1);
  return row ?? null;
}

export async function setMessageStatus(
  messageId: number,
  status: "visible" | "removed",
) {
  await db
    .update(schema.dmMessages)
    .set({ status })
    .where(eq(schema.dmMessages.id, messageId));
}

// ─── Blocks ────────────────────────────────────────────────────────────────

export async function hasBlocked(
  blockerId: string,
  blockedId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.userBlocks.id })
    .from(schema.userBlocks)
    .where(
      and(
        eq(schema.userBlocks.blockerId, blockerId),
        eq(schema.userBlocks.blockedId, blockedId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function blockUser(blockerId: string, blockedId: string) {
  await db
    .insert(schema.userBlocks)
    .values({ blockerId, blockedId })
    .onConflictDoNothing();
}

export async function unblockUser(blockerId: string, blockedId: string) {
  await db
    .delete(schema.userBlocks)
    .where(
      and(
        eq(schema.userBlocks.blockerId, blockerId),
        eq(schema.userBlocks.blockedId, blockedId),
      ),
    );
}

/** Everyone the viewer has blocked or been blocked by. */
async function listBlockedPeerIds(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({
      blockerId: schema.userBlocks.blockerId,
      blockedId: schema.userBlocks.blockedId,
    })
    .from(schema.userBlocks)
    .where(
      or(
        eq(schema.userBlocks.blockerId, userId),
        eq(schema.userBlocks.blockedId, userId),
      ),
    );
  return new Set(
    rows.map((row) => (row.blockerId === userId ? row.blockedId : row.blockerId)),
  );
}

// ─── Finding someone to message ────────────────────────────────────────────

export type MessageContact = {
  userId: string;
  firstName: string;
  unitName: string | null;
  /** Why they are suggested, e.g. "Your group leader". */
  note: string | null;
};

/**
 * The viewer's group leader and active discipler — offered before any search,
 * and the only people an under-18 can start a conversation with.
 */
export async function listSuggestedContacts(
  ctx: CommunityContext,
): Promise<MessageContact[]> {
  if (ctx.enrollmentId == null) return [];

  const [pastors, leaders, disciplers, blocked] = await Promise.all([
    ctx.unit
      ? db
          .select({
            userId: schema.users.id,
            name: schema.users.name,
            firstName: sql<string>`''`,
          })
          .from(schema.pastorRegions)
          .innerJoin(
            schema.users,
            eq(schema.users.id, schema.pastorRegions.pastorUserId),
          )
          .where(eq(schema.pastorRegions.unitId, ctx.unit.id))
      : Promise.resolve([]),
    ctx.unit
      ? db
          .select({
            userId: schema.sogpEnrollments.userId,
            name: schema.sogpEnrollments.name,
            firstName: schema.sogpEnrollments.firstName,
          })
          .from(schema.unitMembers)
          .innerJoin(
            schema.sogpEnrollments,
            eq(schema.sogpEnrollments.id, schema.unitMembers.enrollmentId),
          )
          .where(
            and(
              eq(schema.unitMembers.unitId, ctx.unit.id),
              eq(schema.unitMembers.role, "leader"),
            ),
          )
      : Promise.resolve([]),
    db
      .select({
        userId: schema.sogpEnrollments.userId,
        name: schema.sogpEnrollments.name,
        firstName: schema.sogpEnrollments.firstName,
      })
      .from(schema.discipleshipMemberships)
      .innerJoin(
        schema.discipleshipGroups,
        eq(schema.discipleshipGroups.id, schema.discipleshipMemberships.groupId),
      )
      .innerJoin(
        schema.sogpEnrollments,
        eq(schema.sogpEnrollments.id, schema.discipleshipGroups.leaderEnrollmentId),
      )
      .where(
        and(
          eq(schema.discipleshipMemberships.discipleEnrollmentId, ctx.enrollmentId),
          eq(schema.discipleshipMemberships.status, "active"),
          eq(schema.discipleshipGroups.status, "active"),
        ),
      ),
    listBlockedPeerIds(ctx.userId),
  ]);

  const contacts = new Map<string, MessageContact>();
  const add = (
    row: { userId: string; name: string; firstName: string },
    note: string,
    unitName: string | null,
  ) => {
    if (row.userId === ctx.userId || blocked.has(row.userId)) return;
    if (contacts.has(row.userId)) return;
    contacts.set(row.userId, {
      userId: row.userId,
      firstName: firstNameOf(row.firstName || row.name),
      unitName,
      note,
    });
  };
  for (const row of pastors) add(row, "Your pastor", ctx.unit?.name ?? null);
  for (const row of leaders) add(row, "Your group leader", ctx.unit?.name ?? null);
  for (const row of disciplers) add(row, "Your discipler", null);
  return [...contacts.values()];
}

/**
 * First-name search across enrolled adults. Under-18s are never listed, and an
 * under-18 viewer gets no search at all — only their suggested contacts.
 */
export async function searchMembers(
  ctx: CommunityContext,
  query: string,
): Promise<MessageContact[]> {
  const term = query.trim().slice(0, 40);
  if (term.length < 2 || ctx.isMinor) return [];

  const pattern = `${term.replace(/[\\%_]/g, "\\$&")}%`;
  const [rows, blocked] = await Promise.all([
    db
      .select({
        userId: schema.sogpEnrollments.userId,
        name: schema.sogpEnrollments.name,
        firstName: schema.sogpEnrollments.firstName,
        unitName: schema.units.name,
      })
      .from(schema.sogpEnrollments)
      .leftJoin(
        schema.unitMembers,
        eq(schema.unitMembers.enrollmentId, schema.sogpEnrollments.id),
      )
      .leftJoin(schema.units, eq(schema.units.id, schema.unitMembers.unitId))
      .where(
        and(
          ne(schema.sogpEnrollments.userId, ctx.userId),
          or(
            ilike(schema.sogpEnrollments.firstName, pattern),
            ilike(schema.sogpEnrollments.name, pattern),
          ),
          sql`not exists (
            select 1 from ${schema.sogpEnrollments} as minor_check
            where minor_check.user_id = ${schema.sogpEnrollments.userId}
              and minor_check.birth_year >= ${minorBirthYearFloor()}
          )`,
        ),
      )
      .orderBy(asc(schema.sogpEnrollments.firstName))
      .limit(60),
    listBlockedPeerIds(ctx.userId),
  ]);

  const contacts = new Map<string, MessageContact>();
  for (const row of rows) {
    if (blocked.has(row.userId) || contacts.has(row.userId)) continue;
    contacts.set(row.userId, {
      userId: row.userId,
      firstName: firstNameOf(row.firstName || row.name),
      unitName: row.unitName,
      note: null,
    });
    if (contacts.size === 20) break;
  }
  return [...contacts.values()];
}

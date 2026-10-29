import "server-only";

import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { firstNameOf } from "@/lib/community/visibility";
import { getDashboardViewer } from "@/lib/dashboard/viewer";
import { getCommunityHomeDiscipleship } from "./community-discipleship";
import { countUnreadConversations } from "./community-messages";
import { listOwnActiveCommunityGroups } from "./community-groups";
import { listOwnPendingInvitations } from "./sogp-group-invitations";
import { listUnitNames } from "./community-units";

/** Read-only, session-owned home. Never creates a group or loads answer text. */
export async function getCommunityHome() {
  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) return null;
  const leader = alias(schema.sogpEnrollments, "home_leader");
  const [managedLocations, unreadConversations, discipleship, groups, viewer, responses, invitations, [owned], wavering, prayers] = await Promise.all([
    // Location groups the viewer looks after as assigned pastor (user report, 19 October: Edo had gone missing).
    // Their own location group counts too when they look after it, as its pastor or member leader (user, 19 October: "I lead Oyo").
    listUnitNames([...new Set([...ctx.managedUnitIds, ...(ctx.unit && ctx.isUnitLeader ? [ctx.unit.id] : [])])]),
    countUnreadConversations(ctx.userId),
    getCommunityHomeDiscipleship(ctx.userId),
    listOwnActiveCommunityGroups(ctx.userId),
    getDashboardViewer(),
    db.select({
      id: schema.discipleshipPromptResponses.id,
      groupId: schema.discipleshipGroups.id,
      groupName: schema.discipleshipGroups.name,
      name: schema.sogpEnrollments.name,
      firstName: schema.sogpEnrollments.firstName,
    })
      .from(schema.discipleshipPromptResponses)
      .innerJoin(schema.discipleshipPrompts, eq(schema.discipleshipPrompts.id, schema.discipleshipPromptResponses.promptId))
      .innerJoin(schema.discipleshipGroups, and(
        eq(schema.discipleshipGroups.id, schema.discipleshipPrompts.groupId),
        eq(schema.discipleshipGroups.status, "active"),
      ))
      .innerJoin(leader, and(eq(leader.id, schema.discipleshipGroups.leaderEnrollmentId), eq(leader.userId, ctx.userId)))
      .innerJoin(schema.discipleshipMemberships, and(
        eq(schema.discipleshipMemberships.groupId, schema.discipleshipGroups.id),
        eq(schema.discipleshipMemberships.discipleEnrollmentId, schema.discipleshipPromptResponses.discipleEnrollmentId),
        eq(schema.discipleshipMemberships.status, "active"),
      ))
      .innerJoin(schema.sogpEnrollments, eq(schema.sogpEnrollments.id, schema.discipleshipPromptResponses.discipleEnrollmentId))
      .where(isNull(schema.discipleshipPromptResponses.leaderReply))
      .orderBy(desc(schema.discipleshipPromptResponses.updatedAt))
      .limit(3),
    // Optional section: the home still renders on a database without 0059.
    listOwnPendingInvitations(ctx.userId).catch(() => []),
    db.select({ n: count() }).from(schema.pastorAssignments).where(eq(schema.pastorAssignments.pastorUserId, ctx.userId)),
    // Disciples whose last daily status (kept by the discipleship cron) needs the leader.
    db.select({
      membershipId: schema.discipleshipMemberships.id,
      groupId: schema.discipleshipGroups.id,
      groupName: schema.discipleshipGroups.name,
      status: schema.discipleshipMemberships.lastKnownStatus,
      name: schema.sogpEnrollments.name,
      firstName: schema.sogpEnrollments.firstName,
    })
      .from(schema.discipleshipMemberships)
      .innerJoin(schema.discipleshipGroups, and(eq(schema.discipleshipGroups.id, schema.discipleshipMemberships.groupId), eq(schema.discipleshipGroups.status, "active")))
      .innerJoin(leader, and(eq(leader.id, schema.discipleshipGroups.leaderEnrollmentId), eq(leader.userId, ctx.userId)))
      .innerJoin(schema.sogpEnrollments, eq(schema.sogpEnrollments.id, schema.discipleshipMemberships.discipleEnrollmentId))
      .where(and(eq(schema.discipleshipMemberships.status, "active"), inArray(schema.discipleshipMemberships.lastKnownStatus, ["unresponsive", "at_risk"])))
      .limit(5),
    // Open prayer requests the leader hasn't marked as prayed. Text stays out.
    db.select({
      id: schema.discipleshipPrayerRequests.id,
      groupId: schema.discipleshipGroups.id,
      groupName: schema.discipleshipGroups.name,
      name: schema.sogpEnrollments.name,
      firstName: schema.sogpEnrollments.firstName,
    })
      .from(schema.discipleshipPrayerRequests)
      .innerJoin(schema.discipleshipGroups, and(eq(schema.discipleshipGroups.id, schema.discipleshipPrayerRequests.groupId), eq(schema.discipleshipGroups.status, "active")))
      .innerJoin(leader, and(eq(leader.id, schema.discipleshipGroups.leaderEnrollmentId), eq(leader.userId, ctx.userId)))
      .innerJoin(schema.discipleshipMemberships, and(
        eq(schema.discipleshipMemberships.groupId, schema.discipleshipGroups.id),
        eq(schema.discipleshipMemberships.discipleEnrollmentId, schema.discipleshipPrayerRequests.discipleEnrollmentId),
        eq(schema.discipleshipMemberships.status, "active"),
      ))
      .innerJoin(schema.sogpEnrollments, eq(schema.sogpEnrollments.id, schema.discipleshipPrayerRequests.discipleEnrollmentId))
      .where(and(eq(schema.discipleshipPrayerRequests.status, "open"), isNull(schema.discipleshipPrayerRequests.prayedAt)))
      .orderBy(desc(schema.discipleshipPrayerRequests.createdAt))
      .limit(3),
  ]);
  const led = discipleship.leading.filter(group => !group.paused);
  const groupBase = (groupId: number) => `/dashboard/community/discipleship/${groupId}`;
  // Across every group the viewer leads: who needs them, most urgent first.
  const needsYou: NeedsYouItem[] = [
    ...wavering.sort((a, b) => (a.status === "unresponsive" ? 0 : 1) - (b.status === "unresponsive" ? 0 : 1)).map(row => ({
      key: `status-${row.membershipId}`,
      name: row.firstName || row.name,
      firstName: firstNameOf(row.firstName || row.name),
      tone: row.status === "unresponsive" ? "off" as const : "risk" as const,
      detail: row.status === "unresponsive" ? "Not active lately" : "At risk this week",
      groupName: row.groupName,
      href: `${groupBase(row.groupId)}/disciples/${row.membershipId}`,
      action: "Encourage",
    })),
    ...responses.map(item => ({
      key: `checkin-${item.id}`,
      name: item.firstName || item.name,
      firstName: firstNameOf(item.firstName || item.name),
      tone: null,
      detail: "Answered your check-in",
      groupName: item.groupName,
      href: `${groupBase(item.groupId)}?tab=checkins`,
      action: "Read",
    })),
    ...prayers.map(item => ({
      key: `prayer-${item.id}`,
      name: item.firstName || item.name,
      firstName: firstNameOf(item.firstName || item.name),
      tone: null,
      detail: "Shared a prayer request",
      groupName: item.groupName,
      href: `${groupBase(item.groupId)}?tab=prayer`,
      action: "Pray",
    })),
  ];

  return {
    unreadConversations,
    needsYou,
    showGroupNames: led.length > 1,
    responses: responses.map(item => ({
      id: item.id,
      firstName: firstNameOf(item.firstName || item.name),
      href: `/dashboard/community/discipleship/${item.groupId}?tab=checkins`,
    })),
    invitations: invitations.map(item => ({ id: item.id, leaderFirstName: firstNameOf(item.leaderName), groupName: item.groupName })),
    enrolleeCount: owned?.n ?? 0,
    disciplesEnabled: ctx.enrollmentId !== null,
    discipleCount: discipleship.discipleCount,
    church: viewer?.navigation.find(section => section.key === "oversight")?.items.find(item => item.key === "church") ?? null,
    // A location group they look after sits with the groups they lead, not the ones they're under.
    locationGroup: ctx.unit && !ctx.isUnitLeader && !ctx.managedUnitIds.includes(ctx.unit.id) ? ctx.unit : null,
    managedLocations,
    joinedGroups: discipleship.joinedGroups,
    ledGroups: discipleship.leading.filter(group => !group.paused),
    memberGroups: groups,
  };
}

export type NeedsYouItem = {
  key: string;
  /** For the initials. */
  name: string;
  firstName: string;
  tone: "off" | "risk" | null;
  detail: string;
  /** Shown only to the leader, and only when they lead more than one group. */
  groupName: string | null;
  href: string;
  action: string;
};

export type CommunityHomeData = NonNullable<Awaited<ReturnType<typeof getCommunityHome>>>;

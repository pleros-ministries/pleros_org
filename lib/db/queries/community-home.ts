import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { firstNameOf } from "@/lib/community/visibility";
import { getDashboardViewer } from "@/lib/dashboard/viewer";
import { getCommunityDiscipleship } from "./community-discipleship";
import { listConversations } from "./community-messages";
import { listGroupDirectory } from "./community-groups";

/** Read-only, session-owned home. Never creates a group or loads answer text. */
export async function getCommunityHome() {
  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) return null;
  const leader = alias(schema.sogpEnrollments, "home_leader");
  const [conversations, discipleship, groups, viewer, responses] = await Promise.all([
    listConversations(ctx.userId),
    getCommunityDiscipleship(ctx),
    listGroupDirectory(ctx.userId),
    getDashboardViewer(),
    db.select({
      id: schema.discipleshipPromptResponses.id,
      groupId: schema.discipleshipGroups.id,
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
  ]);

  return {
    unreadConversations: conversations.filter(item => item.unreadCount > 0).length,
    responses: responses.map(item => ({
      id: item.id,
      firstName: firstNameOf(item.firstName || item.name),
      href: `/dashboard/sogp/discipleship?group=${item.groupId}#check-ins`,
    })),
    disciplesEnabled: ctx.enrollmentId !== null,
    discipleCount: discipleship.leading.filter(group => !group.paused).reduce((total, group) => total + group.disciples.length, 0),
    church: viewer?.navigation.find(section => section.key === "oversight")?.items.find(item => item.key === "church") ?? null,
    locationGroup: ctx.unit,
    joinedGroup: discipleship.joined,
    ledGroups: discipleship.leading.filter(group => !group.paused),
    memberGroups: groups.filter(group => group.viewerStatus === "active"),
  };
}

export type CommunityHomeData = NonNullable<Awaited<ReturnType<typeof getCommunityHome>>>;

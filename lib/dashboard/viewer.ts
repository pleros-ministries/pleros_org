import "server-only";

import { getChurchAssignment, hasChurchDirectReports, churchOrganisationEnabled } from "@/lib/db/queries/church-organisation";
import { canManageChurchAssignments, CHURCH_ROLE_LABELS, type ChurchRole } from "@/lib/church/permissions";
import { cache } from "react";

import { getAppSession } from "@/lib/app-session";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { managesAnyUnit } from "@/lib/community/permissions";
import { getSogpDashboardAccess } from "@/lib/db/queries/sogp-journey";
import { leadsAnyMembers } from "@/lib/db/queries/oversight-tree";

import {
  buildDashboardNavigation,
  dashboardRoleLabel,
  type DashboardCapabilities,
} from "./navigation";

/**
 * The signed-in viewer for the dashboard shell and home, loaded once per
 * request. Capabilities come from the same guards the routes use: the SOGP
 * enrolment and the community context. Returns null without an app session.
 */
export const getDashboardViewer = cache(async () => {
  const session = await getAppSession();
  if (!session) return null;

  const [sogpAccess, ctx, church, hasReports, leadsMembers] = await Promise.all([
    getSogpDashboardAccess(session.user.id),
    getCommunityContext(),
    getChurchAssignment(session.user.id),
    hasChurchDirectReports(session.user.id),
    leadsAnyMembers(session.user.id),
  ]);
  const community = canAccessCommunity(ctx);

  const capabilities: DashboardCapabilities = {
    sogpEnrolled: sogpAccess.isSogpEnrolled,
    community,
    reporting: community || church !== null,
    communityUnitId: community ? (ctx?.unit?.id ?? null) : null,
    discipleshipDiscussions: community && ctx?.enrollmentId != null,
    managesLocationGroups: community && ctx != null && managesAnyUnit(ctx),
    staffConsole: session.user.role !== "student",
    staffWorkspace: session.user.role === "student" ? undefined : session.user.role,
    churchAdministration: church?.role === "pastor" || church?.role === "branch_pastor" ? church.role : undefined,
    churchOversight: hasReports,
    churchMember: church !== null,
    churchAssignments: canManageChurchAssignments(church) || churchOrganisationEnabled() && session.user.role === "super_admin",
    groupOversight: leadsMembers || church?.role === "pastor" || church?.role === "branch_pastor",
  };

  return {
    session,
    sogpAccess,
    capabilities,
    navigation: buildDashboardNavigation(capabilities),
    roleLabel: church ? CHURCH_ROLE_LABELS[church.role as ChurchRole] : dashboardRoleLabel({
      role: session.user.role,
      sogpEnrolled: sogpAccess.isSogpEnrolled,
      isUnitLeader: ctx?.isUnitLeader ?? false,
      managedUnitCount: ctx?.managedUnitIds.length ?? 0,
    }),
  };
});

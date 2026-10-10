import "server-only";

import { cache } from "react";

import { getAppSession } from "@/lib/app-session";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { managesAnyUnit } from "@/lib/community/permissions";
import { getSogpDashboardAccess } from "@/lib/db/queries/sogp-journey";

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

  const [sogpAccess, ctx] = await Promise.all([
    getSogpDashboardAccess(session.user.id),
    getCommunityContext(),
  ]);
  const community = canAccessCommunity(ctx);

  const capabilities: DashboardCapabilities = {
    sogpEnrolled: sogpAccess.isSogpEnrolled,
    community,
    communityUnitId: community ? (ctx?.unit?.id ?? null) : null,
    discipleshipDiscussions: community && ctx?.enrollmentId != null,
    managesLocationGroups: community && ctx != null && managesAnyUnit(ctx),
    staffConsole: session.user.role !== "student",
  };

  return {
    session,
    sogpAccess,
    capabilities,
    navigation: buildDashboardNavigation(capabilities),
    roleLabel: dashboardRoleLabel({
      role: session.user.role,
      sogpEnrolled: sogpAccess.isSogpEnrolled,
      isUnitLeader: ctx?.isUnitLeader ?? false,
      managedUnitCount: ctx?.managedUnitIds.length ?? 0,
    }),
  };
});

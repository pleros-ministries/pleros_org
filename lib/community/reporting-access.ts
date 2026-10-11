import "server-only";
import { canAccessCommunity, type CommunityContext } from "./context";
import { getChurchAssignment } from "@/lib/db/queries/church-organisation";
/** Own reporting is available to existing community members or explicitly assigned church members.
 * This grants no community-feed, messaging or geographic moderation access. */
export async function canAccessReporting(ctx: CommunityContext | null): Promise<boolean> {
  return Boolean(ctx && (canAccessCommunity(ctx) || await getChurchAssignment(ctx.userId)));
}

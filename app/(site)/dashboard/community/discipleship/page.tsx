import { redirect } from "next/navigation";

import { getAppSession } from "@/lib/app-session";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { getCommunityDiscipleship } from "@/lib/db/queries/community-discipleship";

// Reads the session on every request (Cache Components).
export const instant = false;

/**
 * Old entry point for the discipleship spaces. Each group now has its own
 * page, so this opens the right one: `?group=` when it is the viewer's,
 * otherwise the group they joined, then the first group they lead.
 */
export default async function CommunityDiscipleshipRoute({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const [session, ctx] = await Promise.all([getAppSession(), getCommunityContext()]);
  if (!session) redirect("/login?returnTo=/dashboard/community/discipleship");
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const data = await getCommunityDiscipleship(ctx);
  const { group } = await searchParams;
  const requested = group && /^\d{1,9}$/.test(group) ? Number(group) : null;
  const ids = [...data.joinedGroups.map(item => item.groupId), ...data.leading.map(item => item.groupId)];
  const target = (requested !== null && ids.includes(requested) ? requested : null)
    ?? data.joinedGroups[0]?.groupId
    ?? data.leading.find(item => !item.paused && item.disciples.length > 0)?.groupId
    ?? data.leading[0]?.groupId;
  if (target != null) redirect(`/dashboard/community/discipleship/${target}`);
  // No group yet: the SOGP route creates the learner's first one, then comes back.
  if (ctx.enrollmentId != null) redirect("/dashboard/sogp/discipleship");
  redirect("/dashboard/community/groups");
}

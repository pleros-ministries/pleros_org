import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NewGroupPage } from "@/components/community/groups/new-group-page";
import { getAppSession } from "@/lib/app-session";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { getCommunityHomeDiscipleship } from "@/lib/db/queries/community-discipleship";
import { discipleshipGroupBlockMessage, evaluateCreateDiscipleshipGroup } from "@/lib/sogp/discipleship";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "New group" };

export default async function NewGroupRoute() {
  const [session, ctx] = await Promise.all([getAppSession(), getCommunityContext()]);
  if (!session) redirect("/login?returnTo=/dashboard/community/groups/new");
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");
  if (ctx.enrollmentId == null) redirect("/dashboard/community/groups");

  const { leading } = await getCommunityHomeDiscipleship(ctx.userId);
  // A first group is the default one, created by the discipleship landing.
  if (!leading.length) redirect("/dashboard/sogp/discipleship");

  const decision = evaluateCreateDiscipleshipGroup({ openGroupCount: leading.length, hasPausedGroup: leading.some(group => group.paused) });
  // The new group takes the next lead colourway after the active ones.
  const active = leading.filter(group => !group.paused).length;
  return <NewGroupPage
    ledCount={leading.length}
    colourway={active % 2 === 1 ? "slate" : "lilac"}
    block={decision.ok ? null : discipleshipGroupBlockMessage(decision.reason)}
  />;
}

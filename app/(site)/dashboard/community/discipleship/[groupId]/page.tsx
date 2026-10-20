import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { LeaderGroupView, type LeaderTab } from "@/components/community/discipleship/leader-group";
import { MemberGroupView } from "@/components/community/discipleship/member-group";
import { SogpQueryProvider } from "@/components/sogp/sogp-query-provider";
import { getAppSession } from "@/lib/app-session";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { getCommunityDiscipleship } from "@/lib/db/queries/community-discipleship";
import { getDiscipleshipDashboard } from "@/lib/db/queries/sogp-discipleship";
import { getLeaderEpisodeQuestions, getOwnEpisodeQuestions } from "@/lib/db/queries/sogp-episode-questions";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Discipleship group" };

const TABS: LeaderTab[] = ["disciples", "discussion", "checkins", "prayer"];

/**
 * One discipleship group, the single home for everything in it. Its leader
 * sees the disciples, discussion, check-ins and prayer requests; a disciple
 * sees their discipler, their own check-ins and requests, and the discussion.
 */
export default async function DiscipleshipGroupRoute({ params, searchParams }: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ tab?: string; panel?: string }>;
}) {
  const [{ groupId: rawId }, { tab, panel }] = await Promise.all([params, searchParams]);
  if (!/^\d{1,9}$/.test(rawId)) notFound();
  const groupId = Number(rawId);
  // Old "+ New group" links opened the form here; it has its own page now.
  if (panel === "create") redirect("/dashboard/community/groups/new");

  const [session, ctx] = await Promise.all([getAppSession(), getCommunityContext()]);
  if (!session) redirect(`/login?returnTo=/dashboard/community/discipleship/${groupId}`);
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const community = await getCommunityDiscipleship(ctx);
  const discussion = { viewerName: session.user.name ?? "You", postingBlocked: ctx.postingBlocked };

  // The group the viewer belongs to as a disciple.
  if (community.joined?.groupId === groupId) {
    const [data, ownEpisodeQuestions] = await Promise.all([
      getDiscipleshipDashboard(session.user.id),
      getOwnEpisodeQuestions(session.user.id).catch(() => []),
    ]);
    if (!data?.myDiscipler) notFound();
    return <SogpQueryProvider>
      <MemberGroupView joined={community.joined} discipler={data.myDiscipler} ownEpisodeQuestions={ownEpisodeQuestions} discussion={discussion} initialTab={tab} />
    </SogpQueryProvider>;
  }

  // A group the viewer leads. The query re-checks ownership and falls back to
  // their first group for any other id, so a mismatch means it isn't theirs.
  const led = community.leading.filter(group => !group.paused);
  if (!community.leading.some(group => group.groupId === groupId)) notFound();
  const [data, episodeQuestions] = await Promise.all([
    getDiscipleshipDashboard(session.user.id, groupId),
    getLeaderEpisodeQuestions(session.user.id, groupId).catch(() => []),
  ]);
  if (!data || data.selectedGroup.id !== groupId) notFound();

  return <SogpQueryProvider>
    <LeaderGroupView
      data={data}
      episodeQuestions={episodeQuestions}
      colourway={led.findIndex(group => group.groupId === groupId) % 2 === 1 ? "slate" : undefined}
      initialTab={TABS.includes(tab as LeaderTab) ? tab as LeaderTab : "disciples"}
      initialPanel={panel === "invite" ? panel : null}
      discussion={discussion}
    />
  </SogpQueryProvider>;
}

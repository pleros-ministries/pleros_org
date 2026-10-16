import { redirect } from "next/navigation";

import { AskPlerosView } from "@/components/community/ask/ask-pleros-view";
import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { listQuestionsForAsker } from "@/lib/db/queries/ask-pleros";

export default async function AskPlerosRoute({
  searchParams,
}: {
  searchParams: Promise<{ episodeGuid?: string; episodeTitle?: string }>;
}) {
  // Session and context load together instead of one roundtrip after the other.
  const [session, ctx] = await Promise.all([getAppSession(), getCommunityContext()]);
  if (!session) redirect("/login?returnTo=/dashboard/community/ask");
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const { episodeGuid, episodeTitle } = await searchParams;
  const episode = episodeGuid?.trim() && episodeTitle?.trim() && episodeGuid.length <= 200 && episodeTitle.length <= 300
    ? { guid: episodeGuid.trim(), title: episodeTitle.trim() }
    : undefined;
  return <AskPlerosView questions={await listQuestionsForAsker(ctx.userId)} episode={episode} />;
}

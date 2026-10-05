import { redirect } from "next/navigation";

import { AskPlerosView } from "@/components/community/ask/ask-pleros-view";
import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { listQuestionsForAsker } from "@/lib/db/queries/ask-pleros";

export default async function AskPlerosRoute() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/ask");

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  return <AskPlerosView questions={await listQuestionsForAsker(ctx.userId)} />;
}

import { redirect } from "next/navigation";

import { CommunityHomeV3 } from "@/components/community/community-home-v3";
import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { getCommunityHome } from "@/lib/db/queries/community-home";

export default async function CommunityRoute() {
  // Session and context load together: the context resolves its own session,
  // so awaiting one after the other costs a full roundtrip for nothing.
  const [session, ctx] = await Promise.all([getAppSession(), getCommunityContext()]);
  if (!session) redirect("/login?returnTo=/dashboard/community");

  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const data = await getCommunityHome();
  if (!data) redirect("/sogp/enrol");
  return <CommunityHomeV3 data={data} />;
}

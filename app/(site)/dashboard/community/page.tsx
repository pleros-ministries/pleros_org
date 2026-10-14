import { redirect } from "next/navigation";

import { CommunityHomeV3 } from "@/components/community/community-home-v3";
import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { getCommunityHome } from "@/lib/db/queries/community-home";

export default async function CommunityRoute() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community");

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const data = await getCommunityHome();
  if (!data) redirect("/sogp/enrol");
  return <CommunityHomeV3 data={data} />;
}

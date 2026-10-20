import { redirect } from "next/navigation";

import { CommunityHomeV3 } from "@/components/community/community-home-v3";
import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { getCommunityHome } from "@/lib/db/queries/community-home";
import { listPrivateMinistryContacts } from "@/lib/db/queries/private-ministry-contacts";
import { reportingV3SchemaReady } from "@/lib/db/queries/reporting-v3-gate";
import { listOwnEnrollees } from "@/lib/db/queries/sogp-follow-up-routes";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function CommunityRoute() {
  // Session and context load together: the context resolves its own session,
  // so awaiting one after the other costs a full roundtrip for nothing.
  const [session, ctx] = await Promise.all([getAppSession(), getCommunityContext()]);
  if (!session) redirect("/login?returnTo=/dashboard/community");

  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  // Groups left the bottom bar, so Home also carries Saved contacts and My enrollees.
  const [data, contacts, enrollees] = await Promise.all([
    getCommunityHome(),
    reportingV3SchemaReady() ? listPrivateMinistryContacts(ctx.userId).then(rows => rows.length).catch(() => null) : Promise.resolve(null),
    ctx.enrollmentId != null ? listOwnEnrollees(ctx.userId).catch(() => null) : Promise.resolve(null),
  ]);
  if (!data) redirect("/sogp/enrol");
  return <CommunityHomeV3 data={data} people={{ contacts, enrollees: enrollees ? { total: enrollees.length, free: enrollees.filter(row => !row.group).length } : null }} />;
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PartnerHome } from "@/components/dashboard/library/partner-home";
import { getAppSession } from "@/lib/app-session";
import { listPartnerGifts } from "@/lib/db/queries/partner-gifts";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Partner with us" };

export default async function DashboardPartnerPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/partner");
  const gifts = await listPartnerGifts(session.user.id);
  return <PartnerHome name={session.user.name ?? ""} email={session.user.email ?? ""} gifts={gifts} />;
}

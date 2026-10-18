import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PartnerHome } from "@/components/dashboard/library/partner-home";
import { getAppSession } from "@/lib/app-session";

export const metadata: Metadata = { title: "Partner with us" };

export default async function DashboardPartnerPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/partner");
  return <PartnerHome />;
}

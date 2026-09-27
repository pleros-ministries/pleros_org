import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DiscipleshipPage } from "@/components/sogp/discipleship-page";
import { getAppSession } from "@/lib/app-session";
import { getDiscipleshipDashboard } from "@/lib/db/queries/sogp-discipleship";

export const metadata: Metadata = {
  title: "Discipleship",
};

export default async function SogpDiscipleshipPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/discipleship");

  const data = await getDiscipleshipDashboard(session.user.id);
  if (!data) redirect("/sogp/enrol");

  return <DiscipleshipPage data={data} />;
}

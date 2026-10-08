import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DiscipleshipPage } from "@/components/sogp/discipleship-page";
import { SogpQueryProvider } from "@/components/sogp/sogp-query-provider";
import { getAppSession } from "@/lib/app-session";
import { getDiscipleshipDashboard } from "@/lib/db/queries/sogp-discipleship";

export const metadata: Metadata = {
  title: "Discipleship",
};

export default async function SogpDiscipleshipPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/discipleship");

  // `?group=` picks which of the learner's own groups to show; the query
  // ignores an id that isn't theirs and falls back to their first group.
  const { group } = await searchParams;
  const requestedGroupId = group && /^\d{1,9}$/.test(group) ? Number(group) : null;

  const data = await getDiscipleshipDashboard(session.user.id, requestedGroupId);
  if (!data) redirect("/sogp/enrol");

  return (
    <SogpQueryProvider>
      <DiscipleshipPage data={data} />
    </SogpQueryProvider>
  );
}

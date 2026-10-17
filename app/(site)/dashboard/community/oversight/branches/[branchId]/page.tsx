import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { OversightBranch } from "@/components/dashboard/church/oversight-view";
import { CrumbLabel } from "@/components/dashboard/shell/breadcrumbs";
import { getAppSession } from "@/lib/app-session";
import { getOversight } from "@/lib/db/queries/oversight";

export const metadata: Metadata = { title: "Branch" };

/** One branch inside the viewer's oversight. A branch outside it is a 404. */
export default async function OversightBranchPage({ params }: { params: Promise<{ branchId: string }> }) {
  const { branchId: raw } = await params;
  if (!/^\d{1,9}$/.test(raw)) notFound();
  const branchId = Number(raw);
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/community/oversight/branches/${branchId}`);
  const data = await getOversight(session.user.id);
  if (!data) redirect("/dashboard/church");
  const branch = data.branches.find(item => item.id === branchId);
  if (!branch) notFound();
  return <>
    <CrumbLabel href={`/dashboard/community/oversight/branches/${branchId}`} label={branch.name} />
    <OversightBranch data={data} branchId={branchId} />
  </>;
}

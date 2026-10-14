import { notFound, redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { reportingV3Enabled } from "@/lib/db/queries/reporting-v3-gate";
import { createPrivateContactAction } from "@/app/(site)/dashboard/community/_actions/reporting-v3-actions";
import { AddSavedContact } from "@/components/community/report/ministry-v3/saved-contacts";

export default async function AddSavedContactPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/report/people/new");
  if (!reportingV3Enabled()) notFound();
  return <AddSavedContact onPersist={createPrivateContactAction} />;
}

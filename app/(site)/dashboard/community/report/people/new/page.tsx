import { notFound, redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { reportingV3Enabled } from "@/lib/db/queries/reporting-v3-gate";
import { listLedGroupInvites } from "@/lib/db/queries/led-discipleship-invites";
import { createPrivateContactAction } from "@/app/(site)/dashboard/community/_actions/reporting-v3-actions";
import { AddSavedContact } from "@/components/community/report/ministry-v3/saved-contacts";

/** `?invite=<groupId>` comes from "Add contact" on a group page you lead. */
export default async function AddSavedContactPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/report/people/new");
  if (!reportingV3Enabled()) notFound();
  const [{ invite }, groups] = await Promise.all([searchParams, listLedGroupInvites(session.user.id).catch(() => [])]);
  const preselect = Number(invite);
  return <AddSavedContact onPersist={createPrivateContactAction} inviteGroups={groups.map(group => ({ id: group.id, name: group.name }))}
    initialInviteGroupId={groups.some(group => group.id === preselect) ? preselect : null} />;
}

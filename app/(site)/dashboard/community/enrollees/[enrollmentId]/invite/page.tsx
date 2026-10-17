import { notFound, redirect } from "next/navigation";

import { InvitePerson } from "@/components/community/people/person-screens";
import { CrumbLabel } from "@/components/dashboard/shell/breadcrumbs";
import { getAppSession } from "@/lib/app-session";
import { listInviteGroups } from "@/lib/db/queries/invite-groups";
import { getOwnEnrollee } from "@/lib/db/queries/people-follow-ups";

/** Invite an enrollee the viewer follows up into one of their discipleship groups (in Pleros). */
export default async function InviteEnrolleePage({ params }: { params: Promise<{ enrollmentId: string }> }) {
  const { enrollmentId: raw } = await params;
  if (!/^\d{1,9}$/.test(raw)) notFound();
  const enrollmentId = Number(raw);
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/community/enrollees/${enrollmentId}/invite`);
  const enrollee = await getOwnEnrollee(session.user.id, enrollmentId);
  if (!enrollee) notFound();
  const groups = await listInviteGroups(session.user.id);
  return <>
    <CrumbLabel href={`/dashboard/community/enrollees/${enrollmentId}`} label={enrollee.firstName} />
    <InvitePerson person={{ kind: "enrollee", enrollmentId, name: enrollee.name, whatsappUrl: enrollee.whatsappUrl }} groups={groups} leaderFirstName={(session.user.name ?? "").split(/\s+/)[0] || "Your discipler"} />
  </>;
}

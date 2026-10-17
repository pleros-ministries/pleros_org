import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { EnrolleeDetail } from "@/components/community/people/person-screens";
import { CrumbLabel } from "@/components/dashboard/shell/breadcrumbs";
import { getAppSession } from "@/lib/app-session";
import { getOwnEnrollee, listFollowUps } from "@/lib/db/queries/people-follow-ups";

export const metadata: Metadata = { title: "Enrollee" };

/** One enrollee whose follow-up the viewer owns. Anyone else gets a 404. */
export default async function EnrolleeRoute({ params }: { params: Promise<{ enrollmentId: string }> }) {
  const { enrollmentId: raw } = await params;
  if (!/^\d{1,9}$/.test(raw)) notFound();
  const enrollmentId = Number(raw);
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/community/enrollees/${enrollmentId}`);
  const enrollee = await getOwnEnrollee(session.user.id, enrollmentId);
  if (!enrollee) notFound();
  const followUps = await listFollowUps(session.user.id, { enrollmentId });
  return <>
    <CrumbLabel href={`/dashboard/community/enrollees/${enrollmentId}`} label={enrollee.firstName} />
    <EnrolleeDetail enrollee={enrollee} followUps={followUps} />
  </>;
}

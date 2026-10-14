import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getAppSession } from "@/lib/app-session";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { getSogpEnrollmentByUserId } from "@/lib/db/queries/sogp";
import { isPastorAssignedToEnrollment } from "@/lib/db/queries/pastor-followups";
import { InviteEnrollee } from "@/components/sogp/follow-up-invitations";

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  return domain ? `${local.slice(0, 1)}•••@${domain}` : "Email hidden";
}

export default async function InviteEnrolleePage({ params }: { params: Promise<{ enrollmentId: string }> }) {
  const { enrollmentId: raw } = await params;
  const enrollmentId = Number(raw);
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/sogp/enrollees/${raw}/invite`);
  if (!Number.isInteger(enrollmentId) || !(await isPastorAssignedToEnrollment(session.user.id, enrollmentId))) notFound();
  const leader = await getSogpEnrollmentByUserId(session.user.id);
  if (!leader) redirect("/sogp/enrol");
  const [[enrollee], groups] = await Promise.all([
    db.select({ name: s.sogpEnrollments.name, email: s.sogpEnrollments.email }).from(s.sogpEnrollments).where(eq(s.sogpEnrollments.id, enrollmentId)).limit(1),
    db.select({ id: s.discipleshipGroups.id, name: s.discipleshipGroups.name }).from(s.discipleshipGroups)
      .where(and(eq(s.discipleshipGroups.leaderEnrollmentId, leader.id), eq(s.discipleshipGroups.status, "active")))
      .orderBy(s.discipleshipGroups.createdAt),
  ]);
  if (!enrollee) notFound();
  return <InviteEnrollee enrollee={{ enrollmentId, name: enrollee.name, maskedEmail: maskEmail(enrollee.email) }} groups={groups} leaderName={session.user.name} />;
}

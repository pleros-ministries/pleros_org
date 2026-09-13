import { notFound } from "next/navigation";

import { PastorEnrolleeReviewView } from "@/components/ppc/pastor-enrollee-review-view";
import { requirePastorOrAdmin } from "@/lib/auth/require-role";
import { hasAdminAccess } from "@/lib/app-role";
import {
  getPastorEnrolleeById,
  getPastorEnrolleeSubmissions,
  isPastorAssignedToEnrollment,
} from "@/lib/db/queries/pastor-followups";

export default async function PastorEnrolleeDetailPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const session = await requirePastorOrAdmin();
  const isAdmin = hasAdminAccess(session.user.role);

  const { enrollmentId: raw } = await params;
  const enrollmentId = Number(raw);
  if (!Number.isInteger(enrollmentId)) notFound();

  if (!isAdmin) {
    const owns = await isPastorAssignedToEnrollment(session.user.id, enrollmentId);
    if (!owns) notFound();
  }

  const [enrollee, submissions] = await Promise.all([
    getPastorEnrolleeById(enrollmentId),
    getPastorEnrolleeSubmissions(enrollmentId),
  ]);
  if (!enrollee) notFound();

  return (
    <PastorEnrolleeReviewView
      enrollee={enrollee}
      submissions={submissions}
      isAdmin={isAdmin}
    />
  );
}

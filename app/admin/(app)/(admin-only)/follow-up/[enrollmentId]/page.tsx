import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-role";
import { getCoordinatorEnrollee } from "@/lib/db/queries/sogp-coordinator";
import { listFollowUpOwnerCandidates } from "@/lib/db/queries/sogp-follow-up-requests";
import { CoordinatorEnrolleeDetails } from "@/components/ppc/sogp-coordinator";

export default async function CoordinatorEnrolleePage({ params }: { params: Promise<{ enrollmentId: string }> }) {
  await requireAdmin();
  const id = Number((await params).enrollmentId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const [data, people] = await Promise.all([getCoordinatorEnrollee(id), listFollowUpOwnerCandidates()]);
  if (!data) notFound();
  return <CoordinatorEnrolleeDetails data={data} people={people} />;
}

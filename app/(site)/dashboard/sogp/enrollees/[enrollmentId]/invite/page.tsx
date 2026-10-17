import { redirect } from "next/navigation";

/** The enrollee invite moved under Groups in Community (17 October); old links keep working. */
export default async function OldInviteEnrollee({ params }: { params: Promise<{ enrollmentId: string }> }) {
  const { enrollmentId } = await params;
  redirect(`/dashboard/community/enrollees/${encodeURIComponent(enrollmentId)}/invite`);
}

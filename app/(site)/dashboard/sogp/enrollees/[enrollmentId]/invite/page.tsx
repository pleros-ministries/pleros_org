import { redirect } from "next/navigation";

// Reads the session or params on every request (Cache Components).
export const instant = false;

/** The enrollee invite moved under Groups in Community (17 October); old links keep working. */
export default async function OldInviteEnrollee({ params }: { params: Promise<{ enrollmentId: string }> }) {
  const { enrollmentId } = await params;
  redirect(`/dashboard/community/enrollees/${encodeURIComponent(enrollmentId)}/invite`);
}

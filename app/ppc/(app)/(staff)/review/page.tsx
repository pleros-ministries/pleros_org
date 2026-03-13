import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";
import { getReviewQueue } from "@/lib/db/queries/submissions";
import { PageHeader } from "@/components/ppc/page-header";
import { ReviewQueueClient } from "@/components/ppc/review-queue-client";

function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export default async function ReviewQueuePage() {
  const session = await getAppSession();
  if (!session) {
    const h = await headers();
    redirect(toExternalPpcPath(h.get("host"), "/sign-in"));
  }

  const rawQueue = await getReviewQueue();

  const submissions = rawQueue.map((item) => ({
    id: item.id,
    userId: item.userId,
    lessonId: item.lessonId,
    content: item.content,
    status: item.status === "submitted" ? "pending_review" : item.status,
    reviewerNote: item.reviewerNote,
    submittedAt: serializeDate(item.submittedAt),
    reviewedAt: serializeDate(item.reviewedAt),
    studentName: item.studentName,
    studentEmail: item.studentEmail,
    lessonTitle: item.lessonTitle,
    lessonNumber: item.lessonNumber,
    levelId: item.levelId,
  }));

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Review queue"
        description={`${submissions.length} total submissions`}
      />
      <ReviewQueueClient
        submissions={submissions}
        reviewerId={session.user.id}
      />
    </div>
  );
}

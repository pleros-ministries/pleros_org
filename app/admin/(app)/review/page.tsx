import { getReviewQueue } from "@/lib/db/queries/submissions";
import { PageHeader } from "@/components/ppc/page-header";
import { ReviewQueueClient } from "@/components/ppc/review-queue-client";

function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export default async function AdminReviewPage() {
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
      <ReviewQueueClient submissions={submissions} />
    </div>
  );
}

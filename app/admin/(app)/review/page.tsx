import { redirect } from "next/navigation";

import { getReviewQueue } from "@/lib/db/queries/submissions";
import { getAppSession } from "@/lib/app-session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ppc/page-header";
import { ReviewQueueClient } from "@/components/ppc/review-queue-client";

function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export default async function AdminReviewPage() {
  const session = await getAppSession();
  if (!session) {
    redirect("/admin");
  }
  if (session.user.role === "student") {
    redirect("/ppc");
  }
  const currentStaffRole = session.user.role === "admin" ? "admin" : "instructor";

  const rawQueue = await getReviewQueue();
  const staffUsers = await db.query.users.findMany({
    where: (user, { eq, or }) =>
      or(eq(user.role, "admin"), eq(user.role, "instructor")),
  });

  const submissions = rawQueue.map((item) => ({
    id: item.id,
    userId: item.userId,
    lessonId: item.lessonId,
    content: item.content,
    status: item.status === "submitted" ? "pending_review" : item.status,
    reviewerNote: item.reviewerNote,
    assignedToId: item.assignedToId,
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
        currentStaffId={session.user.id}
        currentStaffRole={currentStaffRole}
        staffOptions={staffUsers.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
        }))}
      />
    </div>
  );
}

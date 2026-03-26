import { getAllThreads } from "@/lib/db/queries/qa";
import { PageHeader } from "@/components/ppc/page-header";
import { QaInboxClient } from "@/components/ppc/qa-inbox-client";

function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export default async function AdminQaPage() {
  const rawThreads = await getAllThreads();

  const threads = rawThreads.map((thread) => ({
    id: thread.id,
    userId: thread.userId,
    lessonId: thread.lessonId,
    subject: thread.subject,
    status: thread.status,
    createdAt: serializeDate(thread.createdAt) ?? new Date().toISOString(),
    studentName: thread.studentName,
    studentEmail: thread.studentEmail,
    lessonTitle: thread.lessonTitle,
    levelId: thread.levelId,
    lessonNumber: thread.lessonNumber,
  }));

  return (
    <div className="grid gap-6">
      <PageHeader title="Q&A inbox" description={`${threads.length} threads`} />
      <QaInboxClient threads={threads} />
    </div>
  );
}

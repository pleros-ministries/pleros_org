import { redirect } from "next/navigation";

import { getAllThreads } from "@/lib/db/queries/qa";
import { getAppSession } from "@/lib/app-session";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ppc/page-header";
import { QaInboxClient } from "@/components/ppc/qa-inbox-client";

function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export default async function AdminQaPage() {
  const session = await getAppSession();
  if (!session) {
    redirect("/admin");
  }
  if (session.user.role === "student") {
    redirect("/ppc");
  }
  const currentStaffRole = session.user.role === "admin" ? "admin" : "instructor";

  const rawThreads = await getAllThreads();
  const staffUsers = await db.query.users.findMany({
    where: (user, { eq, or }) =>
      or(eq(user.role, "admin"), eq(user.role, "instructor")),
  });

  const threads = rawThreads.map((thread) => ({
    id: thread.id,
    userId: thread.userId,
    lessonId: thread.lessonId,
    subject: thread.subject,
    assignedToId: thread.assignedToId,
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
      <QaInboxClient
        threads={threads}
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

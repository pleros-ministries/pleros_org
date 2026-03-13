import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";
import { getAllThreads } from "@/lib/db/queries/qa";
import { PageHeader } from "@/components/ppc/page-header";
import { QaInboxClient } from "@/components/ppc/qa-inbox-client";

function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export default async function QaInboxPage() {
  const session = await getAppSession();
  if (!session) {
    const h = await headers();
    redirect(toExternalPpcPath(h.get("host"), "/sign-in"));
  }

  const rawThreads = await getAllThreads();

  const threads = rawThreads.map((t) => ({
    id: t.id,
    userId: t.userId,
    lessonId: t.lessonId,
    subject: t.subject,
    status: t.status,
    createdAt: serializeDate(t.createdAt) ?? new Date().toISOString(),
    studentName: t.studentName,
    studentEmail: t.studentEmail,
    lessonTitle: t.lessonTitle,
    levelId: t.levelId,
    lessonNumber: t.lessonNumber,
  }));

  const reviewerRole = session.user.role === "admin" ? "admin" as const : "instructor" as const;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Q&A inbox"
        description={`${threads.length} threads`}
      />
      <QaInboxClient
        threads={threads}
        reviewerId={session.user.id}
        reviewerRole={reviewerRole}
      />
    </div>
  );
}

import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";

import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";
import { getLevelById, getLessonById } from "@/lib/db/queries/lessons";
import { getThreadsByLesson } from "@/lib/db/queries/qa";
import { Breadcrumb } from "@/components/ppc/breadcrumb";
import { PageHeader } from "@/components/ppc/page-header";
import { QaThreadList } from "@/components/ppc/qa-thread-list";

export default async function QaPage({
  params,
}: {
  params: Promise<{ levelId: string; lessonId: string }>;
}) {
  const { levelId: levelIdStr, lessonId: lessonIdStr } = await params;
  const levelId = Number(levelIdStr);
  const lessonId = Number(lessonIdStr);

  const session = await getAppSession();
  if (!session) {
    const h = await headers();
    redirect(toExternalPpcPath(h.get("host"), "/sign-in"));
  }

  const userId = session.user.id;

  const level = await getLevelById(levelId);
  if (!level) notFound();

  const lesson = await getLessonById(lessonId);
  if (!lesson || lesson.levelId !== levelId) notFound();

  const threads = await getThreadsByLesson(lessonId, userId);

  const serializedThreads = threads.map((t) => ({
    id: t.id,
    subject: t.subject,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "My learning", href: "/ppc/student" },
          { label: level.title, href: `/ppc/student/level/${levelId}` },
          {
            label: `L${levelId}.${lesson.lessonNumber}`,
            href: `/ppc/student/level/${levelId}/lesson/${lessonId}`,
          },
          { label: "Q&A" },
        ]}
      />

      <PageHeader
        title="Questions & answers"
        description={lesson.title}
      />

      <div className="rounded-sm border border-zinc-200 bg-white p-4">
        <QaThreadList
          userId={userId}
          lessonId={lessonId}
          userRole={session.user.role as "student" | "instructor" | "admin"}
          initialThreads={serializedThreads}
        />
      </div>
    </div>
  );
}

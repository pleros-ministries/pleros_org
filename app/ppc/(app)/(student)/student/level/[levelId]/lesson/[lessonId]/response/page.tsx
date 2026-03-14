import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";

import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";
import { getLevelById, getLessonById } from "@/lib/db/queries/lessons";
import { getSubmission } from "@/lib/db/queries/submissions";
import { Breadcrumb } from "@/components/ppc/breadcrumb";
import { PageHeader } from "@/components/ppc/page-header";
import { WrittenResponseEditor } from "@/components/ppc/written-response-editor";

export default async function WrittenResponsePage({
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

  const submission = await getSubmission(userId, lessonId);

  const serialized = submission
    ? {
        id: submission.id,
        content: submission.content,
        status: submission.status,
        reviewerNote: submission.reviewerNote,
      }
    : null;

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
          { label: "Written response" },
        ]}
      />

      <PageHeader
        title="Written response"
        description={lesson.title}
      />

      <div className="rounded-sm border border-zinc-200 bg-white p-4">
        <WrittenResponseEditor
          userId={userId}
          lessonId={lessonId}
          existingSubmission={serialized}
        />
      </div>
    </div>
  );
}

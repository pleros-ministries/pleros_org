import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";
import { getContentOverview, getLessonForEdit } from "@/lib/db/queries/content";
import { PageHeader } from "@/components/ppc/page-header";
import { Breadcrumb } from "@/components/ppc/breadcrumb";
import { ContentCmsClient } from "@/components/ppc/content-cms-client";

function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export default async function ContentCmsPage() {
  const session = await getAppSession();
  if (!session) {
    const h = await headers();
    redirect(toExternalPpcPath(h.get("host"), "/sign-in"));
  }

  const rawLevels = await getContentOverview();

  const levels = rawLevels.map((level) => ({
    id: level.id,
    title: level.title,
    sortOrder: level.sortOrder,
    lessons: level.lessons.map((lesson) => ({
      id: lesson.id,
      lessonNumber: lesson.lessonNumber,
      title: lesson.title,
      status: lesson.status,
      audioUrl: lesson.audioUrl,
      notesContent: lesson.notesContent,
    })),
    publishedCount: level.publishedCount,
    draftCount: level.draftCount,
    totalLessons: level.totalLessons,
  }));

  const allLessonIds = levels.flatMap((l) => l.lessons.map((ls) => ls.id));
  const questionsEntries = await Promise.all(
    allLessonIds.map(async (lessonId) => {
      const data = await getLessonForEdit(lessonId);
      const questions = (data?.questions ?? []).map((q) => ({
        id: q.id,
        lessonId: q.lessonId,
        questionType: q.questionType,
        questionText: q.questionText,
        options: q.options as string[] | null,
        correctAnswer: q.correctAnswer,
        sortOrder: q.sortOrder,
      }));
      return [lessonId, questions] as const;
    }),
  );
  const initialQuestions = Object.fromEntries(questionsEntries);

  return (
    <div className="grid gap-6">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/ppc/admin" },
          { label: "Content" },
        ]}
      />
      <PageHeader
        title="Content CMS"
        description="Manage levels, lessons, and quiz questions"
      />
      <ContentCmsClient
        levels={levels}
        initialQuestions={initialQuestions}
      />
    </div>
  );
}

import { getContentOverview, getLessonForEdit } from "@/lib/db/queries/content";
import { PageHeader } from "@/components/ppc/page-header";
import { Breadcrumb } from "@/components/ppc/breadcrumb";
import { ContentCmsClient } from "@/components/ppc/content-cms-client";

export default async function AdminContentPage() {
  const rawLevels = await getContentOverview();

  const levels = rawLevels.map((level) => ({
    id: level.id,
    title: level.title,
    description: level.description,
    sortOrder: level.sortOrder,
    lessons: level.lessons.map((lesson) => ({
      id: lesson.id,
      lessonNumber: lesson.lessonNumber,
      title: lesson.title,
      status: lesson.status,
      audioUrl: lesson.audioUrl,
      audioUploadKey: lesson.audioUploadKey,
      audioFileName: lesson.audioFileName,
      audioFileSize: lesson.audioFileSize,
      audioUploadedAt: lesson.audioUploadedAt?.toISOString() ?? null,
      notesContent: lesson.notesContent,
    })),
    publishedCount: level.publishedCount,
    draftCount: level.draftCount,
    totalLessons: level.totalLessons,
  }));

  const allLessonIds = levels.flatMap((level) =>
    level.lessons.map((lesson) => lesson.id),
  );
  const questionsEntries = await Promise.all(
    allLessonIds.map(async (lessonId) => {
      const data = await getLessonForEdit(lessonId);
      const questions = (data?.questions ?? []).map((question) => ({
        id: question.id,
        lessonId: question.lessonId,
        questionType: question.questionType,
        questionText: question.questionText,
        options: question.options as string[] | null,
        correctAnswer: question.correctAnswer,
        sortOrder: question.sortOrder,
      }));
      return [lessonId, questions] as const;
    }),
  );
  const initialQuestions = Object.fromEntries(questionsEntries);

  return (
    <div className="grid gap-6">
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Content" }]} />
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

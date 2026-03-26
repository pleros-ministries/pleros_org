import { notFound } from "next/navigation";

import { getStudentById } from "@/lib/db/queries/students";
import { getLevels, getStudentLevelProgress } from "@/lib/db/queries/lessons";
import { isLevelGraduated } from "@/lib/db/queries/graduations";
import { getReviewQueue } from "@/lib/db/queries/submissions";
import { getThreadsByUser } from "@/lib/db/queries/qa";
import { PageHeader } from "@/components/ppc/page-header";
import { Breadcrumb } from "@/components/ppc/breadcrumb";
import { StudentDetailClient } from "@/components/ppc/student-detail-client";
import { getAppSession } from "@/lib/app-session";

type StudentDetailPageProps = {
  params: Promise<{ studentId: string }>;
};

function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export default async function AdminStudentDetailPage({
  params,
}: StudentDetailPageProps) {
  const session = await getAppSession();
  if (!session) notFound();

  const { studentId } = await params;
  const student = await getStudentById(studentId);
  if (!student) notFound();

  const allLevels = await getLevels();
  const levelIds =
    allLevels.length > 0 ? allLevels.map((level) => level.id) : [1, 2, 3, 4, 5];

  const levelProgress = await Promise.all(
    levelIds.map(async (levelId) => {
      const lessonProgress = await getStudentLevelProgress(student.id, levelId);
      const graduated = await isLevelGraduated(student.id, levelId);

      return {
        levelId,
        lessons: lessonProgress.map((item) => ({
          id: item.lesson.id,
          title: item.lesson.title,
          lessonNumber: item.lesson.lessonNumber,
        })),
        progress: lessonProgress.map((item) => ({
          lessonId: item.lesson.id,
          audioListened: item.progress?.audioListened ?? false,
          notesRead: item.progress?.notesRead ?? false,
          quizPassed: item.progress?.quizPassed ?? false,
          writtenApproved: item.progress?.writtenApproved ?? false,
        })),
        graduated,
      };
    }),
  );

  const allSubmissions = await getReviewQueue();
  const studentSubmissions = allSubmissions
    .filter((submission) => submission.userId === student.id)
    .map((submission) => ({
      id: submission.id,
      lessonId: submission.lessonId,
      lessonTitle: submission.lessonTitle,
      levelId: submission.levelId,
      content: submission.content,
      status:
        submission.status === "submitted"
          ? "pending_review"
          : submission.status,
      reviewerNote: submission.reviewerNote,
      submittedAt: serializeDate(submission.submittedAt),
    }));

  const rawThreads = await getThreadsByUser(student.id);
  const threads = rawThreads.map((thread) => ({
    id: thread.id,
    subject: thread.subject,
    status: thread.status,
    lessonTitle: `Lesson ${thread.lessonId}`,
  }));

  return (
    <div className="grid gap-6">
      <Breadcrumb
        items={[
          { label: "Students", href: "/admin/students" },
          { label: student.name },
        ]}
      />
      <PageHeader title={student.name} description={student.email} />
      <StudentDetailClient
        student={{
          id: student.id,
          name: student.name,
          email: student.email,
          role: student.role,
          location: student.location ?? null,
          createdAt: serializeDate(student.createdAt) ?? new Date().toISOString(),
        }}
        levelProgress={levelProgress}
        submissions={studentSubmissions}
        threads={threads}
        isAdmin={session.user.role === "admin"}
      />
    </div>
  );
}

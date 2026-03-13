import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";

import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";
import { getStudentById } from "@/lib/db/queries/students";
import { getLevels, getStudentLevelProgress } from "@/lib/db/queries/lessons";
import { getGraduations, isLevelGraduated } from "@/lib/db/queries/graduations";
import { getReviewQueue } from "@/lib/db/queries/submissions";
import { getThreadsByUser } from "@/lib/db/queries/qa";
import { PageHeader } from "@/components/ppc/page-header";
import { Breadcrumb } from "@/components/ppc/breadcrumb";
import { StudentDetailClient } from "@/components/ppc/student-detail-client";

type StudentDetailPageProps = {
  params: Promise<{ studentId: string }>;
};

function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const session = await getAppSession();
  if (!session) {
    const h = await headers();
    redirect(toExternalPpcPath(h.get("host"), "/sign-in"));
  }

  const { studentId } = await params;
  const student = await getStudentById(studentId);
  if (!student) notFound();

  const allLevels = await getLevels();
  const levelIds = allLevels.length > 0 ? allLevels.map((l) => l.id) : [1, 2, 3, 4, 5];

  const levelProgress = await Promise.all(
    levelIds.map(async (levelId) => {
      const lessonProgress = await getStudentLevelProgress(student.id, levelId);
      const graduated = await isLevelGraduated(student.id, levelId);

      return {
        levelId,
        lessons: lessonProgress.map((lp) => ({
          id: lp.lesson.id,
          title: lp.lesson.title,
          lessonNumber: lp.lesson.lessonNumber,
        })),
        progress: lessonProgress.map((lp) => ({
          lessonId: lp.lesson.id,
          audioListened: lp.progress?.audioListened ?? false,
          notesRead: lp.progress?.notesRead ?? false,
          quizPassed: lp.progress?.quizPassed ?? false,
          writtenApproved: lp.progress?.writtenApproved ?? false,
        })),
        graduated,
      };
    }),
  );

  const allSubmissions = await getReviewQueue();
  const studentSubmissions = allSubmissions
    .filter((s) => s.userId === student.id)
    .map((s) => ({
      id: s.id,
      lessonId: s.lessonId,
      lessonTitle: s.lessonTitle,
      levelId: s.levelId,
      content: s.content,
      status: s.status === "submitted" ? "pending_review" : s.status,
      reviewerNote: s.reviewerNote,
      submittedAt: serializeDate(s.submittedAt),
    }));

  const rawThreads = await getThreadsByUser(student.id);
  const threads = rawThreads.map((t) => ({
    id: t.id,
    subject: t.subject,
    status: t.status,
    lessonTitle: `Lesson ${t.lessonId}`,
  }));

  const reviewerId = session.user.id;
  const isAdmin = session.user.role === "admin";

  return (
    <div className="grid gap-6">
      <Breadcrumb
        items={[
          { label: "Students", href: "/ppc/students" },
          { label: student.name },
        ]}
      />
      <PageHeader
        title={student.name}
        description={student.email}
      />
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
        isAdmin={isAdmin}
        reviewerId={reviewerId}
      />
    </div>
  );
}

import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";

import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";
import { getLevelById, getLessonById } from "@/lib/db/queries/lessons";
import { getQuizQuestions, getBestQuizScore } from "@/lib/db/queries/quizzes";
import { Breadcrumb } from "@/components/ppc/breadcrumb";
import { PageHeader } from "@/components/ppc/page-header";
import { EmptyState } from "@/components/ppc/empty-state";
import { QuizFlow } from "@/components/ppc/quiz-flow";

export default async function QuizPage({
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

  const questions = await getQuizQuestions(lessonId);
  const bestScore = await getBestQuizScore(userId, lessonId);

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
          { label: "Quiz" },
        ]}
      />

      <PageHeader
        title="Quiz"
        description={`${lesson.title} · ${questions.length} question${questions.length !== 1 ? "s" : ""}`}
      />

      {questions.length === 0 ? (
        <EmptyState
          title="No questions yet"
          description="The quiz for this lesson hasn't been set up yet."
        />
      ) : (
        <div className="rounded border border-zinc-200 bg-white p-4">
          <QuizFlow
            userId={userId}
            lessonId={lessonId}
            questions={questions}
            bestScore={bestScore}
          />
        </div>
      )}
    </div>
  );
}

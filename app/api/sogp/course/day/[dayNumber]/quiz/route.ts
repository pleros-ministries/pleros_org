import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import {
  getAttemptCount,
  getBestQuizScore,
  getQuizQuestions,
  submitQuizAttempt,
} from "@/lib/db/queries/quizzes";
import { requireSogpDayAccess } from "@/lib/sogp/server-access";
import { canSubmitQuizAnswers } from "@/lib/student-journey";

async function resolveContext(
  params: Promise<{ dayNumber: string }>,
) {
  const session = await getAppSession();
  if (!session) return null;
  const { dayNumber: raw } = await params;
  const dayNumber = Number(raw);
  if (!Number.isInteger(dayNumber)) return null;
  const data = await requireSogpDayAccess(session.user.id, dayNumber);
  return { session, dayNumber, data };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dayNumber: string }> },
) {
  try {
    const context = await resolveContext(params);
    if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const [questions, bestScore] = await Promise.all([
      getQuizQuestions(context.data.track.lesson.id),
      getBestQuizScore(context.session.user.id, context.data.track.lesson.id),
    ]);
    return NextResponse.json({
      dayNumber: context.dayNumber,
      lessonTitle: context.data.track.lesson.title,
      bestScore,
      questions: questions.map((question) => ({
        id: question.id,
        questionType: question.questionType,
        questionText: question.questionText,
        options: question.options,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Quiz is unavailable" }, { status: 403 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ dayNumber: string }> },
) {
  try {
    const context = await resolveContext(params);
    if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json().catch(() => null)) as {
      answers?: Record<string, string>;
    } | null;
    const answers = body?.answers ?? {};
    const questions = await getQuizQuestions(context.data.track.lesson.id);
    if (!canSubmitQuizAnswers(questions, answers)) {
      return NextResponse.json(
        { error: "Answer every question before submitting." },
        { status: 400 },
      );
    }
    const scored = questions.filter(
      (question) => question.questionType === "multiple_choice",
    );
    const correct = scored.filter(
      (question) => answers[String(question.id)] === question.correctAnswer,
    ).length;
    const score = scored.length ? Math.round((correct / scored.length) * 100) : 0;
    const attemptCount = await getAttemptCount(
      context.session.user.id,
      context.data.track.lesson.id,
    );
    await submitQuizAttempt({
      userId: context.session.user.id,
      lessonId: context.data.track.lesson.id,
      answers,
      score,
      attemptNumber: attemptCount + 1,
    });
    return NextResponse.json({
      score,
      passed: score >= 70,
      attemptNumber: attemptCount + 1,
    });
  } catch {
    return NextResponse.json({ error: "Quiz is unavailable" }, { status: 403 });
  }
}

import "server-only";

import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export type DiscipleQuizAnswer = { question: string; answer: string | null; correctAnswer: string | null; correct: boolean | null };
export type DiscipleQuiz = { lessonId: number; lessonTitle: string; score: number; attemptNumber: number; takenAt: string; answers: DiscipleQuizAnswer[] };
export type DiscipleWritten = { lessonId: number; lessonTitle: string; prompt: string | null; content: string; status: "submitted" | "approved" | "needs_revision"; submittedAt: string | null };
export type DiscipleWork = { quizzes: DiscipleQuiz[]; written: DiscipleWritten[] };

const leader = alias(schema.sogpEnrollments, "work_leader");
const disciple = alias(schema.sogpEnrollments, "work_disciple");

/**
 * A disciple's quiz answers and submitted written work, for their current
 * discipler only (user decision, 17 October: disciplers see the work, not just
 * scores). The membership must be active in a group the viewer leads; lessons
 * are limited to the disciple's own cohort. Never reaches other learners,
 * notifications or Telegram.
 */
export async function getDiscipleWork(viewerUserId: string, groupId: number, membershipId: number): Promise<DiscipleWork | null> {
  const [member] = await db
    .select({ userId: disciple.userId, cohortId: disciple.cohortId })
    .from(schema.discipleshipMemberships)
    .innerJoin(schema.discipleshipGroups, eq(schema.discipleshipGroups.id, schema.discipleshipMemberships.groupId))
    .innerJoin(leader, and(eq(leader.id, schema.discipleshipGroups.leaderEnrollmentId), eq(leader.userId, viewerUserId)))
    .innerJoin(disciple, eq(disciple.id, schema.discipleshipMemberships.discipleEnrollmentId))
    .where(and(
      eq(schema.discipleshipMemberships.id, membershipId),
      eq(schema.discipleshipMemberships.groupId, groupId),
      eq(schema.discipleshipMemberships.status, "active"),
    ))
    .limit(1);
  if (!member) return null;

  const cohortLessons = and(
    eq(schema.sogpCohortTracks.cohortId, member.cohortId),
    eq(schema.sogpCohortTracks.lessonId, schema.lessons.id),
  );

  const [attempts, written] = await Promise.all([
    db.select({
      lessonId: schema.quizAttempts.lessonId,
      lessonTitle: schema.lessons.title,
      answers: schema.quizAttempts.answers,
      score: schema.quizAttempts.score,
      attemptNumber: schema.quizAttempts.attemptNumber,
      createdAt: schema.quizAttempts.createdAt,
    })
      .from(schema.quizAttempts)
      .innerJoin(schema.lessons, eq(schema.lessons.id, schema.quizAttempts.lessonId))
      .innerJoin(schema.sogpCohortTracks, cohortLessons)
      .where(eq(schema.quizAttempts.userId, member.userId))
      .orderBy(desc(schema.quizAttempts.createdAt))
      .limit(120),
    db.select({
      lessonId: schema.writtenSubmissions.lessonId,
      lessonTitle: schema.lessons.title,
      prompt: schema.lessons.responsePrompt,
      content: schema.writtenSubmissions.content,
      status: schema.writtenSubmissions.status,
      submittedAt: schema.writtenSubmissions.submittedAt,
    })
      .from(schema.writtenSubmissions)
      .innerJoin(schema.lessons, eq(schema.lessons.id, schema.writtenSubmissions.lessonId))
      .innerJoin(schema.sogpCohortTracks, cohortLessons)
      .where(and(eq(schema.writtenSubmissions.userId, member.userId), ne(schema.writtenSubmissions.status, "draft")))
      .orderBy(desc(schema.writtenSubmissions.submittedAt))
      .limit(40),
  ]);

  // The latest attempt per lesson, newest lessons first.
  const latest = new Map<number, (typeof attempts)[number]>();
  for (const attempt of attempts) if (!latest.has(attempt.lessonId)) latest.set(attempt.lessonId, attempt);
  const lessonIds = [...latest.keys()].slice(0, 30);
  const questions = lessonIds.length
    ? await db.select({
      id: schema.quizQuestions.id,
      lessonId: schema.quizQuestions.lessonId,
      text: schema.quizQuestions.questionText,
      type: schema.quizQuestions.questionType,
      correctAnswer: schema.quizQuestions.correctAnswer,
      sortOrder: schema.quizQuestions.sortOrder,
    }).from(schema.quizQuestions).where(inArray(schema.quizQuestions.lessonId, lessonIds)).orderBy(schema.quizQuestions.sortOrder)
    : [];

  return {
    quizzes: lessonIds.map(lessonId => {
      const attempt = latest.get(lessonId)!;
      return {
        lessonId,
        lessonTitle: attempt.lessonTitle,
        score: attempt.score,
        attemptNumber: attempt.attemptNumber,
        takenAt: attempt.createdAt.toISOString(),
        answers: questions.filter(question => question.lessonId === lessonId).map(question => {
          const answer = attempt.answers[String(question.id)] ?? null;
          const marked = question.type === "multiple_choice" && question.correctAnswer;
          return {
            question: question.text,
            answer,
            correctAnswer: marked ? question.correctAnswer : null,
            correct: marked ? answer === question.correctAnswer : null,
          };
        }),
      };
    }),
    // A lesson can sit in a cohort's schedule more than once; show it once.
    written: written.filter((row, index) => written.findIndex(other => other.lessonId === row.lessonId) === index).map(row => ({
      lessonId: row.lessonId,
      lessonTitle: row.lessonTitle,
      prompt: row.prompt,
      content: row.content,
      status: row.status as DiscipleWritten["status"],
      submittedAt: row.submittedAt?.toISOString() ?? null,
    })),
  };
}

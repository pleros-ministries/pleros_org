import { getGraduations } from "@/lib/db/queries/graduations";
import { getLevels, getLessonById } from "@/lib/db/queries/lessons";
import { canAccessStudentLevel } from "@/lib/student-journey";

export async function canStudentAccessLevel(userId: string, levelId: number) {
  const [levels, graduations] = await Promise.all([
    getLevels(),
    getGraduations(userId),
  ]);

  return canAccessStudentLevel({
    levelId,
    graduatedLevelIds: graduations.map((graduation) => graduation.levelId),
    totalLevels: levels.length,
  });
}

export async function assertCanAccessPublishedLesson(
  userId: string,
  lessonId: number,
) {
  const lesson = await getLessonById(lessonId);

  if (!lesson || lesson.status !== "published") {
    throw new Error("Lesson is not available.");
  }

  const canAccessLevel = await canStudentAccessLevel(userId, lesson.levelId);
  if (!canAccessLevel) {
    throw new Error("Lesson is locked.");
  }

  return lesson;
}

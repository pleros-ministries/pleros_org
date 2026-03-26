"use server";

import { revalidatePath } from "next/cache";
import {
  createLevel,
  createLesson,
  deleteLevel,
  updateLesson,
  deleteLesson,
  getLessonById,
  getAllLessonsByLevel,
  renumberLessonsInLevel,
  getLevels,
  updateLevel,
  getLevelById,
  renumberLevels,
} from "@/lib/db/queries/lessons";
import {
  publishLesson,
  unpublishLesson,
  getLessonForEdit,
} from "@/lib/db/queries/content";
import {
  createQuizQuestion,
  getQuizQuestions,
  updateQuizQuestion,
  deleteQuizQuestion,
} from "@/lib/db/queries/quizzes";
import { requireAdmin } from "@/lib/auth/require-role";
import {
  getLevelDeletionState,
  getNextLevelSortOrder,
  getLessonAudioCleanupKey,
  getLessonDeletionState,
  getLessonPublishReadiness,
  moveQuestionInOrder,
  hasLevelDraftChanges,
  removeLevelFromOrder,
  renumberLessonsForTarget,
  renumberLevelsForTarget,
} from "@/lib/ppc-content-cms";
import { deleteManagedLessonAudio } from "@/lib/upload/lesson-audio";

function revalidateContentSurfaces() {
  revalidatePath("/ppc", "layout");
  revalidatePath("/admin", "layout");
}

function normalizeLessonAudioFields(data: {
  audioUrl?: string | null;
  audioUploadKey?: string | null;
  audioFileName?: string | null;
  audioFileSize?: number | null;
  audioUploadedAt?: string | null;
}) {
  const audioUrl = data.audioUrl?.trim() || null;

  if (!audioUrl) {
    return {
      audioUrl: null,
      audioUploadKey: null,
      audioFileName: null,
      audioFileSize: null,
      audioUploadedAt: null,
    };
  }

  if (!data.audioUploadKey) {
    return {
      audioUrl,
      audioUploadKey: null,
      audioFileName: null,
      audioFileSize: null,
      audioUploadedAt: null,
    };
  }

  return {
    audioUrl,
    audioUploadKey: data.audioUploadKey,
    audioFileName: data.audioFileName ?? null,
    audioFileSize: data.audioFileSize ?? null,
    audioUploadedAt: data.audioUploadedAt ? new Date(data.audioUploadedAt) : null,
  };
}

function serializeLessonForClient<T extends {
  audioUploadedAt: Date | null;
} | null | undefined>(lesson: T) {
  if (!lesson) {
    return lesson;
  }

  return {
    ...lesson,
    audioUploadedAt: lesson.audioUploadedAt?.toISOString() ?? null,
  };
}

export async function createNewLesson(data: {
  levelId: number;
  lessonNumber: number;
  title: string;
  audioUrl?: string | null;
  audioUploadKey?: string | null;
  audioFileName?: string | null;
  audioFileSize?: number | null;
  audioUploadedAt?: string | null;
  notesContent?: string;
}) {
  await requireAdmin();
  const lesson = await createLesson({
    levelId: data.levelId,
    lessonNumber: data.lessonNumber,
    title: data.title,
    notesContent: data.notesContent,
    ...normalizeLessonAudioFields(data),
  });
  revalidateContentSurfaces();
  return serializeLessonForClient(lesson);
}

export async function createNewLevel(data: {
  title: string;
  description?: string | null;
}) {
  await requireAdmin();
  const title = data.title.trim();
  if (!title) {
    throw new Error("Level title is required.");
  }

  const levels = await getLevels();
  const level = await createLevel({
    title,
    description: data.description?.trim() || null,
    sortOrder: getNextLevelSortOrder(levels),
  });
  revalidateContentSurfaces();
  return level;
}

export async function updateLevelContent(
  levelId: number,
  data: {
    title?: string;
    description?: string | null;
    sortOrder?: number;
  },
) {
  await requireAdmin();
  const existingLevel = await getLevelById(levelId);
  if (!existingLevel) {
    throw new Error("Level not found.");
  }

  const normalizedTitle = data.title?.trim();
  const normalizedDescription =
    data.description == null ? data.description : data.description.trim() || null;

  if (normalizedTitle !== undefined && !normalizedTitle) {
    throw new Error("Level title is required.");
  }

  if (
    data.sortOrder != null &&
    (!Number.isInteger(data.sortOrder) || data.sortOrder < 1)
  ) {
    throw new Error("Level order must be a whole number greater than zero.");
  }

  if (
    !hasLevelDraftChanges(existingLevel, {
      sortOrder: data.sortOrder ?? existingLevel.sortOrder,
      title: normalizedTitle ?? existingLevel.title,
      description: normalizedDescription ?? existingLevel.description ?? "",
    })
  ) {
    return existingLevel;
  }

  const updatedLevel = await updateLevel(levelId, {
    title: normalizedTitle,
    description: normalizedDescription,
  });

  if (
    data.sortOrder != null &&
    data.sortOrder !== existingLevel.sortOrder
  ) {
    const siblingLevels = await getLevels();
    const reorderedLevels = renumberLevelsForTarget(
      siblingLevels,
      levelId,
      data.sortOrder,
    );
    await renumberLevels(reorderedLevels);
  }

  revalidateContentSurfaces();
  return getLevelById(updatedLevel.id);
}

export async function removeLevelAction(levelId: number) {
  await requireAdmin();
  const level = await getLevelById(levelId);
  if (!level) {
    throw new Error("Level not found.");
  }

  const levelLessons = await getAllLessonsByLevel(levelId);
  const deletionState = getLevelDeletionState(levelLessons.length);
  if (!deletionState.canDelete) {
    throw new Error(deletionState.detail);
  }

  await deleteLevel(levelId);
  const remainingLevels = await getLevels();
  await renumberLevels(removeLevelFromOrder(remainingLevels, levelId));
  revalidateContentSurfaces();
}

export async function updateLessonContent(
  lessonId: number,
  data: {
    title?: string;
    audioUrl?: string | null;
    audioUploadKey?: string | null;
    audioFileName?: string | null;
    audioFileSize?: number | null;
    audioUploadedAt?: string | null;
    notesContent?: string | null;
    lessonNumber?: number;
  },
) {
  await requireAdmin();
  const existingLesson = await getLessonById(lessonId);
  if (!existingLesson) {
    throw new Error("Lesson not found.");
  }

  if (
    data.lessonNumber != null &&
    (!Number.isInteger(data.lessonNumber) || data.lessonNumber < 1)
  ) {
    throw new Error("Lesson number must be a whole number greater than zero.");
  }

  const normalizedAudio = normalizeLessonAudioFields(data);
  const lesson = await updateLesson(lessonId, {
    title: data.title,
    notesContent: data.notesContent,
    ...normalizedAudio,
  });

  if (
    data.lessonNumber != null &&
    data.lessonNumber !== existingLesson.lessonNumber
  ) {
    const siblingLessons = await getAllLessonsByLevel(existingLesson.levelId);
    const renumberedLessons = renumberLessonsForTarget(
      siblingLessons,
      lessonId,
      data.lessonNumber,
    );
    await renumberLessonsInLevel(existingLesson.levelId, renumberedLessons);
  }

  const refreshedLesson = await getLessonById(lessonId);
  const cleanupKey = getLessonAudioCleanupKey({
    previousUploadKey: existingLesson?.audioUploadKey ?? null,
    nextUploadKey: refreshedLesson?.audioUploadKey ?? lesson.audioUploadKey,
  });
  await deleteManagedLessonAudio(cleanupKey);
  revalidateContentSurfaces();
  return serializeLessonForClient(refreshedLesson ?? lesson);
}

export async function removeLessonAction(lessonId: number) {
  await requireAdmin();
  const lesson = await getLessonById(lessonId);
  if (!lesson) {
    throw new Error("Lesson not found.");
  }

  const deletionState = getLessonDeletionState(lesson.status);
  if (!deletionState.canDelete) {
    throw new Error(deletionState.detail);
  }

  await deleteLesson(lessonId);
  await deleteManagedLessonAudio(lesson.audioUploadKey ?? null);
  revalidateContentSurfaces();
}

export async function publishLessonAction(lessonId: number) {
  await requireAdmin();
  const lessonData = await getLessonForEdit(lessonId);
  if (!lessonData) {
    throw new Error("Lesson not found.");
  }

  const readiness = getLessonPublishReadiness({
    title: lessonData.lesson.title,
    audioUrl: lessonData.lesson.audioUrl,
    notesContent: lessonData.lesson.notesContent,
    questions: lessonData.questions.map((question) => ({
      questionType: question.questionType,
      questionText: question.questionText,
      options: question.options as string[] | null,
      correctAnswer: question.correctAnswer,
    })),
  });

  if (!readiness.isReady) {
    const blockingRequirement = readiness.requirements.find(
      (requirement) => !requirement.met,
    );
    throw new Error(
      blockingRequirement?.detail ?? blockingRequirement?.label ?? "Lesson is not ready to publish.",
    );
  }

  const lesson = await publishLesson(lessonId);
  revalidateContentSurfaces();
  return serializeLessonForClient(lesson);
}

export async function unpublishLessonAction(lessonId: number) {
  await requireAdmin();
  const lesson = await unpublishLesson(lessonId);
  revalidateContentSurfaces();
  return serializeLessonForClient(lesson);
}

export async function addQuizQuestion(data: {
  lessonId: number;
  questionType: "multiple_choice" | "short_text";
  questionText: string;
  options?: string[] | null;
  correctAnswer?: string | null;
  sortOrder?: number;
}) {
  await requireAdmin();
  const question = await createQuizQuestion(data);
  revalidateContentSurfaces();
  return question;
}

export async function editQuizQuestion(
  id: number,
  data: { questionText?: string; options?: string[] | null; correctAnswer?: string | null; sortOrder?: number },
) {
  await requireAdmin();
  const question = await updateQuizQuestion(id, data);
  revalidateContentSurfaces();
  return question;
}

export async function removeQuizQuestion(id: number) {
  await requireAdmin();
  await deleteQuizQuestion(id);
  revalidateContentSurfaces();
}

export async function reorderQuizQuestion(
  lessonId: number,
  questionId: number,
  direction: "up" | "down",
) {
  await requireAdmin();
  const questions = await getQuizQuestions(lessonId);
  const reorderedQuestions = moveQuestionInOrder(questions, questionId, direction);

  await Promise.all(
    reorderedQuestions.map((question) =>
      updateQuizQuestion(question.id, { sortOrder: question.sortOrder }),
    ),
  );

  revalidateContentSurfaces();
  return reorderedQuestions;
}

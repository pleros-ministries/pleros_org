type LessonSummary = {
  lessonNumber: number;
};

type LevelSnapshot = {
  sortOrder?: number;
  title: string;
  description: string | null;
};

type LevelDraft = {
  sortOrder?: number;
  title: string;
  description: string;
};

type LessonSnapshot = {
  lessonNumber?: number;
  title: string;
  audioUrl: string | null;
  audioUploadKey?: string | null;
  notesContent: string | null;
};

type LessonDraft = {
  lessonNumber?: number;
  title: string;
  audioUrl: string;
  audioUploadKey?: string | null;
  notesContent: string;
};

type LessonAudioDraft = {
  manualUrl: string;
  uploadedUrl: string | null;
};

type ManagedLessonAudioAsset = {
  url: string;
  uploadKey: string;
  fileName: string;
  fileSize: number | null;
  uploadedAt: string | null;
};

type ManagedLessonAudioDraftInput = {
  manualUrl: string;
  uploadedAsset: ManagedLessonAudioAsset | null;
};

type LessonAudioCleanupInput = {
  previousUploadKey: string | null;
  nextUploadKey: string | null;
};

type LessonAudioDraftSummaryInput = {
  audioUrl: string | null;
  audioUploadKey: string | null;
  audioFileName: string | null;
  audioFileSize: number | null;
  audioUploadedAt: string | null;
};

type PublishReadinessQuestion = {
  questionType: string;
  questionText: string;
  options: string[] | null;
  correctAnswer: string | null;
};

type LessonPublishReadinessInput = {
  title: string;
  audioUrl: string | null;
  notesContent: string | null;
  questions: PublishReadinessQuestion[];
};

type QuizQuestionDraftInput = {
  questionType: "multiple_choice" | "short_text";
  questionText: string;
  optionsText: string;
  correctAnswer: string;
};

type QuizQuestionValidationResult =
  | { error: string }
  | { options: string[] | null };

type LessonPublishRequirement = {
  id: string;
  label: string;
  met: boolean;
  detail?: string;
};

type LessonStatus = "draft" | "published";

type OrderedQuestion = {
  id: number;
  sortOrder: number;
};

type OrderedLesson = {
  id: number;
  lessonNumber: number;
};

type OrderedLevel = {
  id: number;
  sortOrder: number;
};

export function getNextLessonNumber(lessons: LessonSummary[]) {
  if (lessons.length === 0) {
    return 1;
  }

  return Math.max(...lessons.map((lesson) => lesson.lessonNumber)) + 1;
}

export function getNextLevelSortOrder(levels: Pick<OrderedLevel, "sortOrder">[]) {
  if (levels.length === 0) {
    return 1;
  }

  return Math.max(...levels.map((level) => level.sortOrder)) + 1;
}

export function parseQuestionOptions(optionsText: string) {
  return optionsText
    .split(/[\n,]/)
    .map((option) => option.trim())
    .filter(Boolean);
}

export function validateQuizQuestionDraft(
  input: QuizQuestionDraftInput,
): QuizQuestionValidationResult {
  if (!input.questionText.trim()) {
    return { error: "Question text is required." };
  }

  const correctAnswer = input.correctAnswer.trim();

  if (input.questionType === "multiple_choice") {
    const options = parseQuestionOptions(input.optionsText);

    if (options.length < 2) {
      return { error: "Multiple choice questions need at least two options." };
    }

    if (!correctAnswer || !options.includes(correctAnswer)) {
      return { error: "Correct answer must match one of the listed options." };
    }

    return { options };
  }

  if (!correctAnswer) {
    return { error: "Short text questions need an expected answer." };
  }

  return { options: null as string[] | null };
}

export function hasLessonDraftChanges(
  original: LessonSnapshot,
  draft: LessonDraft,
) {
  return (
    (original.lessonNumber ?? null) !== (draft.lessonNumber ?? null) ||
    original.title !== draft.title.trim() ||
    (original.audioUrl ?? "") !== draft.audioUrl.trim() ||
    (original.audioUploadKey ?? null) !== (draft.audioUploadKey ?? null) ||
    (original.notesContent ?? "") !== draft.notesContent.trim()
  );
}

export function hasLevelDraftChanges(
  original: LevelSnapshot,
  draft: LevelDraft,
) {
  return (
    (original.sortOrder ?? null) !== (draft.sortOrder ?? null) ||
    original.title !== draft.title.trim() ||
    (original.description ?? "") !== draft.description.trim()
  );
}

export function resolveLessonAudioUrl(input: LessonAudioDraft) {
  const uploadedUrl = input.uploadedUrl?.trim();
  if (uploadedUrl) {
    return uploadedUrl;
  }

  const manualUrl = input.manualUrl.trim();
  return manualUrl || null;
}

export function getLessonAudioAssetLabel(audioUrl: string | null) {
  if (!audioUrl) {
    return null;
  }

  try {
    const { pathname } = new URL(audioUrl);
    const fileName = pathname.split("/").filter(Boolean).at(-1);

    if (!fileName) {
      return audioUrl;
    }

    return decodeURIComponent(fileName);
  } catch {
    return audioUrl;
  }
}

export function resolveManagedLessonAudioDraft(
  input: ManagedLessonAudioDraftInput,
) {
  if (input.uploadedAsset) {
    return {
      audioUrl: input.uploadedAsset.url,
      audioUploadKey: input.uploadedAsset.uploadKey,
      audioFileName: input.uploadedAsset.fileName,
      audioFileSize: input.uploadedAsset.fileSize,
      audioUploadedAt: input.uploadedAsset.uploadedAt,
    };
  }

  return {
    audioUrl: resolveLessonAudioUrl({
      manualUrl: input.manualUrl,
      uploadedUrl: null,
    }),
    audioUploadKey: null,
    audioFileName: null,
    audioFileSize: null,
    audioUploadedAt: null,
  };
}

export function getLessonAudioCleanupKey(input: LessonAudioCleanupInput) {
  if (!input.previousUploadKey) {
    return null;
  }

  if (input.previousUploadKey === input.nextUploadKey) {
    return null;
  }

  return input.previousUploadKey;
}

function formatAudioFileSize(fileSize: number | null) {
  if (!fileSize) {
    return null;
  }

  if (fileSize < 1024 * 1024) {
    return `${Math.round(fileSize / 1024)} KB`;
  }

  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
}

function formatAudioUploadDate(uploadedAt: string | null) {
  if (!uploadedAt) {
    return null;
  }

  const date = new Date(uploadedAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function getLessonAudioDraftSummary(
  input: LessonAudioDraftSummaryInput,
) {
  if (!input.audioUrl) {
    return null;
  }

  const label =
    input.audioFileName?.trim() || getLessonAudioAssetLabel(input.audioUrl);
  const source = input.audioUploadKey ? "Uploaded file" : "External URL";
  const parts = [formatAudioFileSize(input.audioFileSize)];

  const uploadDate = formatAudioUploadDate(input.audioUploadedAt);
  if (uploadDate) {
    parts.push(`uploaded ${uploadDate}`);
  }

  return {
    label,
    source,
    meta: parts.filter(Boolean).join(" "),
  };
}

function getQuestionPublishError(
  question: PublishReadinessQuestion,
  index: number,
) {
  if (!question.questionText.trim()) {
    return `Question ${index + 1} needs question text.`;
  }

  if (question.questionType === "multiple_choice") {
    const options = (question.options ?? []).map((option) => option.trim()).filter(Boolean);

    if (options.length < 2) {
      return `Question ${index + 1} needs at least two multiple choice options.`;
    }

    const correctAnswer = question.correctAnswer?.trim() ?? "";
    if (!correctAnswer || !options.includes(correctAnswer)) {
      return `Question ${index + 1} needs a correct answer that matches an option.`;
    }

    return null;
  }

  if (!question.correctAnswer?.trim()) {
    return `Question ${index + 1} needs an expected answer.`;
  }

  return null;
}

export function getLessonPublishReadiness(
  input: LessonPublishReadinessInput,
) {
  const titleReady = Boolean(input.title.trim());
  const audioReady = Boolean(input.audioUrl?.trim());
  const notesReady = Boolean(input.notesContent?.trim());
  const hasQuestions = input.questions.length > 0;
  const firstQuestionError = input.questions
    .map((question, index) => getQuestionPublishError(question, index))
    .find(Boolean);

  const requirements: LessonPublishRequirement[] = [
    {
      id: "title",
      label: "Lesson title is filled and clearly named.",
      met: titleReady,
    },
    {
      id: "audio_and_notes",
      label: "Audio link and notes are ready for students.",
      met: audioReady && notesReady,
      detail:
        !audioReady && !notesReady
          ? "Add lesson audio and notes before publishing."
          : !audioReady
            ? "Add lesson audio before publishing."
            : !notesReady
              ? "Add lesson notes before publishing."
              : undefined,
    },
    {
      id: "questions_present",
      label: "At least one quiz question is configured.",
      met: hasQuestions,
      detail: hasQuestions ? undefined : "Add at least one quiz question.",
    },
    {
      id: "questions_valid",
      label: "Quiz answers match the configured options.",
      met: hasQuestions && !firstQuestionError,
      detail: !hasQuestions
        ? "Add at least one valid quiz question."
        : firstQuestionError ?? undefined,
    },
  ];

  return {
    isReady: requirements.every((requirement) => requirement.met),
    requirements,
  };
}

export function getLessonDeletionState(status: LessonStatus) {
  if (status === "published") {
    return {
      canDelete: false,
      detail: "Unpublish this lesson before deleting it.",
    };
  }

  return {
    canDelete: true,
    detail:
      "Delete this lesson and its quiz, progress, submissions, and Q&A records.",
  };
}

export function getLevelDeletionState(totalLessons: number) {
  if (totalLessons > 0) {
    return {
      canDelete: false,
      detail: "Move or delete this level's lessons before deleting the level.",
    };
  }

  return {
    canDelete: true,
    detail: "Delete this empty level from the pathway.",
  };
}

export function moveQuestionInOrder<T extends OrderedQuestion>(
  questions: T[],
  questionId: number,
  direction: "up" | "down",
) {
  const currentIndex = questions.findIndex((question) => question.id === questionId);
  if (currentIndex === -1) {
    return questions;
  }

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= questions.length) {
    return questions;
  }

  const reordered = [...questions];
  const [question] = reordered.splice(currentIndex, 1);
  reordered.splice(targetIndex, 0, question);

  return reordered.map((item, index) => ({
    ...item,
    sortOrder: index + 1,
  }));
}

export function renumberLessonsForTarget<T extends OrderedLesson>(
  lessons: T[],
  lessonId: number,
  targetLessonNumber: number,
) {
  const currentIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (currentIndex === -1) {
    return lessons;
  }

  const clampedIndex = Math.max(
    0,
    Math.min(lessons.length - 1, targetLessonNumber - 1),
  );

  const reordered = [...lessons];
  const [lesson] = reordered.splice(currentIndex, 1);
  reordered.splice(clampedIndex, 0, lesson);

  return reordered.map((item, index) => ({
    ...item,
    lessonNumber: index + 1,
  }));
}

export function renumberLevelsForTarget<T extends OrderedLevel>(
  levels: T[],
  levelId: number,
  targetSortOrder: number,
) {
  const currentIndex = levels.findIndex((level) => level.id === levelId);
  if (currentIndex === -1) {
    return levels;
  }

  const clampedIndex = Math.max(
    0,
    Math.min(levels.length - 1, targetSortOrder - 1),
  );

  const reordered = [...levels];
  const [level] = reordered.splice(currentIndex, 1);
  reordered.splice(clampedIndex, 0, level);

  return reordered.map((item, index) => ({
    ...item,
    sortOrder: index + 1,
  }));
}

export function removeLevelFromOrder<T extends OrderedLevel>(
  levels: T[],
  levelId: number,
) {
  return levels
    .filter((level) => level.id !== levelId)
    .map((item, index) => ({
      ...item,
      sortOrder: index + 1,
    }));
}

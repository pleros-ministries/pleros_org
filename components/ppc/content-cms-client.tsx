"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  PencilLine,
  ChevronDown,
  Upload,
  LoaderCircle,
  Link2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ppc/status-badge";
import { useUploadThing } from "@/lib/upload/uploadthing-client";
import {
  updateLessonContent,
  createNewLevel,
  updateLevelContent,
  publishLessonAction,
  unpublishLessonAction,
  createNewLesson,
  removeLevelAction,
  removeLessonAction,
  addQuizQuestion,
  editQuizQuestion,
  removeQuizQuestion,
  reorderQuizQuestion,
} from "@/app/ppc/_actions/content-actions";
import {
  getLevelDeletionState,
  hasLevelDraftChanges,
  getLessonDeletionState,
  getLessonPublishReadiness,
  getLessonAudioDraftSummary,
  getLessonAudioAssetLabel,
  getNextLevelSortOrder,
  getNextLessonNumber,
  hasLessonDraftChanges,
  moveQuestionInOrder,
  removeLevelFromOrder,
  renumberLessonsForTarget,
  renumberLevelsForTarget,
  resolveManagedLessonAudioDraft,
  validateQuizQuestionDraft,
} from "@/lib/ppc-content-cms";

type Lesson = {
  id: number;
  lessonNumber: number;
  title: string;
  status: string;
  audioUrl: string | null;
  audioUploadKey: string | null;
  audioFileName: string | null;
  audioFileSize: number | null;
  audioUploadedAt: string | null;
  notesContent: string | null;
};

type Level = {
  id: number;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: Lesson[];
  publishedCount: number;
  draftCount: number;
  totalLessons: number;
};

type QuizQuestion = {
  id: number;
  lessonId: number;
  questionType: string;
  questionText: string;
  options: string[] | null;
  correctAnswer: string | null;
  sortOrder: number;
};

type ContentCmsClientProps = {
  levels: Level[];
  initialQuestions: Record<number, QuizQuestion[]>;
};

type AudioUploadTarget = "create" | "edit";

type UploadedLessonAudioAsset = {
  url: string;
  uploadKey: string;
  fileName: string;
  fileSize: number | null;
  uploadedAt: string | null;
};

function normalizeLessonRecord(
  lesson: Omit<Lesson, "audioUploadedAt"> & {
    audioUploadedAt: string | Date | null;
  },
): Lesson {
  return {
    ...lesson,
    audioUploadedAt:
      lesson.audioUploadedAt instanceof Date
        ? lesson.audioUploadedAt.toISOString()
        : lesson.audioUploadedAt,
  };
}

export function ContentCmsClient({
  levels,
  initialQuestions,
}: ContentCmsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const createAudioInputRef = useRef<HTMLInputElement | null>(null);
  const editAudioInputRef = useRef<HTMLInputElement | null>(null);

  const [levelRecords, setLevelRecords] = useState(levels);
  const [activeLevelId, setActiveLevelId] = useState<number | null>(
    levels[0]?.id ?? null,
  );
  const [editLevelTitle, setEditLevelTitle] = useState(levels[0]?.title ?? "");
  const [editLevelDescription, setEditLevelDescription] = useState(
    levels[0]?.description ?? "",
  );
  const [editLevelSortOrder, setEditLevelSortOrder] = useState(
    String(levels[0]?.sortOrder ?? 1),
  );
  const [isCreateLevelOpen, setIsCreateLevelOpen] = useState(levels.length === 0);
  const [newLevelTitle, setNewLevelTitle] = useState("");
  const [newLevelDescription, setNewLevelDescription] = useState("");
  const [newLevelError, setNewLevelError] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(
    levels[0]?.lessons[0]?.id ?? null,
  );
  const [isCreateLessonOpen, setIsCreateLessonOpen] = useState(
    (levels[0]?.lessons.length ?? 0) === 0,
  );
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonAudioUrl, setNewLessonAudioUrl] = useState("");
  const [newLessonUploadedAudio, setNewLessonUploadedAudio] =
    useState<UploadedLessonAudioAsset | null>(null);
  const [newLessonNotes, setNewLessonNotes] = useState("");
  const [newLessonError, setNewLessonError] = useState<string | null>(null);
  const [workspaceFeedback, setWorkspaceFeedback] = useState<string | null>(null);
  const [workspaceFeedbackTone, setWorkspaceFeedbackTone] = useState<
    "default" | "error"
  >("default");
  const [lessonFeedback, setLessonFeedback] = useState<string | null>(null);
  const [lessonFeedbackTone, setLessonFeedbackTone] = useState<
    "default" | "error"
  >("default");
  const [questionFeedback, setQuestionFeedback] = useState<string | null>(null);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [editQuestionError, setEditQuestionError] = useState<string | null>(
    null,
  );

  const [editTitle, setEditTitle] = useState("");
  const [editLessonNumber, setEditLessonNumber] = useState("1");
  const [editAudioUrl, setEditAudioUrl] = useState("");
  const [editUploadedAudio, setEditUploadedAudio] =
    useState<UploadedLessonAudioAsset | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [audioUploadState, setAudioUploadState] = useState<{
    target: AudioUploadTarget | null;
    fileName: string | null;
    progress: number;
    error: string | null;
    success: string | null;
  }>({
    target: null,
    fileName: null,
    progress: 0,
    error: null,
    success: null,
  });

  const [questions, setQuestions] =
    useState<Record<number, QuizQuestion[]>>(initialQuestions);

  const [newQType, setNewQType] = useState<"multiple_choice" | "short_text">(
    "multiple_choice",
  );
  const [newQText, setNewQText] = useState("");
  const [newQOptions, setNewQOptions] = useState("");
  const [newQAnswer, setNewQAnswer] = useState("");

  const [editingQId, setEditingQId] = useState<number | null>(null);
  const [editQText, setEditQText] = useState("");
  const [editQOptions, setEditQOptions] = useState("");
  const [editQAnswer, setEditQAnswer] = useState("");
  const [deleteConfirmLevelId, setDeleteConfirmLevelId] = useState<number | null>(
    null,
  );
  const [deleteConfirmLessonId, setDeleteConfirmLessonId] = useState<
    number | null
  >(null);
  const { startUpload, isUploading } = useUploadThing("audioUploader", {
    onUploadProgress: (progress) => {
      setAudioUploadState((current) =>
        current.target
          ? {
              ...current,
              progress,
            }
          : current,
      );
    },
  });

  const activeLevel = levelRecords.find((l) => l.id === activeLevelId);
  const selectedLesson = activeLevel?.lessons.find(
    (l) => l.id === selectedLessonId,
  );
  const lessonQuestions =
    selectedLessonId != null ? questions[selectedLessonId] ?? [] : [];
  const nextLessonNumber = getNextLessonNumber(activeLevel?.lessons ?? []);
  const hasLessonChanges = selectedLesson
    ? hasLessonDraftChanges(selectedLesson, {
        lessonNumber: Number.parseInt(editLessonNumber, 10),
        title: editTitle,
        audioUrl: editAudioUrl,
        audioUploadKey: editUploadedAudio?.uploadKey ?? null,
        notesContent: editNotes,
      })
    : false;
  const selectedLessonAudioDraft = resolveManagedLessonAudioDraft({
    manualUrl: editAudioUrl,
    uploadedAsset: editUploadedAudio,
  });
  const newLessonAudioDraft = resolveManagedLessonAudioDraft({
    manualUrl: newLessonAudioUrl,
    uploadedAsset: newLessonUploadedAudio,
  });
  const selectedLessonAudioLabel =
    selectedLessonAudioDraft.audioFileName ||
    getLessonAudioAssetLabel(selectedLessonAudioDraft.audioUrl);
  const newLessonAudioLabel =
    newLessonAudioDraft.audioFileName ||
    getLessonAudioAssetLabel(newLessonAudioDraft.audioUrl);
  const selectedLessonAudioSummary = getLessonAudioDraftSummary(
    selectedLessonAudioDraft,
  );
  const newLessonAudioSummary = getLessonAudioDraftSummary(newLessonAudioDraft);
  const publishReadiness = getLessonPublishReadiness({
    title: editTitle,
    audioUrl: selectedLessonAudioDraft.audioUrl,
    notesContent: editNotes,
    questions: lessonQuestions.map((question) => ({
      questionType: question.questionType,
      questionText: question.questionText,
      options: question.options,
      correctAnswer: question.correctAnswer,
    })),
  });
  const isUploadingCreateLesson =
    isUploading && audioUploadState.target === "create";
  const isUploadingSelectedLesson =
    isUploading && audioUploadState.target === "edit";
  const deletionState = selectedLesson
    ? getLessonDeletionState(selectedLesson.status as "draft" | "published")
    : null;
  const levelDeletionState = activeLevel
    ? getLevelDeletionState(activeLevel.totalLessons)
    : null;
  const hasLevelChanges = activeLevel
    ? hasLevelDraftChanges(activeLevel, {
        sortOrder: Number.parseInt(editLevelSortOrder, 10),
        title: editLevelTitle,
        description: editLevelDescription,
      })
    : false;
  const nextLevelSortOrder = getNextLevelSortOrder(levelRecords);

  const recalculateLevelCounts = (level: Level): Level => {
    const publishedCount = level.lessons.filter(
      (lesson) => lesson.status === "published",
    ).length;
    const totalLessons = level.lessons.length;

    return {
      ...level,
      publishedCount,
      draftCount: totalLessons - publishedCount,
      totalLessons,
    };
  };

  useEffect(() => {
    setLevelRecords(levels);
  }, [levels]);

  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  useEffect(() => {
    if (!activeLevel) {
      return;
    }

    setEditLevelTitle(activeLevel.title);
    setEditLevelDescription(activeLevel.description ?? "");
    setEditLevelSortOrder(String(activeLevel.sortOrder));
    setDeleteConfirmLevelId(null);
  }, [activeLevel]);

  const clearSelectedLessonState = () => {
    setSelectedLessonId(null);
    setEditTitle("");
    setEditLessonNumber("1");
    setEditAudioUrl("");
    setEditUploadedAudio(null);
    setEditNotes("");
    setEditingQId(null);
    setDeleteConfirmLessonId(null);
    setLessonFeedback(null);
    setLessonFeedbackTone("default");
    setQuestionFeedback(null);
    setQuestionError(null);
    setEditQuestionError(null);
    resetAudioUploadState();
  };

  const selectLesson = (lesson: Lesson) => {
    setSelectedLessonId(lesson.id);
    setEditLessonNumber(String(lesson.lessonNumber));
    setEditTitle(lesson.title);
    setEditAudioUrl(lesson.audioUrl ?? "");
    setEditUploadedAudio(
      lesson.audioUploadKey
        ? {
            url: lesson.audioUrl ?? "",
            uploadKey: lesson.audioUploadKey,
            fileName:
              lesson.audioFileName ??
              getLessonAudioAssetLabel(lesson.audioUrl) ??
              "Lesson audio",
            fileSize: lesson.audioFileSize,
            uploadedAt: lesson.audioUploadedAt,
          }
        : null,
    );
    setEditNotes(lesson.notesContent ?? "");
    setEditingQId(null);
    setDeleteConfirmLessonId(null);
    setLessonFeedback(null);
    setLessonFeedbackTone("default");
    setQuestionFeedback(null);
    setQuestionError(null);
    setEditQuestionError(null);
    setAudioUploadState({
      target: null,
      fileName: null,
      progress: 0,
      error: null,
      success: null,
    });
  };

  const resetAudioUploadState = () => {
    setAudioUploadState({
      target: null,
      fileName: null,
      progress: 0,
      error: null,
      success: null,
    });
  };

  const handleAudioUrlChange = (
    target: AudioUploadTarget,
    nextValue: string,
  ) => {
    if (target === "create") {
      setNewLessonAudioUrl(nextValue);
      if ((newLessonUploadedAudio?.url ?? "") !== nextValue.trim()) {
        setNewLessonUploadedAudio(null);
      }
      return;
    }

    setEditAudioUrl(nextValue);
    if ((editUploadedAudio?.url ?? "") !== nextValue.trim()) {
      setEditUploadedAudio(null);
    }
  };

  const handleAudioUpload = async (
    target: AudioUploadTarget,
    file: File | null,
  ) => {
    if (!file) {
      return;
    }

    setAudioUploadState({
      target,
      fileName: file.name,
      progress: 0,
      error: null,
      success: null,
    });

    try {
      const result = await startUpload([file]);
      const uploadedAudio = result?.[0]?.serverData
        ? {
            url: result[0].serverData.url,
            uploadKey: result[0].serverData.uploadKey,
            fileName: result[0].serverData.fileName,
            fileSize: result[0].serverData.fileSize,
            uploadedAt: result[0].serverData.uploadedAt,
          }
        : null;
      const uploadedUrl = uploadedAudio?.url ?? result?.[0]?.ufsUrl;

      if (!uploadedUrl) {
        throw new Error("Upload finished without a file URL.");
      }

      if (target === "create") {
        setNewLessonAudioUrl(uploadedUrl);
        setNewLessonUploadedAudio(
          uploadedAudio ?? {
            url: uploadedUrl,
            uploadKey: "",
            fileName: file.name,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
          },
        );
      } else {
        setEditAudioUrl(uploadedUrl);
        setEditUploadedAudio(
          uploadedAudio ?? {
            url: uploadedUrl,
            uploadKey: "",
            fileName: file.name,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
          },
        );
      }

      setAudioUploadState({
        target,
        fileName: file.name,
        progress: 100,
        error: null,
        success: "Audio uploaded. Save the lesson to keep this file.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Audio upload failed.";
      setAudioUploadState({
        target,
        fileName: file.name,
        progress: 0,
        error: message,
        success: null,
      });
    }
  };

  const clearLessonAudio = (target: AudioUploadTarget) => {
    if (target === "create") {
      setNewLessonAudioUrl("");
      setNewLessonUploadedAudio(null);
    } else {
      setEditAudioUrl("");
      setEditUploadedAudio(null);
    }
    resetAudioUploadState();
  };

  const handleSaveLesson = () => {
    if (selectedLessonId == null) return;
    const parsedLessonNumber = Number.parseInt(editLessonNumber, 10);
    if (!editTitle.trim()) {
      setLessonFeedback("Lesson title is required.");
      setLessonFeedbackTone("error");
      return;
    }
    if (!Number.isInteger(parsedLessonNumber) || parsedLessonNumber < 1) {
      setLessonFeedback("Lesson number must be a whole number greater than zero.");
      setLessonFeedbackTone("error");
      return;
    }

    startTransition(async () => {
      const savedLesson = await updateLessonContent(selectedLessonId, {
        lessonNumber: parsedLessonNumber,
        title: editTitle.trim(),
        ...selectedLessonAudioDraft,
        notesContent: editNotes.trim() || null,
      });
      if (savedLesson) {
        const lesson = normalizeLessonRecord(savedLesson);
        const reorderedLessons =
          activeLevel && parsedLessonNumber !== selectedLesson?.lessonNumber
            ? renumberLessonsForTarget(
                activeLevel.lessons,
                selectedLessonId,
                parsedLessonNumber,
              )
            : null;
        setLevelRecords((prev) =>
          prev.map((level) =>
            recalculateLevelCounts({
              ...level,
              lessons:
                reorderedLessons && level.id === activeLevel?.id
                  ? reorderedLessons.map((item) =>
                      item.id === lesson.id
                        ? {
                            ...item,
                            title: lesson.title,
                            status: lesson.status,
                            audioUrl: lesson.audioUrl,
                            audioUploadKey: lesson.audioUploadKey,
                            audioFileName: lesson.audioFileName,
                            audioFileSize: lesson.audioFileSize,
                            audioUploadedAt: lesson.audioUploadedAt,
                            notesContent: lesson.notesContent,
                          }
                        : item,
                    )
                  : level.lessons.map((item) =>
                      item.id === lesson.id
                        ? {
                            ...item,
                            lessonNumber: lesson.lessonNumber,
                            title: lesson.title,
                            audioUrl: lesson.audioUrl,
                            audioUploadKey: lesson.audioUploadKey,
                            audioFileName: lesson.audioFileName,
                            audioFileSize: lesson.audioFileSize,
                            audioUploadedAt: lesson.audioUploadedAt,
                            notesContent: lesson.notesContent,
                          }
                        : item,
                    ),
            }),
          ),
        );
        selectLesson({
          id: lesson.id,
          lessonNumber: lesson.lessonNumber,
          title: lesson.title,
          status: lesson.status,
          audioUrl: lesson.audioUrl,
          audioUploadKey: lesson.audioUploadKey,
          audioFileName: lesson.audioFileName,
          audioFileSize: lesson.audioFileSize,
          audioUploadedAt: lesson.audioUploadedAt,
          notesContent: lesson.notesContent,
        });
        setLessonFeedback("Lesson details saved.");
        setLessonFeedbackTone("default");
        setWorkspaceFeedback(null);
        setWorkspaceFeedbackTone("default");
        resetAudioUploadState();
      }
      router.refresh();
    });
  };

  const handlePublishToggle = () => {
    if (!selectedLesson) return;
    startTransition(async () => {
      try {
        const lesson =
          selectedLesson.status === "published"
            ? await unpublishLessonAction(selectedLesson.id)
            : await publishLessonAction(selectedLesson.id);
        if (lesson) {
          setLevelRecords((prev) =>
            prev.map((level) =>
              recalculateLevelCounts({
                ...level,
                lessons: level.lessons.map((item) =>
                  item.id === lesson.id
                    ? {
                        ...item,
                        status: lesson.status,
                      }
                    : item,
                ),
              }),
            ),
          );
          setLessonFeedback(
            lesson.status === "published"
              ? "Lesson published."
              : "Lesson returned to draft.",
          );
          setLessonFeedbackTone("default");
          setDeleteConfirmLessonId(null);
        }
      } catch (error) {
        setLessonFeedback(
          error instanceof Error
            ? error.message
            : "Lesson could not be published yet.",
        );
        setLessonFeedbackTone("error");
      }
      router.refresh();
    });
  };

  const handleAddQuestion = () => {
    if (!newQText.trim() || selectedLessonId == null) return;
    const validation = validateQuizQuestionDraft({
      questionType: newQType,
      questionText: newQText,
      optionsText: newQOptions,
      correctAnswer: newQAnswer,
    });
    if ("error" in validation) {
      setQuestionError(validation.error);
      return;
    }

    startTransition(async () => {
      const q = await addQuizQuestion({
        lessonId: selectedLessonId,
        questionType: newQType,
        questionText: newQText.trim(),
        options: validation.options,
        correctAnswer: newQAnswer.trim() || null,
        sortOrder: lessonQuestions.length + 1,
      });
      if (q) {
        setQuestions((prev) => ({
          ...prev,
          [selectedLessonId]: [...(prev[selectedLessonId] ?? []), q as unknown as QuizQuestion],
        }));
      }
      setNewQText("");
      setNewQOptions("");
      setNewQAnswer("");
      setQuestionError(null);
      setQuestionFeedback("Question added.");
      router.refresh();
    });
  };

  const handleEditQuestion = (qId: number) => {
    const q = lessonQuestions.find((qq) => qq.id === qId);
    if (!q) return;
    setEditingQId(qId);
    setEditQText(q.questionText);
    setEditQOptions(q.options?.join("\n") ?? "");
    setEditQAnswer(q.correctAnswer ?? "");
    setEditQuestionError(null);
  };

  const handleSaveQuestion = () => {
    if (editingQId == null || selectedLessonId == null) return;
    const editingQuestion = lessonQuestions.find((question) => question.id === editingQId);
    if (!editingQuestion) return;

    const validation = validateQuizQuestionDraft({
      questionType: editingQuestion.questionType as "multiple_choice" | "short_text",
      questionText: editQText,
      optionsText: editQOptions,
      correctAnswer: editQAnswer,
    });
    if ("error" in validation) {
      setEditQuestionError(validation.error);
      return;
    }

    startTransition(async () => {
      await editQuizQuestion(editingQId, {
        questionText: editQText.trim() || undefined,
        options: validation.options,
        correctAnswer: editQAnswer.trim() || null,
      });
      setQuestions((prev) => ({
        ...prev,
        [selectedLessonId]: (prev[selectedLessonId] ?? []).map((q) =>
          q.id === editingQId
            ? {
                ...q,
                questionText: editQText.trim() || q.questionText,
                options: validation.options,
                correctAnswer: editQAnswer.trim() || null,
              }
            : q,
        ),
      }));
      setEditingQId(null);
      setEditQuestionError(null);
      setQuestionFeedback("Question updated.");
      router.refresh();
    });
  };

  const handleDeleteQuestion = (qId: number) => {
    if (selectedLessonId == null) return;
    startTransition(async () => {
      await removeQuizQuestion(qId);
      setQuestions((prev) => ({
        ...prev,
        [selectedLessonId]: (prev[selectedLessonId] ?? []).filter(
          (q) => q.id !== qId,
        ),
      }));
      setQuestionFeedback("Question removed.");
      router.refresh();
    });
  };

  const handleReorderQuestion = (
    questionId: number,
    direction: "up" | "down",
  ) => {
    if (selectedLessonId == null) return;

    const reorderedQuestions = moveQuestionInOrder(
      lessonQuestions,
      questionId,
      direction,
    );

    if (reorderedQuestions === lessonQuestions) {
      return;
    }

    startTransition(async () => {
      await reorderQuizQuestion(selectedLessonId, questionId, direction);
      setQuestions((prev) => ({
        ...prev,
        [selectedLessonId]: reorderedQuestions,
      }));
      setQuestionFeedback("Question order updated.");
      router.refresh();
    });
  };

  const handleCreateLesson = () => {
    if (!activeLevel) return;
    if (!newLessonTitle.trim()) {
      setNewLessonError("Lesson title is required.");
      return;
    }

    startTransition(async () => {
      const createdLesson = await createNewLesson({
        levelId: activeLevel.id,
        lessonNumber: nextLessonNumber,
        title: newLessonTitle.trim(),
        ...newLessonAudioDraft,
        notesContent: newLessonNotes.trim() || undefined,
      });

      if (createdLesson) {
        const lesson = normalizeLessonRecord(createdLesson);
        setLevelRecords((prev) =>
          prev.map((level) =>
            level.id !== activeLevel.id
              ? level
              : recalculateLevelCounts({
                  ...level,
                  lessons: [...level.lessons, lesson].sort(
                    (left, right) => left.lessonNumber - right.lessonNumber,
                  ),
                }),
          ),
        );
        setQuestions((prev) => ({ ...prev, [lesson.id]: [] }));
        setNewLessonTitle("");
        setNewLessonAudioUrl("");
        setNewLessonUploadedAudio(null);
        setNewLessonNotes("");
        setNewLessonError(null);
        setIsCreateLessonOpen(false);
        selectLesson({
          id: lesson.id,
          lessonNumber: lesson.lessonNumber,
          title: lesson.title,
          status: lesson.status,
          audioUrl: lesson.audioUrl,
          audioUploadKey: lesson.audioUploadKey,
          audioFileName: lesson.audioFileName,
          audioFileSize: lesson.audioFileSize,
          audioUploadedAt: lesson.audioUploadedAt,
          notesContent: lesson.notesContent,
        });
        setLessonFeedback("New lesson created.");
        setLessonFeedbackTone("default");
        setWorkspaceFeedback(null);
        setWorkspaceFeedbackTone("default");
        resetAudioUploadState();
      }

      router.refresh();
    });
  };

  const handleCreateLevel = () => {
    if (!newLevelTitle.trim()) {
      setNewLevelError("Level title is required.");
      return;
    }

    startTransition(async () => {
      try {
        const createdLevel = await createNewLevel({
          title: newLevelTitle.trim(),
          description: newLevelDescription.trim() || null,
        });

        if (!createdLevel) {
          return;
        }

        const nextLevel: Level = {
          id: createdLevel.id,
          title: createdLevel.title,
          description: createdLevel.description,
          sortOrder: createdLevel.sortOrder,
          lessons: [],
          publishedCount: 0,
          draftCount: 0,
          totalLessons: 0,
        };

        setLevelRecords((prev) =>
          [...prev, nextLevel].sort((left, right) => left.sortOrder - right.sortOrder),
        );
        setActiveLevelId(nextLevel.id);
        clearSelectedLessonState();
        setIsCreateLevelOpen(false);
        setIsCreateLessonOpen(true);
        setNewLevelTitle("");
        setNewLevelDescription("");
        setNewLevelError(null);
        setWorkspaceFeedback("New level created.");
        setWorkspaceFeedbackTone("default");
      } catch (error) {
        setNewLevelError(
          error instanceof Error ? error.message : "Level could not be created.",
        );
      }

      router.refresh();
    });
  };

  const handleSaveLevel = () => {
    if (!activeLevel) return;

    const parsedSortOrder = Number.parseInt(editLevelSortOrder, 10);
    if (!editLevelTitle.trim()) {
      setWorkspaceFeedback("Level title is required.");
      setWorkspaceFeedbackTone("error");
      return;
    }

    if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 1) {
      setWorkspaceFeedback("Level order must be a whole number greater than zero.");
      setWorkspaceFeedbackTone("error");
      return;
    }

    startTransition(async () => {
      try {
        const savedLevel = await updateLevelContent(activeLevel.id, {
          title: editLevelTitle.trim(),
          description: editLevelDescription.trim() || null,
          sortOrder: parsedSortOrder,
        });

        if (!savedLevel) {
          return;
        }

        const reorderedLevels =
          parsedSortOrder !== activeLevel.sortOrder
            ? renumberLevelsForTarget(levelRecords, activeLevel.id, parsedSortOrder)
            : null;

        setLevelRecords((prev) =>
          (reorderedLevels ?? prev).map((level) =>
            level.id === savedLevel.id
              ? {
                  ...level,
                  title: savedLevel.title,
                  description: savedLevel.description,
                  sortOrder: savedLevel.sortOrder,
                }
              : level,
          ),
        );
        setActiveLevelId(savedLevel.id);
        setWorkspaceFeedback("Level details saved.");
        setWorkspaceFeedbackTone("default");
      } catch (error) {
        setWorkspaceFeedback(
          error instanceof Error ? error.message : "Level could not be saved.",
        );
        setWorkspaceFeedbackTone("error");
      }

      router.refresh();
    });
  };

  const handleDeleteLevel = () => {
    if (!activeLevel || !levelDeletionState) return;

    if (!levelDeletionState.canDelete) {
      setWorkspaceFeedback(levelDeletionState.detail);
      setWorkspaceFeedbackTone("error");
      return;
    }

    startTransition(async () => {
      try {
        await removeLevelAction(activeLevel.id);

        const currentIndex = levelRecords.findIndex(
          (level) => level.id === activeLevel.id,
        );
        const remainingLevels = removeLevelFromOrder(levelRecords, activeLevel.id);
        const nextLevel =
          remainingLevels[Math.min(currentIndex, remainingLevels.length - 1)] ??
          null;

        setLevelRecords(remainingLevels);
        setDeleteConfirmLevelId(null);

        if (nextLevel) {
          setActiveLevelId(nextLevel.id);
          if (nextLevel.lessons[0]) {
            setIsCreateLessonOpen(false);
            selectLesson(nextLevel.lessons[0]);
          } else {
            clearSelectedLessonState();
            setIsCreateLessonOpen(true);
          }
          setWorkspaceFeedback(`Deleted ${activeLevel.title}.`);
        } else {
          setActiveLevelId(null);
          clearSelectedLessonState();
          setIsCreateLevelOpen(true);
          setIsCreateLessonOpen(false);
          setWorkspaceFeedback("Deleted the last level. Create a new level to keep authoring.");
        }
        setWorkspaceFeedbackTone("default");
      } catch (error) {
        setWorkspaceFeedback(
          error instanceof Error ? error.message : "Level could not be deleted.",
        );
        setWorkspaceFeedbackTone("error");
      }

      router.refresh();
    });
  };

  const handleDeleteLesson = () => {
    if (!selectedLesson || !activeLevel || !deletionState) return;

    if (!deletionState.canDelete) {
      setLessonFeedback(deletionState.detail);
      setLessonFeedbackTone("error");
      return;
    }

    startTransition(async () => {
      try {
        await removeLessonAction(selectedLesson.id);

        const lessonIndex = activeLevel.lessons.findIndex(
          (lesson) => lesson.id === selectedLesson.id,
        );
        const remainingLessons = activeLevel.lessons.filter(
          (lesson) => lesson.id !== selectedLesson.id,
        );
        const nextLesson =
          remainingLessons[Math.min(lessonIndex, remainingLessons.length - 1)] ??
          null;

        setLevelRecords((prev) =>
          prev.map((level) =>
            level.id !== activeLevel.id
              ? level
              : recalculateLevelCounts({
                  ...level,
                  lessons: level.lessons.filter(
                    (lesson) => lesson.id !== selectedLesson.id,
                  ),
                }),
          ),
        );

        setQuestions((prev) => {
          const nextQuestions = { ...prev };
          delete nextQuestions[selectedLesson.id];
          return nextQuestions;
        });

        if (nextLesson) {
          selectLesson(nextLesson);
          setLessonFeedback(
            `Deleted lesson ${selectedLesson.lessonNumber}.`,
          );
          setLessonFeedbackTone("default");
          setWorkspaceFeedback(null);
          setWorkspaceFeedbackTone("default");
        } else {
          setSelectedLessonId(null);
          setEditTitle("");
          setEditLessonNumber("1");
          setEditAudioUrl("");
          setEditUploadedAudio(null);
          setEditNotes("");
          setDeleteConfirmLessonId(null);
          setLessonFeedback(null);
          setLessonFeedbackTone("default");
          setWorkspaceFeedback(
            `Deleted lesson ${selectedLesson.lessonNumber}. This level has no lessons left.`,
          );
          setWorkspaceFeedbackTone("default");
          setIsCreateLessonOpen(true);
          resetAudioUploadState();
        }
      } catch (error) {
        setLessonFeedback(
          error instanceof Error ? error.message : "Lesson could not be deleted.",
        );
        setLessonFeedbackTone("error");
      }

      router.refresh();
    });
  };

  return (
    <div className="grid gap-3">
      <div className="flex gap-1 border-b border-zinc-200">
        {levelRecords.map((level) => (
          <button
            key={level.id}
            onClick={() => {
              setActiveLevelId(level.id);
              setSelectedLessonId(level.lessons[0]?.id ?? null);
              if (level.lessons[0]) {
                selectLesson(level.lessons[0]);
              } else {
                setEditTitle("");
                setEditLessonNumber("1");
                setEditAudioUrl("");
                setEditUploadedAudio(null);
                setEditNotes("");
                setDeleteConfirmLessonId(null);
                resetAudioUploadState();
              }
              setIsCreateLessonOpen(level.lessons.length === 0);
              setLessonFeedback(null);
              setWorkspaceFeedback(null);
              setWorkspaceFeedbackTone("default");
            }}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors",
              activeLevelId === level.id
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-400 hover:text-zinc-600",
            )}
          >
            {level.title}
            <span className="text-[10px] text-zinc-400">
              {level.publishedCount}/{level.totalLessons}
            </span>
          </button>
        ))}
        <button
          onClick={() => {
            setIsCreateLevelOpen((current) => !current);
            setNewLevelError(null);
          }}
          className="ml-auto inline-flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700"
        >
          <Plus className="size-3.5" />
          New level
        </button>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid gap-3">
          <div className="rounded-sm border border-zinc-200 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  {activeLevel?.title ?? "Level"}
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-900">
                  {activeLevel?.totalLessons ?? 0} lessons with{" "}
                  {activeLevel?.publishedCount ?? 0} published
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setIsCreateLevelOpen((current) => !current);
                    setNewLevelError(null);
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  <Plus className="size-3.5" />
                  New level
                </button>
                <button
                  onClick={() => {
                    setIsCreateLessonOpen((current) => !current);
                    setNewLessonError(null);
                  }}
                  disabled={!activeLevel}
                  className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                >
                  <Plus className="size-3.5" />
                  New lesson
                </button>
              </div>
            </div>

            {workspaceFeedback ? (
              <div
                className={cn(
                  "mt-3 flex items-center gap-1.5 rounded-sm px-2.5 py-2 text-[11px]",
                  workspaceFeedbackTone === "error"
                    ? "border border-red-200 bg-red-50 text-red-700"
                    : "border border-zinc-200 bg-zinc-50 text-zinc-600",
                )}
              >
                {workspaceFeedbackTone === "error" ? (
                  <AlertCircle className="size-3.5 text-red-500" />
                ) : (
                  <CheckCircle2 className="size-3.5 text-zinc-500" />
                )}
                {workspaceFeedback}
              </div>
            ) : null}

            {isCreateLevelOpen ? (
              <div className="mt-3 grid gap-2 rounded-sm border border-zinc-100 bg-zinc-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-900">
                    Create level {nextLevelSortOrder}
                  </p>
                  <span className="text-[10px] text-zinc-400">
                    Empty until lessons are added
                  </span>
                </div>
                {newLevelError ? (
                  <div className="rounded-sm border border-red-200 bg-red-50 px-2.5 py-2 text-[11px] text-red-700">
                    {newLevelError}
                  </div>
                ) : null}
                <input
                  type="text"
                  value={newLevelTitle}
                  onChange={(event) => setNewLevelTitle(event.target.value)}
                  placeholder="Level title"
                  className="h-8 rounded-sm border border-zinc-200 bg-white px-2 text-xs outline-none placeholder:text-zinc-300 focus:border-zinc-400"
                />
                <textarea
                  value={newLevelDescription}
                  onChange={(event) => setNewLevelDescription(event.target.value)}
                  rows={3}
                  placeholder="Level description (optional)"
                  className="rounded-sm border border-zinc-200 bg-white px-2 py-1.5 text-xs outline-none placeholder:text-zinc-300 focus:border-zinc-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateLevel}
                    disabled={isPending}
                    className="flex h-7 items-center gap-1.5 rounded-sm bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    <Plus className="size-3" />
                    Create level
                  </button>
                  <button
                    onClick={() => setIsCreateLevelOpen(false)}
                    className="h-7 rounded-sm border border-zinc-200 px-3 text-xs text-zinc-600 hover:bg-zinc-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}

            {activeLevel ? (
              <div className="mt-3 grid gap-2 rounded-sm border border-zinc-100 bg-zinc-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-zinc-900">
                    Level details
                  </p>
                  {hasLevelChanges ? (
                    <span className="rounded-sm border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700">
                      Unsaved changes
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-2 sm:grid-cols-[88px_minmax(0,1fr)]">
                  <div>
                    <label className="mb-0.5 block text-[10px] text-zinc-400">
                      Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={editLevelSortOrder}
                      onChange={(event) =>
                        setEditLevelSortOrder(event.target.value)
                      }
                      className="h-8 w-full rounded-sm border border-zinc-200 bg-white px-2 text-xs outline-none focus:border-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] text-zinc-400">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editLevelTitle}
                      onChange={(event) => setEditLevelTitle(event.target.value)}
                      className="h-8 w-full rounded-sm border border-zinc-200 bg-white px-2 text-xs outline-none focus:border-zinc-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-zinc-400">
                    Description
                  </label>
                  <textarea
                    value={editLevelDescription}
                    onChange={(event) =>
                      setEditLevelDescription(event.target.value)
                    }
                    rows={3}
                    className="w-full rounded-sm border border-zinc-200 bg-white px-2 py-1.5 text-xs outline-none placeholder:text-zinc-300 focus:border-zinc-400"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveLevel}
                    disabled={isPending || !hasLevelChanges}
                    className="flex h-7 items-center gap-1.5 rounded-sm bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    <Save className="size-3" />
                    Save level
                  </button>
                </div>
                <div className="mt-1 grid gap-2 rounded-sm border border-zinc-200 bg-white p-2 text-[11px]">
                  <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-2.5 py-2 text-zinc-600">
                    {levelDeletionState?.detail ??
                      "Select a level to manage its lifecycle."}
                  </div>
                  {deleteConfirmLevelId === activeLevel.id &&
                  levelDeletionState?.canDelete ? (
                    <div className="grid gap-2 rounded-sm border border-red-200 bg-red-50 p-2">
                      <p className="text-red-700">
                        Delete {activeLevel.title} from the pathway?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteLevel}
                          disabled={isPending}
                          className="inline-flex h-7 items-center gap-1.5 rounded-sm bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          <Trash2 className="size-3" />
                          Confirm delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmLevelId(null)}
                          className="h-7 rounded-sm border border-zinc-200 bg-white px-3 text-xs text-zinc-600 hover:bg-zinc-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmLevelId(activeLevel.id)}
                      disabled={isPending || !levelDeletionState?.canDelete}
                      className={cn(
                        "inline-flex h-8 items-center justify-center gap-1.5 rounded-sm border px-3 text-xs font-medium disabled:opacity-50",
                        levelDeletionState?.canDelete
                          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          : "border-zinc-200 bg-zinc-100 text-zinc-400",
                      )}
                    >
                      <Trash2 className="size-3" />
                      Delete level
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {isCreateLessonOpen ? (
              <div className="mt-3 grid gap-2 rounded-sm border border-zinc-100 bg-zinc-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-900">
                    Create lesson {nextLessonNumber}
                  </p>
                  <span className="text-[10px] text-zinc-400">
                    Draft by default
                  </span>
                </div>
                {newLessonError ? (
                  <div className="rounded-sm border border-red-200 bg-red-50 px-2.5 py-2 text-[11px] text-red-700">
                    {newLessonError}
                  </div>
                ) : null}
                <input
                  type="text"
                  value={newLessonTitle}
                  onChange={(event) => setNewLessonTitle(event.target.value)}
                  placeholder="Lesson title"
                  className="h-8 rounded-sm border border-zinc-200 bg-white px-2 text-xs outline-none placeholder:text-zinc-300 focus:border-zinc-400"
                />
                <input
                  type="text"
                  value={newLessonAudioUrl}
                  onChange={(event) =>
                    handleAudioUrlChange("create", event.target.value)
                  }
                  placeholder="Audio URL (optional)"
                  className="h-8 rounded-sm border border-zinc-200 bg-white px-2 text-xs outline-none placeholder:text-zinc-300 focus:border-zinc-400"
                />
                <div className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                        Lesson audio
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        Upload an audio file or keep using an external URL.
                      </p>
                    </div>
                    <input
                      ref={createAudioInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(event) => {
                        void handleAudioUpload(
                          "create",
                          event.target.files?.[0] ?? null,
                        );
                        event.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => createAudioInputRef.current?.click()}
                      disabled={isUploading}
                      className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-2.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      {isUploadingCreateLesson ? (
                        <LoaderCircle className="size-3 animate-spin" />
                      ) : (
                        <Upload className="size-3" />
                      )}
                      {isUploadingCreateLesson ? "Uploading..." : "Upload audio"}
                    </button>
                  </div>

                  {audioUploadState.target === "create" &&
                  audioUploadState.error ? (
                    <div className="flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
                      <AlertCircle className="size-3.5" />
                      {audioUploadState.error}
                    </div>
                  ) : null}

                  {audioUploadState.target === "create" &&
                  audioUploadState.success ? (
                    <div className="flex items-center gap-1.5 rounded-sm border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[11px] text-zinc-600">
                      <CheckCircle2 className="size-3.5 text-zinc-500" />
                      {audioUploadState.success}
                    </div>
                  ) : null}

                  {isUploadingCreateLesson ? (
                    <div className="text-[11px] text-zinc-500">
                      Uploading {audioUploadState.fileName} ({audioUploadState.progress}
                      %)
                    </div>
                  ) : null}

                  {newLessonAudioDraft.audioUrl ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-zinc-700">
                          {newLessonAudioLabel ?? "Lesson audio attached"}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {newLessonAudioSummary?.source ?? "External URL"}
                        </p>
                        {newLessonAudioSummary?.meta ? (
                          <p className="text-[10px] text-zinc-400">
                            {newLessonAudioSummary.meta}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={newLessonAudioDraft.audioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-6 items-center gap-1 rounded-sm border border-zinc-200 bg-white px-2 text-[10px] text-zinc-600 hover:bg-zinc-100"
                        >
                          <Link2 className="size-3" />
                          Open
                        </a>
                        <button
                          type="button"
                          onClick={() => clearLessonAudio("create")}
                          className="inline-flex h-6 items-center gap-1 rounded-sm border border-zinc-200 bg-white px-2 text-[10px] text-zinc-600 hover:bg-zinc-100"
                        >
                          <X className="size-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
                <textarea
                  value={newLessonNotes}
                  onChange={(event) => setNewLessonNotes(event.target.value)}
                  rows={4}
                  placeholder="Starter notes (optional)"
                  className="rounded-sm border border-zinc-200 bg-white px-2 py-1.5 text-xs outline-none placeholder:text-zinc-300 focus:border-zinc-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateLesson}
                    disabled={isPending || isUploadingCreateLesson}
                    className="flex h-7 items-center gap-1.5 rounded-sm bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    <Plus className="size-3" />
                    Create lesson
                  </button>
                  <button
                    onClick={() => setIsCreateLessonOpen(false)}
                    className="h-7 rounded-sm border border-zinc-200 px-3 text-xs text-zinc-600 hover:bg-zinc-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="grid content-start gap-1 rounded-sm border border-zinc-200 bg-white p-2">
              {activeLevel?.lessons.length ? (
                activeLevel.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => selectLesson(lesson)}
                    className={cn(
                      "flex items-center gap-2 rounded-sm border px-2 py-2 text-left transition-colors",
                      selectedLessonId === lesson.id
                        ? "border-zinc-400 bg-zinc-50"
                        : "border-zinc-200 bg-white hover:bg-zinc-50",
                    )}
                  >
                    <div className="grid shrink-0 justify-items-center gap-1">
                      <span className="text-[10px] text-zinc-400">
                        {lesson.lessonNumber}
                      </span>
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          lesson.status === "published"
                            ? "bg-emerald-500"
                            : "bg-zinc-300",
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-zinc-700">
                        {lesson.title}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {(questions[lesson.id] ?? []).length} questions
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-sm border border-dashed border-zinc-200 px-3 py-6 text-center text-xs text-zinc-400">
                  No lessons yet for this level
                </div>
              )}
            </div>

            {selectedLesson == null ? (
              <div className="flex items-center justify-center rounded-sm border border-zinc-200 bg-white py-12 text-xs text-zinc-400">
                Select a lesson to edit
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="rounded-sm border border-zinc-200 bg-white p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                        Lesson details
                      </p>
                      <p className="mt-1 text-sm font-medium text-zinc-900">
                        Lesson {selectedLesson.lessonNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasLessonChanges ? (
                        <span className="rounded-sm border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700">
                          Unsaved changes
                        </span>
                      ) : null}
                      <StatusBadge
                        status={selectedLesson.status}
                        variant={
                          selectedLesson.status === "published"
                            ? "success"
                            : "default"
                        }
                      />
                    </div>
                  </div>

                  {lessonFeedback ? (
                    <div
                      className={cn(
                        "mb-3 flex items-center gap-1.5 rounded-sm px-2.5 py-2 text-[11px]",
                        lessonFeedbackTone === "error"
                          ? "border border-red-200 bg-red-50 text-red-700"
                          : "border border-zinc-200 bg-zinc-50 text-zinc-600",
                      )}
                    >
                      {lessonFeedbackTone === "error" ? (
                        <AlertCircle className="size-3.5 text-red-500" />
                      ) : (
                        <CheckCircle2 className="size-3.5 text-zinc-500" />
                      )}
                      {lessonFeedback}
                    </div>
                  ) : null}

                  <div className="grid gap-2">
                    <div>
                      <label className="mb-0.5 block text-[10px] text-zinc-400">
                        Lesson number
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={editLessonNumber}
                        onChange={(event) =>
                          setEditLessonNumber(event.target.value)
                        }
                        className="h-8 w-full rounded-sm border border-zinc-200 px-2 text-xs outline-none focus:border-zinc-400"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[10px] text-zinc-400">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        className="h-8 w-full rounded-sm border border-zinc-200 px-2 text-xs outline-none focus:border-zinc-400"
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[10px] text-zinc-400">
                        Audio URL
                      </label>
                      <input
                        type="text"
                        value={editAudioUrl}
                        onChange={(event) =>
                          handleAudioUrlChange("edit", event.target.value)
                        }
                        placeholder="https://..."
                        className="h-8 w-full rounded-sm border border-zinc-200 px-2 text-xs outline-none placeholder:text-zinc-300 focus:border-zinc-400"
                      />
                    </div>
                    <div className="grid gap-2 rounded-sm border border-zinc-200 bg-zinc-50 p-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                            Lesson audio
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            Upload a replacement file or keep an external URL.
                          </p>
                        </div>
                        <input
                          ref={editAudioInputRef}
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          onChange={(event) => {
                            void handleAudioUpload(
                              "edit",
                              event.target.files?.[0] ?? null,
                            );
                            event.target.value = "";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => editAudioInputRef.current?.click()}
                          disabled={isUploading}
                          className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-2.5 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                        >
                          {isUploadingSelectedLesson ? (
                            <LoaderCircle className="size-3 animate-spin" />
                          ) : (
                            <Upload className="size-3" />
                          )}
                          {isUploadingSelectedLesson
                            ? "Uploading..."
                            : "Upload audio"}
                        </button>
                      </div>

                      {audioUploadState.target === "edit" &&
                      audioUploadState.error ? (
                        <div className="flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
                          <AlertCircle className="size-3.5" />
                          {audioUploadState.error}
                        </div>
                      ) : null}

                      {audioUploadState.target === "edit" &&
                      audioUploadState.success ? (
                        <div className="flex items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-2 py-1.5 text-[11px] text-zinc-600">
                          <CheckCircle2 className="size-3.5 text-zinc-500" />
                          {audioUploadState.success}
                        </div>
                      ) : null}

                      {isUploadingSelectedLesson ? (
                        <div className="text-[11px] text-zinc-500">
                          Uploading {audioUploadState.fileName} ({audioUploadState.progress}
                          %)
                        </div>
                      ) : null}

                      {selectedLessonAudioDraft.audioUrl ? (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-zinc-200 bg-white px-2 py-1.5">
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-medium text-zinc-700">
                              {selectedLessonAudioLabel ?? "Lesson audio attached"}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              {selectedLessonAudioSummary?.source ?? "External URL"}
                            </p>
                            {selectedLessonAudioSummary?.meta ? (
                              <p className="text-[10px] text-zinc-400">
                                {selectedLessonAudioSummary.meta}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={selectedLessonAudioDraft.audioUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-6 items-center gap-1 rounded-sm border border-zinc-200 bg-white px-2 text-[10px] text-zinc-600 hover:bg-zinc-100"
                            >
                              <Link2 className="size-3" />
                              Open
                            </a>
                            <button
                              type="button"
                              onClick={() => clearLessonAudio("edit")}
                              className="inline-flex h-6 items-center gap-1 rounded-sm border border-zinc-200 bg-white px-2 text-[10px] text-zinc-600 hover:bg-zinc-100"
                            >
                              <X className="size-3" />
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[10px] text-zinc-400">
                        Notes
                      </label>
                      <textarea
                        value={editNotes}
                        onChange={(event) => setEditNotes(event.target.value)}
                        rows={7}
                        className="w-full rounded-sm border border-zinc-200 px-2 py-1.5 text-xs outline-none placeholder:text-zinc-300 focus:border-zinc-400"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleSaveLesson}
                        disabled={
                          isPending || !hasLessonChanges || isUploadingSelectedLesson
                        }
                        className="flex h-7 items-center gap-1.5 rounded-sm bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                      >
                        <Save className="size-3" />
                        Save changes
                      </button>
                      <button
                        onClick={handlePublishToggle}
                        disabled={
                          isPending ||
                          (selectedLesson.status !== "published" &&
                            (!publishReadiness.isReady ||
                              hasLessonChanges ||
                              isUploadingSelectedLesson))
                        }
                        className={cn(
                          "flex h-7 items-center gap-1.5 rounded-sm border px-3 text-xs font-medium disabled:opacity-50",
                          selectedLesson.status === "published"
                            ? "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                        )}
                      >
                        {selectedLesson.status === "published" ? (
                          <>
                            <EyeOff className="size-3" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Eye className="size-3" />
                            Publish
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-sm border border-zinc-200 bg-white p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                        Quiz questions
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {lessonQuestions.length} question
                        {lessonQuestions.length === 1 ? "" : "s"} configured
                      </p>
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      Use commas or new lines for options
                    </span>
                  </div>

                  {questionFeedback ? (
                    <div className="mb-3 flex items-center gap-1.5 rounded-sm border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-[11px] text-zinc-600">
                      <CheckCircle2 className="size-3.5 text-zinc-500" />
                      {questionFeedback}
                    </div>
                  ) : null}

                  <div className="mb-3 grid gap-1">
                    {lessonQuestions.length ? (
                      lessonQuestions.map((q, index) => (
                        <div
                          key={q.id}
                          className="rounded-sm border border-zinc-100 px-2 py-2"
                        >
                          {editingQId === q.id ? (
                            <div className="grid gap-1.5">
                              {editQuestionError ? (
                                <div className="flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
                                  <AlertCircle className="size-3.5" />
                                  {editQuestionError}
                                </div>
                              ) : null}
                              <input
                                type="text"
                                value={editQText}
                                onChange={(event) =>
                                  setEditQText(event.target.value)
                                }
                                className="h-7 w-full rounded-sm border border-zinc-200 px-2 text-xs outline-none"
                              />
                              {q.questionType === "multiple_choice" ? (
                                <textarea
                                  value={editQOptions}
                                  onChange={(event) =>
                                    setEditQOptions(event.target.value)
                                  }
                                  rows={3}
                                  placeholder="One option per line or comma-separated"
                                  className="w-full rounded-sm border border-zinc-200 px-2 py-1.5 text-xs outline-none placeholder:text-zinc-300"
                                />
                              ) : null}
                              <input
                                type="text"
                                value={editQAnswer}
                                onChange={(event) =>
                                  setEditQAnswer(event.target.value)
                                }
                                placeholder="Correct answer"
                                className="h-7 w-full rounded-sm border border-zinc-200 px-2 text-xs outline-none placeholder:text-zinc-300"
                              />
                              <div className="flex gap-1.5">
                                <button
                                  onClick={handleSaveQuestion}
                                  disabled={isPending}
                                  className="h-6 rounded bg-zinc-900 px-2 text-[10px] font-medium text-white disabled:opacity-50"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingQId(null);
                                    setEditQuestionError(null);
                                  }}
                                  className="h-6 rounded-sm border border-zinc-200 px-2 text-[10px] text-zinc-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <div className="rounded-sm border border-zinc-200 bg-zinc-50 px-1.5 py-1 text-[10px] text-zinc-500">
                                Q{index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="rounded bg-zinc-100 px-1 text-[9px] text-zinc-500">
                                    {q.questionType === "multiple_choice"
                                      ? "MC"
                                      : "Text"}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-zinc-700">
                                  {q.questionText}
                                </p>
                                {q.options ? (
                                  <p className="mt-1 whitespace-pre-wrap text-[10px] text-zinc-400">
                                    Options: {q.options.join(", ")}
                                  </p>
                                ) : null}
                                {q.correctAnswer ? (
                                  <p className="mt-1 text-[10px] text-emerald-600">
                                    Answer: {q.correctAnswer}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleReorderQuestion(q.id, "up")}
                                  disabled={isPending || index === 0}
                                  className="flex h-6 items-center gap-1 rounded-sm border border-zinc-200 px-1.5 text-[10px] text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
                                  title="Move up"
                                >
                                  <ArrowUp className="size-2.5" />
                                </button>
                                <button
                                  onClick={() => handleReorderQuestion(q.id, "down")}
                                  disabled={isPending || index === lessonQuestions.length - 1}
                                  className="flex h-6 items-center gap-1 rounded-sm border border-zinc-200 px-1.5 text-[10px] text-zinc-500 hover:bg-zinc-50 disabled:opacity-50"
                                  title="Move down"
                                >
                                  <ArrowDown className="size-2.5" />
                                </button>
                                <button
                                  onClick={() => handleEditQuestion(q.id)}
                                  className="flex h-6 items-center gap-1 rounded-sm border border-zinc-200 px-1.5 text-[10px] text-zinc-500 hover:bg-zinc-50"
                                >
                                  <PencilLine className="size-2.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  disabled={isPending}
                                  className="flex h-6 items-center gap-1 rounded-sm border border-red-200 px-1.5 text-[10px] text-red-500 hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2 className="size-2.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-sm border border-dashed border-zinc-200 px-3 py-6 text-center text-xs text-zinc-400">
                        No quiz questions yet
                      </div>
                    )}
                  </div>

                  <div className="rounded-sm border border-dashed border-zinc-200 p-3">
                    <p className="mb-1.5 flex items-center gap-1 text-[10px] font-medium text-zinc-400">
                      <Plus className="size-3" />
                      Add question
                    </p>
                    {questionError ? (
                      <div className="mb-2 flex items-center gap-1.5 rounded-sm border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
                        <AlertCircle className="size-3.5" />
                        {questionError}
                      </div>
                    ) : null}
                    <div className="grid gap-1.5">
                      <div className="relative">
                        <select
                          value={newQType}
                          onChange={(event) =>
                            setNewQType(
                              event.target.value as
                                | "multiple_choice"
                                | "short_text",
                            )
                          }
                          className="h-7 w-full appearance-none rounded-sm border border-zinc-200 pl-2 pr-6 text-xs outline-none"
                        >
                          <option value="multiple_choice">Multiple choice</option>
                          <option value="short_text">Short text</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-zinc-400" />
                      </div>
                      <input
                        type="text"
                        value={newQText}
                        onChange={(event) => setNewQText(event.target.value)}
                        placeholder="Question text"
                        className="h-7 w-full rounded-sm border border-zinc-200 px-2 text-xs outline-none placeholder:text-zinc-300"
                      />
                      {newQType === "multiple_choice" ? (
                        <textarea
                          value={newQOptions}
                          onChange={(event) =>
                            setNewQOptions(event.target.value)
                          }
                          rows={3}
                          placeholder="One option per line or comma-separated"
                          className="w-full rounded-sm border border-zinc-200 px-2 py-1.5 text-xs outline-none placeholder:text-zinc-300"
                        />
                      ) : null}
                      <input
                        type="text"
                        value={newQAnswer}
                        onChange={(event) => setNewQAnswer(event.target.value)}
                        placeholder="Correct answer"
                        className="h-7 w-full rounded-sm border border-zinc-200 px-2 text-xs outline-none placeholder:text-zinc-300"
                      />
                      <button
                        onClick={handleAddQuestion}
                        disabled={isPending || !newQText.trim()}
                        className="flex h-7 w-fit items-center gap-1.5 rounded-sm bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                      >
                        <Plus className="size-3" />
                        Add question
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="grid content-start gap-3">
          <div className="rounded-sm border border-zinc-200 bg-white p-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              Authoring status
            </p>
            <div className="mt-3 grid gap-2">
              <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                  Selected lesson
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-900">
                  {selectedLesson?.title ?? "None selected"}
                </p>
              </div>
              <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                  Lesson status
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-900 capitalize">
                  {selectedLesson?.status ?? "Draft"}
                </p>
              </div>
              <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                  Quiz questions
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-900">
                  {lessonQuestions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-zinc-200 bg-white p-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              Publishing checklist
            </p>
            <div className="mt-3 grid gap-2">
              {publishReadiness.requirements.map((requirement) => (
                <div
                  key={requirement.id}
                  className={cn(
                    "rounded-sm border px-3 py-2 text-[11px]",
                    requirement.met
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-800",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {requirement.met ? (
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                    )}
                    <div>
                      <p>{requirement.label}</p>
                      {requirement.detail ? (
                        <p
                          className={cn(
                            "mt-1",
                            requirement.met
                              ? "text-emerald-600"
                              : "text-amber-700",
                          )}
                        >
                          {requirement.detail}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {selectedLesson?.status !== "published" && hasLessonChanges ? (
              <p className="mt-3 text-[11px] text-zinc-500">
                Save lesson changes before publishing.
              </p>
            ) : null}
          </div>

          <div className="rounded-sm border border-zinc-200 bg-white p-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              Lesson lifecycle
            </p>
            <div className="mt-3 grid gap-2 text-[11px]">
              <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-2 text-zinc-600">
                {deletionState?.detail ??
                  "Select a lesson to manage its lifecycle."}
              </div>
              {selectedLesson ? (
                deleteConfirmLessonId === selectedLesson.id &&
                deletionState?.canDelete ? (
                  <div className="grid gap-2 rounded-sm border border-red-200 bg-red-50 p-2">
                    <p className="text-red-700">
                      Delete lesson {selectedLesson.lessonNumber} and all related
                      student records?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteLesson}
                        disabled={isPending}
                        className="inline-flex h-7 items-center gap-1.5 rounded-sm bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        <Trash2 className="size-3" />
                        Confirm delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmLessonId(null)}
                        className="h-7 rounded-sm border border-zinc-200 bg-white px-3 text-xs text-zinc-600 hover:bg-zinc-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmLessonId(selectedLesson.id)}
                    disabled={isPending || !deletionState?.canDelete}
                    className={cn(
                      "inline-flex h-8 items-center justify-center gap-1.5 rounded-sm border px-3 text-xs font-medium disabled:opacity-50",
                      deletionState?.canDelete
                        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border-zinc-200 bg-zinc-100 text-zinc-400",
                    )}
                  >
                    <Trash2 className="size-3" />
                    Delete lesson
                  </button>
                )
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

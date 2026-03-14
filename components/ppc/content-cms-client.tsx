"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
  GripVertical,
  PencilLine,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ppc/status-badge";
import {
  updateLessonContent,
  publishLessonAction,
  unpublishLessonAction,
  addQuizQuestion,
  editQuizQuestion,
  removeQuizQuestion,
} from "@/app/ppc/_actions/content-actions";

type Lesson = {
  id: number;
  lessonNumber: number;
  title: string;
  status: string;
  audioUrl: string | null;
  notesContent: string | null;
};

type Level = {
  id: number;
  title: string;
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

export function ContentCmsClient({
  levels,
  initialQuestions,
}: ContentCmsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeLevelId, setActiveLevelId] = useState(levels[0]?.id ?? 1);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editAudioUrl, setEditAudioUrl] = useState("");
  const [editNotes, setEditNotes] = useState("");

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

  const activeLevel = levels.find((l) => l.id === activeLevelId);
  const selectedLesson = activeLevel?.lessons.find(
    (l) => l.id === selectedLessonId,
  );
  const lessonQuestions =
    selectedLessonId != null ? questions[selectedLessonId] ?? [] : [];

  const selectLesson = (lesson: Lesson) => {
    setSelectedLessonId(lesson.id);
    setEditTitle(lesson.title);
    setEditAudioUrl(lesson.audioUrl ?? "");
    setEditNotes(lesson.notesContent ?? "");
    setEditingQId(null);
  };

  const handleSaveLesson = () => {
    if (selectedLessonId == null) return;
    startTransition(async () => {
      await updateLessonContent(selectedLessonId, {
        title: editTitle || undefined,
        audioUrl: editAudioUrl || null,
        notesContent: editNotes || null,
      });
      router.refresh();
    });
  };

  const handlePublishToggle = () => {
    if (!selectedLesson) return;
    startTransition(async () => {
      if (selectedLesson.status === "published") {
        await unpublishLessonAction(selectedLesson.id);
      } else {
        await publishLessonAction(selectedLesson.id);
      }
      router.refresh();
    });
  };

  const handleAddQuestion = () => {
    if (!newQText.trim() || selectedLessonId == null) return;
    startTransition(async () => {
      const opts =
        newQType === "multiple_choice" && newQOptions.trim()
          ? newQOptions.split(",").map((o) => o.trim())
          : null;
      const q = await addQuizQuestion({
        lessonId: selectedLessonId,
        questionType: newQType,
        questionText: newQText.trim(),
        options: opts,
        correctAnswer: newQAnswer.trim() || null,
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
      router.refresh();
    });
  };

  const handleEditQuestion = (qId: number) => {
    const q = lessonQuestions.find((qq) => qq.id === qId);
    if (!q) return;
    setEditingQId(qId);
    setEditQText(q.questionText);
    setEditQOptions(q.options?.join(", ") ?? "");
    setEditQAnswer(q.correctAnswer ?? "");
  };

  const handleSaveQuestion = () => {
    if (editingQId == null || selectedLessonId == null) return;
    startTransition(async () => {
      const opts = editQOptions.trim()
        ? editQOptions.split(",").map((o) => o.trim())
        : null;
      await editQuizQuestion(editingQId, {
        questionText: editQText.trim() || undefined,
        options: opts,
        correctAnswer: editQAnswer.trim() || null,
      });
      setQuestions((prev) => ({
        ...prev,
        [selectedLessonId]: (prev[selectedLessonId] ?? []).map((q) =>
          q.id === editingQId
            ? {
                ...q,
                questionText: editQText.trim() || q.questionText,
                options: opts,
                correctAnswer: editQAnswer.trim() || null,
              }
            : q,
        ),
      }));
      setEditingQId(null);
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
      router.refresh();
    });
  };

  return (
    <div className="grid gap-3">
      {/* Level tabs */}
      <div className="flex gap-1 border-b border-zinc-200">
        {levels.map((level) => (
          <button
            key={level.id}
            onClick={() => {
              setActiveLevelId(level.id);
              setSelectedLessonId(null);
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
      </div>

      <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
        {/* Lesson sidebar */}
        <div className="grid content-start gap-1 max-h-[600px] overflow-y-auto">
          {activeLevel?.lessons.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => selectLesson(lesson)}
              className={cn(
                "flex items-center gap-2 rounded-sm border px-2 py-1.5 text-left transition-colors",
                selectedLessonId === lesson.id
                  ? "border-zinc-400 bg-zinc-50"
                  : "border-zinc-200 bg-white hover:bg-zinc-50",
              )}
            >
              <span className="text-[10px] text-zinc-400">
                #{lesson.lessonNumber}
              </span>
              <span className="flex-1 text-xs text-zinc-700 truncate">
                {lesson.title}
              </span>
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  lesson.status === "published"
                    ? "bg-emerald-500"
                    : "bg-zinc-300",
                )}
              />
            </button>
          ))}
        </div>

        {/* Edit panel */}
        {selectedLesson == null ? (
          <div className="flex items-center justify-center rounded-sm border border-zinc-200 bg-white py-12 text-xs text-zinc-400">
            Select a lesson to edit
          </div>
        ) : (
          <div className="grid gap-3">
            {/* Lesson fields */}
            <div className="rounded-sm border border-zinc-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  Lesson details
                </p>
                <StatusBadge
                  status={selectedLesson.status}
                  variant={
                    selectedLesson.status === "published"
                      ? "success"
                      : "default"
                  }
                />
              </div>

              <div className="grid gap-2">
                <div>
                  <label className="mb-0.5 block text-[10px] text-zinc-400">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
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
                    onChange={(e) => setEditAudioUrl(e.target.value)}
                    placeholder="https://…"
                    className="h-8 w-full rounded-sm border border-zinc-200 px-2 text-xs outline-none placeholder:text-zinc-300 focus:border-zinc-400"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-zinc-400">
                    Notes
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={5}
                    className="w-full rounded-sm border border-zinc-200 px-2 py-1.5 text-xs outline-none placeholder:text-zinc-300 focus:border-zinc-400"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveLesson}
                    disabled={isPending}
                    className="flex h-7 items-center gap-1.5 rounded-sm bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    <Save className="size-3" />
                    Save
                  </button>
                  <button
                    onClick={handlePublishToggle}
                    disabled={isPending}
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

            {/* Quiz editor */}
            <div className="rounded-sm border border-zinc-200 bg-white p-3">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Quiz questions
              </p>

              {/* Existing questions */}
              <div className="grid gap-1 mb-3">
                {lessonQuestions.map((q, i) => (
                  <div
                    key={q.id}
                    className="rounded-sm border border-zinc-100 px-2 py-1.5"
                  >
                    {editingQId === q.id ? (
                      <div className="grid gap-1.5">
                        <input
                          type="text"
                          value={editQText}
                          onChange={(e) => setEditQText(e.target.value)}
                          className="h-7 w-full rounded-sm border border-zinc-200 px-2 text-xs outline-none"
                        />
                        {q.questionType === "multiple_choice" && (
                          <input
                            type="text"
                            value={editQOptions}
                            onChange={(e) => setEditQOptions(e.target.value)}
                            placeholder="Options (comma-separated)"
                            className="h-7 w-full rounded-sm border border-zinc-200 px-2 text-xs outline-none placeholder:text-zinc-300"
                          />
                        )}
                        <input
                          type="text"
                          value={editQAnswer}
                          onChange={(e) => setEditQAnswer(e.target.value)}
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
                            onClick={() => setEditingQId(null)}
                            className="h-6 rounded-sm border border-zinc-200 px-2 text-[10px] text-zinc-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 size-3 shrink-0 text-zinc-300" />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-400">
                              Q{i + 1}
                            </span>
                            <span className="rounded bg-zinc-100 px-1 text-[9px] text-zinc-500">
                              {q.questionType === "multiple_choice"
                                ? "MC"
                                : "Text"}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-700">
                            {q.questionText}
                          </p>
                          {q.options && (
                            <p className="text-[10px] text-zinc-400">
                              Options: {q.options.join(", ")}
                            </p>
                          )}
                          {q.correctAnswer && (
                            <p className="text-[10px] text-emerald-600">
                              Answer: {q.correctAnswer}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
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
                ))}
              </div>

              {/* Add question */}
              <div className="rounded-sm border border-dashed border-zinc-200 p-2">
                <p className="mb-1.5 flex items-center gap-1 text-[10px] font-medium text-zinc-400">
                  <Plus className="size-3" />
                  Add question
                </p>
                <div className="grid gap-1.5">
                  <div className="relative">
                    <select
                      value={newQType}
                      onChange={(e) =>
                        setNewQType(
                          e.target.value as "multiple_choice" | "short_text",
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
                    onChange={(e) => setNewQText(e.target.value)}
                    placeholder="Question text"
                    className="h-7 w-full rounded-sm border border-zinc-200 px-2 text-xs outline-none placeholder:text-zinc-300"
                  />
                  {newQType === "multiple_choice" && (
                    <input
                      type="text"
                      value={newQOptions}
                      onChange={(e) => setNewQOptions(e.target.value)}
                      placeholder="Options (comma-separated)"
                      className="h-7 w-full rounded-sm border border-zinc-200 px-2 text-xs outline-none placeholder:text-zinc-300"
                    />
                  )}
                  <input
                    type="text"
                    value={newQAnswer}
                    onChange={(e) => setNewQAnswer(e.target.value)}
                    placeholder="Correct answer"
                    className="h-7 w-full rounded-sm border border-zinc-200 px-2 text-xs outline-none placeholder:text-zinc-300"
                  />
                  <button
                    onClick={handleAddQuestion}
                    disabled={isPending || !newQText.trim()}
                    className="flex h-7 w-fit items-center gap-1.5 rounded-sm bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    <Plus className="size-3" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

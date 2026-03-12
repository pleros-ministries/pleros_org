import {
  BookOpen,
  CheckCircle2,
  Circle,
  CircleCheck,
  Clock3,
  Lock,
  MessageSquareText,
} from "lucide-react";

import { DEMO_STUDENTS } from "@/lib/ppc-demo";
import { buildCourseRail, buildDefaultStudentCourse } from "@/lib/student-course";
import {
  buildDemoLevelLearningSnapshot,
  isLessonComplete,
  type LessonPathItem,
  type LessonRequirementSignals,
} from "@/lib/student-learning";

const demoStudent = DEMO_STUDENTS.find((student) => student.level === 1) ?? DEMO_STUDENTS[0];
const currentCourse = buildDefaultStudentCourse();
const courseRail = buildCourseRail(currentCourse.level);
const learningSnapshot = buildDemoLevelLearningSnapshot(currentCourse.level);
const activeLesson =
  learningSnapshot.lessonPath.find(
    (lesson) => lesson.lessonNumber === learningSnapshot.currentLessonNumber,
  ) ?? learningSnapshot.lessonPath[0];

type SignalItem = {
  label: string;
  done: boolean;
};

function buildSignalItems(signals: LessonRequirementSignals): SignalItem[] {
  return [
    { label: "Audio marked as listened", done: signals.audioListened },
    { label: "Notes marked as read", done: signals.notesRead },
    { label: "Quiz passed (>= 70%)", done: signals.quizPassed },
    { label: "Written response approved", done: signals.writtenApproved },
  ];
}

function getLessonStatusCopy(lesson: LessonPathItem): string {
  if (lesson.status === "completed") {
    return "Completed";
  }

  if (lesson.status === "in_progress") {
    return "In progress";
  }

  return "Not started";
}

export default function StudentHomePage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Course Outline
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-zinc-950">Your Levels</h2>

        <div className="mt-4 grid gap-2">
          {courseRail.map((item) => {
            const isCurrent = item.state === "current";
            const isLocked = item.locked;

            return (
              <article
                key={item.level}
                className={
                  isCurrent
                    ? "rounded-xl border border-zinc-900 bg-zinc-900 px-3 py-3 text-white"
                    : "rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-zinc-800"
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className={isCurrent ? "text-xs text-zinc-300" : "text-xs text-zinc-500"}>
                      {item.lessons} lessons
                    </p>
                  </div>
                  {isLocked ? (
                    <Lock className="mt-0.5 size-4" />
                  ) : (
                    <CircleCheck className="mt-0.5 size-4" />
                  )}
                </div>
                <p className={isCurrent ? "mt-2 text-[11px] text-zinc-300" : "mt-2 text-[11px] text-zinc-500"}>
                  {isCurrent
                    ? "Current course"
                    : isLocked
                      ? "Locked until previous level graduation"
                      : "Read-only access"}
                </p>
              </article>
            );
          })}
        </div>
      </aside>

      <div className="grid gap-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Learner View
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
            Continue {currentCourse.courseTitle}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Current lesson: Lesson {learningSnapshot.currentLessonNumber}
          </p>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs font-medium text-zinc-600">
              <span>Level progress</span>
              <span>{learningSnapshot.progressPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-zinc-900 transition-all"
                style={{ width: `${learningSnapshot.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Graduation readiness</p>
                <p className="mt-1 text-xs text-zinc-600">
                  {learningSnapshot.canGraduate
                    ? "All lessons are complete. Waiting for staff graduation mark."
                    : "All lessons must be fully approved before this level can be graduated."}
                </p>
              </div>
              {learningSnapshot.canGraduate ? (
                <CheckCircle2 className="size-4 text-zinc-900" />
              ) : (
                <Clock3 className="size-4 text-zinc-600" />
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-900">Lessons in this level</h3>
              <span className="text-xs text-zinc-500">
                {learningSnapshot.lessonCount} lessons
              </span>
            </div>

            <div className="mt-3 grid gap-2">
              {learningSnapshot.lessonPath.map((lesson) => {
                const isCurrent = lesson.lessonNumber === learningSnapshot.currentLessonNumber;
                const statusCopy = getLessonStatusCopy(lesson);

                return (
                  <article
                    key={lesson.lessonNumber}
                    className={
                      isCurrent
                        ? "rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-3 text-white"
                        : "rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3 text-zinc-900"
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">Lesson {lesson.lessonNumber}</p>
                      {lesson.unlocked ? (
                        <span
                          className={
                            isCurrent
                              ? "rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-100"
                              : "rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] text-zinc-600"
                          }
                        >
                          {statusCopy}
                        </span>
                      ) : (
                        <Lock className={isCurrent ? "size-4 text-zinc-200" : "size-4 text-zinc-500"} />
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </article>

          <article className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-sm font-semibold text-zinc-900">
              Lesson {activeLesson.lessonNumber} requirements
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              Complete every signal to mark the lesson done.
            </p>

            <div className="mt-3 grid gap-2">
              {buildSignalItems(activeLesson.signals).map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2"
                >
                  {item.done ? (
                    <CheckCircle2 className="size-4 text-zinc-900" />
                  ) : (
                    <Circle className="size-4 text-zinc-500" />
                  )}
                  <span className="text-xs text-zinc-700">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
              {isLessonComplete(activeLesson.signals)
                ? "This lesson is complete."
                : "This lesson remains in progress until all signals are complete."}
            </div>
          </article>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl border border-zinc-200 bg-white p-4">
            <BookOpen className="size-4 text-zinc-600" />
            <p className="mt-2 text-sm font-semibold text-zinc-900">Progress</p>
            <p className="mt-1 text-xs text-zinc-600">
              {learningSnapshot.progressPercent}% complete
            </p>
          </article>

          <article className="rounded-xl border border-zinc-200 bg-white p-4">
            <CircleCheck className="size-4 text-zinc-600" />
            <p className="mt-2 text-sm font-semibold text-zinc-900">Graduation status</p>
            <p className="mt-1 text-xs text-zinc-600">
              {demoStudent.graduationStatus.replace("_", " ")}
            </p>
          </article>

          <article className="rounded-xl border border-zinc-200 bg-white p-4">
            <MessageSquareText className="size-4 text-zinc-600" />
            <p className="mt-2 text-sm font-semibold text-zinc-900">Open Q&A</p>
            <p className="mt-1 text-xs text-zinc-600">{demoStudent.qaPending} pending replies</p>
          </article>
        </section>
      </div>
    </div>
  );
}

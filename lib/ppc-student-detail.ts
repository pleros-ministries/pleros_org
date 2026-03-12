import { DEMO_STUDENTS, type DemoStudent } from "./ppc-demo";
import type { CourseLevel } from "./student-course";

export type StudentResponseStatus =
  | "draft"
  | "pending"
  | "needs_revision"
  | "approved";

export type StudentResponseItem = {
  id: string;
  lessonLabel: string;
  kind: "quiz_short_text" | "written_response";
  status: StudentResponseStatus;
  submittedAt: string;
  reviewedBy?: string;
};

export type StudentTimelineItem = {
  id: string;
  event: string;
  occurredAt: string;
};

export type StudentLevelSummary = {
  totalLessons: number;
  completedLessons: number;
  remainingLessons: number;
  canGraduate: boolean;
  pendingResponseClearance: number;
};

export type StudentDetailSnapshot = {
  student: DemoStudent;
  levelSummary: StudentLevelSummary;
  responses: StudentResponseItem[];
  timeline: StudentTimelineItem[];
};

const LESSONS_BY_LEVEL: Record<CourseLevel, number> = {
  1: 5,
  2: 11,
  3: 30,
  4: 60,
  5: 300,
};

const DEMO_RESPONSES_BY_STUDENT: Record<string, StudentResponseItem[]> = {
  "stu-001": [
    {
      id: "resp-001",
      lessonLabel: "Level 2 / Lesson 6",
      kind: "written_response",
      status: "pending",
      submittedAt: "2026-03-11T07:10:00.000Z",
    },
    {
      id: "resp-002",
      lessonLabel: "Level 2 / Lesson 5",
      kind: "quiz_short_text",
      status: "needs_revision",
      submittedAt: "2026-03-10T18:20:00.000Z",
      reviewedBy: "Rev. Tolu Aina",
    },
    {
      id: "resp-003",
      lessonLabel: "Level 2 / Lesson 4",
      kind: "quiz_short_text",
      status: "approved",
      submittedAt: "2026-03-09T16:00:00.000Z",
      reviewedBy: "Rev. Tolu Aina",
    },
  ],
  "stu-002": [
    {
      id: "resp-004",
      lessonLabel: "Level 1 / Lesson 5",
      kind: "written_response",
      status: "approved",
      submittedAt: "2026-03-09T09:30:00.000Z",
      reviewedBy: "Pastor E. James",
    },
    {
      id: "resp-005",
      lessonLabel: "Level 1 / Lesson 4",
      kind: "quiz_short_text",
      status: "approved",
      submittedAt: "2026-03-08T14:10:00.000Z",
      reviewedBy: "Pastor E. James",
    },
  ],
};

const DEMO_TIMELINE_BY_STUDENT: Record<string, StudentTimelineItem[]> = {
  "stu-001": [
    {
      id: "tl-001",
      event: "Submitted written response for Level 2 / Lesson 6",
      occurredAt: "2026-03-11T07:10:00.000Z",
    },
    {
      id: "tl-002",
      event: "Received needs revision on Lesson 5 short-text quiz",
      occurredAt: "2026-03-10T18:40:00.000Z",
    },
    {
      id: "tl-003",
      event: "Marked audio as listened for Level 2 / Lesson 6",
      occurredAt: "2026-03-10T17:55:00.000Z",
    },
  ],
  "stu-002": [
    {
      id: "tl-004",
      event: "Level 1 marked ready for review",
      occurredAt: "2026-03-09T10:05:00.000Z",
    },
    {
      id: "tl-005",
      event: "Written response approved for Level 1 / Lesson 5",
      occurredAt: "2026-03-09T09:35:00.000Z",
    },
  ],
};

function buildFallbackResponses(student: DemoStudent): StudentResponseItem[] {
  if (student.reviewsPending === 0) {
    return [];
  }

  return Array.from({ length: student.reviewsPending }, (_, index) => ({
    id: `${student.id}-pending-${index + 1}`,
    lessonLabel: student.currentLesson,
    kind: "written_response",
    status: "pending",
    submittedAt: student.lastActivity,
  }));
}

function buildFallbackTimeline(student: DemoStudent): StudentTimelineItem[] {
  return [
    {
      id: `${student.id}-timeline-1`,
      event: `Updated progress in ${student.currentLesson}`,
      occurredAt: student.lastActivity,
    },
  ];
}

function clampCompletedLessons(totalLessons: number, progressPercent: number): number {
  const projected = Math.floor((progressPercent / 100) * totalLessons);
  return Math.min(Math.max(projected, 0), totalLessons);
}

export function getTotalLessonsForLevel(level: CourseLevel): number {
  return LESSONS_BY_LEVEL[level];
}

export function buildStudentDetail(studentId: string): StudentDetailSnapshot | null {
  const student = DEMO_STUDENTS.find((candidate) => candidate.id === studentId);

  if (!student) {
    return null;
  }

  const totalLessons = getTotalLessonsForLevel(student.level);
  const completedLessons = clampCompletedLessons(totalLessons, student.progressPercent);
  const responses = DEMO_RESPONSES_BY_STUDENT[student.id] ?? buildFallbackResponses(student);
  const pendingResponseClearance = responses.filter(
    (response) => response.status === "pending" || response.status === "needs_revision",
  ).length;

  return {
    student,
    levelSummary: {
      totalLessons,
      completedLessons,
      remainingLessons: Math.max(totalLessons - completedLessons, 0),
      canGraduate:
        student.graduationStatus === "ready_for_review" || student.graduationStatus === "graduated",
      pendingResponseClearance,
    },
    responses,
    timeline: DEMO_TIMELINE_BY_STUDENT[student.id] ?? buildFallbackTimeline(student),
  };
}

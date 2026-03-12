export type DemoStudentStatus = "active" | "suspended";

export type DemoGraduationStatus =
  | "in_progress"
  | "ready_for_review"
  | "graduated"
  | "blocked";

export type DemoStudent = {
  id: string;
  name: string;
  email: string;
  level: 1 | 2 | 3 | 4 | 5;
  progressPercent: number;
  currentLesson: string;
  location: string;
  status: DemoStudentStatus;
  lastActivity: string;
  qaPending: number;
  reviewsPending: number;
  graduationStatus: DemoGraduationStatus;
  enrolledAt: string;
};

export type StudentFilterOptions = {
  query: string;
  level: number | "all";
  status: DemoStudentStatus | "all";
};

export type StudentSortOptions = {
  sortBy: "name" | "level" | "progressPercent" | "lastActivity";
  direction: "asc" | "desc";
};

export type DashboardStats = {
  activeStudents: number;
  pendingReviews: number;
  pendingQa: number;
  averageProgress: number;
};

export type DemoReviewItem = {
  id: string;
  studentName: string;
  level: number;
  lesson: string;
  type: "short_text" | "written_response";
  status: "pending" | "in_review" | "needs_revision";
  submittedAt: string;
};

export type DemoQaThread = {
  id: string;
  studentName: string;
  level: number;
  subject: string;
  status: "open" | "answered";
  updatedAt: string;
};

export type DemoNotification = {
  id: string;
  event: string;
  channel: "email" | "web_push";
  sentAt: string;
  recipient: string;
};

export const DEMO_STUDENTS: DemoStudent[] = [
  {
    id: "stu-001",
    name: "Ada Nwosu",
    email: "ada@pleros.test",
    level: 2,
    progressPercent: 54,
    currentLesson: "Level 2 / Lesson 6",
    location: "Lagos, NG",
    status: "active",
    lastActivity: "2026-03-10T14:00:00.000Z",
    qaPending: 1,
    reviewsPending: 2,
    graduationStatus: "in_progress",
    enrolledAt: "2026-01-02T08:00:00.000Z",
  },
  {
    id: "stu-002",
    name: "Ben Udo",
    email: "ben@pleros.test",
    level: 1,
    progressPercent: 92,
    currentLesson: "Level 1 / Lesson 5",
    location: "Abuja, NG",
    status: "active",
    lastActivity: "2026-03-09T09:00:00.000Z",
    qaPending: 0,
    reviewsPending: 1,
    graduationStatus: "ready_for_review",
    enrolledAt: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "stu-003",
    name: "Chiamaka Obi",
    email: "chiamaka@pleros.test",
    level: 3,
    progressPercent: 12,
    currentLesson: "Level 3 / Lesson 2",
    location: "Port Harcourt, NG",
    status: "suspended",
    lastActivity: "2026-03-02T07:00:00.000Z",
    qaPending: 4,
    reviewsPending: 3,
    graduationStatus: "blocked",
    enrolledAt: "2026-02-11T08:00:00.000Z",
  },
  {
    id: "stu-004",
    name: "Deborah Ibe",
    email: "deborah@pleros.test",
    level: 4,
    progressPercent: 38,
    currentLesson: "Level 4 / Lesson 17",
    location: "Enugu, NG",
    status: "active",
    lastActivity: "2026-03-10T11:00:00.000Z",
    qaPending: 0,
    reviewsPending: 5,
    graduationStatus: "in_progress",
    enrolledAt: "2025-12-21T08:00:00.000Z",
  },
  {
    id: "stu-005",
    name: "Emeka Yusuf",
    email: "emeka@pleros.test",
    level: 5,
    progressPercent: 73,
    currentLesson: "Level 5 / Lesson 131",
    location: "Kaduna, NG",
    status: "active",
    lastActivity: "2026-03-11T08:30:00.000Z",
    qaPending: 2,
    reviewsPending: 4,
    graduationStatus: "in_progress",
    enrolledAt: "2025-08-02T08:00:00.000Z",
  },
  {
    id: "stu-006",
    name: "Favour Bassey",
    email: "favour@pleros.test",
    level: 2,
    progressPercent: 85,
    currentLesson: "Level 2 / Lesson 10",
    location: "Calabar, NG",
    status: "active",
    lastActivity: "2026-03-11T06:00:00.000Z",
    qaPending: 1,
    reviewsPending: 0,
    graduationStatus: "ready_for_review",
    enrolledAt: "2026-01-09T08:00:00.000Z",
  },
  {
    id: "stu-007",
    name: "Gloria Mensah",
    email: "gloria@pleros.test",
    level: 3,
    progressPercent: 48,
    currentLesson: "Level 3 / Lesson 14",
    location: "Accra, GH",
    status: "active",
    lastActivity: "2026-03-10T17:45:00.000Z",
    qaPending: 3,
    reviewsPending: 2,
    graduationStatus: "in_progress",
    enrolledAt: "2025-11-11T08:00:00.000Z",
  },
  {
    id: "stu-008",
    name: "Henry Okon",
    email: "henry@pleros.test",
    level: 1,
    progressPercent: 27,
    currentLesson: "Level 1 / Lesson 2",
    location: "Uyo, NG",
    status: "active",
    lastActivity: "2026-03-08T10:15:00.000Z",
    qaPending: 0,
    reviewsPending: 1,
    graduationStatus: "in_progress",
    enrolledAt: "2026-02-18T08:00:00.000Z",
  },
  {
    id: "stu-009",
    name: "Ifeoma Okeke",
    email: "ifeoma@pleros.test",
    level: 4,
    progressPercent: 64,
    currentLesson: "Level 4 / Lesson 30",
    location: "Onitsha, NG",
    status: "active",
    lastActivity: "2026-03-11T09:10:00.000Z",
    qaPending: 1,
    reviewsPending: 3,
    graduationStatus: "in_progress",
    enrolledAt: "2025-10-10T08:00:00.000Z",
  },
  {
    id: "stu-010",
    name: "James Adeyemi",
    email: "james@pleros.test",
    level: 5,
    progressPercent: 95,
    currentLesson: "Level 5 / Lesson 287",
    location: "Ibadan, NG",
    status: "active",
    lastActivity: "2026-03-11T07:50:00.000Z",
    qaPending: 0,
    reviewsPending: 1,
    graduationStatus: "ready_for_review",
    enrolledAt: "2025-06-15T08:00:00.000Z",
  },
];

export const DEMO_REVIEW_QUEUE: DemoReviewItem[] = [
  {
    id: "rev-001",
    studentName: "Ada Nwosu",
    level: 2,
    lesson: "Lesson 6",
    type: "written_response",
    status: "pending",
    submittedAt: "2026-03-11T07:10:00.000Z",
  },
  {
    id: "rev-002",
    studentName: "Deborah Ibe",
    level: 4,
    lesson: "Lesson 17",
    type: "short_text",
    status: "in_review",
    submittedAt: "2026-03-11T05:30:00.000Z",
  },
  {
    id: "rev-003",
    studentName: "Gloria Mensah",
    level: 3,
    lesson: "Lesson 14",
    type: "written_response",
    status: "needs_revision",
    submittedAt: "2026-03-10T19:00:00.000Z",
  },
  {
    id: "rev-004",
    studentName: "Ifeoma Okeke",
    level: 4,
    lesson: "Lesson 30",
    type: "short_text",
    status: "pending",
    submittedAt: "2026-03-10T16:00:00.000Z",
  },
  {
    id: "rev-005",
    studentName: "Emeka Yusuf",
    level: 5,
    lesson: "Lesson 131",
    type: "written_response",
    status: "pending",
    submittedAt: "2026-03-09T13:00:00.000Z",
  },
];

export const DEMO_QA_THREADS: DemoQaThread[] = [
  {
    id: "qa-001",
    studentName: "Ben Udo",
    level: 1,
    subject: "Clarification on prayer cadence in Lesson 5",
    status: "open",
    updatedAt: "2026-03-11T08:05:00.000Z",
  },
  {
    id: "qa-002",
    studentName: "Ada Nwosu",
    level: 2,
    subject: "Difference between reflection and confession tasks",
    status: "answered",
    updatedAt: "2026-03-10T14:05:00.000Z",
  },
  {
    id: "qa-003",
    studentName: "Emeka Yusuf",
    level: 5,
    subject: "How to approach Lesson 132 prerequisites",
    status: "open",
    updatedAt: "2026-03-10T12:20:00.000Z",
  },
];

export const DEMO_NOTIFICATIONS: DemoNotification[] = [
  {
    id: "notif-001",
    event: "Inactivity reminder",
    channel: "email",
    sentAt: "2026-03-11T08:40:00.000Z",
    recipient: "chiamaka@pleros.test",
  },
  {
    id: "notif-002",
    event: "Needs revision",
    channel: "web_push",
    sentAt: "2026-03-11T08:35:00.000Z",
    recipient: "gloria@pleros.test",
  },
  {
    id: "notif-003",
    event: "Q&A reply",
    channel: "email",
    sentAt: "2026-03-11T07:55:00.000Z",
    recipient: "ben@pleros.test",
  },
  {
    id: "notif-004",
    event: "Certificate sent",
    channel: "email",
    sentAt: "2026-03-10T17:20:00.000Z",
    recipient: "james@pleros.test",
  },
];

export function buildDashboardStats(students: DemoStudent[]): DashboardStats {
  const activeStudents = students.filter((student) => student.status === "active").length;
  const pendingReviews = students.reduce(
    (sum, student) => sum + student.reviewsPending,
    0,
  );
  const pendingQa = students.reduce((sum, student) => sum + student.qaPending, 0);
  const averageProgress =
    students.length === 0
      ? 0
      : Math.round(
          students.reduce((sum, student) => sum + student.progressPercent, 0) /
            students.length,
        );

  return {
    activeStudents,
    pendingReviews,
    pendingQa,
    averageProgress,
  };
}

export function filterStudents(
  students: DemoStudent[],
  options: StudentFilterOptions,
): DemoStudent[] {
  const normalizedQuery = options.query.trim().toLowerCase();

  return students.filter((student) => {
    const queryMatch =
      normalizedQuery.length === 0 ||
      student.name.toLowerCase().includes(normalizedQuery) ||
      student.email.toLowerCase().includes(normalizedQuery);

    const levelMatch = options.level === "all" || student.level === options.level;
    const statusMatch = options.status === "all" || student.status === options.status;

    return queryMatch && levelMatch && statusMatch;
  });
}

function compareString(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function sortStudents(
  students: DemoStudent[],
  options: StudentSortOptions,
): DemoStudent[] {
  const sorted = [...students].sort((a, b) => {
    if (options.sortBy === "name") {
      return compareString(a.name, b.name);
    }

    if (options.sortBy === "level") {
      return a.level - b.level;
    }

    if (options.sortBy === "progressPercent") {
      return a.progressPercent - b.progressPercent;
    }

    return compareString(a.lastActivity, b.lastActivity);
  });

  if (options.direction === "desc") {
    sorted.reverse();
  }

  return sorted;
}

export function formatShortDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(isoDate));
}

export function formatRelativeDay(isoDate: string): string {
  const oneDayInMs = 1000 * 60 * 60 * 24;
  const diffInMs = Date.now() - new Date(isoDate).getTime();
  const days = Math.max(0, Math.floor(diffInMs / oneDayInMs));

  if (days === 0) {
    return "Today";
  }

  if (days === 1) {
    return "1 day ago";
  }

  return `${days} days ago`;
}

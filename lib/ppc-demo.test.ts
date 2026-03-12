import { describe, expect, test } from "vitest";

import {
  buildDashboardStats,
  filterStudents,
  sortStudents,
  type DemoStudent,
} from "./ppc-demo";

const students: DemoStudent[] = [
  {
    id: "stu-001",
    name: "Ada Nwosu",
    email: "ada@example.com",
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
    email: "ben@example.com",
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
    email: "chiamaka@example.com",
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
];

describe("ppc demo utilities", () => {
  test("buildDashboardStats aggregates active, pending, and average progress", () => {
    const stats = buildDashboardStats(students);

    expect(stats.activeStudents).toBe(2);
    expect(stats.pendingReviews).toBe(6);
    expect(stats.pendingQa).toBe(5);
    expect(stats.averageProgress).toBe(53);
  });

  test("filterStudents supports search + level + status filters", () => {
    const result = filterStudents(students, {
      query: "ada",
      level: 2,
      status: "active",
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("stu-001");
  });

  test("sortStudents sorts descending progress and ascending name", () => {
    const byProgress = sortStudents(students, {
      sortBy: "progressPercent",
      direction: "desc",
    });

    expect(byProgress.map((student) => student.id)).toEqual([
      "stu-002",
      "stu-001",
      "stu-003",
    ]);

    const byName = sortStudents(students, {
      sortBy: "name",
      direction: "asc",
    });

    expect(byName.map((student) => student.id)).toEqual([
      "stu-001",
      "stu-002",
      "stu-003",
    ]);
  });
});

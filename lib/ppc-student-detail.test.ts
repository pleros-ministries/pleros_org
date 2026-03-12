import { describe, expect, test } from "vitest";

import {
  buildStudentDetail,
  getTotalLessonsForLevel,
  type StudentResponseStatus,
} from "./ppc-student-detail";

describe("ppc student detail", () => {
  test("resolves lesson totals by level", () => {
    expect(getTotalLessonsForLevel(1)).toBe(5);
    expect(getTotalLessonsForLevel(5)).toBe(300);
  });

  test("returns null when student id does not exist", () => {
    expect(buildStudentDetail("missing")).toBeNull();
  });

  test("builds level summary with completed and remaining lesson counts", () => {
    const detail = buildStudentDetail("stu-002");

    expect(detail).not.toBeNull();
    expect(detail?.levelSummary.totalLessons).toBe(5);
    expect(detail?.levelSummary.completedLessons).toBe(4);
    expect(detail?.levelSummary.remainingLessons).toBe(1);
    expect(detail?.levelSummary.canGraduate).toBe(true);
  });

  test("includes response queue and aggregates pending response count", () => {
    const detail = buildStudentDetail("stu-001");

    expect(detail).not.toBeNull();
    expect(detail?.responses.length).toBeGreaterThan(0);

    const pendingStatuses: StudentResponseStatus[] = ["pending", "needs_revision"];
    const pendingCount = detail?.responses.filter((response) =>
      pendingStatuses.includes(response.status),
    ).length;

    expect(pendingCount).toBe(detail?.levelSummary.pendingResponseClearance);
  });
});

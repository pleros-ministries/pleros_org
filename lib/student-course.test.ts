import { describe, expect, test } from "vitest";

import { buildCourseRail, buildDefaultStudentCourse } from "./student-course";

describe("student course defaults", () => {
  test("defaults every learner to Level 1 current course", () => {
    const course = buildDefaultStudentCourse();

    expect(course.level).toBe(1);
    expect(course.courseTitle).toBe("Level 1 Perfecting Course");
    expect(course.progressPercent).toBe(0);
    expect(course.currentLessonLabel).toBe("Lesson 1");
  });

  test("buildCourseRail marks Level 1 as active and later levels as locked", () => {
    const rail = buildCourseRail(1);

    expect(rail).toHaveLength(5);
    expect(rail[0]).toMatchObject({
      level: 1,
      state: "current",
      locked: false,
    });
    expect(rail[1]).toMatchObject({
      level: 2,
      state: "locked",
      locked: true,
    });
    expect(rail[4]).toMatchObject({
      level: 5,
      state: "locked",
      locked: true,
    });
  });
});

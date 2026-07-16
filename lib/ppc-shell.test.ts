import { describe, expect, test } from "vitest";

import {
  PPC_SHELL_NAV_ITEMS,
  buildStudentLevelNavItems,
  getLogicalPpcShellPath,
  getPpcShellContext,
  getVisiblePpcShellNavItems,
  isStudentLevelNavItemActive,
} from "./ppc-shell";

describe("ppc shell helpers", () => {
  test("nav definitions stay stable", () => {
    expect(
      PPC_SHELL_NAV_ITEMS.map(({ label, path, icon, roles }) => ({
        label,
        path,
        icon,
        roles,
      })),
    ).toEqual([
      {
        label: "Dashboard",
        path: "/",
        icon: "dashboard",
        roles: ["super_admin", "admin", "instructor"],
      },
      {
        label: "Platform",
        path: "/platform",
        icon: "admin",
        roles: ["super_admin", "admin"],
      },
      {
        label: "Content",
        path: "/content",
        icon: "content",
        roles: ["super_admin", "admin"],
      },
      {
        label: "School of Purpose",
        path: "/school-of-purpose",
        icon: "waitlist",
        roles: ["super_admin", "admin"],
      },
      {
        label: "Staff",
        path: "/staff",
        icon: "staff",
        roles: ["super_admin"],
      },
      {
        label: "Registrants",
        path: "/students",
        icon: "students",
        roles: ["super_admin", "admin", "instructor"],
      },
      {
        label: "Review queue",
        path: "/review",
        icon: "review",
        roles: ["super_admin", "admin", "instructor"],
      },
      {
        label: "Q&A inbox",
        path: "/qa",
        icon: "qa",
        roles: ["super_admin", "admin", "instructor"],
      },
      {
        label: "Contact",
        path: "/contact",
        icon: "contact",
        roles: ["super_admin", "admin", "instructor"],
      },
      {
        label: "Notifications",
        path: "/notifications",
        icon: "notifications",
        roles: ["super_admin", "admin", "instructor"],
      },
      {
        label: "Dashboard",
        path: "/student",
        icon: "learning",
        roles: ["student"],
      },
    ]);
  });

  test("filters nav items by role", () => {
    expect(
      getVisiblePpcShellNavItems("super_admin").map((item) => item.path),
    ).toEqual([
      "/",
      "/platform",
      "/content",
      "/school-of-purpose",
      "/staff",
      "/students",
      "/review",
      "/qa",
      "/contact",
      "/notifications",
    ]);
    expect(getVisiblePpcShellNavItems("admin").map((item) => item.path)).toEqual([
      "/",
      "/platform",
      "/content",
      "/school-of-purpose",
      "/students",
      "/review",
      "/qa",
      "/contact",
      "/notifications",
    ]);
    expect(
      getVisiblePpcShellNavItems("instructor").map((item) => item.path),
    ).toEqual(["/", "/students", "/review", "/qa", "/contact", "/notifications"]);
    expect(getVisiblePpcShellNavItems("student").map((item) => item.path)).toEqual([
      "/student",
    ]);
  });

  test("normalizes logical paths with or without /ppc prefix", () => {
    expect(getLogicalPpcShellPath("/ppc")).toBe("/");
    expect(getLogicalPpcShellPath("/ppc/students")).toBe("/students");
    expect(getLogicalPpcShellPath("/admin/content")).toBe("/content");
    expect(getLogicalPpcShellPath("/student")).toBe("/student");
  });

  test("resolves top bar context for staff routes", () => {
    expect(getPpcShellContext("/")).toEqual({
      label: "Dashboard",
      description: "Course operations overview",
    });
    expect(getPpcShellContext("/students")).toEqual({
      label: "Registrants",
      description: "All signups and progress status",
    });
    expect(getPpcShellContext("/students/student-1")).toEqual({
      label: "Registrant detail",
      description: "Profile, progress, and support history",
    });
    expect(getPpcShellContext("/review")).toEqual({
      label: "Review queue",
      description: "Written submissions awaiting attention",
    });
    expect(getPpcShellContext("/qa")).toEqual({
      label: "Q&A inbox",
      description: "Student threads and staff replies",
    });
    expect(getPpcShellContext("/contact")).toEqual({
      label: "Contact submissions",
      description: "Public leads, messages, and follow-up status",
    });
    expect(getPpcShellContext("/notifications")).toEqual({
      label: "Notifications",
      description: "Reminder policy and delivery channels",
    });
    expect(getPpcShellContext("/platform")).toEqual({
      label: "Platform",
      description: "Overrides, assignments, and platform oversight",
    });
    expect(getPpcShellContext("/content")).toEqual({
      label: "Content CMS",
      description: "Lessons, notes, audio, and quizzes",
    });
    expect(getPpcShellContext("/school-of-purpose")).toEqual({
      label: "School of Purpose waitlist",
      description: "Name, WhatsApp number, and signup date",
    });
    expect(getPpcShellContext("/staff")).toEqual({
      label: "Staff access",
      description: "Invites, roles, and account onboarding",
    });
  });

  test("resolves top bar context for student lesson routes", () => {
    expect(getPpcShellContext("/student")).toEqual({
      label: "Dashboard",
      description: "Levels, progress, and next steps",
    });
    expect(getPpcShellContext("/student/level/2")).toEqual({
      label: "Level overview",
      description: "Lesson timeline and completion state",
    });
    expect(
      getPpcShellContext("/student/level/2/lesson/12"),
    ).toEqual({
      label: "Lesson",
      description: "Audio, notes, and completion tasks",
    });
    expect(
      getPpcShellContext("/student/level/2/lesson/12/quiz"),
    ).toEqual({
      label: "Quiz",
      description: "Assessment and attempt history",
    });
    expect(
      getPpcShellContext("/student/level/2/lesson/12/response"),
    ).toEqual({
      label: "Written response",
      description: "Draft, submit, and review status",
    });
    expect(getPpcShellContext("/student/level/2/lesson/12/qa")).toEqual({
      label: "Lesson Q&A",
      description: "Questions and staff replies",
    });
  });

  test("falls back safely for unknown routes", () => {
    expect(getPpcShellContext("/something-unexpected")).toEqual({
      label: "PPC platform",
      description: "Course administration and learning",
    });
  });

  test("builds student level nav with locked state retained", () => {
    expect(
      buildStudentLevelNavItems(
        [
          { id: 1, title: "Level 1 - Foundations", sortOrder: 1 },
          { id: 2, title: "Level 2 - Growth", sortOrder: 2 },
          { id: 3, title: "Level 3 - Ministry", sortOrder: 3 },
        ],
        [1],
      ),
    ).toEqual([
      {
        id: 1,
        label: "Level 1",
        description: "Foundations",
        href: "/student/level/1",
        state: "completed",
      },
      {
        id: 2,
        label: "Level 2",
        description: "Growth",
        href: "/student/level/2",
        state: "current",
      },
      {
        id: 3,
        label: "Level 3",
        description: "Ministry",
        href: null,
        state: "locked",
      },
    ]);
  });

  test("treats level one as current when nothing is graduated", () => {
    expect(
      buildStudentLevelNavItems(
        [
          { id: 1, title: "Level 1 - Foundations", sortOrder: 1 },
          { id: 2, title: "Level 2 - Growth", sortOrder: 2 },
        ],
        [],
      ).map(({ id, state }) => ({ id, state })),
    ).toEqual([
      { id: 1, state: "current" },
      { id: 2, state: "locked" },
    ]);
  });

  test("keeps final level available once prior levels are graduated", () => {
    expect(
      buildStudentLevelNavItems(
        [
          { id: 1, title: "Level 1 - Foundations", sortOrder: 1 },
          { id: 2, title: "Level 2 - Growth", sortOrder: 2 },
        ],
        [1, 2],
      ).map(({ id, href, state }) => ({ id, href, state })),
    ).toEqual([
      { id: 1, href: "/student/level/1", state: "completed" },
      { id: 2, href: "/student/level/2", state: "completed" },
    ]);
  });

  test("marks nested lesson routes as active for their level item", () => {
    expect(isStudentLevelNavItemActive(2, "/student/level/2")).toBe(true);
    expect(
      isStudentLevelNavItemActive(2, "/student/level/2/lesson/12"),
    ).toBe(true);
    expect(
      isStudentLevelNavItemActive(2, "/student/level/2/lesson/12/quiz"),
    ).toBe(true);
    expect(isStudentLevelNavItemActive(1, "/student/level/2/lesson/12")).toBe(
      false,
    );
  });
});

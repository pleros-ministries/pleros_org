import { describe, expect, test } from "vitest";

import {
  canAccessPpcPath,
  getRoleHomePath,
  isPublicPpcPath,
  toExternalPpcPath,
} from "./ppc-access";

describe("ppc access rules", () => {
  test("public paths are recognized", () => {
    expect(isPublicPpcPath("/sign-in")).toBe(true);
    expect(isPublicPpcPath("/forbidden")).toBe(true);
    expect(isPublicPpcPath("/")).toBe(false);
  });

  test("role home paths are stable", () => {
    expect(getRoleHomePath("admin")).toBe("/");
    expect(getRoleHomePath("instructor")).toBe("/");
    expect(getRoleHomePath("student")).toBe("/student");
  });

  test("admin can access all app paths", () => {
    expect(canAccessPpcPath("admin", "/")).toBe(true);
    expect(canAccessPpcPath("admin", "/admin")).toBe(true);
    expect(canAccessPpcPath("admin", "/students")).toBe(true);
  });

  test("instructor is denied admin and student-only views", () => {
    expect(canAccessPpcPath("instructor", "/")).toBe(true);
    expect(canAccessPpcPath("instructor", "/review")).toBe(true);
    expect(canAccessPpcPath("instructor", "/admin")).toBe(false);
    expect(canAccessPpcPath("instructor", "/student")).toBe(false);
  });

  test("student can only access student route", () => {
    expect(canAccessPpcPath("student", "/student")).toBe(true);
    expect(canAccessPpcPath("student", "/")).toBe(false);
    expect(canAccessPpcPath("student", "/review")).toBe(false);
  });

  test("external ppc paths resolve correctly for local and ppc host", () => {
    expect(toExternalPpcPath("localhost:3000", "/")).toBe("/ppc");
    expect(toExternalPpcPath("localhost:3000", "/students")).toBe("/ppc/students");
    expect(toExternalPpcPath("ppc.pleros.org", "/")).toBe("/");
    expect(toExternalPpcPath("ppc.pleros.org", "/students")).toBe("/students");
  });
});

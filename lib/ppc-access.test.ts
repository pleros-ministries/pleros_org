import { describe, expect, test } from "vitest";

import {
  canAccessPpcPath,
  getRoleHomePath,
  isPublicPpcPath,
  toExternalPpcPath,
} from "./ppc-access";

describe("ppc access rules", () => {
  test("public paths are recognized", () => {
    expect(isPublicPpcPath("/")).toBe(true);
    expect(isPublicPpcPath("/login")).toBe(true);
    expect(isPublicPpcPath("/signup")).toBe(true);
    expect(isPublicPpcPath("/sign-in")).toBe(true);
    expect(isPublicPpcPath("/sign-up")).toBe(true);
    expect(isPublicPpcPath("/forbidden")).toBe(true);
    expect(isPublicPpcPath("/student")).toBe(false);
  });

  test("role home paths are stable", () => {
    expect(getRoleHomePath("super_admin")).toBe("/admin");
    expect(getRoleHomePath("admin")).toBe("/admin");
    expect(getRoleHomePath("instructor")).toBe("/admin");
    expect(getRoleHomePath("student")).toBe("/ppc");
  });

  test("staff is limited to public PPC entry routes", () => {
    expect(canAccessPpcPath("super_admin", "/")).toBe(true);
    expect(canAccessPpcPath("super_admin", "/student")).toBe(false);
    expect(canAccessPpcPath("admin", "/")).toBe(true);
    expect(canAccessPpcPath("admin", "/student")).toBe(false);
    expect(canAccessPpcPath("instructor", "/signup")).toBe(true);
    expect(canAccessPpcPath("instructor", "/review")).toBe(false);
  });

  test("student can only access student route", () => {
    expect(canAccessPpcPath("student", "/student")).toBe(true);
    expect(canAccessPpcPath("student", "/")).toBe(true);
    expect(canAccessPpcPath("student", "/review")).toBe(false);
  });

  test("external ppc paths resolve correctly for local and ppc host", () => {
    expect(toExternalPpcPath("localhost:3000", "/")).toBe("/ppc");
    expect(toExternalPpcPath("localhost:3000", "/students")).toBe("/ppc/students");
    expect(toExternalPpcPath("ppc.pleros.org", "/")).toBe("/");
    expect(toExternalPpcPath("ppc.pleros.org", "/students")).toBe("/students");
  });
});

import { describe, expect, test } from "vitest";

import { canAccessArea, getRoleDefaultPath, type AccessArea } from "./app-access";

describe("app access", () => {
  test("staff area allows admin and instructor", () => {
    expect(canAccessArea("admin", "staff")).toBe(true);
    expect(canAccessArea("instructor", "staff")).toBe(true);
    expect(canAccessArea("student", "staff")).toBe(false);
  });

  test("admin area allows only admin", () => {
    expect(canAccessArea("admin", "admin")).toBe(true);
    expect(canAccessArea("instructor", "admin")).toBe(false);
    expect(canAccessArea("student", "admin")).toBe(false);
  });

  test("student area allows only student", () => {
    expect(canAccessArea("student", "student")).toBe(true);
    expect(canAccessArea("admin", "student")).toBe(false);
  });

  test("default role home path is stable", () => {
    expect(getRoleDefaultPath("admin")).toBe("/admin");
    expect(getRoleDefaultPath("instructor")).toBe("/admin");
    expect(getRoleDefaultPath("student")).toBe("/ppc");
  });

  test("access area union stays stable", () => {
    const areas: AccessArea[] = ["staff", "admin", "student"];
    expect(areas).toHaveLength(3);
  });
});

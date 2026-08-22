import { describe, expect, test } from "vitest";

import { resolvePpcHref } from "./ppc-navigation";

describe("resolvePpcHref", () => {
  test("uses root paths outside portal namespaces", () => {
    expect(resolvePpcHref("/", "/admin")).toBe("/admin");
    expect(resolvePpcHref("/review", "/students")).toBe("/students");
  });

  test("keeps /ppc prefix when working directly in namespace", () => {
    expect(resolvePpcHref("/ppc", "/admin")).toBe("/ppc/admin");
    expect(resolvePpcHref("/ppc/students", "/review")).toBe("/ppc/review");
    expect(resolvePpcHref("/ppc", "/")).toBe("/ppc");
  });

  test("keeps /admin prefix when working directly in admin namespace", () => {
    expect(resolvePpcHref("/admin", "/students")).toBe("/admin/students");
    expect(resolvePpcHref("/admin/review", "/content")).toBe("/admin/content");
    expect(resolvePpcHref("/admin/qa", "/")).toBe("/admin");
  });
});

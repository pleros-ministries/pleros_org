import { describe, expect, test } from "vitest";

import { resolvePpcHref } from "./ppc-navigation";

describe("resolvePpcHref", () => {
  test("uses root paths on ppc host rewrite URLs", () => {
    expect(resolvePpcHref("/", "/admin")).toBe("/admin");
    expect(resolvePpcHref("/review", "/students")).toBe("/students");
  });

  test("keeps /ppc prefix when working directly in namespace", () => {
    expect(resolvePpcHref("/ppc", "/admin")).toBe("/ppc/admin");
    expect(resolvePpcHref("/ppc/students", "/review")).toBe("/ppc/review");
    expect(resolvePpcHref("/ppc", "/")).toBe("/ppc");
  });
});

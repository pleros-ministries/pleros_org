import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

function source(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("PPC student dashboard preview", () => {
  test("renders the current student dashboard view inside the PPC shell", () => {
    const previewSource = source(
      "app",
      "preview",
      "ppc-student-dashboard",
      "page.tsx",
    );
    const liveSource = source(
      "app",
      "ppc",
      "(app)",
      "(student)",
      "student",
      "page.tsx",
    );

    expect(previewSource).toContain("PpcShell");
    expect(previewSource).toContain("StudentDashboardView");
    expect(previewSource).toContain('pathnameOverride="/ppc/student"');
    expect(liveSource).toContain("StudentDashboardView");
  });
});

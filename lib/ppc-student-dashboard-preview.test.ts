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

  test("keeps redundant student dashboard helper copy out of the view", () => {
    const viewSource = source(
      "components",
      "ppc",
      "student-dashboard-view.tsx",
    );

    expect(viewSource).not.toContain("Use the sidebar");
    expect(viewSource).not.toContain("Locked in this level");
    expect(viewSource).not.toContain("primary navigator");
  });

  test("does not render a literal PP brand tile in the shell sidebar", () => {
    const shellSource = source("components", "ppc", "ppc-shell.tsx");

    expect(shellSource).not.toContain(">PP<");
  });

  test("applies PPC theme tokens to the mobile sidebar portal", () => {
    const shellSource = source("components", "ppc", "ppc-shell.tsx");

    expect(shellSource).toContain('className="ppc-theme w-[88vw] max-w-[320px] p-0"');
  });
});

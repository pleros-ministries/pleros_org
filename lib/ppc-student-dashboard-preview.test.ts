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
    expect(previewSource).toContain("studentName={previewSession.user.name}");
    expect(liveSource).toContain("StudentDashboardView");
    expect(liveSource).toContain("studentName={session.user.name}");
  });

  test("uses a personalized first-name dashboard heading", () => {
    const viewSource = source(
      "components",
      "ppc",
      "student-dashboard-view.tsx",
    );

    expect(viewSource).toContain("Welcome, ${firstName}");
    expect(viewSource).not.toContain('<PageHeader title="My learning" />');
  });

  test("keeps redundant student dashboard helper copy out of the view", () => {
    const viewSource = source(
      "components",
      "ppc",
      "student-dashboard-view.tsx",
    );

    expect(viewSource).not.toContain("Use the sidebar");
    expect(viewSource).not.toContain("Locked in this level");
    expect(viewSource).not.toContain("locked</span>");
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

  test("keeps sidebar controls visually tight", () => {
    const shellSource = source("components", "ppc", "ppc-shell.tsx");

    expect(shellSource.match(/rounded-\[4px\]/g)?.length).toBeGreaterThanOrEqual(5);
  });

  test("uses the softer shell accent for sidebar selection states", () => {
    const shellSource = source("components", "ppc", "ppc-shell.tsx");
    const globalsSource = source("app", "globals.css");

    expect(globalsSource).toContain("--ppc-shell-accent: #1f4ed8");
    expect(shellSource.match(/var\(--ppc-shell-accent\)/g)?.length).toBeGreaterThanOrEqual(6);
  });

  test("uses the course name in the shell top bar", () => {
    const shellSource = source("components", "ppc", "ppc-shell.tsx");

    expect(shellSource).toContain("Pleros Perfecting Course");
  });

  test("keeps the mobile top bar flush with the viewport top", () => {
    const shellSource = source("components", "ppc", "ppc-shell.tsx");

    expect(shellSource).toContain("gap-3 px-3 pb-3 lg:grid");
    expect(shellSource).not.toContain("gap-3 p-3 lg:grid");
  });

  test("uses setup-oriented notification copy", () => {
    const panelSource = source("components", "ppc", "push-subscription-panel.tsx");
    const copySource = source("lib", "ppc-notifications.ts");

    expect(panelSource).toContain("Setup notifications");
    expect(panelSource).toContain("Notifications are not ready");
    expect(copySource).toContain("after the PPC team finishes notification setup");
    expect(copySource).toContain("Waiting for admin setup");
  });
});

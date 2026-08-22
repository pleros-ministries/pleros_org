import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("admin contact page", () => {
  test("uses a dedicated admin route with staff gating and contact queries", () => {
    const routePath = join(
      process.cwd(),
      "app",
      "admin",
      "(app)",
      "contact",
      "page.tsx",
    );
    const actionPath = join(
      process.cwd(),
      "app",
      "_actions",
      "contact-actions.ts",
    );
    const queryPath = join(
      process.cwd(),
      "lib",
      "db",
      "queries",
      "contact-submissions.ts",
    );

    expect(existsSync(routePath)).toBe(true);
    expect(existsSync(actionPath)).toBe(true);
    expect(existsSync(queryPath)).toBe(true);

    const routeSource = readFileSync(routePath, "utf8");
    const actionSource = readFileSync(actionPath, "utf8");
    const querySource = readFileSync(queryPath, "utf8");

    expect(routeSource).toContain("getAppSession");
    expect(routeSource).toContain('redirect("/admin")');
    expect(routeSource).toContain('redirect("/ppc")');
    expect(routeSource).toContain("getContactSubmissionSummaries");
    expect(routeSource).toContain("getContactSubmissionById");
    expect(routeSource).toContain("Mark as resolved");

    expect(actionSource).toContain("updateContactSubmissionStatusAction");
    expect(actionSource).toContain('revalidatePath("/admin", "layout")');
    expect(actionSource).toContain('revalidatePath("/admin/contact")');

    expect(querySource).toContain("updateContactSubmissionStatus");
    expect(querySource).toContain("recordContactSubmissionNotificationResult");
  });
});

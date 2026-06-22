import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

function source(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("welcome dashboard access", () => {
  test("dashboard layout accepts either Better Auth session or welcome cookie", () => {
    const layoutSource = source("app", "(site)", "dashboard", "layout.tsx");

    expect(layoutSource).toContain("getAppSession");
    expect(layoutSource).toContain("if (!appSession && !welcomeSession)");
    expect(layoutSource).toContain('redirect("/welcome")');
    expect(layoutSource).not.toContain('redirect("/")');
  });

  test("dashboard pages use welcome cookie only as a session bootstrap fallback", () => {
    const dashboardSource = source("app", "(site)", "dashboard", "page.tsx");
    const packSource = source(
      "app",
      "(site)",
      "dashboard",
      "welcomepack",
      "page.tsx",
    );

    expect(dashboardSource).toContain("if (!appSession && welcomeSession)");
    expect(dashboardSource).toContain('redirect("/welcome")');
    expect(packSource).toContain("appSession?.user.email ?? welcomeSession?.email");
    expect(packSource).toContain("if (!appSession && welcomeSession)");
    expect(packSource).toContain('redirect("/welcome")');
  });

  test("proxy refreshes the welcome cookie on dashboard visits", () => {
    const proxySource = source("proxy.ts");

    expect(proxySource).toContain("refreshWelcomeAccessCookie");
    expect(proxySource).toContain('pathname.startsWith("/dashboard")');
    expect(proxySource).toContain("WELCOME_ACCESS_MAX_AGE");
  });
});

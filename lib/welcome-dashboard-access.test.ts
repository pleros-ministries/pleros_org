import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

function source(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("welcome dashboard access", () => {
  test("dashboard layout does not gate the dashboard behind welcome access", () => {
    const layoutSource = source("app", "(site)", "dashboard", "layout.tsx");

    expect(layoutSource).toContain("AppShell");
    expect(layoutSource).not.toContain("getAppSession");
    expect(layoutSource).not.toContain("readWelcomeAccessToken");
    expect(layoutSource).not.toContain('redirect("/welcome")');
    expect(layoutSource).not.toContain('redirect("/")');
  });

  test("dashboard page renders publicly and only bootstraps a welcome session when present", () => {
    const dashboardSource = source("app", "(site)", "dashboard", "page.tsx");

    expect(dashboardSource).toContain("if (!appSession && welcomeSession)");
    expect(dashboardSource).toContain("return <WelcomeDashboardView />");
    expect(dashboardSource).not.toContain('redirect("/welcome")');
  });

  test("welcome pack page still requires a session or welcome cookie", () => {
    const packSource = source(
      "app",
      "(site)",
      "dashboard",
      "welcomepack",
      "page.tsx",
    );

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

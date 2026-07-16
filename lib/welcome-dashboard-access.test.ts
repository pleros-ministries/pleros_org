import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

function source(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("welcome dashboard access", () => {
  test("dashboard layout requires either Better Auth session or welcome cookie", () => {
    const layoutSource = source("app", "(site)", "dashboard", "layout.tsx");

    expect(layoutSource).toContain("getAppSession");
    expect(layoutSource).toContain("if (!appSession && !welcomeSession)");
    expect(layoutSource).toContain('redirect("/welcome")');
    expect(layoutSource).not.toContain('redirect("/")');
  });

  test("dashboard page uses welcome cookie only as a session bootstrap fallback", () => {
    const dashboardSource = source("app", "(site)", "dashboard", "page.tsx");

    expect(dashboardSource).toContain("if (!appSession && welcomeSession)");
    expect(dashboardSource).toContain(
      "return <WelcomeDashboardView name={appSession.user.name} />",
    );
    expect(dashboardSource).toContain('redirect("/welcome")');
  });

  test("dashboard and thank-you page greet visitors by their first name", () => {
    const dashboardViewSource = source(
      "components",
      "dashboard",
      "welcome-dashboard-view.tsx",
    );
    const thankYouSource = source(
      "components",
      "home",
      "thank-you-page.tsx",
    );
    const thankYouRouteSource = source("app", "(site)", "thankyou", "page.tsx");

    expect(dashboardViewSource).toContain("name?: string");
    expect(dashboardViewSource).toContain("`Welcome, ${name}`");

    expect(thankYouSource).toContain("name?: string");
    expect(thankYouSource).toContain(
      "`Thank you for receiving your gift, ${name}.`",
    );

    expect(thankYouRouteSource).toContain("getAppSession");
    expect(thankYouRouteSource).toContain("readWelcomeAccessToken");
    expect(thankYouRouteSource).toContain(
      "appSession?.user.name ?? welcomeSession?.name",
    );
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

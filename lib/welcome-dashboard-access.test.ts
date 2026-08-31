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
    expect(layoutSource).toContain("welcomePathAllowed");
    expect(layoutSource).toContain("const appSession = await getAppSession()");
    expect(layoutSource).toContain('redirect(`/login?returnTo=');
    expect(layoutSource).not.toContain('redirect("/")');
  });

  test("dashboard page uses welcome cookie directly for display-name source", () => {
    const dashboardSource = source("app", "(site)", "dashboard", "page.tsx");

    expect(dashboardSource).toContain("if (welcomeSession)");
    expect(dashboardSource).toContain(
      "getWelcomePackLeadByEmail(welcomeSession.email)",
    );
    expect(dashboardSource).toContain(
      "resolveWelcomeDisplayName",
    );
    expect(dashboardSource).toContain(
      "return <WelcomeDashboardView name={displayName ?? undefined} />",
    );
    expect(dashboardSource).not.toContain("/api/welcome-access/session");
    expect(dashboardSource).toContain('redirect("/welcome")');
  });

  test("dashboard resolves SOGP card access from the authenticated enrolment", () => {
    const dashboardSource = source("app", "(site)", "dashboard", "page.tsx");

    expect(dashboardSource).toContain("getSogpDashboardAccess");
    expect(dashboardSource).toContain("resolveWelcomeDashboardSections");
    expect(dashboardSource).toContain("sections={sections}");
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
      "`Thank you for receiving our gift, ${name}`",
    );

    expect(thankYouRouteSource).toContain("getAppSession");
    expect(thankYouRouteSource).toContain("readWelcomeAccessToken");
    expect(thankYouRouteSource).toContain("getWelcomePackLeadByEmail(email)");
    expect(thankYouRouteSource).toContain(
      "resolveWelcomeDisplayName",
    );
  });

  test("welcome pack routes share session-or-cookie access protection", () => {
    const accessSource = source("lib", "welcome-pack-dashboard-access.ts");
    const joinSource = source(
      "app",
      "(focused)",
      "dashboard",
      "welcomepack",
      "join",
      "page.tsx",
    );
    const giftsSource = source(
      "app",
      "(site)",
      "dashboard",
      "welcomepack",
      "gifts",
      "page.tsx",
    );

    expect(accessSource).toContain("readWelcomeAccessToken");
    expect(accessSource).toContain("getAppSession");
    expect(accessSource).toContain('redirect("/welcome")');
    expect(joinSource).toContain("requireWelcomePackAccess");
    expect(giftsSource).toContain("requireWelcomePackAccess");
  });

  test("dashboard routes provide immediate loading feedback during card navigation", () => {
    const loadingSource = source("app", "(site)", "dashboard", "loading.tsx");

    expect(loadingSource).toContain("Loading dashboard page");
    expect(loadingSource).toContain("grid grid-cols-2 gap-4");
    expect(loadingSource).toContain("animate-pulse");
  });

  test("dashboard mutations require a verified app session", () => {
    const actionSessionSource = source("lib", "dashboard-action-session.ts");
    const podcastActionsSource = source("app", "_actions", "podcast-progress-actions.ts");
    const prayerActionsSource = source("app", "_actions", "prayer-watch-actions.ts");
    const schoolActionsSource = source("app", "_actions", "school-of-purpose-actions.ts");

    expect(actionSessionSource).toContain("getAppSession");
    expect(actionSessionSource).not.toContain("provisionWelcomeSession");
    expect(actionSessionSource).not.toContain("readWelcomeAccessToken");
    expect(actionSessionSource).not.toContain("resolveDbUserId");
    expect(podcastActionsSource).toContain("getDashboardActionSession");
    expect(prayerActionsSource).toContain("getDashboardActionSession");
    expect(schoolActionsSource).toContain("getDashboardActionSession");
  });

  test("proxy refreshes the welcome cookie on dashboard visits", () => {
    const proxySource = source("proxy.ts");

    expect(proxySource).toContain("refreshWelcomeAccessCookie");
    expect(proxySource).toContain('pathname.startsWith("/dashboard")');
    expect(proxySource).toContain("WELCOME_ACCESS_MAX_AGE");
  });
});

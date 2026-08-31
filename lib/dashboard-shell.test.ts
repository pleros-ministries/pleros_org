import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("dashboard shell", () => {
  test("reuses the home page navigation component in the shared app shell", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "layout", "app-shell.tsx"),
      "utf8",
    );

    expect(source).toContain('from "../home/homepage-nav"');
    expect(source).toContain("<HomepageNav showSignOut={authenticated} />");
    expect(source).not.toContain("<SiteNav />");
  });

  test("offers sign out only for a full authenticated dashboard session", () => {
    const shellSource = readFileSync(
      join(process.cwd(), "components", "layout", "app-shell.tsx"),
      "utf8",
    );
    const navSource = readFileSync(
      join(process.cwd(), "components", "home", "homepage-nav.tsx"),
      "utf8",
    );
    const buttonSource = readFileSync(
      join(process.cwd(), "components", "auth", "dashboard-sign-out-button.tsx"),
      "utf8",
    );

    expect(shellSource).toContain("authenticated = false");
    expect(navSource).toContain("showSignOut = false");
    expect(navSource).not.toContain("<DashboardSignOutButton compact />");
    expect(navSource).toContain('<DashboardSignOutButton />');
    expect(navSource).toContain('href="/login"');
    expect(navSource).toContain('Log in');
    expect(buttonSource).toContain("signOutDashboardAction");
    expect(buttonSource).toContain("useFormStatus");
    expect(buttonSource).toContain('type="submit"');
  });

  test("reuses the home page footer component in the shared app shell", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "layout", "app-shell.tsx"),
      "utf8",
    );

    expect(source).toContain('from "../home/homepage-footer"');
    expect(source).toContain("<HomepageFooter />");
    expect(source).not.toContain("Pleros Ministries &amp; Missions");
  });
});

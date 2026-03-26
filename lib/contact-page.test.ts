import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("contact page", () => {
  test("uses a dedicated route with the public contact hero and form", () => {
    const routePath = join(process.cwd(), "app", "(site)", "contact", "page.tsx");
    const viewPath = join(
      process.cwd(),
      "components",
      "home",
      "contact-page-view.tsx",
    );
    const contentPath = join(process.cwd(), "lib", "contact-page-content.ts");

    expect(existsSync(routePath)).toBe(true);
    expect(existsSync(viewPath)).toBe(true);
    expect(existsSync(contentPath)).toBe(true);

    const routeSource = readFileSync(routePath, "utf8");
    const viewSource = readFileSync(viewPath, "utf8");
    const contentSource = readFileSync(contentPath, "utf8");

    expect(routeSource).toContain("ContactPageView");
    expect(contentSource).toContain("Contact Us");
    expect(contentSource).toContain("Reach out to us.");
    expect(contentSource).toContain("Full Name");
    expect(contentSource).toContain("Email Address");
    expect(contentSource).toContain("Phone Number");
    expect(contentSource).toContain("Location");
    expect(contentSource).toContain("Write your Message");
    expect(contentSource).toContain("SEND MESSAGE");
    expect(viewSource).toContain("HomepageCommunitySection");
    expect(viewSource).toContain("HomepageFooter");
  });
});

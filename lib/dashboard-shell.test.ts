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
    expect(source).toContain("<HomepageNav />");
    expect(source).not.toContain("<SiteNav />");
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

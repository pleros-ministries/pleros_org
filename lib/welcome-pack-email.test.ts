import { describe, expect, test } from "vitest";

import {
  welcomePackAccessHtml,
  welcomePackExtrasUnlockedHtml,
} from "./email/templates";

describe("welcome pack emails", () => {
  test("access email links straight to the dashboard, not a direct download", () => {
    const html = welcomePackAccessHtml({
      name: "Grace",
      dashboardUrl: "https://pleros.org/dashboard/welcomepack",
    });

    expect(html).toContain("Your welcome pack is ready");
    expect(html).toContain("Access your welcome pack");
    expect(html).toContain("https://pleros.org/dashboard/welcomepack");
    expect(html).not.toContain("download");
  });

  test("extras unlock email points users back to the welcome pack dashboard", () => {
    const html = welcomePackExtrasUnlockedHtml({
      name: "Grace",
      dashboardUrl: "https://pleros.org/dashboard/welcomepack",
    });

    expect(html).toContain("Your extra gifts are unlocked");
    expect(html).toContain("https://pleros.org/dashboard/welcomepack");
  });
});

import { describe, expect, test } from "vitest";

import {
  welcomePackAccessHtml,
  welcomePackExtrasUnlockedHtml,
} from "./email/templates";

describe("welcome pack emails", () => {
  test("access email mentions the main gift and the two extra gifts path", () => {
    const html = welcomePackAccessHtml({
      name: "Grace",
      dashboardUrl: "https://pleros.org/dashboard/welcomepack",
    });

    expect(html).toContain("Your main gift is ready");
    expect(html).toContain("two extra gifts");
    expect(html).toContain("https://pleros.org/dashboard/welcomepack");
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

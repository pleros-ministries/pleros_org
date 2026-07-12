import { describe, expect, test } from "vitest";

import {
  welcomePackAccessHtml,
  welcomePackExtrasUnlockedHtml,
} from "./email/templates";

describe("welcome pack emails", () => {
  test("access email uses a text logo and points only to the direct download", () => {
    const html = welcomePackAccessHtml({
      name: "Grace",
      downloadUrl: "https://pleros.org/api/welcome-pack/download?token=abc",
    });

    expect(html).toContain("Pleros");
    expect(html).toContain("Your welcome pack download is ready");
    expect(html).toContain("Download your welcome pack");
    expect(html).toContain("https://pleros.org/api/welcome-pack/download?token=abc");
    expect(html).not.toContain("white-logotype");
    expect(html).not.toContain("/dashboard/welcomepack");
  });

  test("extras unlock email points users back to the welcome pack dashboard", () => {
    const html = welcomePackExtrasUnlockedHtml({
      name: "Grace",
      dashboardUrl: "https://pleros.org/dashboard/welcomepack",
    });

    expect(html).toContain("Your extra gifts are unlocked");
    expect(html).toContain("https://pleros.org/dashboard/welcomepack");
    expect(html).not.toContain("white-logotype");
  });
});

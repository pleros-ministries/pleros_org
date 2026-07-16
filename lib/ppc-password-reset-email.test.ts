import { describe, expect, test } from "vitest";

import { passwordResetHtml } from "./email/templates";

describe("PPC password reset email", () => {
  test("renders the reset link and escapes user-controlled values", () => {
    const html = passwordResetHtml({
      name: "<Ada>",
      resetUrl: "https://ppc.pleros.org/ppc/reset-password?token=abc&next=<script>",
    });

    expect(html).toContain("Reset your password");
    expect(html).toContain("Reset password");
    expect(html).toContain("&lt;Ada&gt;");
    expect(html).toContain(
      "https://ppc.pleros.org/ppc/reset-password?token=abc&amp;next=&lt;script&gt;",
    );
    expect(html).not.toContain("<script>");
  });

  test("uses staff copy for admin password reset links", () => {
    const html = passwordResetHtml({
      name: "Daniel",
      resetUrl: "https://pleros.org/admin/reset-password?token=abc",
    });

    expect(html).toContain("Pleros admin");
    expect(html).toContain("staff account");
    expect(html).not.toContain("Pleros Perfecting Course");
    expect(html).not.toContain("PPC account");
  });
});

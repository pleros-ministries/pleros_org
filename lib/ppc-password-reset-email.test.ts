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
});

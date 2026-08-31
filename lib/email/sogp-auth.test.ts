import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  emailVerificationHtml,
  passwordResetHtml,
  sogpAuthCodeHtml,
  staffInviteHtml,
  superAdminSetupHtml,
} from "./templates";

const sendEmail = vi.fn();
const isEmailEnabled = vi.fn();

vi.mock("./resend", () => ({
  resend: { emails: { send: sendEmail } },
  isEmailEnabled,
}));

describe("SOGP authentication email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isEmailEnabled.mockReturnValue(true);
    vi.stubEnv("EMAIL_FROM_PLEROS", "Pleros Media <noreply@pleros.org>");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("renders an escaped six-digit code with expiry and safety copy", () => {
    const html = sogpAuthCodeHtml({
      otp: "123456",
      type: "email-verification",
    });

    expect(html).toContain("123456");
    expect(html).toContain("10 minutes");
    expect(html).toContain("If you did not request this");
    expect(html).not.toContain("dashboard/welcomepack");
  });

  test("uses one branded, email-safe design across authentication emails", () => {
    const templates = [
      sogpAuthCodeHtml({ otp: "123456", type: "sign-in" }),
      passwordResetHtml({
        name: "Ada",
        resetUrl: "https://pleros.org/reset-password?token=abc",
      }),
      emailVerificationHtml({
        name: "Ada",
        verificationUrl: "https://pleros.org/verify?token=abc",
      }),
      staffInviteHtml({
        role: "admin",
        inviteUrl: "https://pleros.org/admin/invite/abc",
      }),
      superAdminSetupHtml({
        name: "Ada",
        setupUrl: "https://pleros.org/admin/setup/claim/abc",
      }),
    ];

    for (const html of templates) {
      expect(html).toContain("font-family:'Sen'");
      expect(html).toContain("font-family:'Be Vietnam Pro'");
      expect(html).toContain('bgcolor="#e0f3ff"');
      expect(html).toContain("background:#e9ed01");
      expect(html).toContain("#051480");
      expect(html).toContain("font-weight:600");
      expect(html).toContain('role="presentation"');
      expect(html).toContain("Pleros Ministries &amp; Missions");
      expect(html).toContain("<!--[if mso]>");
    }
  });

  test("sends from the ministry identity", async () => {
    const { sendSogpAuthCodeEmail } = await import("./send");

    await sendSogpAuthCodeEmail({
      to: "learner@example.com",
      otp: "654321",
      type: "sign-in",
    });

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Pleros Ministries & Missions <noreply@pleros.org>",
        to: "learner@example.com",
        subject: "Your SOGP verification code",
      }),
    );
  });

  test("configures hashed, rate-limited Better Auth email OTP", () => {
    const serverSource = readFileSync(
      join(process.cwd(), "lib", "auth", "better-auth.ts"),
      "utf8",
    );
    const clientSource = readFileSync(
      join(process.cwd(), "lib", "auth", "auth-client.ts"),
      "utf8",
    );

    expect(serverSource).toContain("emailOTP({");
    expect(serverSource).toContain("disableSignUp: true");
    expect(serverSource).toContain('storeOTP: "hashed"');
    expect(serverSource).toContain("allowedAttempts: 3");
    expect(serverSource).toContain("SOGP_OTP_TTL_SECONDS");
    expect(clientSource).toContain("emailOTPClient()");
  });
});

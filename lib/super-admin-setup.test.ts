import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("super admin setup hardening", () => {
  test("keeps eligible super admin emails server-side during setup", () => {
    const pageSource = readFileSync(
      join(process.cwd(), "app", "admin", "setup", "page.tsx"),
      "utf8",
    );
    const formSource = readFileSync(
      join(process.cwd(), "components", "ppc", "super-admin-setup-form.tsx"),
      "utf8",
    );
    const actionSource = readFileSync(
      join(process.cwd(), "app", "admin", "setup", "actions.ts"),
      "utf8",
    );
    const forgotPasswordSource = readFileSync(
      join(process.cwd(), "app", "admin", "forgot-password", "page.tsx"),
      "utf8",
    );

    expect(pageSource).toContain("getMissingSuperAdminEmails");
    expect(pageSource).toContain("<SuperAdminSetupForm />");
    expect(pageSource).not.toContain("emails={missingSuperAdminEmails}");
    expect(formSource).toContain('name="email"');
    expect(formSource).not.toContain('name="setupToken"');
    expect(formSource).not.toContain('name="password"');
    expect(formSource).not.toContain("emails.map");
    expect(formSource).not.toContain("authClient.signUp.email");
    expect(actionSource).not.toContain("SUPER_ADMIN_SETUP_TOKEN");
    expect(actionSource).not.toContain("timingSafeEqual");
    expect(actionSource).toContain("randomBytes");
    expect(actionSource).toContain(
      'callbackURL: "/admin/forgot-password?setup=super-admin"',
    );
    expect(actionSource).toContain("isConfiguredSuperAdminEmail(email)");
    expect(actionSource).toContain("getMissingSuperAdminEmails");
    expect(forgotPasswordSource).toContain("Create your password");
    expect(forgotPasswordSource).toContain("setup === \"super-admin\"");
  });

  test("requires verified email before privileged app access", () => {
    const authSource = readFileSync(
      join(process.cwd(), "lib", "auth", "better-auth.ts"),
      "utf8",
    );
    const sessionSource = readFileSync(
      join(process.cwd(), "lib", "app-session.ts"),
      "utf8",
    );
    const inviteActionSource = readFileSync(
      join(process.cwd(), "app", "ppc", "_actions", "staff-invite-actions.ts"),
      "utf8",
    );

    expect(authSource).toContain("emailVerification");
    expect(authSource).toContain("sendOnSignUp: true");
    expect(authSource).toContain("sendOnSignIn: true");
    expect(authSource).toContain("sendEmailVerification");
    expect(authSource).toContain("afterEmailVerification");
    expect(sessionSource).toContain("const emailVerified = Boolean");
    expect(sessionSource).toContain("if (!emailVerified)");
    expect(sessionSource).toContain('role: "super_admin"');
    expect(inviteActionSource).toContain("!authUser.emailVerified");
    expect(inviteActionSource).toContain(
      "Verify your email before accepting this staff invite.",
    );
  });
});

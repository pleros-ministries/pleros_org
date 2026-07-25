import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

import {
  buildSuperAdminSetupUrl,
  getSuperAdminSetupClaimStatus,
  getSuperAdminSetupExpiry,
  hashSuperAdminSetupToken,
} from "./super-admin-setup";

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
    const claimPageSource = readFileSync(
      join(process.cwd(), "app", "admin", "setup", "claim", "[token]", "page.tsx"),
      "utf8",
    );
    const claimFormSource = readFileSync(
      join(process.cwd(), "components", "ppc", "super-admin-password-setup-form.tsx"),
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
    expect(actionSource).not.toContain('callbackURL: "/admin/forgot-password');
    expect(actionSource).not.toContain("signUpEmail");
    expect(actionSource).toContain("sendSuperAdminSetup");
    expect(actionSource).toContain("createSuperAdminSetupClaim");
    expect(actionSource).toContain("completeSuperAdminSetupAction");
    expect(actionSource).toContain("isConfiguredSuperAdminEmail(email)");
    expect(actionSource).toContain("getMissingSuperAdminEmails");
    expect(claimPageSource).toContain("getSuperAdminSetupClaimByToken");
    expect(claimPageSource).toContain("<SuperAdminPasswordSetupForm");
    expect(claimFormSource).toContain('name="password"');
    expect(claimFormSource).toContain('name="confirmPassword"');
    expect(
      readFileSync(join(process.cwd(), "lib", "app-user.ts"), "utf8"),
    ).toContain('user.role === "super_admin" && user.emailVerified');
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

  test("uses short lived one-click claim links for setup", () => {
    const tokenHash = hashSuperAdminSetupToken("setup-token");

    expect(tokenHash).toHaveLength(64);
    expect(tokenHash).not.toBe("setup-token");
    expect(
      buildSuperAdminSetupUrl("https://pleros.org/", "setup-token"),
    ).toBe("https://pleros.org/admin/setup/claim/setup-token");
    expect(getSuperAdminSetupExpiry(new Date("2026-01-01T00:00:00Z"))).toEqual(
      new Date("2026-01-01T01:00:00Z"),
    );
    expect(
      getSuperAdminSetupClaimStatus({
        consumedAt: null,
        expiresAt: new Date("2026-01-01T01:00:00Z"),
        now: new Date("2026-01-01T00:30:00Z"),
      }),
    ).toBe("pending");
    expect(
      getSuperAdminSetupClaimStatus({
        consumedAt: null,
        expiresAt: new Date("2026-01-01T01:00:00Z"),
        now: new Date("2026-01-01T01:00:00Z"),
      }),
    ).toBe("expired");
    expect(
      getSuperAdminSetupClaimStatus({
        consumedAt: new Date("2026-01-01T00:30:00Z"),
        expiresAt: new Date("2026-01-01T01:00:00Z"),
      }),
    ).toBe("consumed");
  });
});

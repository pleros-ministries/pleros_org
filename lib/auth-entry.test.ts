import { describe, expect, test } from "vitest";

import {
  formatAuthErrorMessage,
  getPortalAccessNotice,
  getPostAuthRedirectPath,
} from "./auth-entry";

describe("auth entry helpers", () => {
  test("keeps students on the requested ppc return path", () => {
    expect(
      getPostAuthRedirectPath({
        resolvedRole: "student",
        returnTo: "/ppc/student/level/2",
      }),
    ).toBe("/ppc/student/level/2");
  });

  test("routes staff roles to admin regardless of requested return path", () => {
    expect(
      getPostAuthRedirectPath({
        resolvedRole: "admin",
        returnTo: "/ppc/student",
      }),
    ).toBe("/admin");

    expect(
      getPostAuthRedirectPath({
        resolvedRole: "instructor",
        returnTo: "/ppc/student",
      }),
    ).toBe("/admin");
  });

  test("describes when a staff email is used from the student portal", () => {
    expect(getPortalAccessNotice("student", "admin")).toEqual({
      tone: "info",
      message:
        "This email is configured for staff access. After login, you'll be sent to /admin.",
    });
  });

  test("warns when a non-staff email is used from the staff portal", () => {
    expect(getPortalAccessNotice("staff", "student")).toEqual({
      tone: "warning",
      message:
        "This email is not configured for staff access. It will open in the student portal at /ppc.",
    });
  });

  test("normalizes common auth errors for sign-in", () => {
    expect(
      formatAuthErrorMessage("Invalid email or password", "sign_in"),
    ).toBe("Email or password is incorrect.");
  });

  test("normalizes existing-account errors for sign-up", () => {
    expect(
      formatAuthErrorMessage("User already exists", "sign_up"),
    ).toBe("An account already exists for this email. Use login instead.");
  });

  test("falls back to a context-aware default error", () => {
    expect(formatAuthErrorMessage("", "sign_in")).toBe("Login failed.");
    expect(formatAuthErrorMessage("", "sign_up")).toBe(
      "Account setup failed.",
    );
  });
});

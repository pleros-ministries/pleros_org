import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

function source(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

test("provides password and email-code learner login with SOGP signup", () => {
  const page = source("app", "(site)", "login", "page.tsx");
  const form = source("components", "auth", "learner-login-form.tsx");

  expect(page).toContain("normalizeLearnerReturnTo");
  expect(form).toContain("authClient.signIn.email");
  expect(form).toContain("authClient.emailOtp.sendVerificationOtp");
  expect(form).toContain("authClient.signIn.emailOtp");
  expect(form).toContain("Email me a sign-in code");
  expect(form).toContain("Create or reset your password");
  expect(form).toContain("New to SOGP?");
  expect(form).toContain("Enrol to create your account and access your dashboard.");
  expect(form).toContain('href="/signup"');
});

test("provides code-based password recovery and friendly signup", () => {
  const recovery = source("components", "auth", "learner-password-recovery.tsx");
  const signup = source("app", "(site)", "signup", "page.tsx");

  expect(recovery).toContain("requestPasswordReset");
  expect(recovery).toContain("resetPassword");
  expect(recovery).toContain('autoComplete="one-time-code"');
  expect(signup).toContain('redirect(`/sogp/enrol');
});

test("keeps legacy friendly auth routes", () => {
  expect(source("app", "(site)", "sign-in", "page.tsx")).toContain(
    'permanentRedirect("/login")',
  );
  expect(source("app", "(site)", "sign-up", "page.tsx")).toContain(
    'permanentRedirect("/signup")',
  );
});

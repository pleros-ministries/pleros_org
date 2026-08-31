import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

test("guards setup and exposes email verification before password creation", () => {
  const pageSource = readFileSync(
    join(process.cwd(), "app", "(site)", "setup", "page.tsx"),
    "utf8",
  );
  const formSource = readFileSync(
    join(process.cwd(), "components", "sogp", "sogp-setup-form.tsx"),
    "utf8",
  );

  expect(pageSource).toContain("SOGP_SETUP_COOKIE");
  expect(pageSource).toContain('redirect("/signup")');
  expect(formSource).toContain("Verify your email");
  expect(formSource).toContain('autoComplete="one-time-code"');
  expect(formSource).toContain('inputMode="numeric"');
  expect(formSource).toContain("Create your password");
  expect(formSource).toContain('postJson("/api/sogp/enrol/verify"');
  expect(formSource).toContain('postJson("/api/sogp/enrol/complete"');
  expect(formSource).not.toContain("localStorage");
  expect(formSource).not.toContain("sessionStorage");
});

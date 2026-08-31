import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

test("keeps the enrolment page focused with a compact summary list", () => {
  const pageSource = readFileSync(
    join(process.cwd(), "components", "sogp", "sogp-enrollment-page.tsx"),
    "utf8",
  );
  const formSource = readFileSync(
    join(process.cwd(), "components", "sogp", "sogp-enrollment-form.tsx"),
    "utf8",
  );

  expect(pageSource).not.toContain("20 tracks");
  expect(pageSource).not.toContain("Telegram community");
  expect(pageSource).not.toContain("HomepageNav");
  expect(pageSource).not.toContain("School of God&apos;s Purpose</p>");
  expect(pageSource).not.toContain("border-b border-[var(--color-line)] bg-[var(--color-brand-sky)]");
  // The summary reads as a tight icon list rather than a tall square grid.
  expect(pageSource).not.toContain("aspect-square");
  expect(pageSource).not.toContain("grid-cols-2");
  expect(pageSource).toContain("<ul className=\"grid gap-3\">");
  expect(pageSource).toContain("[font-size:0.875rem] font-medium leading-tight");
  expect(pageSource).toContain("text-[clamp(2.1rem,8vw,2.35rem)]");
  expect(pageSource).toContain("[font-size:0.875rem] leading-[1.55]");
  expect(pageSource).toContain('meta: "One live review on weekends"');
  expect(pageSource).not.toContain("One required review every Sunday");
  expect(formSource).toContain(">First name<RequiredMark /></label>");
  expect(formSource).toContain("[font-size:0.8125rem] font-medium");
  expect(formSource).toContain("[font-size:0.875rem] text-white");
  expect(formSource).toContain("mt-3 min-h-12");
  expect(formSource).toContain('"Continue setup"');
  expect(formSource).toContain('href="/login?returnTo=/dashboard/sogp"');
  expect(formSource).toContain("Already enrolled? Log in");
  expect(formSource).not.toContain('"Continue to email verification"');
  expect(formSource).not.toContain("text-sm font-semibold");
  expect(formSource).not.toContain("markTouched");
  expect(formSource).not.toContain("setTouched");
  expect(formSource).not.toContain("onBlur=");
  expect(formSource).toContain(
    "if (submitAttempted) return clientErrors[field];",
  );
  expect(formSource.match(/<RequiredMark \/>/g)?.length ?? 0).toBe(10);
  expect(formSource).toContain('aria-hidden="true"');
  expect(formSource).toContain(
    "aria-invalid:border-[var(--destructive)]",
  );
  expect(formSource).toContain(">Surname/Last name<RequiredMark /></label>");
  expect(formSource).toContain(">State/Province/Region of residence<RequiredMark /></label>");
  expect(formSource).toContain(">How did you hear about us?<RequiredMark /></label>");
  expect(formSource).toContain('id="referralSourceOther"');
  expect(formSource).toContain('fetch("/api/sogp/enrol/start"');
  expect(pageSource).toContain('href="/login?returnTo=/dashboard/sogp"');
  expect(pageSource).toContain("Already enrolled? Log in");
  expect(formSource).not.toContain("What do you want to get out of SOGP?");
  expect(formSource).toMatch(/<select\s+id="birthYear"/);
  expect(formSource.match(/appearance-none/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  expect(formSource.match(/right-4/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
  expect(formSource).not.toContain('type="checkbox"');
  expect(formSource).toMatch(/<select\s+id="whatsappConsent"/);
  expect(formSource).toContain(
    "Would you like to receive SOGP updates via WhatsApp?",
  );
});

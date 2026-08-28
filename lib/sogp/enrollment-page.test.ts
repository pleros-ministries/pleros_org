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
  expect(pageSource).not.toContain("HomepageNav");
  expect(pageSource).not.toContain("School of God&apos;s Purpose</p>");
  expect(pageSource).not.toContain("border-b border-[var(--color-line)] bg-[var(--color-brand-sky)]");
  // The summary reads as a tight icon list rather than a tall square grid.
  expect(pageSource).not.toContain("aspect-square");
  expect(pageSource).not.toContain("grid-cols-2");
  expect(pageSource).toContain("<ul className=\"grid gap-3\">");
  expect(formSource).toContain(">First name</label>");
  expect(formSource).toContain(">Surname</label>");
  expect(formSource).toContain(">State / province / region of residence</label>");
  expect(formSource).toContain(">How did you hear about us?</label>");
  expect(formSource).not.toContain("What do you want to get out of SOGP?");
  expect(formSource).toMatch(/<select\s+id="birthYear"/);
  expect(formSource).not.toContain('type="checkbox"');
  expect(formSource).toMatch(/<select\s+id="whatsappConsent"/);
  expect(formSource).toContain(
    "Would you like to receive SOGP updates and course reminders via WhatsApp?",
  );
});

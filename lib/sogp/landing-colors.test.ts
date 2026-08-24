import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

test("uses a white SOGP hero with a pastel-blue school-name accent", () => {
  const source = readFileSync(
    join(process.cwd(), "components", "sogp", "sogp-landing-page.tsx"),
    "utf8",
  );

  expect(source).toContain('<section className="bg-white">');
  expect(source).toContain(
    'inline-block bg-[var(--color-brand-sky)] px-3 py-2',
  );
  expect(source).not.toContain(
    'bg-[var(--color-brand-lime)] py-5 text-[var(--color-brand-blue)]',
  );
});

test("keeps facilitator social links out of the distraction-free landing page", () => {
  const source = readFileSync(
    join(process.cwd(), "components", "sogp", "sogp-landing-page.tsx"),
    "utf8",
  );

  expect(source).not.toContain("content.facilitator.links");
  expect(source).toContain("content.facilitator.description");
});

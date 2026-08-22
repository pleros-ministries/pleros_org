import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

test("uses design-system pastel blue as SOGP landing hero surface", () => {
  const source = readFileSync(
    join(process.cwd(), "components", "sogp", "sogp-landing-page.tsx"),
    "utf8",
  );

  expect(source).toContain(
    'bg-[var(--color-brand-sky)] text-[var(--color-brand-blue)]',
  );
  expect(source).toContain(
    'text-[clamp(2.8rem,6.5vw,5.8rem)] leading-[0.92] text-[var(--color-brand-blue)]',
  );
  expect(source).not.toContain(
    'bg-[var(--color-brand-lime)] py-5 text-[var(--color-brand-blue)]',
  );
});

test("keeps white facilitator social icons visible on brand-blue controls", () => {
  const source = readFileSync(
    join(process.cwd(), "components", "sogp", "sogp-landing-page.tsx"),
    "utf8",
  );

  expect(source).toContain(
    'className="grid size-11 place-items-center rounded-full bg-[var(--color-brand-blue)]',
  );
});

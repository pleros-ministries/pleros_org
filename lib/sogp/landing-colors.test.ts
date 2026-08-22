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
    'text-[clamp(3rem,7vw,6.4rem)] leading-[0.88] text-[var(--color-brand-blue)]',
  );
  expect(source).not.toContain(
    'bg-[var(--color-brand-lime)] py-5 text-[var(--color-brand-blue)]',
  );
});

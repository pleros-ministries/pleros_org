import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

test("shows The Word of Truth in the SOGP dashboard mockup", () => {
  const source = readFileSync(
    join(process.cwd(), "components", "sogp", "sogp-hero-phone.tsx"),
    "utf8",
  );

  expect(source).toContain("The Word of Truth");
  expect(source).not.toContain("The Life of Prayer");
});

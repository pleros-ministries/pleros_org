import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

test("renders today-first preparation with a previous-days archive", () => {
  const source = readFileSync(
    join(process.cwd(), "components", "sogp", "sogp-dashboard.tsx"),
    "utf8",
  );

  expect(source).toContain("partitionSogpPreparationDays");
  expect(source).toContain("Today’s preparation");
  expect(source).toContain("Previous preparation days");
  expect(source).toContain("Your material for today is being prepared");
  expect(source).not.toContain("SOGP_PREPARATION_CONTENT");
});

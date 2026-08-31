import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";

test("keeps the course menu out of the mobile SOGP dashboard", () => {
  const source = readFileSync(
    join(process.cwd(), "components", "sogp", "sogp-course-sidebar.tsx"),
    "utf8",
  );

  expect(source).not.toContain("SogpMobileCourseSidebar");
  expect(source).not.toContain("Open course menu");
  expect(source).not.toContain("Course menu");
  expect(source).toContain('className="hidden lg:block"');
});
